import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Profile,
  Room,
  Game,
  Round,
  PlayerRoundState,
  PlayerScoreSummary,
  GameResult,
  GameSettings,
  ChallengeType
} from '../types';
import { api } from '../services/api';
import { sound } from '../services/audio';

interface GameContextType {
  profile: Profile | null;
  currentRoom: Room | null;
  currentGame: Game | null;
  currentRound: Round | null;
  playerRoundState: PlayerRoundState | null;
  leaderboard: PlayerScoreSummary[];
  history: GameResult[];
  activeTab: 'home' | 'history' | 'profile' | 'settings';
  setActiveTab: (tab: 'home' | 'history' | 'profile' | 'settings') => void;
  isLoading: boolean;
  isJudging: boolean;
  judgingSubmission: { imageUrl: string; attempt: number } | null;
  lastSubmissionVerdict: { valid: boolean; reason?: string; points?: number; streak?: number; confidence?: number; imageUrl?: string } | null;
  showEmergencyModal: boolean;
  setShowEmergencyModal: (show: boolean) => void;
  settings: {
    sound: boolean;
    music: boolean;
    vibration: boolean;
    theme: string;
  };
  updateAppSettings: (newSettings: Partial<{ sound: boolean; music: boolean; vibration: boolean; theme: string }>) => void;
  setProfileInfo: (username: string, avatar: string, accentColor?: string) => Promise<void>;
  createRoom: (rounds?: 3 | 5 | 7, duration?: 15 | 30 | 45) => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updateHostSettings: (settings: { rounds_count?: 3 | 5 | 7; round_duration_seconds?: 15 | 30 | 45; enabled_challenge_types?: ChallengeType[] }) => Promise<void>;
  toggleBots: (action: 'add_bot' | 'remove_bots' | 'fill') => Promise<void>;
  startGame: () => Promise<void>;
  submitPhoto: (base64Image: string) => Promise<{ valid: boolean; reason?: string }>;
  executeOverride: (submissionId: string, forceValid: boolean) => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearLastVerdict: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [playerRoundState, setPlayerRoundState] = useState<PlayerRoundState | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerScoreSummary[]>([]);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile' | 'settings'>('home');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isJudging, setIsJudging] = useState<boolean>(false);
  const [judgingSubmission, setJudgingSubmission] = useState<{ imageUrl: string; attempt: number } | null>(null);
  const [lastSubmissionVerdict, setLastSubmissionVerdict] = useState<{ valid: boolean; reason?: string; points?: number; streak?: number; confidence?: number; imageUrl?: string } | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  const [appSettings, setAppSettings] = useState({
    sound: true,
    music: false,
    vibration: true,
    theme: 'Celestial'
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastRoundNumberRef = useRef<number>(-1);
  const lastGameStatusRef = useRef<string>('');

  // Sound sync
  const updateAppSettings = useCallback((newSettings: Partial<{ sound: boolean; music: boolean; vibration: boolean; theme: string }>) => {
    setAppSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.sound !== undefined) {
        sound.setMuted(!newSettings.sound);
      }
      try {
        localStorage.setItem('npc_app_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Initialize profile from local storage / server
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('npc_app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setAppSettings(parsed);
        sound.setMuted(!parsed.sound);
      }
    } catch {
      // ignore
    }

    let token = '';
    try {
      token = localStorage.getItem('npc_device_token') || '';
      if (!token) {
        token = `device_${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem('npc_device_token', token);
      }
    } catch {
      token = `device_${Math.random().toString(36).substring(2, 10)}`;
    }

    // Load or create profile
    api.setupProfile({
      username: 'Banu',
      avatar: '👩',
      accentColor: '#00D9F5',
      device_token: token
    }).then((res) => {
      setProfile(res.profile);
      // Load history
      api.getProfileHistory(res.profile.id).then((hRes) => {
        setHistory(hRes.history);
      }).catch(console.error);
    }).catch(console.error);
  }, []);

  // Update profile
  const setProfileInfo = async (username: string, avatar: string, accentColor?: string) => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const res = await api.setupProfile({
        username,
        avatar,
        accentColor,
        device_token: profile.device_token
      });
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch History
  const fetchHistory = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await api.getProfileHistory(profile.id);
      setHistory(res.history);
    } catch (err) {
      console.error(err);
    }
  }, [profile]);

  // Create Room
  const createRoom = async (rounds_count?: 3 | 5 | 7, round_duration_seconds?: 15 | 30 | 45): Promise<string> => {
    if (!profile) throw new Error('Profile not ready');
    setIsLoading(true);
    try {
      const res = await api.createRoom({
        profile_id: profile.id,
        rounds_count,
        round_duration_seconds
      });
      setCurrentRoom(res.room);
      setCurrentGame(null);
      setCurrentRound(null);
      setPlayerRoundState(null);
      setLastSubmissionVerdict(null);
      sound.playClick();
      return res.room.code;
    } finally {
      setIsLoading(false);
    }
  };

  // Join Room
  const joinRoom = async (code: string) => {
    if (!profile) throw new Error('Profile not ready');
    setIsLoading(true);
    try {
      const res = await api.joinRoom(code, profile.id);
      setCurrentRoom(res.room);
      setCurrentGame(null);
      setCurrentRound(null);
      setPlayerRoundState(null);
      setLastSubmissionVerdict(null);
      sound.playClick();
    } finally {
      setIsLoading(false);
    }
  };

  // Leave Room
  const leaveRoom = async () => {
    if (!currentRoom || !profile) return;
    try {
      await api.leaveRoom(currentRoom.code, profile.id);
    } catch {
      // ignore
    }
    setCurrentRoom(null);
    setCurrentGame(null);
    setCurrentRound(null);
    setPlayerRoundState(null);
    setLastSubmissionVerdict(null);
    sound.playClick();
  };

  // Update Settings (Host)
  const updateHostSettings = async (newSettings: {
    rounds_count?: 3 | 5 | 7;
    round_duration_seconds?: 15 | 30 | 45;
    enabled_challenge_types?: ChallengeType[];
  }) => {
    if (!currentRoom || !profile) return;
    const res = await api.updateRoomSettings(currentRoom.code, {
      host_profile_id: profile.id,
      ...newSettings
    });
    setCurrentRoom(res.room);
    sound.playClick();
  };

  // Toggle Bots
  const toggleBots = async (action: 'add_bot' | 'remove_bots' | 'fill') => {
    if (!currentRoom || !profile) return;
    const res = await api.toggleBots(currentRoom.code, {
      host_profile_id: profile.id,
      action
    });
    setCurrentRoom(res.room);
    sound.playClick();
  };

  // Start Game
  const startGame = async () => {
    if (!currentRoom || !profile) return;
    setIsLoading(true);
    try {
      const res = await api.startGame(currentRoom.code, profile.id);
      setCurrentGame(res.game);
      setCurrentRoom(res.room);
      setLastSubmissionVerdict(null);
      sound.playCountdownTick(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Photo to AI Referee
  const submitPhoto = async (base64Image: string): Promise<{ valid: boolean; reason?: string }> => {
    if (!currentGame || !currentRound || !profile) {
      throw new Error('No active round');
    }

    sound.playShutter();
    setIsJudging(true);
    const attempt = (playerRoundState?.attempts_used || 0) + 1;
    setJudgingSubmission({ imageUrl: base64Image, attempt });

    try {
      const res = await api.submitRoundPhoto(currentRound.id, {
        profile_id: profile.id,
        image_data: base64Image,
      });

      setPlayerRoundState(res.player_round_state);
      const isValid = res.submission.valid === true;

      if (isValid) {
        sound.playValidChime();
        setLastSubmissionVerdict({
          valid: true,
          points: res.submission.score,
          streak: res.player_score.current_streak,
          reason: res.submission.reason || 'Verified match!',
          confidence: res.submission.confidence,
          imageUrl: res.submission.image_url
        });
      } else {
        sound.playInvalidBuzz();
        setLastSubmissionVerdict({
          valid: false,
          reason: res.submission.reason || "Doesn't match challenge",
          confidence: res.submission.confidence,
          imageUrl: res.submission.image_url
        });
      }

      return { valid: isValid, reason: res.submission.reason };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Validation failed';
      sound.playInvalidBuzz();
      setLastSubmissionVerdict({
        valid: false,
        reason: errMsg
      });
      return { valid: false, reason: errMsg };
    } finally {
      setIsJudging(false);
      setJudgingSubmission(null);
    }
  };

  // Host Emergency Override
  const executeOverride = async (submissionId: string, forceValid: boolean) => {
    if (!profile) return;
    await api.overrideSubmission(submissionId, {
      host_profile_id: profile.id,
      force_valid: forceValid
    });
    sound.playClick();
  };

  const clearLastVerdict = () => {
    setLastSubmissionVerdict(null);
  };

  // Synchronized Polling Engine
  useEffect(() => {
    if (!currentRoom) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const pollInterval = currentGame?.status === 'ROUND_ACTIVE' ? 800 : 1500;

    const runPoll = async () => {
      try {
        if (currentRoom.code) {
          const roomRes = await api.getRoom(currentRoom.code);
          setCurrentRoom(roomRes.room);

          if (roomRes.room.current_game_id) {
            const gameStatusRes = await api.getGameStatus(roomRes.room.current_game_id);
            const g = gameStatusRes.game;
            setCurrentGame(g);
            setCurrentRound(gameStatusRes.current_round || null);
            setLeaderboard(gameStatusRes.leaderboard || []);

            if (profile && gameStatusRes.player_round_states) {
              const myState = gameStatusRes.player_round_states[profile.id];
              if (myState) {
                setPlayerRoundState(myState);
              }
            }

            // Audio cues on state transitions
            if (g.status !== lastGameStatusRef.current) {
              if (g.status === 'GAME_OVER' && lastGameStatusRef.current !== 'GAME_OVER') {
                sound.playVictoryFanfare();
                fetchHistory();
              }
              lastGameStatusRef.current = g.status;
            }

            // Check if round changed
            if (gameStatusRes.current_round && gameStatusRes.current_round.number !== lastRoundNumberRef.current) {
              lastRoundNumberRef.current = gameStatusRes.current_round.number;
              setLastSubmissionVerdict(null);
              if (g.status === 'ROUND_ACTIVE') {
                sound.playCountdownTick(true);
              }
            }
          } else {
            setCurrentGame(null);
            setCurrentRound(null);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    runPoll();
    pollingRef.current = setInterval(runPoll, pollInterval);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentRoom?.code, currentGame?.status, profile?.id, fetchHistory]);

  return (
    <GameContext.Provider
      value={{
        profile,
        currentRoom,
        currentGame,
        currentRound,
        playerRoundState,
        leaderboard,
        history,
        activeTab,
        setActiveTab,
        isLoading,
        isJudging,
        judgingSubmission,
        lastSubmissionVerdict,
        showEmergencyModal,
        setShowEmergencyModal,
        settings: appSettings,
        updateAppSettings,
        setProfileInfo,
        createRoom,
        joinRoom,
        leaveRoom,
        updateHostSettings,
        toggleBots,
        startGame,
        submitPhoto,
        executeOverride,
        fetchHistory,
        clearLastVerdict
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
