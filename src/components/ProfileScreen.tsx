import React, { useState } from 'react';
import {
  User,
  Trophy,
  Flame,
  Star,
  Award,
  Edit3,
  Compass,
  Zap,
  Target,
  ShieldCheck,
  Medal,
  Crown,
  Check
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { HeaderNav } from './HeaderNav';
import { AVATAR_OPTIONS, ACCENT_COLORS, computeAchievements } from '../data/achievements';
import { Achievement } from '../types';

export const ProfileScreen: React.FC = () => {
  const { profile, setProfileInfo, history, isLoading } = useGame();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile?.avatar || '👩');
  const [usernameInput, setUsernameInput] = useState<string>(profile?.username || 'Banu');
  const [accentColor, setAccentColor] = useState<string>(profile?.accentColor || '#00D9F5');

  const gamesPlayed = profile?.games_played ?? 0;
  const wins = profile?.wins ?? 0;
  const bestScore = profile?.best_score ?? 0;
  const bestStreak = (history || []).reduce((max, h) => Math.max(max, h.best_streak || 0), 0);
  const totalPoints = (history || []).reduce((sum, h) => sum + (h.final_score || 0), 0);

  const stats = {
    games_played: gamesPlayed,
    wins: wins,
    best_score: bestScore,
    best_streak: bestStreak,
    total_points: totalPoints,
  };

  const winRate = stats.games_played > 0 ? Math.round((stats.wins / stats.games_played) * 100) : 0;
  const achievements = computeAchievements(
    stats.games_played,
    stats.wins,
    stats.best_score,
    stats.best_streak
  );

  const handleSaveProfile = async () => {
    if (!usernameInput.trim()) return;
    await setProfileInfo(usernameInput.trim(), selectedAvatar, accentColor);
    setIsEditing(false);
  };

  const getAchievementIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-5 h-5 ${unlocked ? 'text-[#00D9F5]' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'Medal':
        return <Medal className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  return (
    <div
      id="profile-screen-view"
      className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto select-none pb-24 animate-fade-in"
    >
      <HeaderNav
        title="PLAYER PROFILE"
        rightAction={
          <button
            id="open-edit-profile-btn"
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        }
      />

      <div className="my-2 space-y-4">
        {/* Profile Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-b from-[#0B1220] to-[#070B14] border border-cyan-950 shadow-xl flex flex-col items-center text-center space-y-3 relative">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-3xl bg-cyan-950/60 border-2 flex items-center justify-center text-4xl shadow-xl"
              style={{ borderColor: profile?.accentColor || '#00D9F5' }}
            >
              {profile?.avatar || '👩'}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#00D9F5] text-slate-950 border-2 border-[#070B14] shadow"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>

          <div>
            <h2 className="text-xl font-black text-white">{profile?.username || 'Banu'}</h2>
            <div className="text-xs text-cyan-400 font-semibold tracking-wide mt-0.5">
              SCAVENGER OPERATIVE • LEVEL {Math.floor(stats.games_played / 3) + 1}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-400">GAMES</div>
            <div className="text-lg font-black font-mono text-white mt-0.5">{stats.games_played}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-400">WINS</div>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">{stats.wins}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-400">WIN RATE</div>
            <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">{winRate}%</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-400">BEST STREAK</div>
            <div className="text-lg font-black font-mono text-amber-400 mt-0.5 flex items-center justify-center space-x-1">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{stats.best_streak}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-400">HIGH SCORE</div>
            <div className="text-lg font-black font-mono text-[#00D9F5] mt-0.5">{stats.best_score}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] font-bold text-slate-400">TOTAL PTS</div>
            <div className="text-lg font-black font-mono text-purple-400 mt-0.5">{stats.total_points}</div>
          </div>
        </div>

        {/* Badges & Achievements Section */}
        <div className="p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>BADGES & ACHIEVEMENTS</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {achievements.filter((a) => a.unlocked).length}/{achievements.length} Unlocked
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  ach.unlocked
                    ? 'bg-cyan-950/30 border-cyan-500/30 text-white'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      ach.unlocked
                        ? 'bg-cyan-950 border-cyan-400/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {getAchievementIcon(ach.icon, ach.unlocked)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                      <span>{ach.title}</span>
                      {ach.unlocked && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{ach.description}</div>
                  </div>
                </div>

                {ach.progress !== undefined && ach.maxProgress !== undefined && !ach.unlocked && (
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400">
                      {ach.progress}/{ach.maxProgress}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div
          id="edit-profile-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full max-w-md bg-[#0B1220] border border-cyan-900/50 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">EDIT PROFILE</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Choose Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.emoji)}
                    className={`p-2 rounded-2xl text-2xl border transition-all ${
                      selectedAvatar === av.emoji
                        ? 'bg-cyan-950 border-[#00D9F5] shadow-md shadow-cyan-500/30 scale-105'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Player Name</label>
              <input
                id="edit-username-input"
                type="text"
                maxLength={16}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter player name"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Accent Color */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Accent Color</label>
              <div className="flex items-center space-x-2">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                      accentColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                  >
                    {accentColor === c && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="save-profile-btn"
              type="button"
              disabled={isLoading || !usernameInput.trim()}
              onClick={handleSaveProfile}
              className="w-full py-3.5 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              SAVE CHANGES
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
