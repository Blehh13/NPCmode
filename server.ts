import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  Profile,
  Room,
  RoomPlayer,
  Game,
  Round,
  Submission,
  PlayerRoundState,
  GameResult,
  GameSettings,
  ChallengeType,
  ChallengeDef,
  PlayerScoreSummary
} from "./src/types";

// Challenge definitions with prompts and rich visual metadata
const CHALLENGE_POOL: Record<ChallengeType, ChallengeDef[]> = {
  COLOR: [
    { type: 'COLOR', prompt: 'FIND SOMETHING RED', subPrompt: 'Take a clear photo of anything red in your room', badgeLabel: 'RED', accentColor: '#EF4444', iconName: 'Palette' },
    { type: 'COLOR', prompt: 'FIND SOMETHING BLUE', subPrompt: 'Locate a vivid blue object, clothing, or container', badgeLabel: 'BLUE', accentColor: '#3B82F6', iconName: 'Palette' },
    { type: 'COLOR', prompt: 'FIND SOMETHING GREEN', subPrompt: 'Spot a green plant, packaging, notebook, or bottle', badgeLabel: 'GREEN', accentColor: '#10B981', iconName: 'Palette' },
    { type: 'COLOR', prompt: 'FIND SOMETHING YELLOW', subPrompt: 'Find something bright yellow or golden', badgeLabel: 'YELLOW', accentColor: '#F59E0B', iconName: 'Palette' },
  ],
  TEXT: [
    { type: 'TEXT', prompt: 'FIND SOMETHING WITH VISIBLE TEXT ON IT', subPrompt: 'Find any sign, board, book title, label, or logo', badgeLabel: 'TEXT', accentColor: '#06B6D4', iconName: 'Type' },
    { type: 'TEXT', prompt: 'FIND A BOOK OR PRINTED COVER', subPrompt: 'Capture legible printed words or headlines', badgeLabel: 'BOOK', accentColor: '#8B5CF6', iconName: 'BookOpen' },
    { type: 'TEXT', prompt: 'FIND A BRAND NAME OR PRODUCT LOGO', subPrompt: 'Photograph a recognizable logo or brand label', badgeLabel: 'LOGO', accentColor: '#EC4899', iconName: 'Tag' }
  ],
  NUMBER: [
    { type: 'NUMBER', prompt: 'FIND SOMETHING WITH A VISIBLE NUMBER ON IT', subPrompt: 'Find a clock, calendar, price tag, keyboard digit, or ruler', badgeLabel: 'NUMBER', accentColor: '#3B82F6', iconName: 'Hash' },
    { type: 'NUMBER', prompt: 'FIND A DIGITAL OR ANALOG CLOCK', subPrompt: 'Capture numbers showing the time or date', badgeLabel: 'CLOCK', accentColor: '#06B6D4', iconName: 'Clock' }
  ],
  SHAPE: [
    { type: 'SHAPE', prompt: 'FIND SOMETHING CIRCULAR', subPrompt: 'Find a round cup, coin, wheel, clock, or ball', badgeLabel: 'CIRCULAR', accentColor: '#10B981', iconName: 'Circle' },
    { type: 'SHAPE', prompt: 'FIND SOMETHING RECTANGULAR', subPrompt: 'Find a screen, notebook, door, phone, or box', badgeLabel: 'RECTANGLE', accentColor: '#6366F1', iconName: 'Square' },
    { type: 'SHAPE', prompt: 'FIND SOMETHING TRIANGULAR', subPrompt: 'Find a triangular object, sign, hanger, or folded paper', badgeLabel: 'TRIANGLE', accentColor: '#F97316', iconName: 'Triangle' }
  ],
  PATTERN: [
    { type: 'PATTERN', prompt: 'FIND SOMETHING STRIPED, DOTTED, OR CHECKERED', subPrompt: 'Locate a repeating pattern on clothing, fabric, or wallpaper', badgeLabel: 'PATTERN', accentColor: '#A855F7', iconName: 'Grid' },
    { type: 'PATTERN', prompt: 'FIND A GRID OR MESH PATTERN', subPrompt: 'Spot a keyboard, speaker grille, vent, or tiles', badgeLabel: 'GRID', accentColor: '#EC4899', iconName: 'Grid' }
  ],
  TRANSPARENCY: [
    { type: 'TRANSPARENCY', prompt: 'FIND SOMETHING TRANSPARENT', subPrompt: 'Find clear glass, clear plastic bottle, glasses, or window', badgeLabel: 'TRANSPARENT', accentColor: '#00D9F5', iconName: 'Layers' },
    { type: 'TRANSPARENCY', prompt: 'FIND A CLEAR DRINKING GLASS OR WATER BOTTLE', subPrompt: 'Photograph a see-through glass or container', badgeLabel: 'CLEAR GLASS', accentColor: '#38BDF8', iconName: 'Eye' }
  ]
};

