import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface JudgingOverlayProps {
  attempt?: number;
  imageUrl?: string;
}

export const JudgingOverlay: React.FC<JudgingOverlayProps> = ({ attempt = 1, imageUrl }) => {
  return (
    <div
      id="ai-judging-overlay"
      className="fixed inset-0 z-50 bg-[#070B14]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in"
    >
      <div className="relative w-full max-w-sm flex flex-col items-center space-y-6">
        {/* Animated Hologram Radar / AI Beacon */}
        <div className="relative flex items-center justify-center w-28 h-28">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00D9F5]/40 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 border border-cyan-400/60 shadow-lg shadow-cyan-500/30 flex items-center justify-center backdrop-blur-xl">
            <Bot className="w-10 h-10 text-[#00D9F5] animate-bounce" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#00D9F5] animate-pulse" />
            <span>AI REFEREE AT WORK</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-wide">
            AI IS JUDGING...
          </h2>
          <p className="text-sm text-slate-300 max-w-xs">
            Evaluating your photo against the challenge criteria.
          </p>
        </div>

        {/* Thumbnail Preview */}
        {imageUrl && (
          <div className="w-36 h-28 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-md bg-slate-900 relative">
            <img
              src={imageUrl}
              alt="Submitted candidate"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-cyan-300">
              Attempt #{attempt}
            </div>
            {/* Scanning light sweep */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-pulse" />
          </div>
        )}

        <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Analyzing colors, shapes, and textures</span>
        </div>
      </div>
    </div>
  );
};
