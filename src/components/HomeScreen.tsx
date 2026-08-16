import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  LogIn,
  Users,
  Trophy,
  Flame,
  HelpCircle,
  Clock,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { HeaderNav } from './HeaderNav';

interface HomeScreenProps {
  onOpenHowToPlay: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenHowToPlay }) => {
  const {
    profile,
    createRoom,
    joinRoom,
    toggleBots,
    startGame,
    history,
    setActiveTab,
    isLoading
  } = useGame();

  const [joinCode, setJoinCode] = useState<string>('');
  const [showJoinInput, setShowJoinInput] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async () => {
    try {
      setErrorMsg(null);
      await createRoom();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create room');
    }
  };

  const handleJoin = async () => {
    if (!joinCode || joinCode.trim().length < 4) {
      setErrorMsg('Please enter a 5-character room code');
      return;
    }
    try {
      setErrorMsg(null);
      await joinRoom(joinCode.trim().toUpperCase());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not join room');
    }
  };

  // Instant 1-click Quick Match with AI companions
  const handleQuickDemo = async () => {
    try {
      setErrorMsg(null);
      await createRoom(3, 30);
      await toggleBots('fill');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Demo match error');
    }
  };

  const recentGame = history.length > 0 ? history[0] : null;

  return (
    <div
      id="home-screen-view"
      className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto select-none pb-24 animate-fade-in"
    >
      <HeaderNav />

      {/* Hero & Profile Header Card */}
      <div className="my-2 space-y-4">
        {/* Profile Snapshot Card */}
        <div
          id="profile-snapshot-card"
          onClick={() => setActiveTab('profile')}
          className="p-4 rounded-3xl bg-gradient-to-b from-[#0B1220] to-[#070B14] border border-cyan-950/80 shadow-xl flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-3xl shadow-md">
                {profile?.avatar || '👩'}
              </div>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#070B14] absolute -bottom-0.5 -right-0.5" />
            </div>

            <div>
              <div className="text-base font-extrabold text-white flex items-center space-x-1.5">
                <span>{profile?.username || 'Banu'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  LVL {Math.floor(((profile?.games_played ?? 0) / 3)) + 1}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-3">
                <span>{profile?.games_played ?? 0} matches</span>
                <span>•</span>
                <span>{profile?.wins ?? 0} wins</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">BEST SCORE</div>
            <div className="text-lg font-black font-mono text-[#00D9F5]">
              {profile?.best_score ?? 0}
            </div>
          </div>
        </div>

        {/* Catchphrase Hero Banner */}
        <div className="text-center py-2 space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PHYSICAL WORLD.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5A0] to-[#00D9F5]">
              AI REFEREE.
            </span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Find and photograph real-world objects matching dynamic AI prompts before time runs out!
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Create Room */}
          <button
            id="home-create-room-btn"
            type="button"
            disabled={isLoading}
            onClick={handleCreate}
            className="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center">
                <Play className="w-4 h-4 fill-slate-950" />
              </div>
              <span className="text-base">CREATE ROOM</span>
            </div>
            <span className="text-xs font-bold text-slate-900 bg-white/40 px-2.5 py-1 rounded-full">
              Host Match
            </span>
          </button>

          {/* Join Room */}
          {!showJoinInput ? (
            <button
              id="home-join-room-toggle-btn"
              type="button"
              onClick={() => setShowJoinInput(true)}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-cyan-300 bg-[#0B1220] border border-cyan-500/40 hover:bg-[#0f192c] active:scale-[0.98] transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <LogIn className="w-5 h-5 text-cyan-400" />
                <span>JOIN ROOM</span>
              </div>
              <span className="text-xs text-slate-400">Enter Code →</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-[#0B1220] border-2 border-cyan-500/60 shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">ENTER 5-DIGIT ROOM CODE</span>
                <button
                  type="button"
                  onClick={() => setShowJoinInput(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="flex space-x-2">
                <input
                  id="room-code-input-field"
                  type="text"
                  maxLength={5}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="AB7X2"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-cyan-500/40 font-mono font-black text-lg tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
                <button
                  id="submit-join-room-btn"
                  type="button"
                  disabled={isLoading || joinCode.length < 4}
                  onClick={handleJoin}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-md active:scale-95 transition-all disabled:opacity-40"
                >
                  JOIN
                </button>
              </div>
            </div>
          )}

          {/* Quick Demo with AI Companions */}
          <button
            id="home-quick-demo-btn"
            type="button"
            disabled={isLoading}
            onClick={handleQuickDemo}
            className="w-full py-3 px-4 rounded-2xl font-semibold text-xs text-slate-300 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Quick Solo Demo (with 3 AI Companions)</span>
            </div>
            <span className="text-cyan-400 text-xs font-bold">1-Click</span>
          </button>
        </div>

        {/* Recent Activity Mini Card */}
        {recentGame && (
          <div
            id="recent-match-card"
            onClick={() => setActiveTab('history')}
            className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-200">
                  Last Match: Rank #{recentGame.rank} of {recentGame.total_players}
                </div>
                <div className="text-[11px] text-slate-400">
                  {recentGame.total_score} points • {recentGame.rounds.length} rounds
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
        )}

        {/* How to Play Card */}
        <div
          id="how-to-play-card-btn"
          onClick={onOpenHowToPlay}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-cyan-900/40 flex items-center justify-between cursor-pointer hover:border-cyan-500/40 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-cyan-300">How To Play NPC Mode</div>
              <div className="text-[11px] text-slate-400">Rules, scoring speed, & AI referee guidelines</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500">
        AI Referee powered by Gemini 3.7 Flash
      </div>
    </div>
  );
};
