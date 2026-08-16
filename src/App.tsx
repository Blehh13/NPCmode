import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { WaitingRoomScreen } from './components/WaitingRoomScreen';
import { RoundActiveScreen } from './components/RoundActiveScreen';
import { BetweenRoundLeaderboardScreen } from './components/BetweenRoundLeaderboardScreen';
import { FinalResultsScreen } from './components/FinalResultsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { GameHistoryScreen } from './components/GameHistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HostOverrideModal } from './components/HostOverrideModal';
import { HowToPlayModal } from './components/HowToPlayModal';

const GameRouter: React.FC = () => {
  const { currentRoom, currentGame, activeTab } = useGame();
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // 1. Active Game Over View (§13, Screens 4, 8)
  if (currentGame && currentGame.status === 'GAME_OVER') {
    return (
      <main className="min-h-screen bg-[#070B14] text-slate-100 font-sans antialiased">
        <FinalResultsScreen />
        <HostOverrideModal />
      </main>
    );
  }

  // 2. Active Game In-Between Round Leaderboard (§12, Screen 3)
  if (currentGame && currentGame.status === 'ROUND_LEADERBOARD') {
    return (
      <main className="min-h-screen bg-[#070B14] text-slate-100 font-sans antialiased">
        <BetweenRoundLeaderboardScreen />
        <HostOverrideModal />
      </main>
    );
  }

  // 3. Active Round Gameplay / Camera Viewfinder (§9-11, Screens 2, 5, 6, 7)
  if (currentGame && (currentGame.status === 'ROUND_ACTIVE' || currentGame.status === 'STARTING')) {
    return (
      <main className="min-h-screen bg-[#070B14] text-slate-100 font-sans antialiased">
        <RoundActiveScreen />
        <HostOverrideModal />
      </main>
    );
  }

  // 4. Waiting Room Lobby (§8, Screens 1, 9, 10)
  if (currentRoom && currentRoom.status === 'WAITING') {
    return (
      <main className="min-h-screen bg-[#070B14] text-slate-100 font-sans antialiased">
        <WaitingRoomScreen />
      </main>
    );
  }

  // 5. Standby Tabs (Home, History, Profile, Settings)
  return (
    <main className="min-h-screen bg-[#070B14] text-slate-100 font-sans antialiased relative">
      {activeTab === 'home' && (
        <HomeScreen onOpenHowToPlay={() => setShowHowToPlay(true)} />
      )}
      {activeTab === 'history' && <GameHistoryScreen />}
      {activeTab === 'profile' && <ProfileScreen />}
      {activeTab === 'settings' && (
        <SettingsScreen onOpenHowToPlay={() => setShowHowToPlay(true)} />
      )}

      {/* Global Bottom Navigation */}
      <BottomNav />

      {/* Global How to Play Modal */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </main>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
