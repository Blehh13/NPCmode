import React, { useState, useEffect } from 'react';
import { Trophy, Flame } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const BetweenRoundLeaderboardScreen: React.FC = () => {
  const { leaderboard, currentRound, currentGame, profile } = useGame();
  const [countdown, setCountdown] = useState<number>(5);

  const roundNum = currentRound?.number || 1;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      id="between-round-leaderboard"
      className="min-h-[85vh] flex flex-col justify-between p-4 max-w-md mx-auto animate-fade-in select-none text-center"
    >
      {/* Header Banner */}
      <div className="flex flex-col items-center space-y-3 pt-2">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Trophy className="w-8 h-8 text-cyan-400" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            ROUND {roundNum} COMPLETE!
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Here&apos;s how everyone is scoring so far
          </p>
        </div>
      </div>

      {/* Ranked Players List */}
      <div className="my-4 p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-2xl flex flex-col space-y-2.5">
        <div className="flex justify-between items-center px-2 text-xs font-bold text-slate-400 pb-1 border-b border-slate-800/80">
          <span>RANK & PLAYER</span>
          <div className="flex items-center space-x-4">
            <span>STREAK</span>
            <span>TOTAL SCORE</span>
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.map((player, idx) => {
            const isMe = player.profile_id === profile?.id;
            return (
              <div
                key={player.profile_id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-cyan-950/40 border-[#00D9F5]/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 text-center font-extrabold text-sm">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </div>
                  <span className="text-xl">{player.avatar}</span>
                  <div className="text-left">
                    <div className={`text-xs font-bold ${isMe ? 'text-[#00D9F5]' : 'text-slate-100'}`}>
                      {player.username} {isMe && '(You)'}
                    </div>
                    {player.current_round_score > 0 && (
                      <div className="text-[10px] text-emerald-400 font-semibold">
                        +{player.current_round_score} this round
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10">
                    {player.current_streak > 1 ? (
                      <span className="flex items-center space-x-0.5 text-xs font-extrabold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Flame className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{player.current_streak}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">0</span>
                    )}
                  </div>

                  <div className="text-sm font-black font-mono text-white min-w-[50px] text-right">
                    {player.total_score}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Countdown Ring to Next Round */}
      <div className="flex flex-col items-center space-y-2 pb-4">
        <span className="text-xs font-semibold text-slate-400">Next round starting in</span>
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-lg font-black text-cyan-300 font-mono">
            {countdown}
          </div>
        </div>
      </div>
    </div>
  );
};
