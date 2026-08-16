class UserProfile {
  final String id;
  final String username;
  final String avatar;
  final String deviceToken;
  final int gamesPlayed;
  final int wins;
  final int bestScore;

  UserProfile({
    required this.id,
    required this.username,
    required this.avatar,
    required this.deviceToken,
    this.gamesPlayed = 0,
    this.wins = 0,
    this.bestScore = 0,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      username: json['username'] ?? 'Operator',
      avatar: json['avatar'] ?? 'bot',
      deviceToken: json['device_token'] ?? '',
      gamesPlayed: json['games_played'] ?? 0,
      wins: json['wins'] ?? 0,
      bestScore: json['best_score'] ?? 0,
    );
  }
}

class RoomPlayer {
  final String id;
  final String profileId;
  final String username;
  final String avatar;
  final String deviceToken;

  RoomPlayer({
    required this.id,
    required this.profileId,
    required this.username,
    required this.avatar,
    required this.deviceToken,
  });

  factory RoomPlayer.fromJson(Map<String, dynamic> json) {
    return RoomPlayer(
      id: json['id'] ?? '',
      profileId: json['profile_id'] ?? '',
      username: json['username'] ?? 'Player',
      avatar: json['avatar'] ?? 'bot',
      deviceToken: json['device_token'] ?? '',
    );
  }
}

class GameSettings {
  final String? id;
  final int roundsCount;
  final int roundDurationSeconds;
  final List<String> enabledChallengeTypes;

  GameSettings({
    this.id,
    this.roundsCount = 3,
    this.roundDurationSeconds = 30,
    this.enabledChallengeTypes = const ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY'],
  });

  factory GameSettings.fromJson(Map<String, dynamic> json) {
    return GameSettings(
      id: json['id'],
      roundsCount: json['rounds_count'] ?? 3,
      roundDurationSeconds: json['round_duration_seconds'] ?? 30,
      enabledChallengeTypes: List<String>.from(json['enabled_challenge_types'] ?? ['COLOR', 'SHAPE', 'TEXT', 'NUMBER', 'PATTERN', 'TRANSPARENCY']),
    );
  }
}

class GameRoom {
  final String id;
  final String code;
  final String hostId;
  final String hostUsername;
  final String hostDeviceToken;
  final String status;
  final List<RoomPlayer> players;
  final GameSettings settings;
  final String? currentGameId;

  GameRoom({
    required this.id,
    required this.code,
    required this.hostId,
    required this.hostUsername,
    required this.hostDeviceToken,
    required this.status,
    required this.players,
    required this.settings,
    this.currentGameId,
  });

  factory GameRoom.fromJson(Map<String, dynamic> json) {
    var rawPlayers = json['players'] as List? ?? [];
    return GameRoom(
      id: json['id'] ?? '',
      code: json['code'] ?? '',
      hostId: json['host'] ?? '',
      hostUsername: json['host_username'] ?? 'Host',
      hostDeviceToken: json['host_device_token'] ?? '',
      status: json['status'] ?? 'WAITING',
      players: rawPlayers.map((p) => RoomPlayer.fromJson(p)).toList(),
      settings: json['settings'] != null ? GameSettings.fromJson(json['settings']) : GameSettings(),
      currentGameId: json['current_game_id'],
    );
  }
}

class CurrentRoundInfo {
  final String roundId;
  final String gameId;
  final int roundNumber;
  final int totalRounds;
  final String challengeType;
  final String prompt;
  final DateTime? startTime;
  final DateTime? endTime;
  final int secondsRemaining;
  final String gameStatus;
  final String roundStatus;
  final String playerStatus; // 'SEARCHING' | 'DONE'
  final int attemptsUsed;
  final int maxAttempts;

  CurrentRoundInfo({
    required this.roundId,
    required this.gameId,
    required this.roundNumber,
    required this.totalRounds,
    required this.challengeType,
    required this.prompt,
    this.startTime,
    this.endTime,
    required this.secondsRemaining,
    required this.gameStatus,
    required this.roundStatus,
    required this.playerStatus,
    required this.attemptsUsed,
    this.maxAttempts = 2,
  });

  factory CurrentRoundInfo.fromJson(Map<String, dynamic> json) {
    return CurrentRoundInfo(
      roundId: json['round_id'] ?? '',
      gameId: json['game_id'] ?? '',
      roundNumber: json['round_number'] ?? 1,
      totalRounds: json['total_rounds'] ?? 3,
      challengeType: json['challenge_type'] ?? 'COLOR',
      prompt: json['prompt'] ?? '',
      startTime: json['start_time'] != null ? DateTime.tryParse(json['start_time']) : null,
      endTime: json['end_time'] != null ? DateTime.tryParse(json['end_time']) : null,
      secondsRemaining: json['seconds_remaining'] ?? 0,
      gameStatus: json['game_status'] ?? 'ROUND_ACTIVE',
      roundStatus: json['round_status'] ?? 'ACTIVE',
      playerStatus: json['player_status'] ?? 'SEARCHING',
      attemptsUsed: json['attempts_used'] ?? 0,
      maxAttempts: json['max_attempts'] ?? 2,
    );
  }
}

class LeaderboardPlayer {
  final String profileId;
  final String username;
  final String avatar;
  final int score;
  final int streak;
  final int validCount;
  final int totalAttempts;
  final int rank;

  LeaderboardPlayer({
    required this.profileId,
    required this.username,
    required this.avatar,
    required this.score,
    required this.streak,
    required this.validCount,
    required this.totalAttempts,
    required this.rank,
  });

  factory LeaderboardPlayer.fromJson(Map<String, dynamic> json) {
    return LeaderboardPlayer(
      profileId: json['profile_id'] ?? '',
      username: json['username'] ?? 'Player',
      avatar: json['avatar'] ?? 'bot',
      score: json['score'] ?? 0,
      streak: json['streak'] ?? 0,
      validCount: json['valid_count'] ?? 0,
      totalAttempts: json['total_attempts'] ?? 0,
      rank: json['rank'] ?? 1,
    );
  }
}
