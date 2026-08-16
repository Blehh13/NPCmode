import uuid
import random
import string
from django.db import models
from django.utils import timezone

UNAMBIGUOUS_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

def generate_room_code():
    return ''.join(random.choices(UNAMBIGUOUS_CHARS, k=5))

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=20, unique=True)
    avatar = models.CharField(max_length=30, default='bot')
    device_token = models.CharField(max_length=128, db_index=True)
    games_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    best_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.device_token[:8]})"

class Room(models.Model):
    STATUS_CHOICES = [
        ('WAITING', 'Waiting'),
        ('IN_GAME', 'In Game'),
        ('CLOSED', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=5, unique=True, default=generate_room_code, db_index=True)
    host = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='hosted_rooms')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='WAITING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Room {self.code} [{self.status}]"

class RoomPlayer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='room_players')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='room_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['room', 'profile'], name='unique_room_profile')
        ]
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.profile.username} in {self.room.code}"

class GameSettings(models.Model):
    CHALLENGE_TYPES = ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY']

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='settings')
    rounds_count = models.IntegerField(choices=[(3, 3), (5, 5), (7, 7)], default=3)
    round_duration_seconds = models.IntegerField(choices=[(15, 15), (30, 30), (45, 45)], default=30)
    enabled_challenge_types = models.JSONField(default=lambda: ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY'])

    def to_dict(self):
        return {
            'rounds_count': self.rounds_count,
            'round_duration_seconds': self.round_duration_seconds,
            'enabled_challenge_types': self.enabled_challenge_types,
        }

    def __str__(self):
        return f"Settings for Room {self.room.code}"

class Game(models.Model):
    STATUS_CHOICES = [
        ('STARTING', 'Starting'),
        ('ROUND_ACTIVE', 'Round Active'),
        ('ROUND_LOCKED', 'Round Locked'),
        ('ROUND_RESULT', 'Round Result'),
        ('GAME_OVER', 'Game Over'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='games')
    settings_snapshot = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='STARTING')
    current_round_index = models.IntegerField(default=1)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Game {self.id} in {self.room.code} ({self.status})"

class Round(models.Model):
    CHALLENGE_CHOICES = [
        ('COLOR', 'Color'),
        ('SHAPE', 'Shape'),
        ('TEXT', 'Text'),
        ('NUMBER', 'Number'),
        ('PATTERN', 'Pattern'),
        ('TRANSPARENCY', 'Transparency'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('LOCKED', 'Locked'),
        ('RESULT', 'Result'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='rounds')
    number = models.IntegerField()
    challenge_type = models.CharField(max_length=20, choices=CHALLENGE_CHOICES)
    prompt = models.CharField(max_length=255)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Round {self.number}: {self.challenge_type} ({self.prompt})"

class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='submissions')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='submissions')
    attempt_number = models.IntegerField(default=1)
    image = models.ImageField(upload_to='submissions/', null=True, blank=True)
    image_base64 = models.TextField(blank=True, default='')
    valid = models.BooleanField(null=True, blank=True)
    confidence = models.FloatField(default=0.0)
    is_override = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)
    streak_bonus = models.IntegerField(default=0)
    commentary = models.TextField(blank=True, default='')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['round', 'profile', 'attempt_number'], name='unique_round_profile_attempt')
        ]
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.profile.username} - Round {self.round.number} (Attempt {self.attempt_number}): {'VALID' if self.valid else 'INVALID'}"

class PlayerRoundState(models.Model):
    STATUS_CHOICES = [
        ('SEARCHING', 'Searching'),
        ('DONE', 'Done'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='player_states')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='round_states')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SEARCHING')
    attempts_used = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['round', 'profile'], name='unique_round_profile_state')
        ]

    def __str__(self):
        return f"{self.profile.username} in Round {self.round.number} -> {self.status}"

class GameResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='results')
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='game_results')
    final_score = models.IntegerField(default=0)
    rank = models.IntegerField(default=1)
    best_streak = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['rank', '-final_score']

    def __str__(self):
        return f"{self.profile.username}: Rank #{self.rank} ({self.final_score} pts)"
