import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BreathingPhase,
  LevelConfig,
  PHASE_DETAILS,
  SessionStatus,
  BREATHING_LEVELS,
} from '../types/breathing';
import { AmbientSoundType } from '../types/ambientAudio';
import {
  createLotusSanctuary,
  createPrismSanctuary,
  createCairnSanctuary,
  SanctuaryModel,
  SanctuaryThemeId,
} from '../three/proceduralModels';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface ThreeBreathingSanctuaryProps {
  currentPhase: BreathingPhase;
  secondsRemaining: number;
  phaseProgress: number; // 0 to 1
  status: SessionStatus;
  currentRound: number;
  totalRounds: number;
  level: LevelConfig;
  soundEnabled: boolean;
  onToggleSound: () => void;
  ambientSound: AmbientSoundType;
  onSelectAmbientSound: (sound: AmbientSoundType) => void;
  ambientVolume: number;
  onChangeAmbientVolume: (vol: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSelectLevel: (lvl: LevelConfig) => void;
  onChangeTotalRounds: (rounds: number) => void;
  onExit3D: () => void;
}

export const ThreeBreathingSanctuary: React.FC<ThreeBreathingSanctuaryProps> = ({
  currentPhase,
  secondsRemaining,
  phaseProgress,
  status,
  currentRound,
  totalRounds,
  level,
  soundEnabled,
  onToggleSound,
  ambientSound,
  onSelectAmbientSound,
  ambientVolume,
  onChangeAmbientVolume,
  onStart,
  onPause,
  onResume,
  onReset,
  onSelectLevel,
  onChangeTotalRounds,
  onExit3D,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // 3D Model Preset State
  const [modelTheme, setModelTheme] = useState<SanctuaryThemeId>('lotus');
  // Collapsible bottom dock
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  // Active dock tab: 'controls' | 'patterns' | 'environment'
  const [activeTab, setActiveTab] = useState<'controls' | 'patterns' | 'environment'>('controls');

  // Mutable refs for Three.js render loop to avoid re-initializing scene on React state changes
  const breathStateRef = useRef({
    phase: currentPhase,
    progress: phaseProgress,
    status,
  });

  useEffect(() => {
    breathStateRef.current = {
      phase: currentPhase,
      progress: phaseProgress,
      status,
    };
  }, [currentPhase, phaseProgress, status]);

  const activeModelRef = useRef<SanctuaryModel | null>(null);

  // Keyboard shortcut listener inside 3D mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (status === 'idle') onStart();
        else if (status === 'running') onPause();
        else if (status === 'paused') onResume();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setIsDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExit3D();
      } else if (e.key >= '1' && e.key <= '8') {
        const idx = parseInt(e.key, 10) - 1;
        if (BREATHING_LEVELS[idx]) {
          e.preventDefault();
          onSelectLevel(BREATHING_LEVELS[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, onStart, onPause, onResume, onReset, onSelectLevel, onExit3D]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL (SwiftShader, llvmpipe, WARP) from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);
    scene.fog = new THREE.FogExp2(0x060a14, 0.035);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio PBR Lighting Rig
    // Warm Key Light with tight shadow bounds
    const keyLight = new THREE.DirectionalLight(0xfff1e6, 2.0);
    keyLight.position.set(4, 7, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 20;
      keyLight.shadow.camera.left = -4;
      keyLight.shadow.camera.right = 4;
      keyLight.shadow.camera.top = 4;
      keyLight.shadow.camera.bottom = -4;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool Sky/Ground Fill Light
    const fillLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.85);
    scene.add(fillLight);

    // Accent Back Rim Light
    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.7);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    // 5. OrbitControls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.target.set(0, 1.2, 0);
    controls.update();

    // 6. Instantiate Active Procedural Model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const instantiateModel = (theme: SanctuaryThemeId) => {
      if (activeModelRef.current) {
        modelGroup.remove(activeModelRef.current.group);
        activeModelRef.current.dispose();
        activeModelRef.current = null;
      }

      let model: SanctuaryModel;
      if (theme === 'prism') {
        model = createPrismSanctuary();
      } else if (theme === 'cairn') {
        model = createCairnSanctuary();
      } else {
        model = createLotusSanctuary();
      }

      modelGroup.add(model.group);
      activeModelRef.current = model;
    };

    instantiateModel(modelTheme);

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Lossless 60fps Loop with Software-GL Pacing Guard
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Update OrbitControls
      controls.update();

      // Update Procedural Model kinetic breath state
      if (activeModelRef.current) {
        const { phase, progress, status: sessStatus } = breathStateRef.current;
        activeModelRef.current.update(elapsedTime, phase, progress, sessStatus, delta);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);

      if (activeModelRef.current) {
        activeModelRef.current.dispose();
        activeModelRef.current = null;
      }

      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelTheme]);

  // Phase color accents for HUD
  const phaseColors: Record<BreathingPhase, { ring: string; text: string; bg: string }> = {
    inhale: { ring: '#2dd4bf', text: 'text-teal-300', bg: 'bg-teal-500/20' },
    hold1: { ring: '#818cf8', text: 'text-indigo-300', bg: 'bg-indigo-500/20' },
    exhale: { ring: '#fbbf24', text: 'text-amber-300', bg: 'bg-amber-500/20' },
    hold2: { ring: '#38bdf8', text: 'text-sky-300', bg: 'bg-sky-500/20' },
  };

  const activeColors = phaseColors[currentPhase];
  const phaseInfo = PHASE_DETAILS[currentPhase];
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-40 bg-[#060a14] overflow-hidden select-none">
      {/* 1. Stable WebGL canvas container outside React HUD */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        aria-label="3D Breathing Sanctuary Viewport"
      />

      {/* 2. Minimalist Top Bar HUD (Viewport-first, unobtrusive) */}
      <header className="absolute top-3 sm:top-5 inset-x-3 sm:inset-x-6 flex items-start justify-between pointer-events-none z-10">
        {/* Left: Sanctuary & Level Badge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg">
          <Sparkles className="w-4 h-4 text-teal-400" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">
              3D Breath Sanctuary
            </span>
            <span className="text-[10px] text-teal-300 font-mono">
              {level.name} ({level.secondsPerPhase}s)
            </span>
          </div>
        </div>

        {/* Center: Large Tranquil Breath Phase Indicator */}
        <div className="pointer-events-auto flex flex-col items-center px-4 sm:px-6 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl min-w-[140px] sm:min-w-[190px] text-center">
          <span
            className={`text-[10px] sm:text-xs font-bold tracking-widest uppercase ${
              isIdle ? 'text-slate-400' : activeColors.text
            }`}
          >
            {isIdle ? 'Ready to Begin' : isPaused ? 'Paused' : phaseInfo.label}
          </span>
          <div className="font-mono text-3xl sm:text-4xl font-bold text-white tabular-nums drop-shadow">
            {isIdle ? `${level.secondsPerPhase}s` : secondsRemaining}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Round {isIdle ? 1 : Math.min(totalRounds, currentRound + 1)} of{' '}
            {totalRounds}
          </span>
        </div>

        {/* Right: Fullscreen & Exit 3D View */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-lg"
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          <button
            type="button"
            onClick={onExit3D}
            title="Exit 3D Sanctuary back to 2D dashboard (Esc)"
            aria-label="Exit 3D View"
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-200 hover:text-teal-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-lg"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">2D Dashboard</span>
          </button>
        </div>
      </header>

      {/* 3. Collapsible Unified Bottom Control Dock (<= 15% Viewport footprint) */}
      <aside
        className={`absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-20 transition-transform duration-300 ${
          isDockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
        aria-label="3D Breathing Sanctuary Dock Controls"
      >
        {/* Collapse / Expand Toggle Tab */}
        <div className="flex justify-center -mb-px">
          <button
            type="button"
            onClick={() => setIsDockCollapsed((prev) => !prev)}
            title="Toggle Control Dock (Press H)"
            aria-label={isDockCollapsed ? 'Show Controls Dock' : 'Hide Controls for Zen Mode'}
            className="px-4 py-1 rounded-t-lg bg-slate-900/95 hover:bg-slate-800 border-t border-x border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Show Controls (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Zen Cinema Mode (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Main Body (Solid rgba surface, NO backdrop-filter) */}
        <div className="rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-3 sm:p-4 flex flex-col gap-2.5">
          {/* Dock Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('controls')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'controls'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Session Controls
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('patterns')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'patterns'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Breathing Cadence
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('environment')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'environment'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3D Model & Audio
              </button>
            </div>

            {/* Quick Chime & Mute Indicators */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={onToggleSound}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                title={soundEnabled ? 'Bell Chimes On' : 'Bell Chimes Muted'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
                    <span>Bell On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>Bell Off</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: Session Controls & Rounds */}
          {activeTab === 'controls' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-0.5">
              {/* Primary Start / Pause / Reset Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isIdle ? (
                  <button
                    type="button"
                    onClick={onStart}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                    <span>Start Practice</span>
                  </button>
                ) : isRunning ? (
                  <button
                    type="button"
                    onClick={onPause}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onResume}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Reset Session (R)"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Rounds Selector Pills */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-400 mr-1 hidden md:inline">
                  Rounds:
                </span>
                {[1, 3, 5, 8, 10].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onChangeTotalRounds(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer ${
                      totalRounds === r
                        ? 'bg-teal-500/20 border border-teal-500 text-teal-300'
                        : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Breathing Cadence / Patterns */}
          {activeTab === 'patterns' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-0.5">
              {BREATHING_LEVELS.map((lvl, idx) => {
                const isSelected = lvl.id === level.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => onSelectLevel(lvl)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                      isSelected
                        ? 'bg-teal-500/20 border-teal-500 text-teal-200 shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold truncate">
                        {lvl.name}
                      </span>
                      <span className="text-[10px] font-mono opacity-70">
                        {idx + 1}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {lvl.category === '4-7-8'
                        ? '4-7-8s'
                        : lvl.category === 'resonant'
                        ? '5.5s'
                        : lvl.category === 'viloma'
                        ? '4-2-6-2s'
                        : lvl.category === 'ujjayi'
                        ? '6s'
                        : `${lvl.secondsPerPhase}s`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: 3D Sanctuary Presets & Ambient Audio */}
          {activeTab === 'environment' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-0.5">
              {/* Procedural 3D Model Presets */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 shrink-0">
                  3D Sanctuary:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'lotus' as const, label: '🪷 Sacred Lotus' },
                    { id: 'prism' as const, label: '💎 Prism Beacon' },
                    { id: 'cairn' as const, label: '🪨 Zen Cairn' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModelTheme(m.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        modelTheme === m.id
                          ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Sound Selector & Volume */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-400 shrink-0">
                  Ambient:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'rain' as const, label: 'Rain' },
                    { id: 'forest' as const, label: 'Forest' },
                    { id: 'ocean' as const, label: 'Ocean' },
                    { id: 'none' as const, label: 'Off' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelectAmbientSound(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        ambientSound === s.id
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {ambientSound !== 'none' && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="range"
                      min="0.05"
                      max="0.5"
                      step="0.01"
                      value={ambientVolume}
                      onChange={(e) => onChangeAmbientVolume(parseFloat(e.target.value))}
                      className="w-16 accent-teal-400 cursor-pointer"
                      title={`Volume: ${Math.round(ambientVolume * 100)}%`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
