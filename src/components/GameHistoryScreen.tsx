import React, { useState } from 'react';
import { Clock, Trophy, Flame, ChevronRight, X, AlertCircle, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { HeaderNav } from './HeaderNav';
import { GameResult } from '../types';

export const GameHistoryScreen: React.FC = () => {
  const { history } = useGame();
  const [selectedGame, setSelectedGame] = useState<GameResult | null>(null);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id="game-history-screen-view"
      className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto select-none pb-24 animate-fade-in"
    >
      <HeaderNav title="MATCH HISTORY" />

      <div className="my-2 space-y-3 flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-300">No Matches Played Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Completed games will automatically record your scores, streaks, and photo submissions here.
              </p>
            </div>
          </div>
        ) : (
          history.map((game) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className="p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 hover:border-cyan-500/40 cursor-pointer shadow-lg transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border ${
                    game.rank === 1
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : game.rank === 2
                      ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                      : 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  #{game.rank}
                </div>

                <div>
                  <div className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{game.total_score} Points</span>
                    {game.best_streak > 1 && (
                      <span className="text-[10px] text-amber-400 font-extrabold flex items-center">
                        🔥{game.best_streak}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                    <span>{game.total_players} players</span>
                    <span>•</span>
                    <span>{game.rounds_summary?.length || game.total_rounds || 0} rounds</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right text-[11px] text-slate-500">
                  <div className="font-mono">{formatDate(game.played_at)}</div>
                  <div className="text-[10px] text-cyan-400 font-bold">Game #{game.game_id.slice(0, 6).toUpperCase()}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Game Details Modal */}
      {selectedGame && (
        <div
          id="game-detail-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="w-full max-w-md bg-[#0B1220] border border-cyan-900/50 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">MATCH SUMMARY</h3>
                <div className="text-xs text-slate-400 font-mono">
                  {formatDate(selectedGame.played_at)}
                </div>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Rank banner */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <div>
                <div className="text-[10px] text-slate-400 font-bold">RANK</div>
                <div className="text-base font-black text-amber-400 font-mono">
                  #{selectedGame.rank} of {selectedGame.total_players}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold">TOTAL SCORE</div>
                <div className="text-base font-black text-[#00D9F5] font-mono">
                  {selectedGame.final_score} pts
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold">BEST STREAK</div>
                <div className="text-base font-black text-amber-400 font-mono flex items-center justify-center">
                  🔥 {selectedGame.best_streak}
                </div>
              </div>
            </div>

            {/* Round by Round list */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300">ROUND-BY-ROUND BREAKDOWN</div>
              {(selectedGame.rounds_summary || []).map((round) => (
                <div
                  key={round.round_number}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                        ROUND {round.round_number}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[170px]">
                        {round.prompt}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {round.valid ? (
                        <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>+{round.score}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-[11px] font-bold text-red-400">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>0 pts</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {round.image_url && (
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-slate-800">
                      <img
                        src={round.image_url}
                        alt="Round submission"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedGame(null)}
              className="w-full py-3 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
