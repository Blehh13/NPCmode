export type ChallengeType = 'COLOR' | 'TEXT' | 'NUMBER' | 'SHAPE' | 'PATTERN' | 'TRANSPARENCY';

export type RoomStatus = 'WAITING' | 'IN_GAME' | 'CLOSED';

export type GameStatus = 'STARTING' | 'ROUND_ACTIVE' | 'ROUND_LOCKED' | 'ROUND_RESULT' | 'GAME_OVER';

export type RoundStatus = 'PENDING' | 'ACTIVE' | 'LOCKED' | 'RESULT';

export type PlayerRoundStatus = 'SEARCHING' | 'DONE';

export interface Profile {
  id: string;
  username: string;
  avatar: string;
  accentColor?: string;
  device_token: string;
  games_played: number;
  wins: number;
  best_score: number;
  created_at?: string;
}

export interface GameSettings {
  id?: string;
  room_id?: string;
  rounds_count: 3 | 5 | 7;
  round_duration_seconds: 15 | 30 | 45;
  enabled_challenge_types: ChallengeType[];
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  profile: Profile;
  joined_at: string;
  is_ready: boolean;
  is_bot?: boolean;
}

export interface ChallengeDef {
  type: ChallengeType;
  prompt: string;
  subPrompt?: string;
  badgeLabel: string;
  accentColor: string;
  iconName: string;
}

export interface Submission {
  id: string;
  round_id: string;
  profile_id: string;
  player_name: string;
  player_avatar: string;
  attempt_number: number;
  image_url: string;
  valid: boolean | null;
  confidence: number;
  reason?: string;
  is_override: boolean;
  timestamp: string;
  submission_seconds: number;
  score: number;
  streak_bonus: number;
}

export interface PlayerRoundState {
  round_id: string;
  profile_id: string;
  status: PlayerRoundStatus;
  attempts_used: number;
  valid_submission?: Submission;
}

export interface Round {
  id: string;
  game_id: string;
  number: number;
  challenge_type: ChallengeType;
  prompt: string;
  sub_prompt?: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  status: RoundStatus;
  submissions: Submission[];
}

export interface PlayerScoreSummary {
  profile_id: string;
  username: string;
  avatar: string;
  is_host: boolean;
  is_bot?: boolean;
  current_round_score: number;
  total_score: number;
  current_streak: number;
  best_streak: number;
  attempts_this_round: number;
  is_done_this_round: boolean;
  rank: number;
  total_attempts: number;
}

export interface GameResultRoundItem {
  round_number: number;
  challenge_type: ChallengeType;
  prompt: string;
  valid: boolean;
  score: number;
  time_seconds?: number;
  image_url?: string;
  streak: number;
}

export interface GameResult {
  id: string;
  game_id: string;
  profile_id: string;
  username: string;
  avatar: string;
  final_score: number;
  rank: number;
  best_streak: number;
  is_winner: boolean;
  total_rounds: number;
  round_duration: number;
  played_at: string;
  total_players: number;
  rounds_summary?: GameResultRoundItem[];
}

export interface Game {
  id: string;
  room_id: string;
  settings_snapshot: GameSettings;
  status: GameStatus;
  current_round_index: number;
  total_rounds: number;
  started_at: string;
  completed_at?: string;
  rounds: Round[];
  player_scores: Record<string, { total_score: number; current_streak: number; best_streak: number; total_attempts: number }>;
}

export interface Room {
  id: string;
  code: string;
  host_id: string;
  host_name: string;
  status: RoomStatus;
  settings: GameSettings;
  players: RoomPlayer[];
  current_game_id?: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  category: 'BADGES' | 'MILESTONES';
}
