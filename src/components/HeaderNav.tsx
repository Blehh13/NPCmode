import React from 'react';
import { ArrowLeft, ShieldAlert, Sparkles, Wifi } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface HeaderNavProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  title,
  onBack,
  showBack = false,
  rightAction,
}) => {
  const { currentRoom, profile, currentGame, setShowEmergencyModal } = useGame();
  const isHost = currentRoom && profile && currentRoom.host_id === profile.id;
  const inGame = !!currentGame;

  return (
    <header
      id="app-header-bar"
      className="w-full max-w-md mx-auto pt-3 px-4 pb-2 flex items-center justify-between z-30 select-none"
    >
      <div className="flex items-center space-x-2">
        {showBack && onBack ? (
          <button
            id="header-back-button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#00D9F5]" />
            <span>NPC MODE</span>
          </div>
        )}

        {title && (
          <h1 className="text-base font-bold text-white tracking-tight ml-1 truncate max-w-[180px]">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Emergency Host Override (§11) */}
        {isHost && inGame && (
          <button
            id="host-emergency-override-btn"
            onClick={() => setShowEmergencyModal(true)}
            title="Host Emergency Fallback (§11)"
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-900/50 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        {rightAction ? (
          rightAction
        ) : (
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-medium">LIVE</span>
          </div>
        )}
      </div>
    </header>
  );
};
