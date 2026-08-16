from rest_framework import serializers
from .models import (
    Profile, Room, RoomPlayer, GameSettings,
    Game, Round, Submission, PlayerRoundState, GameResult
)

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['id', 'username', 'avatar', 'device_token', 'games_played', 'wins', 'best_score', 'created_at']
        read_only_fields = ['id', 'games_played', 'wins', 'best_score', 'created_at']

class GameSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameSettings
        fields = ['id', 'rounds_count', 'round_duration_seconds', 'enabled_challenge_types']

class RoomPlayerSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='profile.username')
    avatar = serializers.ReadOnlyField(source='profile.avatar')
    device_token = serializers.ReadOnlyField(source='profile.device_token')
    profile_id = serializers.ReadOnlyField(source='profile.id')

    class Meta:
        model = RoomPlayer
        fields = ['id', 'profile_id', 'username', 'avatar', 'device_token', 'joined_at']

class RoomSerializer(serializers.ModelSerializer):
    host_username = serializers.ReadOnlyField(source='host.username')
    host_device_token = serializers.ReadOnlyField(source='host.device_token')
    players = RoomPlayerSerializer(source='room_players', many=True, read_only=True)
    settings = GameSettingsSerializer(read_only=True)
    current_game_id = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            'id', 'code', 'host', 'host_username', 'host_device_token',
            'status', 'created_at', 'players', 'settings', 'current_game_id'
        ]

    def get_current_game_id(self, obj):
        active_game = obj.games.filter(status__in=['STARTING', 'ROUND_ACTIVE', 'ROUND_LOCKED', 'ROUND_RESULT']).first()
        return str(active_game.id) if active_game else None

class SubmissionSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='profile.username')
    avatar = serializers.ReadOnlyField(source='profile.avatar')

    class Meta:
        model = Submission
        fields = [
            'id', 'round', 'profile', 'username', 'avatar',
            'attempt_number', 'valid', 'confidence', 'is_override',
            'timestamp', 'score', 'streak_bonus'
        ]

class RoundSerializer(serializers.ModelSerializer):
    submissions = SubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = Round
        fields = [
            'id', 'game', 'number', 'challenge_type', 'prompt',
            'start_time', 'end_time', 'status', 'submissions'
        ]

class GameResultSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='profile.username')
    avatar = serializers.ReadOnlyField(source='profile.avatar')

    class Meta:
        model = GameResult
        fields = ['id', 'game', 'profile', 'username', 'avatar', 'final_score', 'rank', 'best_streak', 'created_at']

class GameSerializer(serializers.ModelSerializer):
    rounds = RoundSerializer(many=True, read_only=True)
    results = GameResultSerializer(many=True, read_only=True)
    room_code = serializers.ReadOnlyField(source='room.code')

    class Meta:
        model = Game
        fields = [
            'id', 'room', 'room_code', 'settings_snapshot', 'status',
            'current_round_index', 'started_at', 'completed_at', 'rounds', 'results'
        ]