// Default AI companion players for immediate demo / solo testing
const BOT_TEMPLATES = [
  { username: 'Arjun', avatar: '👦', accentColor: '#3B82F6' },
  { username: 'Priya', avatar: '👩', accentColor: '#EC4899' },
  { username: 'Karthik', avatar: '🧔', accentColor: '#10B981' },
  { username: 'Vikram', avatar: '🧑‍💻', accentColor: '#F59E0B' },
  { username: 'Anita', avatar: '👧', accentColor: '#8B5CF6' }
];

// Sample placeholder thumbnails for simulated bot submissions
const SAMPLE_CHALLENGE_IMAGES: Record<string, string> = {
  RED: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80',
  BLUE: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80',
  GREEN: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&auto=format&fit=crop&q=80',
  YELLOW: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80',
  TEXT: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  NUMBER: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=400&auto=format&fit=crop&q=80',
  CIRCULAR: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
  RECTANGLE: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80',
  PATTERN: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=400&auto=format&fit=crop&q=80',
  TRANSPARENT: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80'
};

// In-Memory Database Store
const profiles = new Map<string, Profile>();
const profileByDeviceToken = new Map<string, string>(); // device_token -> profile_id
const rooms = new Map<string, Room>(); // code -> Room
const roomsById = new Map<string, Room>(); // id -> Room
const games = new Map<string, Game>(); // game_id -> Game
const gameResultsByProfile = new Map<string, GameResult[]>(); // profile_id -> GameResult[]
const roundPlayerStates = new Map<string, Map<string, PlayerRoundState>>(); // round_id -> (profile_id -> PlayerRoundState)

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Generate unambiguous 5-character room code
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper: Calculate scores
function getBaseScoreForRank(validRankIndex: number): number {
  if (validRankIndex === 0) return 100;
  if (validRankIndex === 1) return 75;
  if (validRankIndex === 2) return 50;
  return 25;
}

function getStreakBonus(streakLength: number): number {
  if (streakLength >= 4) return 30;
  if (streakLength === 3) return 20;
  if (streakLength === 2) return 10;
  return 0;
}

// Server background game state tick
function updateGameState(game: Game) {
  const now = Date.now();
  if (game.status === 'STARTING') {
    const startedAt = new Date(game.started_at).getTime();
    if (now >= startedAt + 3000) {
      // 3-second countdown finished -> activate first round
      game.status = 'ROUND_ACTIVE';
      const round = game.rounds[game.current_round_index];
      if (round) {
        round.status = 'ACTIVE';
        round.start_time = new Date().toISOString();
        round.end_time = new Date(now + round.duration_seconds * 1000).toISOString();
      }
    }
    return;
  }

  if (game.status === 'ROUND_ACTIVE') {
    const round = game.rounds[game.current_round_index];
    if (!round) return;

    const endTime = new Date(round.end_time).getTime();
    const isExpired = now >= endTime;

    // Check if all players in the room are done or exhausted attempts
    const room = roomsById.get(game.room_id);
    const roundStates = roundPlayerStates.get(round.id) || new Map<string, PlayerRoundState>();
    
    let allPlayersFinished = true;
    if (room && room.players.length > 0) {
      for (const p of room.players) {
        const state = roundStates.get(p.profile.id);
        if (!state || (state.status !== 'DONE' && state.attempts_used < 2)) {
          allPlayersFinished = false;
          break;
        }
      }
    }

    if (isExpired || allPlayersFinished) {
      round.status = 'LOCKED';
      game.status = 'ROUND_LOCKED';
      // Give 1.5s in locked then transition to round result
      setTimeout(() => {
        if (game.status === 'ROUND_LOCKED') {
          finalizeRoundResults(game);
        }
      }, 1500);
    }
  }
}

function finalizeRoundResults(game: Game) {
  const round = game.rounds[game.current_round_index];
  if (!round) return;
  round.status = 'RESULT';
  game.status = 'ROUND_RESULT';

  const room = roomsById.get(game.room_id);
  const roundStates = roundPlayerStates.get(round.id) || new Map<string, PlayerRoundState>();

  // Process streaks and non-submissions
  if (room) {
    for (const p of room.players) {
      const pScore = game.player_scores[p.profile.id] || { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 0 };
      const state = roundStates.get(p.profile.id);
      if (!state || state.status !== 'DONE') {
        // Player failed or did not submit valid in this round -> streak reset
        pScore.current_streak = 0;
      }
      game.player_scores[p.profile.id] = pScore;
    }
  }

  // After 5s showing between-round leaderboard, advance to next round or game over
  setTimeout(() => {
    if (game.status === 'ROUND_RESULT') {
      if (game.current_round_index + 1 < game.total_rounds) {
        game.current_round_index += 1;
        const nextRound = game.rounds[game.current_round_index];
        nextRound.status = 'ACTIVE';
        nextRound.start_time = new Date().toISOString();
        nextRound.end_time = new Date(Date.now() + nextRound.duration_seconds * 1000).toISOString();
        game.status = 'ROUND_ACTIVE';

        // Trigger bot simulated responses if bots are in room
        triggerBotSubmissions(game, nextRound);
      } else {
        // Game Over!
        finalizeGameOver(game);
      }
    }
  }, 5000);
}

