import React from 'react';
import { X, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useGame } from '../context/GameContext';

export const HostOverrideModal: React.FC = () => {
  const { currentRound, showEmergencyModal, setShowEmergencyModal, executeOverride } = useGame();

  if (!showEmergencyModal || !currentRound) return null;

  const submissions = currentRound.submissions || [];

  return (
    <div
      id="emergency-override-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        id="emergency-override-dialog"
        className="w-full max-w-md bg-[#0B1220] border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-base font-bold tracking-wide">HOST OVERRIDE (§11)</h2>
          </div>
          <button
            id="close-override-modal-btn"
            onClick={() => setShowEmergencyModal(false)}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Emergency fallback control to manually validate or invalidate any player&apos;s round submission during demo/competition.
        </p>

        {submissions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No submissions recorded yet in this round.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{sub.player_avatar}</span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                        <span>{sub.player_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          Attempt {sub.attempt_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {sub.submission_seconds}s • Confidence: {Math.round((sub.confidence || 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {sub.valid ? (
                      <span className="flex items-center space-x-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>VALID</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-xs font-bold text-red-400 bg-red-950/60 px-2 py-1 rounded-lg border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>INVALID</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo Thumbnail */}
                {sub.image_url && (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-slate-800">
                    <img
                      src={sub.image_url}
                      alt="Player submission"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {sub.is_override && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold">
                        OVERRIDDEN
                      </div>
                    )}
                  </div>
                )}

                {/* AI Reasoning */}
                {sub.reason && (
                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex items-start space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{sub.reason}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id={`override-valid-btn-${sub.id}`}
                    onClick={() => executeOverride(sub.id, true)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      sub.valid
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border-emerald-400'
                    }`}
                  >
                    COUNT AS VALID ✓
                  </button>

                  <button
                    id={`override-invalid-btn-${sub.id}`}
                    onClick={() => executeOverride(sub.id, false)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      !sub.valid
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-red-600 hover:bg-red-500 text-white border-red-500'
                    }`}
                  >
                    KEEP AS INVALID ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          id="close-override-dialog-btn"
          onClick={() => setShowEmergencyModal(false)}
          className="w-full py-3 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
