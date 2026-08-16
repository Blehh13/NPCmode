import React, { useEffect } from 'react';
import { CheckCircle2, Flame, Trophy, Users, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';

export const ValidSubmissionScreen: React.FC = () => {
  const { currentRound, leaderboard, profile, lastSubmissionVerdict } = useGame();

  useEffect(() => {
    // Fire celebratory confetti on valid verdict
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F5A0', '#00D9F5', '#F59E0B', '#10B981']
      });
    } catch {
      // ignore
    }
  }, []);

  const myEntry = leaderboard.find((p) => p.profile_id === profile?.id);
  const pointsAwarded = lastSubmissionVerdict?.points || (myEntry?.current_round_score || 100);
  const streakCount = lastSubmissionVerdict?.streak || (myEntry?.current_streak || 1);

  return (
    <div
      id="valid-submission-screen"
      className="min-h-[85vh] flex flex-col justify-between p-4 max-w-md mx-auto animate-fade-in text-center select-none"
    >
      {/* Top Banner & Verdict */}
      <div className="flex flex-col items-center space-y-4 pt-2">
        {/* Animated Emerald Badge */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 stroke-[2.5]" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-white tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
            FOUND IT!
          </h1>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-sm font-extrabold shadow-sm">
            <span>+{pointsAwarded} POINTS</span>
          </div>
        </div>

        {/* Streak Counter Pill */}
        {streakCount > 1 && (
          <div className="w-full max-w-xs p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center space-x-2">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
            <div className="text-left">
              <span className="text-sm font-black text-amber-300">{streakCount} STREAK</span>
              <span className="text-xs text-amber-200/80 ml-1.5 font-medium">Keep it going!</span>
            </div>
          </div>
        )}

        {/* Lockout notice (§9) */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-900/40 w-full max-w-xs text-xs text-slate-300 flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>You&apos;re done for this round. Waiting for others...</span>
        </div>
      </div>

      {/* Live In-Round Leaderboard Standings */}
      <div className="my-4 p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>LIVE LEADERBOARD</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>{leaderboard.length} players</span>
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.slice(0, 4).map((player, idx) => {
            const isMe = player.profile_id === profile?.id;
            return (
              <div
                key={player.profile_id}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                  isMe
                    ? 'bg-cyan-950/40 border-[#00D9F5]/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 text-center text-xs font-black text-slate-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="text-base">{player.avatar}</span>
                  <span className={`text-xs font-bold ${isMe ? 'text-[#00D9F5]' : 'text-slate-200'}`}>
                    {player.username} {isMe && '(You)'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {player.current_streak > 1 && (
                    <span className="flex items-center text-[11px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                      🔥 {player.current_streak}
                    </span>
                  )}
                  <span className="text-xs font-mono font-extrabold text-white">
                    {player.total_score} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-slate-500 pb-2">
        Next round starts automatically when round timer expires.
      </div>
    </div>
  );
};
