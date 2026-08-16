import {
  Profile,
  Room,
  Game,
  GameResult,
  Submission,
  PlayerRoundState,
  PlayerScoreSummary,
  ChallengeType
} from '../types';

export const api = {
  // Health
  async checkHealth(): Promise<{ status: string; gemini_connected: boolean }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Profile
  async setupProfile(data: {
    username?: string;
    avatar?: string;
    accentColor?: string;
    device_token?: string;
  }): Promise<{ profile: Profile }> {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to setup profile');
    }
    return res.json();
  },

  // History
  async getProfileHistory(profileId: string): Promise<{ history: GameResult[] }> {
    const res = await fetch(`/api/profiles/${profileId}/history`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load match history');
    }
    return res.json();
  },

  // Create Room
  async createRoom(data: {
    profile_id: string;
    rounds_count?: number;
    round_duration_seconds?: number;
  }): Promise<{ room: Room }> {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create room');
    }
    return res.json();
  },

  // Join Room
  async joinRoom(
    code: string,
    profileId: string
  ): Promise<{ room: Room }> {
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to join room');
    }
    return res.json();
  },

  // Get Room
  async getRoom(code: string): Promise<{ room: Room; game?: Game }> {
    const res = await fetch(`/api/rooms/${code}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Room not found');
    }
    return res.json();
  },

  // Leave Room
  async leaveRoom(code: string, profileId: string): Promise<{ success: boolean; room?: Room }> {
    const res = await fetch(`/api/rooms/${code}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId }),
    });
    return res.json();
  },

  // Update Settings (Host)
  async updateRoomSettings(
    code: string,
    data: {
      host_profile_id: string;
      rounds_count?: 3 | 5 | 7;
      round_duration_seconds?: 15 | 30 | 45;
      enabled_challenge_types?: ChallengeType[];
    }
  ): Promise<{ room: Room }> {
    const res = await fetch(`/api/rooms/${code}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  },

  // Toggle Bots
  async toggleBots(
    code: string,
    data: {
      host_profile_id: string;
      action: 'add_bot' | 'remove_bots' | 'fill';
    }
  ): Promise<{ room: Room }> {
    const res = await fetch(`/api/rooms/${code}/toggle-bots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update companions');
    }
    return res.json();
  },

  // Start Game (Host)
  async startGame(
    code: string,
    hostProfileId: string
  ): Promise<{ game: Game; room: Room }> {
    const res = await fetch(`/api/rooms/${code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host_profile_id: hostProfileId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to start game');
    }
    return res.json();
  },

  // Polling Game State
  async getGameStatus(gameId: string): Promise<{
    game: Game;
    current_round?: Game['rounds'][0];
    player_round_states: Record<string, PlayerRoundState>;
    leaderboard: PlayerScoreSummary[];
    room_status?: string;
  }> {
    const res = await fetch(`/api/games/${gameId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get game state');
    }
    return res.json();
  },

  // Submit Photo to AI Referee
  async submitRoundPhoto(
    roundId: string,
    data: {
      profile_id: string;
      image_data: string;
      image_url?: string;
    }
  ): Promise<{
    submission: Submission;
    player_round_state: PlayerRoundState;
    player_score: { total_score: number; current_streak: number; best_streak: number };
  }> {
    const res = await fetch(`/api/rounds/${roundId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Submission failed');
    }
    return res.json();
  },

  // Host Emergency Override (§11)
  async overrideSubmission(
    submissionId: string,
    data: {
      host_profile_id: string;
      force_valid: boolean;
    }
  ): Promise<{ success: boolean; submission: Submission }> {
    const res = await fetch(`/api/submissions/${submissionId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to apply override');
    }
    return res.json();
  },

  // Get Leaderboard
  async getLeaderboard(gameId: string): Promise<{ leaderboard: PlayerScoreSummary[] }> {
    const res = await fetch(`/api/games/${gameId}/leaderboard`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load leaderboard');
    }
    return res.json();
  }
};
