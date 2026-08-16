import React from 'react';
import { X, Camera, Bot, Zap, Trophy, Flame, CheckCircle } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div
      id="how-to-play-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        id="how-to-play-dialog"
        className="w-full max-w-md bg-[#0B1220] border border-cyan-900/50 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white tracking-wide">HOW TO PLAY NPC MODE</h3>
          <button
            id="close-how-to-play-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <div className="font-bold text-white text-sm">Join or Host a Room</div>
              <p className="text-slate-400 mt-0.5">
                Create a room or enter a 5-digit code. Compete with 2 to 6 players or add AI companion bots.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <div className="font-bold text-white text-sm">Dynamic AI Challenges</div>
              <p className="text-slate-400 mt-0.5">
                Every round presents a prompt across 6 categories: Colors, Text, Numbers, Shapes, Patterns, and Transparency.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
            <div className="w-7 h-7 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <div className="font-bold text-white text-sm">Snap and Submit Fast</div>
              <p className="text-slate-400 mt-0.5">
                Scramble around your room, point your camera, and photograph the matching real-world object.
              </p>
            </div>
          </div>

          {/* Step 4 - Speed scoring */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Speed Scoring Breakdown</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-emerald-400 font-bold">0-5 seconds: </span>
                <span className="text-white">+100 pts</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-cyan-400 font-bold">5-10 seconds: </span>
                <span className="text-white">+75 pts</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-amber-400 font-bold">10-20 seconds: </span>
                <span className="text-white">+50 pts</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-orange-400 font-bold">20-30 seconds: </span>
                <span className="text-white">+25 pts</span>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
            <div className="w-7 h-7 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
              🔥
            </div>
            <div>
              <div className="font-bold text-white text-sm">Streaks & Combos</div>
              <p className="text-slate-400 mt-0.5">
                Consecutive correct rounds build your flame streak multiplier for massive leaderboards!
              </p>
            </div>
          </div>
        </div>

        <button
          id="how-to-play-understood-btn"
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
        >
          READY TO PLAY!
        </button>
      </div>
    </div>
  );
};
