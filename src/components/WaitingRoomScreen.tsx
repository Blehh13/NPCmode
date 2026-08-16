import React, { useState } from 'react';
import {
  Copy,
  Check,
  Crown,
  Users,
  Clock,
  Palette,
  Type,
  Hash,
  Circle,
  Grid,
  Layers,
  Settings as SettingsIcon,
  Play,
  UserPlus,
  UserMinus,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { HostSettingsModal } from './HostSettingsModal';
import { ChallengeType } from '../types';

export const WaitingRoomScreen: React.FC = () => {
  const {
    currentRoom,
    profile,
    updateHostSettings,
    toggleBots,
    startGame,
    leaveRoom,
    isLoading
  } = useGame();

  const [copied, setCopied] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  if (!currentRoom) return null;

  const isHost = profile && currentRoom.host_id === profile.id;
  const playerCount = currentRoom.players.length;
  const maxPlayers = 6;
  const canStart = playerCount >= 2;

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(currentRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const getChallengeIcon = (type: ChallengeType) => {
    switch (type) {
      case 'COLOR':
        return <Palette className="w-3.5 h-3.5" />;
      case 'TEXT':
        return <Type className="w-3.5 h-3.5" />;
      case 'NUMBER':
        return <Hash className="w-3.5 h-3.5" />;
      case 'SHAPE':
        return <Circle className="w-3.5 h-3.5" />;
      case 'PATTERN':
        return <Grid className="w-3.5 h-3.5" />;
      case 'TRANSPARENCY':
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      id="waiting-room-screen"
      className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto select-none relative animate-fade-in pb-8"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          id="waiting-room-leave-btn"
          onClick={leaveRoom}
          className="px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>

        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
          {isHost ? (
            <span className="flex items-center space-x-1">
              <Crown className="w-3 h-3 text-amber-400" />
              <span>You are HOST</span>
            </span>
          ) : (
            <span>WAITING ROOM</span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col space-y-5 my-auto py-2">
        {/* Room Code Card */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            ROOM CODE
          </span>

          <div
            id="room-code-display-card"
            onClick={handleCopyCode}
            className="group relative px-6 py-3 rounded-2xl bg-gradient-to-b from-[#0B1220] to-[#070B14] border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/10 cursor-pointer flex items-center space-x-3 active:scale-95 transition-all"
          >
            <span className="text-3xl sm:text-4xl font-black tracking-widest text-white font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
              {currentRoom.code}
            </span>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 group-hover:text-cyan-300">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {copied ? 'Code copied to clipboard!' : 'Share this code with friends on other phones or tabs'}
          </p>
        </div>

        {/* Players Roster */}
        <div className="p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Users className="w-4 h-4 text-[#00D9F5]" />
              <span>
                PLAYERS ({playerCount}/{maxPlayers})
              </span>
            </div>

            {/* Host Quick Bot Fill / Toggle controls */}
            {isHost && (
              <div className="flex items-center space-x-1.5">
                <button
                  id="fill-companions-btn"
                  type="button"
                  onClick={() => toggleBots('fill')}
                  title="Fill empty slots with AI companions"
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold hover:bg-cyan-900/60 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>+ Companions</span>
                </button>
                {playerCount > 1 && (
                  <button
                    id="clear-bots-btn"
                    type="button"
                    onClick={() => toggleBots('remove_bots')}
                    title="Remove companion bots"
                    className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {currentRoom.players.map((p) => {
              const isPlayerHost = p.profile.id === currentRoom.host_id;
              const isMe = p.profile.id === profile?.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-cyan-950/40 border-[#00D9F5]/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{p.profile.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>{p.profile.username}</span>
                        {isMe && <span className="text-[#00D9F5] font-normal">(You)</span>}
                        {p.is_bot && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            BOT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {isPlayerHost ? (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/40">
                        <Crown className="w-3 h-3 fill-amber-400" />
                        <span>HOST</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        JOINED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, 2 - playerCount) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center space-x-2 p-2.5 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs"
              >
                <div className="w-7 h-7 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <span>Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Settings Card */}
        <div className="p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <SettingsIcon className="w-4 h-4 text-cyan-400" />
              <span>GAME SETTINGS</span>
            </div>

            {isHost && (
              <button
                id="edit-game-settings-btn"
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-900/60 transition-all"
              >
                EDIT
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-semibold">ROUNDS</div>
              <div className="font-bold text-white text-sm mt-0.5">
                {currentRoom.settings.rounds_count} Rounds
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="text-[10px] text-slate-400 font-semibold">TIME PER ROUND</div>
              <div className="font-bold text-white text-sm mt-0.5">
                {currentRoom.settings.round_duration_seconds} Seconds
              </div>
            </div>
          </div>

          {/* Challenge Type Badges */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ENABLED CHALLENGE POOL
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentRoom.settings.enabled_challenge_types.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold"
                >
                  {getChallengeIcon(type)}
                  <span>{type}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-2 pt-2">
        {isHost ? (
          <>
            <button
              id="start-game-button"
              type="button"
              disabled={!canStart || isLoading}
              onClick={startGame}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>START GAME</span>
            </button>
            <p className="text-center text-xs text-slate-400">
              {canStart
                ? 'Game will start with 3-second countdown'
                : 'Need at least 2 players (add companions above to start immediately)'}
            </p>
          </>
        ) : (
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-center space-y-1">
            <div className="flex items-center justify-center space-x-2 text-cyan-300 text-sm font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Waiting for host to start...</span>
            </div>
            <p className="text-xs text-slate-400">
              Host is configuring rounds and challenges.
            </p>
          </div>
        )}
      </div>

      {/* Host Settings Modal */}
      {showSettingsModal && (
        <HostSettingsModal
          currentSettings={currentRoom.settings}
          onSave={updateHostSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
