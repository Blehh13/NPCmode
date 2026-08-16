import React from 'react';
import { Home, Clock, User, Settings } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentGame, currentRoom } = useGame();

  // If in active round gameplay or countdown, hide bottom bar for full immersion
  if (currentGame && (currentGame.status === 'STARTING' || currentGame.status === 'ROUND_ACTIVE')) {
    return null;
  }

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#070B14]/90 backdrop-blur-md border-t border-cyan-950/60 pb-safe"
    >
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
        <button
          id="nav-tab-home"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'home' ? 'text-[#00D9F5]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'home' ? 'bg-[#00D9F5]/15 ring-1 ring-[#00D9F5]/40' : ''
            }`}
          >
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Home</span>
        </button>

        <button
          id="nav-tab-history"
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'history' ? 'text-[#00D9F5]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'history' ? 'bg-[#00D9F5]/15 ring-1 ring-[#00D9F5]/40' : ''
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">History</span>
        </button>

        <button
          id="nav-tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'profile' ? 'text-[#00D9F5]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'profile' ? 'bg-[#00D9F5]/15 ring-1 ring-[#00D9F5]/40' : ''
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Profile</span>
        </button>

        <button
          id="nav-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
            activeTab === 'settings' ? 'text-[#00D9F5]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-full transition-all ${
              activeTab === 'settings' ? 'bg-[#00D9F5]/15 ring-1 ring-[#00D9F5]/40' : ''
            }`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Settings</span>
        </button>
      </div>
    </nav>
  );
};
