'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  EyeOff,
  Layers,
  Orbit,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  detectSoftwareWebGL,
  createStudioRenderer,
  setupStudioEnvironmentAndLighting,
  scheduleSoftwareFrameAfterDraw,
  type StudioLightingRig,
} from '@/lib/three/renderer-setup';
import { createStudioMaterialSet, type MaterialFinishPreset } from '@/lib/three/materials';
import {
  buildSpatialModel,
  updatePacketStreamInstances,
  SPATIAL_SCENES,
  type SpatialSceneId,
  type BuiltSpatialModel,
} from '@/lib/three/procedural-models';

interface SpatialBackdrop3DProps {
  activeWorkspace: string;
  stageProgressRatio: number;
  completedStageFlags: boolean[];
  inspectMode: boolean;
  onToggleInspectMode: (next: boolean) => void;
}

type CameraPresetId = 'hero' | 'top' | 'macro' | 'side';

const CAMERA_PRESETS: Record<CameraPresetId, { pos: [number, number, number]; target: [number, number, number]; label: string }> = {
  hero: { pos: [4.6, 3.1, 5.4], target: [0, 1.05, 0], label: 'Hero 3/4' },
  top: { pos: [0.05, 6.4, 1.3], target: [0, 0.9, 0], label: 'Top Plan' },
  macro: { pos: [2.5, 1.85, 2.7], target: [0, 1.15, 0], label: 'Macro' },
  side: { pos: [5.6, 1.55, 0.2], target: [0, 1.05, 0], label: 'Profile' },
};

const FINISH_OPTIONS: Array<{ id: MaterialFinishPreset; label: string; swatch: string }> = [
  { id: 'titanium', label: 'Titanium', swatch: 'bg-slate-300' },
  { id: 'gold', label: 'Gold', swatch: 'bg-amber-400' },
  { id: 'sapphire', label: 'Sapphire', swatch: 'bg-indigo-400' },
  { id: 'obsidian', label: 'Obsidian', swatch: 'bg-emerald-400' },
];

// Pre-allocated math helpers (zero per-frame GC allocation)
const _mouseVec = new THREE.Vector2();
const _targetVec = new THREE.Vector3();
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();

