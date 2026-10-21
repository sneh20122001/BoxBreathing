import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BREATHING_LEVELS, BreathingPhase, LevelConfig, SessionStatus } from './types/breathing';
import { THEME_PRESETS, ThemeId } from './types/theme';
import { AmbientSoundType } from './types/ambientAudio';
import { SessionRecord } from './types/stats';
import {
  calculateTotalSessionSeconds,
  resolveSessionTimeline,
  SessionTimelineState,
} from './utils/timerLogic';
import { playChime } from './utils/audio';
import { updateAmbientSound, shouldPlayAmbient } from './utils/ambientSound';
import { resolveKeyboardShortcut } from './utils/keyboard';
import {
  getStoredHistory,
  saveHistoryRecord,
  clearStoredHistory,
  generateSampleHistory,
  STATS_STORAGE_KEY,
} from './utils/statsStorage';
import { Header } from './components/Header';
import { LevelSelector } from './components/LevelSelector';
import { BreathingVisualizer } from './components/BreathingVisualizer';
import { Controls } from './components/Controls';
import { SessionProgress } from './components/SessionProgress';
import { BreathStats } from './components/BreathStats';
import { Insights } from './components/Insights';
import { Instructions } from './components/Instructions';
import { CompletionModal } from './components/CompletionModal';
import { SafetyModal, SafetyBanner } from './components/SafetyDisclaimer';

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(BREATHING_LEVELS[0]);
  const [totalRounds, setTotalRounds] = useState<number>(5);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSafetyOpen, setIsSafetyOpen] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  // Theme state
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('box_breathing_theme');
        if (saved && THEME_PRESETS.some((t) => t.id === saved)) {
          return saved as ThemeId;
        }
      } catch {}
    }
    return 'ocean-calm';
  });

  const activeTheme =
    THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];

  const handleSelectTheme = useCallback((newThemeId: ThemeId) => {
    setThemeId(newThemeId);
    try {
      localStorage.setItem('box_breathing_theme', newThemeId);
    } catch {}
  }, []);

  // Ambient nature sound state (Rain, Forest, Ocean, Off)
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('box_breathing_ambient');
        if (
          saved &&
          (saved === 'none' ||
            saved === 'rain' ||
            saved === 'forest' ||
            saved === 'ocean')
        ) {
          return saved as AmbientSoundType;
        }
      } catch {}
    }
    return 'rain';
  });

  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedVol = localStorage.getItem('box_breathing_ambient_vol');
        if (savedVol) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0.05 && parsed <= 0.5) {
            return parsed;
          }
        }
      } catch {}
    }
    return 0.22;
  });

  const handleSelectAmbientSound = useCallback((sound: AmbientSoundType) => {
    setAmbientSound(sound);
    try {
      localStorage.setItem('box_breathing_ambient', sound);
    } catch {}
  }, []);

  const handleChangeAmbientVolume = useCallback((vol: number) => {
    setAmbientVolume(vol);
    try {
      localStorage.setItem('box_breathing_ambient_vol', vol.toString());
    } catch {}
  }, []);

  // Synchronize ambient nature sound with session status and volume
  useEffect(() => {
    updateAmbientSound(ambientSound, status, ambientVolume);
  }, [ambientSound, status, ambientVolume]);

  useEffect(() => {
    return () => {
      updateAmbientSound('none', 'idle');
    };
  }, []);

  // Session History (stored in localStorage)
  const [history, setHistory] = useState<SessionRecord[]>(() => {
    return getStoredHistory();
  });

  const recordCompletedSession = useCallback(
    (rounds: number, durationSec: number) => {
      if (rounds <= 0) return;
      const newRecord: SessionRecord = {
        id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        completedRounds: rounds,
        durationSeconds: Math.round(durationSec),
        levelId: selectedLevel.id,
        levelName: selectedLevel.name,
        secondsPerPhase: selectedLevel.secondsPerPhase,
      };
      const updated = saveHistoryRecord(newRecord);
      setHistory(updated);
    },
    [selectedLevel]
  );

  const handleClearHistory = useCallback(() => {
    clearStoredHistory();
    setHistory([]);
  }, []);

  const handleLoadSampleData = useCallback(() => {
    const sample = generateSampleHistory();
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(sample));
    } catch {}
    setHistory(sample);
  }, []);

  const handleScrollToStats = useCallback(() => {
    const el = document.getElementById('breath-stats');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleScrollToInsights = useCallback(() => {
    const el = document.getElementById('insights');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Timeline state
  const [timeline, setTimeline] = useState<SessionTimelineState>({
    completedRounds: 0,
    currentPhase: 'inhale',
    secondsRemainingInPhase: selectedLevel.secondsPerPhase,
    phaseProgress: 0,
    totalProgress: 0,
    isSessionCompleted: false,
    totalElapsedSeconds: 0,
  });

  // Accurate timekeeper refs
  const accumulatedMsRef = useRef<number>(0);
  const startTimestampRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastChimedPhaseRef = useRef<BreathingPhase | null>(null);

  // Stop any active animation frame
  const cancelTimerLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Update loop using performance.now()
  const runTimerLoop = useCallback(() => {
    const now = performance.now();
    const currentRunMs = startTimestampRef.current !== null ? now - startTimestampRef.current : 0;
    const totalElapsedMs = accumulatedMsRef.current + currentRunMs;

    const nextState = resolveSessionTimeline(
      totalElapsedMs,
      selectedLevel.secondsPerPhase,
      totalRounds
    );

    setTimeline(nextState);

    // Audio chime on phase transition
    if (nextState.currentPhase !== lastChimedPhaseRef.current && !nextState.isSessionCompleted) {
      lastChimedPhaseRef.current = nextState.currentPhase;
      playChime(soundEnabled, nextState.currentPhase);
    }

    if (nextState.isSessionCompleted) {
      setStatus('completed');
      setShowCompletionModal(true);
      playChime(soundEnabled, 'complete');
      cancelTimerLoop();
      recordCompletedSession(totalRounds, nextState.totalElapsedSeconds);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(runTimerLoop);
  }, [
    selectedLevel.secondsPerPhase,
    totalRounds,
    soundEnabled,
    cancelTimerLoop,
    recordCompletedSession,
  ]);

  // Start Session
  const handleStart = useCallback(() => {
    cancelTimerLoop();
    accumulatedMsRef.current = 0;
    startTimestampRef.current = performance.now();
    lastChimedPhaseRef.current = 'inhale';
    setShowCompletionModal(false);
    setStatus('running');

    // Chime for first inhale
    playChime(soundEnabled, 'inhale');

    animationFrameRef.current = requestAnimationFrame(runTimerLoop);
  }, [cancelTimerLoop, runTimerLoop, soundEnabled]);

  // Pause Session
  const handlePause = useCallback(() => {
    if (status !== 'running') return;
    cancelTimerLoop();
    if (startTimestampRef.current !== null) {
      accumulatedMsRef.current += performance.now() - startTimestampRef.current;
      startTimestampRef.current = null;
    }
    setStatus('paused');
  }, [status, cancelTimerLoop]);

  // Resume Session
  const handleResume = useCallback(() => {
    if (status !== 'paused') return;
    startTimestampRef.current = performance.now();
    setStatus('running');
    animationFrameRef.current = requestAnimationFrame(runTimerLoop);
  }, [status, runTimerLoop]);

  // Reset Session
  const handleReset = useCallback(() => {
    cancelTimerLoop();
    if (status === 'paused' && timeline.completedRounds > 0) {
      recordCompletedSession(timeline.completedRounds, timeline.totalElapsedSeconds);
    }
    accumulatedMsRef.current = 0;
    startTimestampRef.current = null;
    lastChimedPhaseRef.current = null;
    setStatus('idle');
    setShowCompletionModal(false);
    setTimeline({
      completedRounds: 0,
      currentPhase: 'inhale',
      secondsRemainingInPhase: selectedLevel.secondsPerPhase,
      phaseProgress: 0,
      totalProgress: 0,
      isSessionCompleted: false,
      totalElapsedSeconds: 0,
    });
  }, [
    cancelTimerLoop,
    status,
    timeline.completedRounds,
    timeline.totalElapsedSeconds,
    recordCompletedSession,
    selectedLevel.secondsPerPhase,
  ]);

  // Level Selection
  const handleSelectLevel = useCallback(
    (level: LevelConfig) => {
      handleReset();
      setSelectedLevel(level);
      setTimeline((prev) => ({
        ...prev,
        secondsRemainingInPhase: level.secondsPerPhase,
      }));
    },
    [handleReset]
  );

  // Target Rounds Change
  const handleChangeTotalRounds = useCallback(
    (rounds: number) => {
      if (status === 'idle') {
        setTotalRounds(rounds);
      }
    },
    [status]
  );

  // Background tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden
      } else {
        // Tab restored to foreground: calculate exact elapsed state
        if (status === 'running' && startTimestampRef.current !== null) {
          const now = performance.now();
          const currentRunMs = now - startTimestampRef.current;
          const totalElapsedMs = accumulatedMsRef.current + currentRunMs;
          const nextState = resolveSessionTimeline(
            totalElapsedMs,
            selectedLevel.secondsPerPhase,
            totalRounds
          );
          setTimeline(nextState);
          if (nextState.isSessionCompleted) {
            setStatus('completed');
            setShowCompletionModal(true);
            playChime(soundEnabled, 'complete');
            cancelTimerLoop();
            recordCompletedSession(totalRounds, nextState.totalElapsedSeconds);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    status,
    selectedLevel.secondsPerPhase,
    totalRounds,
    soundEnabled,
    cancelTimerLoop,
    recordCompletedSession,
  ]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      cancelTimerLoop();
    };
  }, [cancelTimerLoop]);

  // Global Keyboard Shortcuts (Space, R, 1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const action = resolveKeyboardShortcut(e.key, isInput, isSafetyOpen);
      if (!action) return;

      if (action.type === 'TOGGLE_PLAY') {
        e.preventDefault();
        if (showCompletionModal) {
          handleStart();
        } else if (status === 'running') {
          handlePause();
        } else if (status === 'paused') {
          handleResume();
        } else {
          handleStart();
        }
      } else if (action.type === 'RESET') {
        e.preventDefault();
        handleReset();
      } else if (action.type === 'SET_LEVEL') {
        e.preventDefault();
        const targetLevel = BREATHING_LEVELS[action.levelIndex];
        if (targetLevel) {
          handleSelectLevel(targetLevel);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isSafetyOpen,
    showCompletionModal,
    status,
    handleStart,
    handlePause,
    handleResume,
    handleReset,
    handleSelectLevel,
  ]);

  const totalSessionSeconds = calculateTotalSessionSeconds(
    selectedLevel.secondsPerPhase,
    totalRounds
  );

  return (
    <div
      className={`min-h-screen ${activeTheme.gradientClass} text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200 transition-colors duration-700 relative`}
    >
      {/* Ambient background radial glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 25%, ${activeTheme.ambientGlow} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Top Header */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onOpenSafety={() => setIsSafetyOpen(true)}
        onScrollToStats={handleScrollToStats}
        onScrollToInsights={handleScrollToInsights}
        currentThemeId={themeId}
        onSelectTheme={handleSelectTheme}
        ambientSound={ambientSound}
        onSelectAmbientSound={handleSelectAmbientSound}
        ambientVolume={ambientVolume}
        onChangeAmbientVolume={handleChangeAmbientVolume}
        isAmbientPlaying={shouldPlayAmbient(ambientSound, status)}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-5">
        {/* Safety Disclaimer Banner */}
        <SafetyBanner onOpenModal={() => setIsSafetyOpen(true)} />

        {/* Level Selection Section */}
        <LevelSelector
          selectedLevel={selectedLevel}
          onSelectLevel={handleSelectLevel}
          isRunning={status === 'running' || status === 'paused'}
        />

        {/* Central Visualization Area */}
        <section
          aria-label="Breathing visualizer and session dashboard"
          className="w-full rounded-2xl bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-950/80 border border-slate-800/80 p-3.5 sm:p-6 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center"
        >
          <BreathingVisualizer
            currentPhase={timeline.currentPhase}
            secondsRemaining={timeline.secondsRemainingInPhase}
            phaseProgress={timeline.phaseProgress}
            status={status}
            currentRound={timeline.completedRounds}
            totalRounds={totalRounds}
            secondsPerPhase={selectedLevel.secondsPerPhase}
          />

          {/* Controls */}
          <div className="w-full mt-3">
            <Controls
              status={status}
              totalRounds={totalRounds}
              secondsPerPhase={selectedLevel.secondsPerPhase}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
              onChangeTotalRounds={handleChangeTotalRounds}
            />
          </div>
        </section>

        {/* Session Progress Stats */}
        <SessionProgress
          status={status}
          currentRound={timeline.completedRounds}
          totalRounds={totalRounds}
          currentPhase={timeline.currentPhase}
          totalElapsedSeconds={timeline.totalElapsedSeconds}
          totalSessionSeconds={totalSessionSeconds}
          selectedLevel={selectedLevel}
        />

        {/* Breath Stats Dashboard Section */}
        <div id="breath-stats">
          <BreathStats
            history={history}
            onClearHistory={handleClearHistory}
            onLoadSampleData={handleLoadSampleData}
          />
        </div>

        {/* Insights Analytics Section */}
        <div id="insights">
          <Insights
            history={history}
            onLoadSampleData={handleLoadSampleData}
            onStartSession={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              handleStart();
            }}
          />
        </div>

        {/* Instructions / Technique Guide Section */}
        <Instructions
          currentPhase={timeline.currentPhase}
          isRunning={status === 'running'}
        />
      </main>

      {/* Subtle Footer with Keyboard Shortcuts Legend */}
      <footer className="w-full border-t border-slate-900/80 py-3 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5 px-4">
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span className="font-medium text-slate-400">Shortcuts:</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">Space</kbd> Pause/Resume
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">R</kbd> Reset
          </span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">1-4</kbd> Levels
          </span>
        </div>
        <p>Box Breathing · 4-Phase Guided Cadence for Calm & Mental Clarity</p>
      </footer>

      {/* Modals */}
      <CompletionModal
        isOpen={showCompletionModal}
        totalRounds={totalRounds}
        totalDurationSeconds={timeline.totalElapsedSeconds}
        level={selectedLevel}
        onRestart={handleStart}
        onSelectAnotherLevel={() => {
          setShowCompletionModal(false);
          handleReset();
        }}
      />

      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
      />
    </div>
  );
}
