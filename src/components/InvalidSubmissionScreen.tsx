import React from 'react';
import { XCircle, Camera, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface InvalidSubmissionScreenProps {
  onRetry: () => void;
  onCancel: () => void;
}

export const InvalidSubmissionScreen: React.FC<InvalidSubmissionScreenProps> = ({
  onRetry,
  onCancel,
}) => {
  const { playerRoundState, lastSubmissionVerdict, currentRound } = useGame();

  const attemptsUsed = playerRoundState?.attempts_used || 1;
  const attemptsRemaining = Math.max(0, 2 - attemptsUsed);
  const canRetry = attemptsRemaining > 0;

  return (
    <div
      id="invalid-submission-screen"
      className="min-h-[85vh] flex flex-col justify-between p-4 max-w-md mx-auto animate-fade-in text-center select-none"
    >
      {/* Verdict & Badge */}
      <div className="flex flex-col items-center space-y-4 pt-2">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
          <XCircle className="w-12 h-12 text-red-400 stroke-[2.5]" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300">
            NOT QUITE!
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xs">
            That photo doesn&apos;t sufficiently match the challenge prompt.
          </p>
        </div>

        {/* Photo Card with AI reason */}
        <div className="w-full max-w-xs p-3.5 rounded-2xl bg-slate-900/90 border border-red-500/30 text-left space-y-2.5">
          <div className="flex items-center space-x-3">
            {lastSubmissionVerdict?.imageUrl && (
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                <img
                  src={lastSubmissionVerdict.imageUrl}
                  alt="Submission attempt"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-200">Your Photo</div>
              <div className="text-[11px] text-slate-400">Attempt #{attemptsUsed}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">AI Feedback: </span>
              <span>{lastSubmissionVerdict?.reason || "Object in frame didn't fulfill the challenge requirements."}</span>
            </div>
          </div>
        </div>

        {/* Attempts indicator */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-300">ATTEMPTS REMAINING</div>
          <div className="flex items-center justify-center space-x-2">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                attemptsRemaining >= 1 ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-700'
              }`}
            />
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                attemptsRemaining >= 2 ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        {canRetry ? (
          <button
            id="retry-submission-btn"
            type="button"
            onClick={onRetry}
            className="w-full py-4 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <Camera className="w-5 h-5" />
            <span>TRY AGAIN ({attemptsRemaining} LEFT)</span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-medium">
            Maximum attempts (2) reached for this round. Waiting for next round...
          </div>
        )}

        <button
          id="cancel-submission-btn"
          type="button"
          onClick={onCancel}
          className="w-full py-3 rounded-2xl font-semibold text-xs text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 transition-all"
        >
          CANCEL & WAIT FOR NEXT ROUND
        </button>
      </div>
    </div>
  );
};
