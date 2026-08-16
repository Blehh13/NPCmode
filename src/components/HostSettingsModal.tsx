import React, { useState } from 'react';
import { X, Check, RotateCcw, Palette, Type, Hash, Circle, Grid, Layers } from 'lucide-react';
import { ChallengeType, GameSettings } from '../types';

interface HostSettingsModalProps {
  currentSettings: GameSettings;
  onSave: (settings: {
    rounds_count: 3 | 5 | 7;
    round_duration_seconds: 15 | 30 | 45;
    enabled_challenge_types: ChallengeType[];
  }) => void;
  onClose: () => void;
}

export const HostSettingsModal: React.FC<HostSettingsModalProps> = ({
  currentSettings,
  onSave,
  onClose,
}) => {
  const [roundsCount, setRoundsCount] = useState<3 | 5 | 7>(currentSettings.rounds_count || 3);
  const [duration, setDuration] = useState<15 | 30 | 45>(currentSettings.round_duration_seconds || 30);
  const [enabledTypes, setEnabledTypes] = useState<ChallengeType[]>(
    currentSettings.enabled_challenge_types || ['COLOR', 'TEXT', 'NUMBER', 'SHAPE', 'PATTERN', 'TRANSPARENCY']
  );

  const toggleType = (type: ChallengeType) => {
    if (enabledTypes.includes(type)) {
      if (enabledTypes.length > 1) {
        setEnabledTypes(enabledTypes.filter((t) => t !== type));
      }
    } else {
      setEnabledTypes([...enabledTypes, type]);
    }
  };

  const handleReset = () => {
    setRoundsCount(3);
    setDuration(30);
    setEnabledTypes(['COLOR', 'TEXT', 'NUMBER', 'SHAPE', 'PATTERN', 'TRANSPARENCY']);
  };

  const handleSave = () => {
    onSave({
      rounds_count: roundsCount,
      round_duration_seconds: duration,
      enabled_challenge_types: enabledTypes,
    });
    onClose();
  };

  const challengeCategories: { type: ChallengeType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'COLOR', label: 'Color', icon: <Palette className="w-4 h-4" />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { type: 'TEXT', label: 'Text', icon: <Type className="w-4 h-4" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { type: 'NUMBER', label: 'Number', icon: <Hash className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { type: 'SHAPE', label: 'Shape', icon: <Circle className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { type: 'PATTERN', label: 'Pattern', icon: <Grid className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { type: 'TRANSPARENCY', label: 'Transparency', icon: <Layers className="w-4 h-4" />, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  ];

  return (
    <div
      id="host-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        id="host-settings-dialog"
        className="w-full max-w-md bg-[#0B1220] border border-cyan-900/40 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            id="close-host-settings-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-white tracking-wide">HOST SETTINGS</h2>
          <button
            id="reset-host-settings-btn"
            onClick={handleReset}
            className="text-xs font-semibold text-[#00D9F5] hover:underline flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>

        {/* Rounds count */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-semibold text-slate-200">Rounds</label>
            <span className="text-xs text-slate-400">Choose number of rounds</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([3, 5, 7] as const).map((r) => (
              <button
                key={r}
                id={`settings-rounds-btn-${r}`}
                type="button"
                onClick={() => setRoundsCount(r)}
                className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                  roundsCount === r
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 border-emerald-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Time per round */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-semibold text-slate-200">Time per Round</label>
            <span className="text-xs text-slate-400">How long each round lasts</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([15, 30, 45] as const).map((d) => (
              <button
                key={d}
                id={`settings-duration-btn-${d}`}
                type="button"
                onClick={() => setDuration(d)}
                className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                  duration === d
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 border-emerald-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {d} sec
              </button>
            ))}
          </div>
        </div>

        {/* Challenge Types Pool */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-semibold text-slate-200">Challenge Types</label>
            <span className="text-xs text-slate-400">Select categories to include</span>
          </div>

          <div className="space-y-2">
            {challengeCategories.map(({ type, label, icon, color }) => {
              const isChecked = enabledTypes.includes(type);
              return (
                <button
                  key={type}
                  id={`challenge-type-toggle-${type.toLowerCase()}`}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isChecked
                      ? 'bg-slate-900/90 border-cyan-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg border ${color}`}>
                      {icon}
                    </div>
                    <span className="font-medium text-sm">{label}</span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          id="save-host-settings-btn"
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all"
        >
          SAVE SETTINGS
        </button>

        <p className="text-center text-xs text-slate-500">
          Settings will apply to all upcoming rounds in this room.
        </p>
      </div>
    </div>
  );
};