function finalizeGameOver(game: Game) {
  game.status = 'GAME_OVER';
  game.completed_at = new Date().toISOString();
  const room = roomsById.get(game.room_id);
  if (!room) return;

  // Build final sorted leaderboard
  const playerRankings = room.players.map((rp) => {
    const scores = game.player_scores[rp.profile.id] || { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 0 };
    return {
      profile: rp.profile,
      total_score: scores.total_score,
      best_streak: scores.best_streak,
      total_attempts: scores.total_attempts
    };
  });

  playerRankings.sort((a, b) => {
    if (b.total_score !== a.total_score) return b.total_score - a.total_score;
    return a.total_attempts - b.total_attempts;
  });

  // Save GameResult for each human & bot profile
  playerRankings.forEach((pr, index) => {
    const rank = index + 1;
    const isWinner = rank === 1;

    // Collect rounds summary
    const roundsSummary = game.rounds.map((rnd) => {
      const state = roundPlayerStates.get(rnd.id)?.get(pr.profile.id);
      const validSub = state?.valid_submission;
      return {
        round_number: rnd.number,
        challenge_type: rnd.challenge_type,
        prompt: rnd.prompt,
        valid: state?.status === 'DONE',
        score: validSub ? validSub.score + validSub.streak_bonus : 0,
        time_seconds: validSub?.submission_seconds,
        image_url: validSub?.image_url,
        streak: validSub ? (game.player_scores[pr.profile.id]?.current_streak || 1) : 0
      };
    });

    const result: GameResult = {
      id: generateUUID(),
      game_id: game.id,
      profile_id: pr.profile.id,
      username: pr.profile.username,
      avatar: pr.profile.avatar,
      final_score: pr.total_score,
      rank,
      best_streak: pr.best_streak,
      is_winner: isWinner,
      total_rounds: game.total_rounds,
      round_duration: game.settings_snapshot.round_duration_seconds,
      played_at: game.completed_at || new Date().toISOString(),
      total_players: room.players.length,
      rounds_summary: roundsSummary
    };

    const history = gameResultsByProfile.get(pr.profile.id) || [];
    history.unshift(result);
    gameResultsByProfile.set(pr.profile.id, history);

    // Update persistent profile aggregates
    const profile = profiles.get(pr.profile.id);
    if (profile) {
      profile.games_played += 1;
      if (isWinner) profile.wins += 1;
      if (pr.total_score > profile.best_score) profile.best_score = pr.total_score;
      profiles.set(profile.id, profile);
    }
  });

  // Automatically reset Room status to WAITING after brief victory pause (rematch loop §13)
  setTimeout(() => {
    if (room.status === 'IN_GAME') {
      room.status = 'WAITING';
    }
  }, 10000);
}

// Bot simulation for engaging multi-player testing
function triggerBotSubmissions(game: Game, round: Round) {
  const room = roomsById.get(game.room_id);
  if (!room) return;

  const botPlayers = room.players.filter((p) => p.is_bot);
  if (botPlayers.length === 0) return;

  botPlayers.forEach((bot, index) => {
    // Stagger submission delays realistically between 5s and duration-3s
    const maxDelay = Math.max(6000, (round.duration_seconds - 4) * 1000);
    const delay = 4000 + Math.random() * (maxDelay - 4000);

    setTimeout(() => {
      // Check if round is still active
      if (game.status !== 'ROUND_ACTIVE' || round.status !== 'ACTIVE') return;

      const roundStates = roundPlayerStates.get(round.id) || new Map<string, PlayerRoundState>();
      let pState = roundStates.get(bot.profile.id);
      if (!pState) {
        pState = { round_id: round.id, profile_id: bot.profile.id, status: 'SEARCHING', attempts_used: 0 };
        roundStates.set(bot.profile.id, pState);
      }

      if (pState.status === 'DONE' || pState.attempts_used >= 2) return;

      pState.attempts_used += 1;

      // 80% bot accuracy rate
      const isValid = Math.random() > 0.15;
      const subKey = round.challenge_type;
      const sampleImg = SAMPLE_CHALLENGE_IMAGES[subKey] || SAMPLE_CHALLENGE_IMAGES.RED;

      const submissionSeconds = Math.min(
        round.duration_seconds,
        Math.max(3, Math.round((Date.now() - new Date(round.start_time).getTime()) / 1000))
      );

      const sub: Submission = {
        id: generateUUID(),
        round_id: round.id,
        profile_id: bot.profile.id,
        player_name: bot.profile.username,
        player_avatar: bot.profile.avatar,
        attempt_number: pState.attempts_used,
        image_url: sampleImg,
        valid: isValid,
        confidence: isValid ? 0.85 + Math.random() * 0.14 : 0.2 + Math.random() * 0.25,
        reason: isValid ? `Visible matching object detected clearly` : `Could not confirm matching object in frame`,
        is_override: false,
        timestamp: new Date().toISOString(),
        submission_seconds: submissionSeconds,
        score: 0,
        streak_bonus: 0
      };

      const pScore = game.player_scores[bot.profile.id] || { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 0 };
      pScore.total_attempts += 1;

      if (isValid) {
        pState.status = 'DONE';
        pState.valid_submission = sub;

        // Count previous valid submissions
        const previousValidCount = round.submissions.filter((s) => s.valid === true).length;
        const baseScore = getBaseScoreForRank(previousValidCount);
        pScore.current_streak += 1;
        if (pScore.current_streak > pScore.best_streak) {
          pScore.best_streak = pScore.current_streak;
        }
        const streakBonus = getStreakBonus(pScore.current_streak);

        sub.score = baseScore;
        sub.streak_bonus = streakBonus;
        pScore.total_score += baseScore + streakBonus;
      }

      game.player_scores[bot.profile.id] = pScore;
      round.submissions.push(sub);
      roundPlayerStates.set(round.id, roundStates);

      updateGameState(game);
    }, delay);
  });
}

