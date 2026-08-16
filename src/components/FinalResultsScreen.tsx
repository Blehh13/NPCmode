import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Crown, ArrowRight, RotateCcw, Share2, Award, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';

export const FinalResultsScreen: React.FC = () => {
  const { leaderboard, currentGame, profile, setActiveTab, leaveRoom } = useGame();
  const [rematchCountdown, setRematchCountdown] = useState<number>(8);

  const winner = leaderboard[0];
  const isWinnerMe = winner?.profile_id === profile?.id;

  useEffect(() => {
    // Fire celebratory confetti shower!
    try {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#00F5A0', '#00D9F5', '#F59E0B', '#EF4444'];
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {
      // ignore
    }

    const interval = setInterval(() => {
      setRematchCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="final-results-screen"
      className="min-h-[90vh] flex flex-col justify-between p-4 max-w-md mx-auto animate-fade-in select-none text-center"
    >
      {/* Trophy & Winner Spotlight */}
      <div className="flex flex-col items-center space-y-3 pt-2">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500/30 to-yellow-300/20 border-2 border-amber-400/80 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-pulse">
            <Trophy className="w-14 h-14 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="absolute -top-3 -right-2">
            <Crown className="w-8 h-8 text-amber-400 fill-amber-400 filter drop-shadow-md animate-bounce" />
          </div>
        </div>

        <div>
          <div className="text-xs font-black tracking-widest text-amber-400 uppercase">
            GAME COMPLETE!
          </div>
          <h1 className="text-xl font-bold text-white">Congratulations to the winners!</h1>
        </div>

        {/* Winner Hero Card */}
        {winner && (
          <div className="w-full max-w-xs p-4 rounded-3xl bg-gradient-to-b from-amber-950/40 via-[#0B1220] to-[#0B1220] border border-amber-500/40 shadow-xl flex items-center justify-between">
            <div className="flex items-center space-x-3 text-left">
              <div className="relative">
                <span className="text-3xl">{winner.avatar}</span>
                <Crown className="w-4 h-4 text-amber-400 absolute -top-1.5 -right-1.5 fill-amber-400" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white flex items-center space-x-1">
                  <span>{winner.username}</span>
                  {isWinnerMe && <span className="text-xs text-amber-400 font-bold">(You)</span>}
                </div>
                <div className="text-xs text-slate-400">WINNER 🏆</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black font-mono text-amber-300">
                {winner.total_score} <span className="text-xs font-medium text-slate-400">pts</span>
              </div>
              {winner.best_streak > 0 && (
                <div className="text-[11px] font-bold text-amber-400 flex items-center justify-end space-x-0.5">
                  <Flame className="w-3 h-3 fill-amber-400" />
                  <span>Best {winner.best_streak}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Final Rankings */}
      <div className="my-3 p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl flex flex-col space-y-2 max-h-[35vh] overflow-y-auto">
        <div className="flex justify-between items-center px-1 text-xs font-bold text-slate-400 pb-1 border-b border-slate-800">
          <span>FINAL RANKING</span>
          <span>SCORE</span>
        </div>

        <div className="space-y-1.5">
          {leaderboard.map((p, idx) => {
            const isMe = p.profile_id === profile?.id;
            return (
              <div
                key={p.profile_id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isMe
                    ? 'bg-cyan-950/40 border-[#00D9F5]/40'
                    : 'bg-slate-900/50 border-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 text-center font-bold text-sm">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </span>
                  <span className="text-lg">{p.avatar}</span>
                  <span className={`text-xs font-bold ${isMe ? 'text-[#00D9F5]' : 'text-slate-200'}`}>
                    {p.username} {isMe && '(You)'}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {p.best_streak > 1 && (
                    <span className="text-[10px] font-bold text-amber-400 flex items-center">
                      🔥 {p.best_streak}
                    </span>
                  )}
                  <span className="text-xs font-mono font-extrabold text-white">
                    {p.total_score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Match Stats Summary */}
      {currentGame && (
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">ROUNDS</div>
            <div className="font-bold text-slate-200">{currentGame.total_rounds} Rounds</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">TIME / ROUND</div>
            <div className="font-bold text-slate-200">{currentGame.settings_snapshot.round_duration_seconds}s</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">PLAYERS</div>
            <div className="font-bold text-slate-200">{leaderboard.length} Active</div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="view-game-history-btn"
            type="button"
            onClick={() => setActiveTab('history')}
            className="py-3 rounded-2xl font-bold text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/40 transition-all flex items-center justify-center space-x-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>VIEW HISTORY</span>
          </button>

          <button
            id="back-to-room-rematch-btn"
            type="button"
            onClick={leaveRoom}
            className="py-3 rounded-2xl font-bold text-xs text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>EXIT TO HOME</span>
          </button>
        </div>

        {/* Rematch auto-transition banner */}
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <span>Room stays ready for rematch</span>
            {rematchCountdown > 0 && <span>({rematchCountdown}s)</span>}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full transition-all duration-1000"
              style={{ width: `${((8 - rematchCountdown) / 8) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
