import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Smartphone,
  Sun,
  Moon,
  Sparkles,
  HelpCircle,
  Shield,
  Info,
  CheckCircle2,
  ChevronRight,
  X,
  Camera,
  Bot
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { HeaderNav } from './HeaderNav';

interface SettingsScreenProps {
  onOpenHowToPlay: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenHowToPlay }) => {
  const { settings, updateAppSettings } = useGame();
  const [showAbout, setShowAbout] = useState<boolean>(false);

  return (
    <div
      id="settings-screen-view"
      className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto select-none pb-24 animate-fade-in"
    >
      <HeaderNav title="SETTINGS" />

      <div className="my-2 space-y-4 flex-1 overflow-y-auto">
        {/* Audio & Haptics Section */}
        <div className="p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl space-y-3">
          <div className="text-xs font-bold text-slate-300">AUDIO & FEEDBACK</div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
                {settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Sound Effects</div>
                <div className="text-[11px] text-slate-400">Shutter, ticking, chimes</div>
              </div>
            </div>

            <button
              id="toggle-sound-btn"
              type="button"
              onClick={() => updateAppSettings({ sound: !settings.sound })}
              className={`w-12 h-7 rounded-full transition-all p-1 flex items-center ${
                settings.sound ? 'bg-[#00D9F5] justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* Music */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Background Ambience</div>
                <div className="text-[11px] text-slate-400">Ambient synth texture</div>
              </div>
            </div>

            <button
              id="toggle-music-btn"
              type="button"
              onClick={() => updateAppSettings({ music: !settings.music })}
              className={`w-12 h-7 rounded-full transition-all p-1 flex items-center ${
                settings.music ? 'bg-[#00D9F5] justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* Vibration / Haptic */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Haptic Feedback</div>
                <div className="text-[11px] text-slate-400">Vibration on capture</div>
              </div>
            </div>

            <button
              id="toggle-vibration-btn"
              type="button"
              onClick={() => updateAppSettings({ vibration: !settings.vibration })}
              className={`w-12 h-7 rounded-full transition-all p-1 flex items-center ${
                settings.vibration ? 'bg-[#00D9F5] justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>
        </div>

        {/* System & AI Referee Status */}
        <div className="p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl space-y-3">
          <div className="text-xs font-bold text-slate-300">AI REFEREE & SYSTEM</div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center space-x-3">
              <Bot className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-white">Gemini 3.7 Flash</div>
                <div className="text-[11px] text-slate-400">Multimodal Referee Engine</div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center space-x-3">
              <Camera className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white">Camera Viewfinder</div>
                <div className="text-[11px] text-slate-400">Hardware video & sample fallback</div>
              </div>
            </div>

            <div className="text-xs text-cyan-300 font-mono">READY</div>
          </div>
        </div>

        {/* Guides & About */}
        <div className="p-4 rounded-3xl bg-[#0B1220]/90 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs font-bold text-slate-300">HELP & GUIDES</div>

          <button
            id="settings-open-how-to-play-btn"
            type="button"
            onClick={onOpenHowToPlay}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-900 transition-all text-left"
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">How To Play Guide</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          <button
            id="settings-open-about-btn"
            type="button"
            onClick={() => setShowAbout(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-900 transition-all text-left"
          >
            <div className="flex items-center space-x-3">
              <Info className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">About NPC Mode</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div
          id="about-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-[#0B1220] border border-cyan-900/50 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Sparkles className="w-5 h-5" />
                <span>NPC MODE</span>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              NPC Mode transforms real-world scavenger hunting into an AI-refereed multiplayer competition.
              Players scramble in physical space to capture photos matching randomized visual criteria evaluated in real-time by Google Gemini.
            </p>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div>Version: 1.0.0 (Celestial Release)</div>
              <div>Referee Model: Gemini 3.7 Flash</div>
              <div>Stack: React 19, TypeScript, Express, Web Audio API</div>
            </div>

            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-3 rounded-xl font-bold text-xs bg-slate-900 text-cyan-300 border border-cyan-500/30"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
