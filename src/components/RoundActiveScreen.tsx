import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Clock,
  Flame,
  CheckCircle,
  X,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { JudgingOverlay } from './JudgingOverlay';
import { ValidSubmissionScreen } from './ValidSubmissionScreen';
import { InvalidSubmissionScreen } from './InvalidSubmissionScreen';
import { HeaderNav } from './HeaderNav';

// Sample fallback camera frames for instant testing & desktop environments
const TEST_FRAME_PRESETS: Record<string, string[]> = {
  COLOR: [
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80', // Red chair
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80', // Blue mug
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80', // Green plant
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'  // Yellow notebook
  ],
  TEXT: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', // Book text
    'https://images.unsplash.com/photo-1572945753563-80ac1a4d01b9?w=600&auto=format&fit=crop&q=80', // Exit sign
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80'  // Coffee cup label
  ],
  NUMBER: [
    'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=600&auto=format&fit=crop&q=80', // Clock digits
    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80'  // Keyboard numbers
  ],
  SHAPE: [
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', // Circular cup
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80'  // Rectangular laptop
  ],
  PATTERN: [
    'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80', // Striped pattern
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80'  // Grid mesh
  ],
  TRANSPARENCY: [
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80', // Clear glass
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80'  // Water bottle
  ]
};

export const RoundActiveScreen: React.FC = () => {
  const {
    currentRound,
    currentGame,
    playerRoundState,
    leaderboard,
    profile,
    submitPhoto,
    isJudging,
    judgingSubmission,
    lastSubmissionVerdict,
    clearLastVerdict,
    leaveRoom
  } = useGame();

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [showTestPhotos, setShowTestPhotos] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const attemptsUsed = playerRoundState?.attempts_used || 0;
  const isDone = playerRoundState?.status === 'DONE';
  const myEntry = leaderboard.find((p) => p.profile_id === profile?.id);
  const myScore = myEntry?.total_score || 0;
  const myStreak = myEntry?.current_streak || 0;

  // Countdown timer derived from server round end_time
  useEffect(() => {
    if (!currentRound || !currentRound.end_time) return;

    const updateTimer = () => {
      const diffMs = new Date(currentRound.end_time).getTime() - Date.now();
      const secs = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(secs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [currentRound?.end_time]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err: unknown) {
      console.warn('Camera stream error (using interactive viewfinder):', err);
      setCameraError('Camera access not permitted or unavailable. Use test photos or upload.');
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (!isDone && !lastSubmissionVerdict?.valid) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera, isDone, lastSubmissionVerdict?.valid]);

  // Flip Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture Frame from Video
  const handleCapture = async () => {
    if (isJudging || isDone) return;

    let base64 = '';
    if (videoRef.current && cameraActive) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        // Downscale to max 1024px per PRD §10, §17
        const scale = Math.min(1, 1024 / Math.max(video.videoWidth || 640, video.videoHeight || 480));
        canvas.width = (video.videoWidth || 640) * scale;
        canvas.height = (video.videoHeight || 480) * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          base64 = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (e) {
        console.error('Frame capture error:', e);
      }
    }

    // If camera not ready, choose a contextual preset photo
    if (!base64) {
      const type = currentRound?.challenge_type || 'COLOR';
      const presets = TEST_FRAME_PRESETS[type] || TEST_FRAME_PRESETS.COLOR;
      base64 = presets[Math.floor(Math.random() * presets.length)];
    }

    await submitPhoto(base64);
  };

  // Upload or select file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        await submitPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // If player succeeded in this round
  if (isDone || lastSubmissionVerdict?.valid) {
    return <ValidSubmissionScreen />;
  }

  // If player submitted an invalid photo and has attempts left
  if (lastSubmissionVerdict && !lastSubmissionVerdict.valid) {
    return (
      <InvalidSubmissionScreen
        onRetry={() => clearLastVerdict()}
        onCancel={() => {}}
      />
    );
  }

  const roundNum = currentRound?.number || 1;
  const totalRounds = currentGame?.total_rounds || 3;
  const promptText = currentRound?.prompt || 'FIND SOMETHING RED';
  const subPrompt = currentRound?.sub_prompt || 'Take a clear photo of anything matching the prompt';

  return (
    <div
      id="round-active-screen"
      className="min-h-screen flex flex-col justify-between p-3 sm:p-4 max-w-md mx-auto select-none relative overflow-hidden"
    >
      {/* AI Judging Scanning Overlay */}
      {isJudging && <JudgingOverlay attempt={judgingSubmission?.attempt} imageUrl={judgingSubmission?.imageUrl} />}

      {/* Top Status & Timer Bar */}
      <div className="flex items-center justify-between z-10 px-1 pt-1">
        <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300">
          ROUND {roundNum} OF {totalRounds}
        </div>

        <div className="flex items-center space-x-2">
          {/* Animated Countdown Ring */}
          <div
            className={`flex items-center space-x-1 px-3 py-1 rounded-full font-mono font-bold text-xs border ${
              remainingSeconds <= 5
                ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-slate-900/80 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>00:{remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}</span>
          </div>

          <button
            id="round-exit-btn"
            onClick={leaveRoom}
            className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Challenge Title Banner */}
      <div className="my-2 p-3 rounded-2xl bg-gradient-to-b from-[#0B1220]/90 to-[#070B14]/90 border border-cyan-500/30 text-center shadow-lg">
        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
          CHALLENGE
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
          {promptText}
        </h2>
        <p className="text-xs text-slate-300 mt-0.5 max-w-xs mx-auto">
          {subPrompt}
        </p>
      </div>

      {/* Live Camera Viewfinder Card */}
      <div className="relative flex-1 my-1 rounded-3xl overflow-hidden border-2 border-cyan-500/40 bg-black shadow-2xl flex items-center justify-center min-h-[300px]">
        {/* Real Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
        />

        {/* Fallback Viewfinder if permission denied or desktop demo */}
        {!cameraActive && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-[#00D9F5]">
              <Camera className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">Interactive Camera Ready</div>
              <div className="text-xs text-slate-400 max-w-xs mt-1">
                Point your camera at real-world objects or use the sample photo picker below for instant testing!
              </div>
            </div>
            <button
              id="enable-camera-stream-btn"
              type="button"
              onClick={startCamera}
              className="px-3.5 py-1.5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 text-xs font-bold hover:bg-cyan-900 transition-all"
            >
              Start Camera Stream
            </button>
          </div>
        )}

        {/* Viewfinder Target Corner Brackets */}
        <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between">
            <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
            <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
          </div>
          <div className="flex justify-between">
            <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
            <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
          </div>
        </div>

        {/* Center reticle */}
        <div className="absolute w-8 h-8 border border-white/20 rounded-full pointer-events-none flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-[#00D9F5] rounded-full shadow-sm shadow-cyan-400" />
        </div>

        {/* Camera Overlay Controls */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-2">
          <button
            id="camera-flashlight-btn"
            type="button"
            onClick={() => setTorchOn(!torchOn)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-all"
          >
            {torchOn ? <Zap className="w-5 h-5 text-amber-400 fill-amber-400" /> : <ZapOff className="w-5 h-5 text-slate-300" />}
          </button>

          <button
            id="test-sample-photos-btn"
            type="button"
            onClick={() => setShowTestPhotos(!showTestPhotos)}
            className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-cyan-400/50 text-[11px] font-bold text-cyan-300 flex items-center space-x-1 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sample Photos</span>
          </button>

          <button
            id="camera-flip-btn"
            type="button"
            onClick={toggleFacingMode}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <RefreshCw className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Sample Photos Drawer */}
        {showTestPhotos && (
          <div className="absolute inset-0 bg-[#070B14]/95 backdrop-blur-md p-4 z-20 flex flex-col justify-between animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-300">Pick A Test Candidate Photo</span>
              <button
                onClick={() => setShowTestPhotos(false)}
                className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 my-2 overflow-y-auto max-h-[220px]">
              {(TEST_FRAME_PRESETS[currentRound?.challenge_type || 'COLOR'] || []).map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={async () => {
                    setShowTestPhotos(false);
                    await submitPhoto(imgUrl);
                  }}
                  className="rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 relative aspect-video group"
                >
                  <img src={imgUrl} alt="Sample candidate" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                    Candidate #{i + 1}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center space-x-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Upload Custom Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Input for Custom Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Shutter & Live Game Status Bar */}
      <div className="pt-2 flex flex-col space-y-2">
        {/* Shutter Action Button */}
        <div className="flex items-center justify-around px-4">
          {/* Attempts remaining pills */}
          <div className="flex flex-col items-center space-y-1 w-20">
            <span className="text-[10px] font-bold text-slate-400">ATTEMPTS</span>
            <div className="flex items-center space-x-1.5">
              <div
                className={`w-3 h-3 rounded-full ${
                  attemptsUsed >= 1 ? 'bg-slate-700' : 'bg-emerald-400 shadow-sm shadow-emerald-400/60'
                }`}
              />
              <div
                className={`w-3 h-3 rounded-full ${
                  attemptsUsed >= 2 ? 'bg-slate-700' : 'bg-emerald-400 shadow-sm shadow-emerald-400/60'
                }`}
              />
            </div>
          </div>

          {/* Main Shutter Snap Button */}
          <button
            id="shutter-capture-button"
            type="button"
            disabled={isJudging || isDone}
            onClick={handleCapture}
            className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#00F5A0] to-[#00D9F5] p-1 shadow-lg shadow-cyan-500/40 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
          >
            <div className="w-full h-full rounded-full border-4 border-slate-950 bg-white/90 flex items-center justify-center text-slate-950">
              <Camera className="w-8 h-8 stroke-[2.5]" />
            </div>
          </button>

          {/* Score and Streak Pill */}
          <div className="flex flex-col items-center space-y-1 w-20">
            <span className="text-[10px] font-bold text-slate-400">SCORE</span>
            <div className="flex items-center space-x-1 text-xs font-black text-white font-mono">
              <span>{myScore}</span>
              {myStreak > 0 && (
                <span className="text-[10px] text-amber-400 flex items-center">
                  🔥{myStreak}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
