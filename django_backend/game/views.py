import base64
from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction, models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Profile, Room, RoomPlayer, GameSettings,
    Game, Round, Submission, PlayerRoundState, GameResult
)
from .serializers import (
    ProfileSerializer, RoomSerializer, GameSerializer,
    RoundSerializer, SubmissionSerializer, GameResultSerializer
)
from .gemini_judge import evaluate_scavenger_submission, generate_rounds_for_game

# --- PROFILE ENDPOINTS (§14, §19) ---

class ProfileView(APIView):
    def post(self, request):
        device_token = request.data.get('device_token')
        if not device_token:
            return Response({'error': 'device_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        username = request.data.get('username', '').strip()
        avatar = request.data.get('avatar', 'bot')

        profile = Profile.objects.filter(device_token=device_token).first()
        if profile:
            if username and username != profile.username:
                # Check uniqueness if updating name
                if not Profile.objects.filter(username=username).exclude(id=profile.id).exists():
                    profile.username = username
            if avatar:
                profile.avatar = avatar
            profile.save()
        else:
            if not username:
                username = f"Operator_{device_token[:4]}"
            # Ensure unique username
            base_name = username[:15]
            cand = base_name
            counter = 1
            while Profile.objects.filter(username=cand).exists():
                cand = f"{base_name}_{counter}"
                counter += 1
            profile = Profile.objects.create(
                device_token=device_token,
                username=cand,
                avatar=avatar
            )

        return Response(ProfileSerializer(profile).data, status=status.HTTP_200_OK)

class ProfileHistoryView(APIView):
    def get(self, request):
        device_token = request.query_params.get('device_token') or request.headers.get('X-Device-Token')
        if not device_token:
            return Response({'error': 'device_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile = get_object_or_404(Profile, device_token=device_token)
        results = GameResult.objects.filter(profile=profile).order_by('-created_at')

        history_items = []
        for res in results:
            game = res.game
            rounds = game.rounds.all()
            round_details = []
            for r in rounds:
                sub = r.submissions.filter(profile=profile, valid=True).first()
                round_details.append({
                    'round_number': r.number,
                    'challenge_type': r.challenge_type,
                    'prompt': r.prompt,
                    'is_valid': bool(sub),
                    'score': sub.score if sub else 0,
                    'streak_bonus': sub.streak_bonus if sub else 0,
                })

            history_items.append({
                'game_id': str(game.id),
                'room_code': game.room.code,
                'date': res.created_at,
                'final_score': res.final_score,
                'rank': res.rank,
                'best_streak': res.best_streak,
                'settings': game.settings_snapshot,
                'rounds': round_details,
            })

        return Response({
            'profile': ProfileSerializer(profile).data,
            'history': history_items
        }, status=status.HTTP_200_OK)

# --- ROOM ENDPOINTS (§6, §13, §19) ---

class RoomListCreateView(APIView):
    def post(self, request):
        device_token = request.data.get('device_token')
        if not device_token:
            return Response({'error': 'device_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile = Profile.objects.filter(device_token=device_token).first()
        if not profile:
            profile = Profile.objects.create(
                device_token=device_token,
                username=request.data.get('username', f"Host_{device_token[:4]}")[:20],
                avatar=request.data.get('avatar', 'bot')
            )

        with transaction.atomic():
            room = Room.objects.create(host=profile, status='WAITING')
            GameSettings.objects.create(
                room=room,
                rounds_count=int(request.data.get('rounds_count', 3)),
                round_duration_seconds=int(request.data.get('round_duration_seconds', 30)),
                enabled_challenge_types=request.data.get('enabled_challenge_types', ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY'])
            )
            RoomPlayer.objects.create(room=room, profile=profile)

        return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

class RoomJoinView(APIView):
    def post(self, request, code):
        clean_code = code.strip().upper()
        room = Room.objects.filter(code=clean_code).first()
        if not room:
            return Response({'error': 'Room not found. Check your 5-letter code.'}, status=status.HTTP_404_NOT_FOUND)

        if room.status != 'WAITING':
            return Response({'error': 'Game is already in progress in this room.'}, status=status.HTTP_400_BAD_REQUEST)

        if room.room_players.count() >= 6:
            return Response({'error': 'Room is full (max 6 players).'}, status=status.HTTP_400_BAD_REQUEST)

        device_token = request.data.get('device_token')
        if not device_token:
            return Response({'error': 'device_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile = Profile.objects.filter(device_token=device_token).first()
        if not profile:
            profile = Profile.objects.create(
                device_token=device_token,
                username=request.data.get('username', f"Player_{device_token[:4]}")[:20],
                avatar=request.data.get('avatar', 'bot')
            )

        # Check duplicate username in room
        existing_names = [rp.profile.username.lower() for rp in room.room_players.exclude(profile=profile)]
        if profile.username.lower() in existing_names:
            return Response({'error': f"Username '{profile.username}' is already taken in this room."}, status=status.HTTP_400_BAD_REQUEST)

        RoomPlayer.objects.get_or_create(room=room, profile=profile)

        return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

class RoomDetailView(APIView):
    def get(self, request, code):
        room = get_object_or_404(Room, code=code.strip().upper())
        return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

class RoomSettingsView(APIView):
    def patch(self, request, id):
        room = get_object_or_404(Room, id=id)
        device_token = request.data.get('device_token')

        if room.host.device_token != device_token:
            return Response({'error': 'Only the host can modify room settings.'}, status=status.HTTP_403_FORBIDDEN)

        if room.status != 'WAITING':
            return Response({'error': 'Settings can only be changed while waiting in lobby.'}, status=status.HTTP_400_BAD_REQUEST)

        settings = room.settings
        if 'rounds_count' in request.data:
            settings.rounds_count = int(request.data['rounds_count'])
        if 'round_duration_seconds' in request.data:
            settings.round_duration_seconds = int(request.data['round_duration_seconds'])
        if 'enabled_challenge_types' in request.data:
            settings.enabled_challenge_types = request.data['enabled_challenge_types']

        settings.save()
        return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

# --- GAME LIFECYCLE & ROUNDS (§7, §12, §13, §19) ---

class StartGameView(APIView):
    def post(self, request, id):
        room = get_object_or_404(Room, id=id)
        device_token = request.data.get('device_token')

        if room.host.device_token != device_token:
            return Response({'error': 'Only the host can start the game.'}, status=status.HTTP_403_FORBIDDEN)

        player_count = room.room_players.count()
        if player_count < 1: # Allow solo test or min 2 in real games
            return Response({'error': 'Need at least 2 players to start a game.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            settings_obj = room.settings
            snapshot = settings_obj.to_dict()

            game = Game.objects.create(
                room=room,
                settings_snapshot=snapshot,
                status='STARTING',
                current_round_index=1
            )
            room.status = 'IN_GAME'
            room.save()

            # Seed rounds
            round_data_list = generate_rounds_for_game(
                count=settings_obj.rounds_count,
                enabled_types=settings_obj.enabled_challenge_types
            )

            now = timezone.now()
            # 3 second countdown for round 1
            round_start = now + timedelta(seconds=3)
            round_end = round_start + timedelta(seconds=settings_obj.round_duration_seconds)

            for item in round_data_list:
                r_num = item['round_number']
                is_first = (r_num == 1)
                Round.objects.create(
                    game=game,
                    number=r_num,
                    challenge_type=item['challenge_type'],
                    prompt=item['prompt'],
                    start_time=round_start if is_first else None,
                    end_time=round_end if is_first else None,
                    status='ACTIVE' if is_first else 'PENDING'
                )

            # Initialize PlayerRoundState for all players in round 1
            r1 = game.rounds.get(number=1)
            for rp in room.room_players.all():
                PlayerRoundState.objects.get_or_create(round=r1, profile=rp.profile, defaults={'status': 'SEARCHING'})

        return Response(GameSerializer(game).data, status=status.HTTP_201_CREATED)

class GameDetailView(APIView):
    def get(self, request, id):
        game = get_object_or_404(Game, id=id)
        now = timezone.now()

        # Check automated state transitions if in progress
        if game.status in ['STARTING', 'ROUND_ACTIVE']:
            current_r = game.rounds.filter(number=game.current_round_index).first()
            if current_r:
                if game.status == 'STARTING' and current_r.start_time and now >= current_r.start_time:
                    game.status = 'ROUND_ACTIVE'
                    game.save()

                if game.status == 'ROUND_ACTIVE' and current_r.end_time and now >= current_r.end_time:
                    current_r.status = 'LOCKED'
                    current_r.save()
                    game.status = 'ROUND_LOCKED'
                    game.save()

        return Response(GameSerializer(game).data, status=status.HTTP_200_OK)

class CurrentRoundView(APIView):
    def get(self, request, id):
        game = get_object_or_404(Game, id=id)
        current_r = game.rounds.filter(number=game.current_round_index).first()
        if not current_r:
            return Response({'error': 'No active round found.'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        device_token = request.query_params.get('device_token') or request.headers.get('X-Device-Token')
        profile = Profile.objects.filter(device_token=device_token).first() if device_token else None

        player_state_str = 'SEARCHING'
        attempts_used = 0
        if profile:
            prs, _ = PlayerRoundState.objects.get_or_create(round=current_r, profile=profile)
            player_state_str = prs.status
            attempts_used = prs.attempts_used

        seconds_remaining = 0
        if current_r.end_time:
            seconds_remaining = max(0, int((current_r.end_time - now).total_seconds()))

        return Response({
            'round_id': str(current_r.id),
            'game_id': str(game.id),
            'round_number': current_r.number,
            'total_rounds': game.settings_snapshot.get('rounds_count', 3),
            'challenge_type': current_r.challenge_type,
            'prompt': current_r.prompt,
            'start_time': current_r.start_time,
            'end_time': current_r.end_time,
            'server_time': now,
            'seconds_remaining': seconds_remaining,
            'game_status': game.status,
            'round_status': current_r.status,
            'player_status': player_state_str,
            'attempts_used': attempts_used,
            'max_attempts': 2,
        }, status=status.HTTP_200_OK)

class SubmitPhotoView(APIView):
    def post(self, request, id):
        round_obj = get_object_or_404(Round, id=id)
        game = round_obj.game
        now = timezone.now()

        device_token = request.data.get('device_token')
        if not device_token:
            return Response({'error': 'device_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        profile = get_object_or_404(Profile, device_token=device_token)

        # 1. Validate round is active (§9)
        if round_obj.end_time and now > round_obj.end_time + timedelta(seconds=2):
            return Response({'error': 'Time expired for this round.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Check player state: Lockout rule (§9)
        prs, _ = PlayerRoundState.objects.get_or_create(round=round_obj, profile=profile)
        if prs.status == 'DONE':
            return Response({'error': 'You already submitted a valid photo for this round.'}, status=status.HTTP_400_BAD_REQUEST)

        if prs.attempts_used >= 2:
            return Response({'error': 'Max 2 attempts reached for this round.'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Read image
        image_bytes = None
        if 'image' in request.FILES:
            image_bytes = request.FILES['image'].read()
        elif 'image_base64' in request.data:
            b64_str = request.data['image_base64']
            if ',' in b64_str:
                b64_str = b64_str.split(',')[1]
            image_bytes = base64.b64decode(b64_str)

        if not image_bytes:
            return Response({'error': 'Image file or base64 data required.'}, status=status.HTTP_400_BAD_REQUEST)

        attempt_num = prs.attempts_used + 1

        # 4. Vision model evaluation (§10)
        verdict = evaluate_scavenger_submission(image_bytes, round_obj.prompt)
        is_valid = verdict.get('valid', False)
        confidence = verdict.get('confidence', 0.0)

        with transaction.atomic():
            prs.attempts_used = attempt_num
            base_score = 0
            streak_bonus = 0

            if is_valid:
                # Base scoring by rank in round (§12)
                # Count prior valid submissions in this round
                prior_valid_count = Submission.objects.filter(round=round_obj, valid=True).count()
                if prior_valid_count == 0:
                    base_score = 100
                elif prior_valid_count == 1:
                    base_score = 75
                elif prior_valid_count == 2:
                    base_score = 50
                else:
                    base_score = 25

                # Streak calculation (§12)
                # Calculate consecutive valid rounds for this player in current game
                streak_len = 1
                for r_prev_num in range(round_obj.number - 1, 0, -1):
                    prev_r = game.rounds.filter(number=r_prev_num).first()
                    if prev_r and Submission.objects.filter(round=prev_r, profile=profile, valid=True).exists():
                        streak_len += 1
                    else:
                        break

                if streak_len == 2:
                    streak_bonus = 10
                elif streak_len == 3:
                    streak_bonus = 20
                elif streak_len >= 4:
                    streak_bonus = 30

                prs.status = 'DONE'

            prs.save()

            submission = Submission.objects.create(
                round=round_obj,
                profile=profile,
                attempt_number=attempt_num,
                valid=is_valid,
                confidence=confidence,
                score=base_score + streak_bonus,
                streak_bonus=streak_bonus
            )

        # Check if all players in room are now DONE or exhausted (§7)
        total_players = game.room.room_players.count()
        done_or_exhausted = PlayerRoundState.objects.filter(
            round=round_obj
        ).filter(models.Q(status='DONE') | models.Q(attempts_used__gte=2)).count()

        if total_players > 0 and done_or_exhausted >= total_players:
            round_obj.status = 'LOCKED'
            round_obj.save()
            game.status = 'ROUND_LOCKED'
            game.save()

        return Response({
            'valid': is_valid,
            'confidence': confidence,
            'score_awarded': base_score + streak_bonus,
            'streak_bonus': streak_bonus,
            'player_status': prs.status,
            'attempts_used': prs.attempts_used,
            'submission_id': str(submission.id)
        }, status=status.HTTP_200_OK)

class HostOverrideView(APIView):
    def post(self, request, id):
        submission = get_object_or_404(Submission, id=id)
        round_obj = submission.round
        game = round_obj.game
        host_device_token = request.data.get('device_token')

        if game.room.host.device_token != host_device_token:
            return Response({'error': 'Only the host can execute emergency override.'}, status=status.HTTP_403_FORBIDDEN)

        force_valid = request.data.get('valid', True)
        prev_valid = submission.valid

        with transaction.atomic():
            submission.valid = force_valid
            submission.is_override = True

            prs, _ = PlayerRoundState.objects.get_or_create(round=round_obj, profile=submission.profile)

            if force_valid and not prev_valid:
                # Recalculate score
                prior_valid = Submission.objects.filter(round=round_obj, valid=True).exclude(id=submission.id).count()
                if prior_valid == 0:
                    base_score = 100
                elif prior_valid == 1:
                    base_score = 75
                elif prior_valid == 2:
                    base_score = 50
                else:
                    base_score = 25

                submission.score = base_score
                prs.status = 'DONE'
            elif not force_valid and prev_valid:
                submission.score = 0
                submission.streak_bonus = 0
                prs.status = 'SEARCHING'

            prs.save()
            submission.save()

        return Response(SubmissionSerializer(submission).data, status=status.HTTP_200_OK)

class LeaderboardView(APIView):
    def get(self, request, id):
        game = get_object_or_404(Game, id=id)
        room_players = game.room.room_players.all()

        player_stats = []
        for rp in room_players:
            prof = rp.profile
            subs = Submission.objects.filter(round__game=game, profile=prof, valid=True)
            total_score = sum(s.score for s in subs)
            total_attempts = Submission.objects.filter(round__game=game, profile=prof).count()
            valid_items_count = subs.count()

            # Streak calculation
            current_streak = 0
            for r_num in range(game.current_round_index, 0, -1):
                r = game.rounds.filter(number=r_num).first()
                if r and Submission.objects.filter(round=r, profile=prof, valid=True).exists():
                    current_streak += 1
                else:
                    break

            player_stats.append({
                'profile_id': str(prof.id),
                'username': prof.username,
                'avatar': prof.avatar,
                'score': total_score,
                'streak': current_streak,
                'valid_count': valid_items_count,
                'total_attempts': total_attempts,
            })

        # Rank players by score descending, ties broken by fewest total attempts (§12)
        player_stats.sort(key=lambda x: (-x['score'], x['total_attempts']))
        for idx, p in enumerate(player_stats):
            p['rank'] = idx + 1

        return Response({
            'game_id': str(game.id),
            'room_code': game.room.code,
            'current_round': game.current_round_index,
            'total_rounds': game.settings_snapshot.get('rounds_count', 3),
            'game_status': game.status,
            'leaderboard': player_stats
        }, status=status.HTTP_200_OK)

class NextRoundView(APIView):
    def post(self, request, id):
        game = get_object_or_404(Game, id=id)
        total_rounds = game.settings_snapshot.get('rounds_count', 3)
        duration = game.settings_snapshot.get('round_duration_seconds', 30)

        with transaction.atomic():
            if game.current_round_index >= total_rounds:
                # GAME OVER (§13)
                game.status = 'GAME_OVER'
                game.completed_at = timezone.now()
                game.save()

                # Compute GameResult and aggregate Profile stats (§14)
                leaderboard_res = LeaderboardView().get(request, id).data['leaderboard']
                for item in leaderboard_res:
                    prof = Profile.objects.get(id=item['profile_id'])
                    is_winner = (item['rank'] == 1)

                    GameResult.objects.create(
                        game=game,
                        profile=prof,
                        final_score=item['score'],
                        rank=item['rank'],
                        best_streak=item['streak']
                    )

                    prof.games_played += 1
                    if is_winner:
                        prof.wins += 1
                    if item['score'] > prof.best_score:
                        prof.best_score = item['score']
                    prof.save()

                # Reset Room to WAITING for rematch! (§13)
                room = game.room
                room.status = 'WAITING'
                room.save()

            else:
                next_idx = game.current_round_index + 1
                game.current_round_index = next_idx
                game.status = 'STARTING'
                game.save()

                next_r = game.rounds.get(number=next_idx)
                now = timezone.now()
                round_start = now + timedelta(seconds=3)
                round_end = round_start + timedelta(seconds=duration)

                next_r.start_time = round_start
                next_r.end_time = round_end
                next_r.status = 'ACTIVE'
                next_r.save()

                for rp in game.room.room_players.all():
                    PlayerRoundState.objects.get_or_create(round=next_r, profile=rp.profile, defaults={'status': 'SEARCHING'})

        return Response(GameSerializer(game).data, status=status.HTTP_200_OK)