export function SpatialBackdrop3D({
  activeWorkspace,
  stageProgressRatio,
  completedStageFlags,
  inspectMode,
  onToggleInspectMode,
}: SpatialBackdrop3DProps) {
  const canvasMountRef = useRef<HTMLDivElement>(null);

  const [sceneId, setSceneId] = useState<SpatialSceneId>('silicon-core');
  const [autoFollowWorkspace, setAutoFollowWorkspace] = useState(true);
  const [finish, setFinish] = useState<MaterialFinishPreset>('titanium');
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('hero');
  const [paused, setPaused] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(true);
  const [hoveredPart, setHoveredPart] = useState<{ label: string; detail: string } | null>(null);
  const [selectedPart, setSelectedPart] = useState<{ label: string; detail: string } | null>(null);
  const [webglReady, setWebglReady] = useState(true);

  const effectiveSceneId: SpatialSceneId = autoFollowWorkspace
    ? activeWorkspace === 'overview'
      ? 'curriculum-orrery'
      : activeWorkspace === 'lab'
      ? 'memory-helix'
      : activeWorkspace === 'shell'
      ? 'network-constellation'
      : 'silicon-core'
    : sceneId;

  // Mutable simulation refs so React controls update live without recreating WebGLRenderer
  const configRef = useRef({
    explodeFactor: 0,
    paused: false,
    inspectMode: false,
    cameraPreset: 'hero' as CameraPresetId,
    transitionActive: false,
    reducedMotion: false,
  });

  useEffect(() => {
    configRef.current.explodeFactor = explodeFactor;
  }, [explodeFactor]);

  useEffect(() => {
    configRef.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    configRef.current.inspectMode = inspectMode;
  }, [inspectMode]);

  const threeStateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    rig: StudioLightingRig;
    isSoftwareGl: boolean;
    materials: ReturnType<typeof createStudioMaterialSet> | null;
    model: BuiltSpatialModel | null;
    requestRender: () => void;
  } | null>(null);

  // Hot-swap procedural model & PBR material finish without losing camera/WebGL context
  const stageFlagsSignature = completedStageFlags.map((f) => (f ? '1' : '0')).join('');
  useEffect(() => {
    const state = threeStateRef.current;
    if (!state) return;

    if (state.model) {
      state.scene.remove(state.model.root);
      state.model.disposeGeometries();
      state.model = null;
    }
    if (state.materials) {
      state.materials.dispose();
      state.materials = null;
    }

    const materials = createStudioMaterialSet(finish, state.renderer, state.isSoftwareGl);
    const model = buildSpatialModel(
      effectiveSceneId,
      materials,
      state.isSoftwareGl,
      stageProgressRatio,
      completedStageFlags
    );
    state.scene.add(model.root);
    state.materials = materials;
    state.model = model;

    if (!state.isSoftwareGl) {
      state.renderer.compile(state.scene, state.camera);
    }
    state.requestRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSceneId, finish, stageProgressRatio, stageFlagsSignature]);

  // Trigger camera preset smooth glide
  const handleSelectCameraPreset = (preset: CameraPresetId) => {
    setCameraPreset(preset);
    configRef.current.cameraPreset = preset;
    configRef.current.transitionActive = true;
    const p = CAMERA_PRESETS[preset];
    _camGoalPos.set(...p.pos);
    _camGoalTarget.set(...p.target);
    threeStateRef.current?.requestRender();
  };

  // Keyboard shortcut 'H' to toggle HUD dock collapse (zero occlusion)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.key.toLowerCase() === 'h' && inspectMode) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectMode]);

  // Main WebGL lifecycle (initialized strictly once)
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    configRef.current.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = createStudioRenderer(container, isSoftwareGl);
    } catch {
      queueMicrotask(() => setWebglReady(false));
      return;
    }

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      80
    );
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const rig = setupStudioEnvironmentAndLighting(scene, renderer, isSoftwareGl);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.2;
    controls.maxDistance = 12.5;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minPolarAngle = 0.15;
    controls.update();

    controls.addEventListener('start', () => {
      // Cancel scripted camera transition immediately so it never fights the user
      configRef.current.transitionActive = false;
    });

    const materials = createStudioMaterialSet(finish, renderer, isSoftwareGl);
    const model = buildSpatialModel(
      effectiveSceneId,
      materials,
      isSoftwareGl,
      stageProgressRatio,
      completedStageFlags
    );
    scene.add(model.root);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let disposed = false;
    let frameId = 0;
    let timerIds: number[] = [];
    const registerTimer = (id: number) => {
      timerIds.push(id);
    };

    const clock = new THREE.Clock();
    let currentExplode = 0;
    let elapsed = 0;
    let renderBusy = false;
    let renderDirty = false;

    const applySceneStep = (delta: number) => {
      const state = threeStateRef.current;
      if (!state || !state.model || !state.materials) return;

      const motionActive = !configRef.current.paused && !configRef.current.reducedMotion;
      if (motionActive) {
        elapsed += delta;
        state.materials.waveUniforms.uTime.value = elapsed;

        for (const obj of state.model.animatedParts.rotateSlow) {
          obj.rotation.y += delta * 0.22;
        }
        for (const obj of state.model.animatedParts.rotateReverse) {
          obj.rotation.y -= delta * 0.34;
        }
        if (state.model.animatedParts.packetStream) {
          updatePacketStreamInstances(state.model.animatedParts.packetStream, elapsed);
        }

        // Gentle ambient turntable orbit when in background mode
        if (!configRef.current.inspectMode && !configRef.current.transitionActive) {
          state.model.root.rotation.y = Math.sin(elapsed * 0.16) * 0.35 + elapsed * 0.08;
        }
      }

      // Exponentially damped exploded-view separation
      currentExplode = THREE.MathUtils.damp(
        currentExplode,
        configRef.current.explodeFactor,
        7.5,
        delta
      );
      for (const obj of state.model.interactables) {
        const base = obj.userData.basePosition as THREE.Vector3 | undefined;
        const offset = obj.userData.explodeOffset as THREE.Vector3 | undefined;
        if (base && offset) {
          _targetVec.copy(base).addScaledVector(offset, currentExplode);
          obj.position.lerp(_targetVec, 1);
        }
      }

      // Smooth damped camera preset transition
      if (configRef.current.transitionActive) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 6.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 6.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 6.5, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _camGoalTarget.x, 6.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, 6.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _camGoalTarget.z, 6.5, delta);
        if (camera.position.distanceTo(_camGoalPos) < 0.015) {
          configRef.current.transitionActive = false;
        }
      }

      controls.update();
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const delta = Math.min(clock.getDelta(), 0.05);
        applySceneStep(delta);
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) {
          scheduleSoftwareFrameAfterDraw(renderer, registerTimer, done);
        } else {
          done();
        }
      });
    };

    threeStateRef.current = {
      renderer,
      scene,
      camera,
      controls,
      rig,
      isSoftwareGl,
      materials,
      model,
      requestRender,
    };

    controls.addEventListener('change', () => {
      if (configRef.current.reducedMotion || configRef.current.paused) {
        requestRender();
      }
    });

    const tick = () => {
      if (disposed) return;
      if (document.hidden || configRef.current.reducedMotion || configRef.current.paused) {
        return;
      }
      const delta = Math.min(clock.getDelta(), 0.05);
      applySceneStep(delta);
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        scheduleSoftwareFrameAfterDraw(renderer, registerTimer, tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    const resumeLoop = () => {
      if (disposed) return;
      clock.getDelta();
      if (configRef.current.reducedMotion || configRef.current.paused) {
        requestRender();
      } else {
        tick();
      }
    };

    resumeLoop();

    // Throttled layer-1 Raycasting for interactive inspect mode
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let lastRaycastMs = 0;

    const getHitPart = (clientX: number, clientY: number) => {
      const state = threeStateRef.current;
      if (!state || !state.model || !configRef.current.inspectMode) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      _mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(_mouseVec, camera);
      const hits = raycaster.intersectObjects(state.model.interactables, true);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        if (hitObj.userData.partLabel) {
          return {
            label: String(hitObj.userData.partLabel),
            detail: String(hitObj.userData.partDetail || ''),
          };
        }
      }
      return null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastMs < 55) return;
      lastRaycastMs = now;
      const hit = getHitPart(e.clientX, e.clientY);
      setHoveredPart(hit);
      renderer.domElement.style.cursor = hit ? 'pointer' : configRef.current.inspectMode ? 'grab' : 'default';
    };

    const onClick = (e: MouseEvent) => {
      if (!configRef.current.inspectMode) return;
      const hit = getHitPart(e.clientX, e.clientY);
      setSelectedPart(hit);
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frameId);
      setWebglReady(false);
    };

    const onContextRestored = () => {
      setWebglReady(true);
      resumeLoop();
    };

    const onResize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        resumeLoop();
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      timerIds.forEach((id) => clearTimeout(id));
      timerIds = [];
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      controls.dispose();
      const s = threeStateRef.current;
      if (s?.model) s.model.disposeGeometries();
      if (s?.materials) s.materials.dispose();
      rig.envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      threeStateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-trigger loop when pause toggles
  useEffect(() => {
    if (!paused) {
      threeStateRef.current?.requestRender();
    }
  }, [paused, explodeFactor]);

  const activePartInfo = selectedPart || hoveredPart;
  const activeMeta = SPATIAL_SCENES.find((s) => s.id === effectiveSceneId) || SPATIAL_SCENES[0];

  return (
    <>
      {/* Isolated WebGL mount container behind app shell */}
      <div
        className={`fixed inset-0 transition-opacity duration-300 ${
          inspectMode ? 'z-30 pointer-events-auto opacity-100' : 'z-0 pointer-events-none opacity-65'
        }`}
        aria-hidden={!inspectMode}
      >
        {webglReady ? (
          <div ref={canvasMountRef} className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-[#03050b] bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(56,189,248,0.12),transparent_70%)]" />
        )}

        {/* Ambient vignette only in background mode so foreground typography pops cleanly */}
        {!inspectMode && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(3,5,11,0.18)_0%,rgba(3,5,11,0.78)_78%,#03050b_100%)]" />
        )}
      </div>

      {/* Zero-occlusion minimal top spec badge ONLY in Inspect Mode */}
      {inspectMode && (
        <div className="fixed top-16 left-5 z-40 pointer-events-auto max-w-sm rounded-xl border border-white/12 bg-[#070b14]/92 px-3.5 py-2.5 text-xs shadow-xl">
          <div className="flex items-center gap-2 font-mono text-[11px] text-sky-400">
            <Cpu className="h-3.5 w-3.5 shrink-0" />
            <span>{activeMeta.title}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{activeMeta.partCount} parts</span>
          </div>
          {activePartInfo ? (
            <div className="mt-1.5 border-t border-white/[0.08] pt-1.5">
              <div className="font-semibold text-white">{activePartInfo.label}</div>
              <div className="text-[11px] text-slate-300 leading-snug mt-0.5">{activePartInfo.detail}</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 mt-1">
              Drag to orbit · Scroll to zoom · Click any 3D component to inspect
            </div>
          )}
        </div>
      )}

      {/* Single Collapsible Bottom-Center Dock (Zero Center Viewport Occlusion) */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center max-w-[min(920px,95vw)] pointer-events-auto"
      >
        {/* Top-edge Collapse/Inspect Handle */}
        <div className="flex items-center gap-1.5 rounded-t-xl border border-b-0 border-white/12 bg-[#070b14]/95 px-3 py-1 text-[11px] font-mono text-slate-300 shadow-lg">
          <button
            type="button"
            onClick={() => {
              const next = !inspectMode;
              onToggleInspectMode(next);
              if (next) setDockCollapsed(false);
            }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              inspectMode ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-sky-300 hover:text-white'
            }`}
          >
            {inspectMode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{inspectMode ? 'Exit 3D Inspect' : 'Inspect 3D Scene'}</span>
          </button>

          <span className="text-slate-700">|</span>

          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-slate-300 hover:text-white cursor-pointer whitespace-nowrap"
            aria-expanded={!dockCollapsed}
          >
            {dockCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            <span>{dockCollapsed ? '3D Controls' : 'Hide Controls'}</span>
          </button>
        </div>

        {/* Expanded Bottom Dock Panel (opaque/rgba surface — zero backdrop-filter over WebGL) */}
        {!dockCollapsed && (
          <div className="w-full rounded-2xl border border-white/14 bg-[#070b14]/96 px-4 py-3 shadow-2xl space-y-2.5 text-xs">
            {/* Row 1: Procedural Asset Selector + Camera + Motion */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1 flex-wrap">
                <Orbit className="h-3.5 w-3.5 text-sky-400 mr-1 shrink-0" />
                {SPATIAL_SCENES.map((s) => {
                  const isActive = effectiveSceneId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setAutoFollowWorkspace(false);
                        setSceneId(s.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-200 border border-sky-400/45 font-semibold'
                          : 'bg-white/[0.04] text-slate-400 border border-transparent hover:text-slate-100'
                      }`}
                    >
                      {s.title}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAutoFollowWorkspace((v) => !v)}
                  className={`px-2 py-1 rounded-lg font-mono text-[10px] border transition-colors cursor-pointer whitespace-nowrap ${
                    autoFollowWorkspace
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-white/[0.03] text-slate-400'
                  }`}
                >
                  Auto-Sync
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-slate-200 hover:border-white/25 cursor-pointer"
                >
                  {paused ? <Play className="h-3 w-3 text-emerald-400" /> : <Pause className="h-3 w-3 text-amber-400" />}
                  <span>{paused ? 'Play' : 'Pause'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExplodeFactor(0);
                    setSelectedPart(null);
                    handleSelectCameraPreset('hero');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-mono text-slate-200 hover:border-white/25 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 text-sky-400" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Row 2: Exploded View Slider + Material Finish Swatches + Camera Presets */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-2.5">
              <label className="flex items-center gap-2.5 min-w-[200px] flex-1 max-w-xs font-mono text-[11px] text-slate-300">
                <Layers className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span className="whitespace-nowrap">Explode</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodeFactor}
                  onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <span className="tabular-nums w-8 text-right text-sky-300">
                  {Math.round(explodeFactor * 100)}%
                </span>
              </label>

              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="text-slate-500 mr-1">Finish:</span>
                {FINISH_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFinish(f.id)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      finish === f.id
                        ? 'border-sky-400/50 bg-white/[0.08] text-white font-semibold'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${f.swatch}`} />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 font-mono text-[11px]">
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((pid) => (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => handleSelectCameraPreset(pid)}
                    className={`px-2 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      cameraPreset === pid
                        ? 'border-sky-400/50 bg-sky-500/15 text-sky-200 font-semibold'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {CAMERA_PRESETS[pid].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