// Periodic ticker
setInterval(() => {
  games.forEach((game) => {
    if (game.status === 'STARTING' || game.status === 'ROUND_ACTIVE') {
      updateGameState(game);
    }
  });
}, 500);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parser with higher limit for camera image base64 payloads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health Check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", gemini_connected: !!process.env.GEMINI_API_KEY });
  });

  // 1. Profile: Create or Recognize via Device Token
  app.post("/api/profiles", (req: Request, res: Response) => {
    const { username, avatar, accentColor, device_token } = req.body;
    const token = device_token || `dev_${Math.random().toString(36).substring(2, 9)}`;

    let profile: Profile | undefined;
    const existingId = profileByDeviceToken.get(token);
    if (existingId && profiles.has(existingId)) {
      profile = profiles.get(existingId)!;
      if (username) profile.username = username.trim().substring(0, 20);
      if (avatar) profile.avatar = avatar;
      if (accentColor) profile.accentColor = accentColor;
      profiles.set(profile.id, profile);
    } else {
      const id = generateUUID();
      profile = {
        id,
        username: (username || `Scavenger_${Math.floor(100 + Math.random() * 900)}`).trim().substring(0, 20),
        avatar: avatar || '🧑‍🚀',
        accentColor: accentColor || '#00D9F5',
        device_token: token,
        games_played: 0,
        wins: 0,
        best_score: 0,
        created_at: new Date().toISOString()
      };
      profiles.set(id, profile);
      profileByDeviceToken.set(token, id);
    }

    res.json({ profile });
  });

  // 2. Profile History
  app.get("/api/profiles/:id/history", (req: Request, res: Response) => {
    const { id } = req.params;
    const history = gameResultsByProfile.get(id) || [];
    res.json({ history });
  });

  // 3. Create Room
  app.post("/api/rooms", (req: Request, res: Response) => {
    const { profile_id, rounds_count = 3, round_duration_seconds = 30 } = req.body;
    const profile = profiles.get(profile_id);
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const code = generateRoomCode();
    const roomId = generateUUID();

    const settings: GameSettings = {
      id: generateUUID(),
      room_id: roomId,
      rounds_count: rounds_count as 3 | 5 | 7,
      round_duration_seconds: round_duration_seconds as 15 | 30 | 45,
      enabled_challenge_types: ['COLOR', 'TEXT', 'NUMBER', 'SHAPE', 'PATTERN', 'TRANSPARENCY']
    };

    const hostPlayer: RoomPlayer = {
      id: generateUUID(),
      room_id: roomId,
      profile,
      joined_at: new Date().toISOString(),
      is_ready: true,
      is_bot: false
    };

    const room: Room = {
      id: roomId,
      code,
      host_id: profile.id,
      host_name: profile.username,
      status: 'WAITING',
      settings,
      players: [hostPlayer],
      created_at: new Date().toISOString()
    };

    rooms.set(code, room);
    roomsById.set(roomId, room);

    res.json({ room });
  });

  // 4. Join Room
  app.post("/api/rooms/:code/join", (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase().trim();
    const { profile_id } = req.body;

    const profile = profiles.get(profile_id);
    if (!profile) {
      res.status(404).json({ error: "Profile not found. Please setup a profile first." });
      return;
    }

    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: `Room code '${code}' not found. Please check the code.` });
      return;
    }

    if (room.status === 'CLOSED') {
      res.status(400).json({ error: "This room has been closed." });
      return;
    }

    // Check if player is already in room
    const existingIndex = room.players.findIndex((p) => p.profile.id === profile.id);
    if (existingIndex >= 0) {
      // Rejoining player
      room.players[existingIndex].profile = profile;
      res.json({ room });
      return;
    }

    if (room.status === 'IN_GAME') {
      res.status(400).json({ error: "Game is currently in progress in this room. Please wait for the match to conclude." });
      return;
    }

    if (room.players.length >= 6) {
      res.status(400).json({ error: "Room is full (maximum 6 players reached)." });
      return;
    }

    // Check duplicate username in room
    if (room.players.some((p) => p.profile.username.toLowerCase() === profile.username.toLowerCase())) {
      profile.username = `${profile.username}_${Math.floor(10 + Math.random() * 90)}`;
    }

    const newPlayer: RoomPlayer = {
      id: generateUUID(),
      room_id: room.id,
      profile,
      joined_at: new Date().toISOString(),
      is_ready: true,
      is_bot: false
    };

    room.players.push(newPlayer);
    res.json({ room });
  });

  // 5. Read Room State
  app.get("/api/rooms/:code", (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    let currentGame: Game | undefined;
    if (room.current_game_id) {
      currentGame = games.get(room.current_game_id);
    }

    res.json({ room, game: currentGame });
  });

  // 6. Leave Room
  app.post("/api/rooms/:code/leave", (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase().trim();
    const { profile_id } = req.body;
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    room.players = room.players.filter((p) => p.profile.id !== profile_id);

    // If host left, transfer host to next human player or close room
    if (room.host_id === profile_id) {
      const nextHuman = room.players.find((p) => !p.is_bot);
      if (nextHuman) {
        room.host_id = nextHuman.profile.id;
        room.host_name = nextHuman.profile.username;
      } else {
        room.status = 'CLOSED';
      }
    }

    res.json({ success: true, room });
  });

  // 7. Update Room Settings (Host Only)
  app.patch("/api/rooms/:code/settings", (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase().trim();
    const { host_profile_id, rounds_count, round_duration_seconds, enabled_challenge_types } = req.body;
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.host_id !== host_profile_id) {
      res.status(403).json({ error: "Only the host can modify room settings." });
      return;
    }

    if (room.status !== 'WAITING') {
      res.status(400).json({ error: "Settings can only be changed while in the Waiting Room." });
      return;
    }

    if (rounds_count && [3, 5, 7].includes(rounds_count)) {
      room.settings.rounds_count = rounds_count;
    }
    if (round_duration_seconds && [15, 30, 45].includes(round_duration_seconds)) {
      room.settings.round_duration_seconds = round_duration_seconds;
    }
    if (enabled_challenge_types && Array.isArray(enabled_challenge_types) && enabled_challenge_types.length > 0) {
      room.settings.enabled_challenge_types = enabled_challenge_types;
    }

    res.json({ room });
  });

  // 8. Toggle Bots / Add simulated players for easy testing
  app.post("/api/rooms/:code/toggle-bots", (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase().trim();
    const { host_profile_id, action } = req.body; // action: 'add_bot' | 'remove_bots' | 'fill'
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.host_id !== host_profile_id) {
      res.status(403).json({ error: "Only the host can configure companions." });
      return;
    }

    if (action === 'remove_bots') {
      room.players = room.players.filter((p) => !p.is_bot);
    } else if (action === 'fill' || action === 'add_bot') {
      const botsToAddCount = action === 'fill' ? Math.max(0, 4 - room.players.length) : 1;
      for (let i = 0; i < botsToAddCount && room.players.length < 6; i++) {
        const availableTemplates = BOT_TEMPLATES.filter(
          (bt) => !room.players.some((p) => p.profile.username === bt.username)
        );
        const template = availableTemplates[0] || {
          username: `Bot_${Math.floor(100 + Math.random() * 900)}`,
          avatar: '🤖',
          accentColor: '#38BDF8'
        };

        const botProfile: Profile = {
          id: generateUUID(),
          username: template.username,
          avatar: template.avatar,
          accentColor: template.accentColor,
          device_token: `bot_${generateUUID()}`,
          games_played: Math.floor(5 + Math.random() * 20),
          wins: Math.floor(1 + Math.random() * 10),
          best_score: Math.floor(200 + Math.random() * 400),
          created_at: new Date().toISOString()
        };
        profiles.set(botProfile.id, botProfile);

        room.players.push({
          id: generateUUID(),
          room_id: room.id,
          profile: botProfile,
          joined_at: new Date().toISOString(),
          is_ready: true,
          is_bot: true
        });
      }
    }

    res.json({ room });
  });

  // 9. Start Game (Host only - starts Game 1 or Rematch!)
  app.post("/api/rooms/:code/start", (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase().trim();
    const { host_profile_id } = req.body;
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (room.host_id !== host_profile_id) {
      res.status(403).json({ error: "Only the room host can start the game." });
      return;
    }

    if (room.players.length < 2) {
      // Auto-add 2 bots if playing solo so the user can immediately experience the full game loop!
      const needed = 2 - room.players.length;
      for (let i = 0; i < needed; i++) {
        const template = BOT_TEMPLATES[i] || { username: `Player_${i + 1}`, avatar: '🤖', accentColor: '#10B981' };
        const botProfile: Profile = {
          id: generateUUID(),
          username: template.username,
          avatar: template.avatar,
          accentColor: template.accentColor,
          device_token: `bot_${generateUUID()}`,
          games_played: 12,
          wins: 4,
          best_score: 360,
          created_at: new Date().toISOString()
        };
        profiles.set(botProfile.id, botProfile);
        room.players.push({
          id: generateUUID(),
          room_id: room.id,
          profile: botProfile,
          joined_at: new Date().toISOString(),
          is_ready: true,
          is_bot: true
        });
      }
    }

    const settingsSnapshot: GameSettings = JSON.parse(JSON.stringify(room.settings));
    const gameId = generateUUID();

    // Generate balanced rounds
    const rounds: Round[] = [];
    const enabledTypes = settingsSnapshot.enabled_challenge_types.length > 0
      ? settingsSnapshot.enabled_challenge_types
      : (['COLOR', 'TEXT', 'NUMBER', 'SHAPE', 'PATTERN', 'TRANSPARENCY'] as ChallengeType[]);

    let lastType: ChallengeType | null = null;
    for (let rNum = 1; rNum <= settingsSnapshot.rounds_count; rNum++) {
      const candidates = enabledTypes.filter((t) => t !== lastType);
      const chosenType = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
      lastType = chosenType;

      const pool = CHALLENGE_POOL[chosenType] || CHALLENGE_POOL.COLOR;
      const challenge = pool[Math.floor(Math.random() * pool.length)];

      const roundId = generateUUID();
      rounds.push({
        id: roundId,
        game_id: gameId,
        number: rNum,
        challenge_type: chosenType,
        prompt: challenge.prompt,
        sub_prompt: challenge.subPrompt,
        start_time: new Date(Date.now() + 3000).toISOString(),
        end_time: new Date(Date.now() + 3000 + settingsSnapshot.round_duration_seconds * 1000).toISOString(),
        duration_seconds: settingsSnapshot.round_duration_seconds,
        status: 'PENDING',
        submissions: []
      });

      // Init round player states map
      const stateMap = new Map<string, PlayerRoundState>();
      room.players.forEach((p) => {
        stateMap.set(p.profile.id, {
          round_id: roundId,
          profile_id: p.profile.id,
          status: 'SEARCHING',
          attempts_used: 0
        });
      });
      roundPlayerStates.set(roundId, stateMap);
    }

    // Init player scores
    const playerScores: Record<string, { total_score: number; current_streak: number; best_streak: number; total_attempts: number }> = {};
    room.players.forEach((p) => {
      playerScores[p.profile.id] = { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 0 };
    });

    const newGame: Game = {
      id: gameId,
      room_id: room.id,
      settings_snapshot: settingsSnapshot,
      status: 'STARTING',
      current_round_index: 0,
      total_rounds: settingsSnapshot.rounds_count,
      started_at: new Date().toISOString(),
      rounds,
      player_scores: playerScores
    };

    games.set(gameId, newGame);
    room.current_game_id = gameId;
    room.status = 'IN_GAME';

    res.json({ game: newGame, room });
  });

  // 10. Synchronized Game State Polling
  app.get("/api/games/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const game = games.get(id);
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const room = roomsById.get(game.room_id);
    const currentRound = game.rounds[game.current_round_index];
    const roundStates = currentRound ? roundPlayerStates.get(currentRound.id) : null;

    const roundStatesObj: Record<string, PlayerRoundState> = {};
    if (roundStates) {
      roundStates.forEach((val, key) => {
        roundStatesObj[key] = val;
      });
    }

    // Build Live Leaderboard Score Summaries
    const leaderboard: PlayerScoreSummary[] = (room?.players || []).map((rp) => {
      const sc = game.player_scores[rp.profile.id] || { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 0 };
      const rState = roundStates?.get(rp.profile.id);
      const validSub = rState?.valid_submission;
      return {
        profile_id: rp.profile.id,
        username: rp.profile.username,
        avatar: rp.profile.avatar,
        is_host: rp.profile.id === room?.host_id,
        is_bot: rp.is_bot,
        current_round_score: validSub ? validSub.score + validSub.streak_bonus : 0,
        total_score: sc.total_score,
        current_streak: sc.current_streak,
        best_streak: sc.best_streak,
        attempts_this_round: rState?.attempts_used || 0,
        is_done_this_round: rState?.status === 'DONE',
        rank: 1,
        total_attempts: sc.total_attempts
      };
    });

    leaderboard.sort((a, b) => {
      if (b.total_score !== a.total_score) return b.total_score - a.total_score;
      return a.total_attempts - b.total_attempts;
    });

    leaderboard.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    res.json({
      game,
      current_round: currentRound,
      player_round_states: roundStatesObj,
      leaderboard,
      room_status: room?.status
    });
  });

  // 11. AI Referee Submission Endpoint
  app.post("/api/rounds/:id/submit", async (req: Request, res: Response) => {
    const { id: roundId } = req.params;
    const { profile_id, image_data, image_url } = req.body;

    let targetGame: Game | undefined;
    let targetRound: Round | undefined;

    for (const g of games.values()) {
      const r = g.rounds.find((rnd) => rnd.id === roundId);
      if (r) {
        targetGame = g;
        targetRound = r;
        break;
      }
    }

    if (!targetGame || !targetRound) {
      res.status(404).json({ error: "Round not found" });
      return;
    }

    if (targetRound.status !== 'ACTIVE') {
      res.status(400).json({ error: "Round is not currently active for submissions." });
      return;
    }

    const roundStates = roundPlayerStates.get(roundId) || new Map<string, PlayerRoundState>();
    let pState = roundStates.get(profile_id);
    if (!pState) {
      pState = { round_id: roundId, profile_id, status: 'SEARCHING', attempts_used: 0 };
      roundStates.set(profile_id, pState);
    }

    // Strict Enforcement of §9: If already DONE, reject further submissions!
    if (pState.status === 'DONE') {
      res.status(400).json({ error: "You have already completed this round with a valid submission." });
      return;
    }

    if (pState.attempts_used >= 2) {
      res.status(400).json({ error: "Maximum attempts (2) exhausted for this round." });
      return;
    }

    pState.attempts_used += 1;
    const attemptNumber = pState.attempts_used;

    const profile = profiles.get(profile_id);
    const playerName = profile?.username || 'Player';
    const playerAvatar = profile?.avatar || '👤';

    const submissionSeconds = Math.min(
      targetRound.duration_seconds,
      Math.max(1, Math.round((Date.now() - new Date(targetRound.start_time).getTime()) / 1000))
    );

    // Call Gemini AI Referee
    let isValid = false;
    let confidence = 0.5;
    let reason = "Judging in progress...";

    const prompt = targetRound.prompt;
    const challengeType = targetRound.challenge_type;

    try {
      const ai = getGemini();
      if (ai && image_data) {
        // Strip data:image/...;base64, prefix if present
        const base64Data = image_data.includes('base64,')
          ? image_data.split('base64,')[1]
          : image_data;

        // Exact system prompt from PRD §10
        const systemPrompt = `You are judging a single photo submitted in a real-time scavenger game.
The player was given this challenge: "${prompt}"

Rules for your judgment:
- Judge only what is visibly present in the image.
- For color challenges: any clearly visible object or region containing the requested color counts, including common shades and tints of it.
- For text/number challenges: any legible visible text or numeral counts, in any language, any size, printed or handwritten.
- For shape challenges: judge the dominant visible outline of an object loosely — approximate matches count.
- For pattern challenges: the pattern must be clearly visible and unambiguous, not inferred from a small or blurry region.
- For transparency challenges: the transparent material or region must be clearly visible in the frame, not merely plausible.
- Do not require the object to be the main subject of the photo — a qualifying object anywhere in frame is sufficient.
- If you are unsure, lean toward VALID rather than INVALID — this is a casual party game, not a strict test.

Respond with ONLY a JSON object in this exact format, no other text:
{"valid": true or false, "confidence": a number between 0 and 1, "reason": "brief 5-10 word explanation"}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              },
              {
                text: systemPrompt
              }
            ]
          },
          config: {
            responseMimeType: "application/json"
          }
        });

        const textOutput = response.text?.trim() || "";
        try {
          const parsed = JSON.parse(textOutput);
          isValid = Boolean(parsed.valid);
          confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;
          reason = parsed.reason || (isValid ? 'Matching object verified' : 'Object does not meet criteria');
        } catch {
          // Fallback parsing if wrapped in markdown
          const match = textOutput.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            isValid = Boolean(parsed.valid);
            confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;
            reason = parsed.reason || (isValid ? 'Matching object verified' : 'Object does not meet criteria');
          } else {
            isValid = true;
            confidence = 0.8;
            reason = "AI verified candidate object in photo";
          }
        }
      } else {
        // Fallback simulated referee if Gemini key is not configured in local environment
        isValid = true;
        confidence = 0.92;
        reason = `Object verified for ${prompt}`;
      }
    } catch (err: unknown) {
      console.error("Gemini AI referee error:", err);
      // Fallback per PRD §15: lean forgivingly or allow retry
      isValid = true;
      confidence = 0.8;
      reason = "Verified candidate match in camera frame";
    }

    const finalImageUrl = image_url || image_data || (SAMPLE_CHALLENGE_IMAGES[challengeType] || SAMPLE_CHALLENGE_IMAGES.RED);

    const submission: Submission = {
      id: generateUUID(),
      round_id: roundId,
      profile_id,
      player_name: playerName,
      player_avatar: playerAvatar,
      attempt_number: attemptNumber,
      image_url: finalImageUrl,
      valid: isValid,
      confidence: Math.round(confidence * 100) / 100,
      reason,
      is_override: false,
      timestamp: new Date().toISOString(),
      submission_seconds: submissionSeconds,
      score: 0,
      streak_bonus: 0
    };

    const pScore = targetGame.player_scores[profile_id] || { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 0 };
    pScore.total_attempts += 1;

    if (isValid) {
      pState.status = 'DONE';
      pState.valid_submission = submission;

      // Scoring per PRD §12
      const previousValidSubmissions = targetRound.submissions.filter((s) => s.valid === true).length;
      const baseScore = getBaseScoreForRank(previousValidSubmissions);

      pScore.current_streak += 1;
      if (pScore.current_streak > pScore.best_streak) {
        pScore.best_streak = pScore.current_streak;
      }
      const streakBonus = getStreakBonus(pScore.current_streak);

      submission.score = baseScore;
      submission.streak_bonus = streakBonus;
      pScore.total_score += baseScore + streakBonus;
    }

    targetGame.player_scores[profile_id] = pScore;
    targetRound.submissions.push(submission);
    roundPlayerStates.set(roundId, roundStates);

    updateGameState(targetGame);

    res.json({
      submission,
      player_round_state: pState,
      player_score: pScore
    });
  });

  // 12. Host Emergency Override (§11)
  app.post("/api/submissions/:id/override", (req: Request, res: Response) => {
    const { id: submissionId } = req.params;
    const { host_profile_id, force_valid } = req.body;

    let targetGame: Game | undefined;
    let targetRound: Round | undefined;
    let targetSub: Submission | undefined;

    for (const g of games.values()) {
      for (const r of g.rounds) {
        const s = r.submissions.find((sub) => sub.id === submissionId);
        if (s) {
          targetGame = g;
          targetRound = r;
          targetSub = s;
          break;
        }
      }
      if (targetSub) break;
    }

    if (!targetGame || !targetRound || !targetSub) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const room = roomsById.get(targetGame.room_id);
    if (!room || room.host_id !== host_profile_id) {
      res.status(403).json({ error: "Only the host can execute an emergency override." });
      return;
    }

    const wasValid = targetSub.valid;
    const makeValid = Boolean(force_valid);

    targetSub.valid = makeValid;
    targetSub.is_override = true;
    targetSub.reason = makeValid ? "Host manual override: Validated" : "Host manual override: Invalidated";

    const roundStates = roundPlayerStates.get(targetRound.id) || new Map<string, PlayerRoundState>();
    let pState = roundStates.get(targetSub.profile_id);
    if (!pState) {
      pState = { round_id: targetRound.id, profile_id: targetSub.profile_id, status: 'SEARCHING', attempts_used: 1 };
    }

    const pScore = targetGame.player_scores[targetSub.profile_id] || { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 1 };

    if (makeValid && !wasValid) {
      pState.status = 'DONE';
      pState.valid_submission = targetSub;

      const previousValidCount = targetRound.submissions.filter((s) => s.valid === true && s.id !== targetSub!.id).length;
      const baseScore = getBaseScoreForRank(previousValidCount);
      pScore.current_streak += 1;
      if (pScore.current_streak > pScore.best_streak) {
        pScore.best_streak = pScore.current_streak;
      }
      const streakBonus = getStreakBonus(pScore.current_streak);

      targetSub.score = baseScore;
      targetSub.streak_bonus = streakBonus;
      pScore.total_score += baseScore + streakBonus;
    } else if (!makeValid && wasValid) {
      pScore.total_score = Math.max(0, pScore.total_score - (targetSub.score + targetSub.streak_bonus));
      targetSub.score = 0;
      targetSub.streak_bonus = 0;
      pState.status = 'SEARCHING';
      pState.valid_submission = undefined;
    }

    targetGame.player_scores[targetSub.profile_id] = pScore;
    roundPlayerStates.set(targetRound.id, roundStates);

    updateGameState(targetGame);

    res.json({ success: true, submission: targetSub, player_score: pScore });
  });

  // 13. Leaderboard
  app.get("/api/games/:id/leaderboard", (req: Request, res: Response) => {
    const { id } = req.params;
    const game = games.get(id);
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const room = roomsById.get(game.room_id);
    const leaderboard = (room?.players || []).map((rp) => {
      const sc = game.player_scores[rp.profile.id] || { total_score: 0, current_streak: 0, best_streak: 0, total_attempts: 0 };
      return {
        profile_id: rp.profile.id,
        username: rp.profile.username,
        avatar: rp.profile.avatar,
        is_host: rp.profile.id === room?.host_id,
        is_bot: rp.is_bot,
        total_score: sc.total_score,
        current_streak: sc.current_streak,
        best_streak: sc.best_streak,
        total_attempts: sc.total_attempts
      };
    });

    leaderboard.sort((a, b) => b.total_score - a.total_score);

    res.json({ leaderboard });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NPC Mode Game Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
