'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Trophy,
  ShieldAlert,
  Cpu,
  Zap,
  Shield,
  Crosshair,
  Sparkles,
} from 'lucide-react';

interface SystemsArcadeGameProps {
  isOpen: boolean;
  onClose: () => void;
  onAwardXp: (xp: number, summary: string) => void;
}

type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';
type TowerKind = 'cache' | 'mutex' | 'canary' | 'gc';

interface TowerBlueprint {
  id: TowerKind;
  name: string;
  hotkey: string;
  cost: number;
  range: number;
  fireRate: number;
  damage: number;
  color: string;
  glow: string;
  role: string;
}

const TOWER_BLUEPRINTS: Record<TowerKind, TowerBlueprint> = {
  cache: {
    id: 'cache',
    name: 'L1 Cache',
    hotkey: '1',
    cost: 50,
    range: 145,
    fireRate: 0.42,
    damage: 24,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.5)',
    role: 'Rapid SRAM laser',
  },
  mutex: {
    id: 'mutex',
    name: 'Mutex Gate',
    hotkey: '2',
    cost: 70,
    range: 130,
    fireRate: 0.72,
    damage: 18,
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    role: 'Stalls & locks packets',
  },
  canary: {
    id: 'canary',
    name: 'Stack Canary',
    hotkey: '3',
    cost: 95,
    range: 205,
    fireRate: 1.05,
    damage: 66,
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.5)',
    role: 'High-caliber overflow lance',
  },
  gc: {
    id: 'gc',
    name: 'GC Sweep',
    hotkey: '4',
    cost: 110,
    range: 125,
    fireRate: 1.35,
    damage: 40,
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.5)',
    role: 'Radial memory shockwave',
  },
};

const LOGICAL_W = 960;
const LOGICAL_H = 560;

const BUS_WAYPOINTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 40, y: 120 },
  { x: 255, y: 120 },
  { x: 255, y: 390 },
  { x: 485, y: 390 },
  { x: 485, y: 155 },
  { x: 720, y: 155 },
  { x: 720, y: 410 },
  { x: 905, y: 410 },
];

const SOCKET_PADS: ReadonlyArray<{ id: number; x: number; y: number }> = [
  { id: 0, x: 155, y: 210 },
  { id: 1, x: 370, y: 270 },
  { id: 2, x: 370, y: 470 },
  { id: 3, x: 600, y: 265 },
  { id: 4, x: 600, y: 78 },
  { id: 5, x: 820, y: 280 },
  { id: 6, x: 165, y: 455 },
  { id: 7, x: 810, y: 495 },
];

interface EnemyEntity {
  id: number;
  label: string;
  hp: number;
  maxHp: number;
  speed: number;
  slowTimer: number;
  segmentIndex: number;
  x: number;
  y: number;
  reward: number;
  coreDamage: number;
  radius: number;
  color: string;
}

interface TowerEntity {
  padId: number;
  kind: TowerKind;
  x: number;
  y: number;
  level: number;
  cooldown: number;
  pulseAnim: number;
}

interface ProjectileEntity {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  slows: boolean;
  targetId: number;
  life: number;
}

interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface RingEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
}

interface GameSimState {
  wave: number;
  maxWaves: number;
  integrity: number;
  maxIntegrity: number;
  credits: number;
  score: number;
  kills: number;
  waveSpawnQueue: Array<{
    label: string;
    hp: number;
    speed: number;
    reward: number;
    coreDamage: number;
    radius: number;
    color: string;
  }>;
  spawnTimer: number;
  interWaveTimer: number;
  manualPulseCooldown: number;
  enemies: EnemyEntity[];
  towers: TowerEntity[];
  projectiles: ProjectileEntity[];
  particles: ParticleEntity[];
  rings: RingEffect[];
  nextId: number;
  hardcore: boolean;
  xpAwarded: boolean;
}

function buildWaveQueue(wave: number, hardcore: boolean) {
  const mult = (hardcore ? 1.28 : 1.0) * (1 + (wave - 1) * 0.25);
  const count = 6 + wave * 3;
  const items: GameSimState['waveSpawnQueue'] = [];
  for (let i = 0; i < count; i++) {
    const isBoss = wave >= 3 && i === count - 1;
    const isHeavy = !isBoss && i % 4 === 3;
    const isFast = !isBoss && !isHeavy && i % 3 === 1;

    if (isBoss) {
      items.push({
        label: wave === 6 ? 'KERNEL PANIC' : 'DEADLOCK TITAN',
        hp: Math.round(310 * mult),
        speed: 44 + wave * 3,
        reward: 55,
        coreDamage: 28,
        radius: 17,
        color: '#f43f5e',
      });
    } else if (isHeavy) {
      items.push({
        label: 'HEAP OVERFLOW',
        hp: Math.round(125 * mult),
        speed: 56 + wave * 3,
        reward: 22,
        coreDamage: 14,
        radius: 13,
        color: '#fb923c',
      });
    } else if (isFast) {
      items.push({
        label: 'RACE SPIKE',
        hp: Math.round(52 * mult),
        speed: 108 + wave * 5,
        reward: 14,
        coreDamage: 8,
        radius: 9,
        color: '#e879f9',
      });
    } else {
      items.push({
        label: 'SYN FLOOD',
        hp: Math.round(76 * mult),
        speed: 78 + wave * 4,
        reward: 16,
        coreDamage: 10,
        radius: 11,
        color: '#38bdf8',
      });
    }
  }
  return items;
}

function createInitialSim(hardcore: boolean): GameSimState {
  return {
    wave: 1,
    maxWaves: 6,
    integrity: 100,
    maxIntegrity: 100,
    credits: hardcore ? 130 : 165,
    score: 0,
    kills: 0,
    waveSpawnQueue: buildWaveQueue(1, hardcore),
    spawnTimer: 0.4,
    interWaveTimer: 0,
    manualPulseCooldown: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    rings: [],
    nextId: 1,
    hardcore,
    xpAwarded: false,
  };
}

class ArcadeSynthAudio {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      this.ctx = new AudioCtor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playTone(freq: number, duration: number, type: OscillatorType = 'triangle', gainLevel = 0.06, slideTo?: number) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  public playDeploy() {
    this.playTone(420, 0.11, 'sine', 0.07, 680);
  }

  public playZap() {
    this.playTone(540, 0.09, 'triangle', 0.05, 220);
  }

  public playPop() {
    this.playTone(290, 0.08, 'square', 0.035, 110);
  }

  public playHitCore() {
    this.playTone(130, 0.22, 'sawtooth', 0.08, 65);
  }

  public playWaveClear() {
    this.playTone(440, 0.12, 'triangle', 0.06);
    setTimeout(() => this.playTone(554, 0.12, 'triangle', 0.06), 90);
    setTimeout(() => this.playTone(660, 0.22, 'triangle', 0.07), 180);
  }
}

export function SystemsArcadeGame({
  isOpen,
  onClose,
  onAwardXp,
}: SystemsArcadeGameProps) {
  const [phase, setPhase] = useState<GamePhase>('title');
  const [hardcore, setHardcore] = useState(false);
  const [muted, setMuted] = useState(false);
  const [selectedKind, setSelectedKind] = useState<TowerKind>('cache');
  const [hud, setHud] = useState({
    wave: 1,
    maxWaves: 6,
    integrity: 100,
    credits: 165,
    score: 0,
    kills: 0,
    enemiesLeft: 0,
    pulseReady: true,
    interWave: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<GameSimState>(createInitialSim(false));
  const synthRef = useRef<ArcadeSynthAudio | null>(null);
  const selectedKindRef = useRef<TowerKind>('cache');
  const phaseRef = useRef<GamePhase>('title');
  const onAwardXpRef = useRef(onAwardXp);

  useEffect(() => {
    onAwardXpRef.current = onAwardXp;
  }, [onAwardXp]);

  useEffect(() => {
    selectedKindRef.current = selectedKind;
  }, [selectedKind]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new ArcadeSynthAudio();
    }
    synthRef.current.muted = muted;
    return synthRef.current;
  }, [muted]);

  const startNewRun = useCallback((isHardcore: boolean) => {
    const fresh = createInitialSim(isHardcore);
    simRef.current = fresh;
    setHud({
      wave: 1,
      maxWaves: fresh.maxWaves,
      integrity: fresh.integrity,
      credits: fresh.credits,
      score: 0,
      kills: 0,
      enemiesLeft: fresh.waveSpawnQueue.length,
      pulseReady: true,
      interWave: false,
    });
    setPhase('playing');
    getSynth().playWaveClear();
  }, [getSynth]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setSelectedKind('cache');
      else if (e.key === '2') setSelectedKind('mutex');
      else if (e.key === '3') setSelectedKind('canary');
      else if (e.key === '4') setSelectedKind('gc');
      else if (e.key === 'm' || e.key === 'M') setMuted((prev) => !prev);
      else if (e.key === ' ') {
        if (phaseRef.current === 'playing') {
          e.preventDefault();
          setPhase('paused');
        } else if (phaseRef.current === 'paused') {
          e.preventDefault();
          setPhase('playing');
        }
      } else if (e.key === 'Escape') {
        if (phaseRef.current === 'playing') {
          setPhase('paused');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Main 60fps simulation & renderer loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const handleFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const sim = simRef.current;

      if (phaseRef.current === 'playing') {
        sim.manualPulseCooldown = Math.max(0, sim.manualPulseCooldown - dt);

        // Spawn logic
        if (sim.waveSpawnQueue.length > 0) {
          sim.spawnTimer -= dt;
          if (sim.spawnTimer <= 0) {
            const spec = sim.waveSpawnQueue.shift()!;
            sim.enemies.push({
              id: sim.nextId++,
              ...spec,
              maxHp: spec.hp,
              slowTimer: 0,
              segmentIndex: 0,
              x: BUS_WAYPOINTS[0].x,
              y: BUS_WAYPOINTS[0].y,
            });
            sim.spawnTimer = Math.max(0.38, 1.05 - sim.wave * 0.08);
          }
        } else if (sim.enemies.length === 0) {
          if (sim.wave >= sim.maxWaves) {
            if (!sim.xpAwarded) {
              sim.xpAwarded = true;
              const earnedXp = Math.max(80, Math.round(sim.score * 0.12));
              onAwardXpRef.current(
                earnedXp,
                `Cleared Kernel Defense Wave ${sim.maxWaves}/${sim.maxWaves} (${sim.score} pts)`
              );
            }
            setPhase('victory');
            getSynth().playWaveClear();
          } else {
            sim.interWaveTimer += dt;
            if (sim.interWaveTimer >= 1.8) {
              sim.wave += 1;
              sim.credits += 45 + sim.wave * 8;
              sim.score += 100;
              sim.waveSpawnQueue = buildWaveQueue(sim.wave, sim.hardcore);
              sim.interWaveTimer = 0;
              sim.spawnTimer = 0.5;
              getSynth().playWaveClear();
            }
          }
        }

        // Update enemies along waypoints
        for (let i = sim.enemies.length - 1; i >= 0; i--) {
          const e = sim.enemies[i];
          if (e.slowTimer > 0) e.slowTimer = Math.max(0, e.slowTimer - dt);
          const effectiveSpeed = e.slowTimer > 0 ? e.speed * 0.48 : e.speed;

          const targetWp = BUS_WAYPOINTS[e.segmentIndex + 1];
          if (!targetWp) {
            // Reached CPU Core!
            sim.integrity = Math.max(0, sim.integrity - e.coreDamage);
            sim.rings.push({
              x: BUS_WAYPOINTS[BUS_WAYPOINTS.length - 1].x,
              y: BUS_WAYPOINTS[BUS_WAYPOINTS.length - 1].y,
              radius: 10,
              maxRadius: 60,
              color: '#f43f5e',
              life: 0.45,
            });
            sim.enemies.splice(i, 1);
            getSynth().playHitCore();

            if (sim.integrity <= 0) {
              if (!sim.xpAwarded && sim.score > 100) {
                sim.xpAwarded = true;
                onAwardXpRef.current(40, `Kernel Defense run ended on Wave ${sim.wave} (${sim.score} pts)`);
              }
              setPhase('gameover');
            }
            continue;
          }

          const dx = targetWp.x - e.x;
          const dy = targetWp.y - e.y;
          const dist = Math.hypot(dx, dy);
          const step = effectiveSpeed * dt;

          if (dist <= step) {
            e.x = targetWp.x;
            e.y = targetWp.y;
            e.segmentIndex += 1;
          } else {
            e.x += (dx / dist) * step;
            e.y += (dy / dist) * step;
          }
        }

        // Towers target & fire
        for (const t of sim.towers) {
          t.cooldown = Math.max(0, t.cooldown - dt);
          t.pulseAnim = Math.max(0, t.pulseAnim - dt * 3);
          const spec = TOWER_BLUEPRINTS[t.kind];
          const dmgMult = 1 + (t.level - 1) * 0.45;
          const effRange = spec.range + (t.level - 1) * 16;

          if (t.cooldown > 0) continue;

          if (t.kind === 'gc') {
            const inRange = sim.enemies.filter((e) => Math.hypot(e.x - t.x, e.y - t.y) <= effRange);
            if (inRange.length > 0) {
              t.cooldown = spec.fireRate;
              t.pulseAnim = 1;
              sim.rings.push({
                x: t.x,
                y: t.y,
                radius: 12,
                maxRadius: effRange,
                color: spec.color,
                life: 0.35,
              });
              for (const enemy of inRange) {
                enemy.hp -= Math.round(spec.damage * dmgMult);
              }
            }
          } else {
            let best: EnemyEntity | null = null;
            let bestSeg = -1;
            for (const e of sim.enemies) {
              if (Math.hypot(e.x - t.x, e.y - t.y) <= effRange) {
                if (e.segmentIndex > bestSeg) {
                  best = e;
                  bestSeg = e.segmentIndex;
                }
              }
            }
            if (best) {
              t.cooldown = Math.max(0.2, spec.fireRate - (t.level - 1) * 0.05);
              t.pulseAnim = 1;
              const angle = Math.atan2(best.y - t.y, best.x - t.x);
              const projSpeed = t.kind === 'canary' ? 560 : 420;
              sim.projectiles.push({
                x: t.x,
                y: t.y,
                tx: best.x,
                ty: best.y,
                vx: Math.cos(angle) * projSpeed,
                vy: Math.sin(angle) * projSpeed,
                damage: Math.round(spec.damage * dmgMult),
                color: spec.color,
                slows: t.kind === 'mutex',
                targetId: best.id,
                life: 0.85,
              });
            }
          }
        }

        // Update projectiles
        for (let i = sim.projectiles.length - 1; i >= 0; i--) {
          const p = sim.projectiles[i];
          p.life -= dt;
          if (p.life <= 0) {
            sim.projectiles.splice(i, 1);
            continue;
          }
          const target = sim.enemies.find((e) => e.id === p.targetId);
          if (target) {
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const dist = Math.hypot(dx, dy);
            const speed = Math.hypot(p.vx, p.vy);
            if (dist < 14) {
              target.hp -= p.damage;
              if (p.slows) target.slowTimer = 1.6;
              for (let k = 0; k < 5; k++) {
                const a = Math.random() * Math.PI * 2;
                const s = 40 + Math.random() * 75;
                sim.particles.push({
                  x: target.x,
                  y: target.y,
                  vx: Math.cos(a) * s,
                  vy: Math.sin(a) * s,
                  life: 0.28,
                  maxLife: 0.28,
                  color: p.color,
                  size: 2.2,
                });
              }
              sim.projectiles.splice(i, 1);
              continue;
            }
            p.x += (dx / dist) * speed * dt;
            p.y += (dy / dist) * speed * dt;
          } else {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }
        }

        // Sweep defeated enemies
        for (let i = sim.enemies.length - 1; i >= 0; i--) {
          const e = sim.enemies[i];
          if (e.hp <= 0) {
            sim.credits += e.reward;
            sim.score += e.reward * 5;
            sim.kills += 1;
            for (let k = 0; k < 10; k++) {
              const a = Math.random() * Math.PI * 2;
              const s = 55 + Math.random() * 110;
              sim.particles.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 0.42,
                maxLife: 0.42,
                color: e.color,
                size: 2.8,
              });
            }
            sim.enemies.splice(i, 1);
            getSynth().playPop();
          }
        }

        // Particles & rings
        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const pt = sim.particles[i];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          if (pt.life <= 0) sim.particles.splice(i, 1);
        }
        for (let i = sim.rings.length - 1; i >= 0; i--) {
          const rg = sim.rings[i];
          rg.life -= dt;
          rg.radius += (rg.maxRadius - rg.radius) * Math.min(1, dt * 8);
          if (rg.life <= 0) sim.rings.splice(i, 1);
        }

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.1) {
          hudSyncAccum = 0;
          setHud({
            wave: sim.wave,
            maxWaves: sim.maxWaves,
            integrity: sim.integrity,
            credits: sim.credits,
            score: sim.score,
            kills: sim.kills,
            enemiesLeft: sim.enemies.length + sim.waveSpawnQueue.length,
            pulseReady: sim.manualPulseCooldown <= 0.02,
            interWave: sim.interWaveTimer > 0,
          });
        }
      }

      // ---- RENDER ARENA ----
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

      // Subtle architectural blueprint grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.065)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= LOGICAL_W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, LOGICAL_H);
        ctx.stroke();
      }
      for (let gy = 0; gy <= LOGICAL_H; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(LOGICAL_W, gy);
        ctx.stroke();
      }

      // Data bus path
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.lineWidth = 42;
      ctx.beginPath();
      BUS_WAYPOINTS.forEach((wp, idx) => (idx === 0 ? ctx.moveTo(wp.x, wp.y) : ctx.lineTo(wp.x, wp.y)));
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -(now * 0.04);
      ctx.beginPath();
      BUS_WAYPOINTS.forEach((wp, idx) => (idx === 0 ? ctx.moveTo(wp.x, wp.y) : ctx.lineTo(wp.x, wp.y)));
      ctx.stroke();
      ctx.setLineDash([]);

      // Ingress & CPU Core terminals
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(BUS_WAYPOINTS[0].x, BUS_WAYPOINTS[0].y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DMA', BUS_WAYPOINTS[0].x, BUS_WAYPOINTS[0].y + 4);

      const coreWp = BUS_WAYPOINTS[BUS_WAYPOINTS.length - 1];
      ctx.fillStyle = sim.integrity > 35 ? '#064e3b' : '#4c0519';
      ctx.strokeStyle = sim.integrity > 35 ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(coreWp.x, coreWp.y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('CPU', coreWp.x, coreWp.y - 2);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = '10px monospace';
      ctx.fillText(`${sim.integrity}%`, coreWp.x, coreWp.y + 12);

      // Socket pads & deployed towers
      const selectedBlueprint = TOWER_BLUEPRINTS[selectedKindRef.current];
      for (const pad of SOCKET_PADS) {
        const deployed = sim.towers.find((t) => t.padId === pad.id);
        if (!deployed) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle =
            sim.credits >= selectedBlueprint.cost
              ? 'rgba(56, 189, 248, 0.45)'
              : 'rgba(148, 163, 184, 0.22)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pad.x, pad.y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+', pad.x, pad.y + 5);
        } else {
          const spec = TOWER_BLUEPRINTS[deployed.kind];
          ctx.strokeStyle = spec.glow;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(deployed.x, deployed.y, spec.range + (deployed.level - 1) * 16, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#091022';
          ctx.strokeStyle = spec.color;
          ctx.lineWidth = 2.5 + deployed.pulseAnim * 1.8;
          ctx.beginPath();
          ctx.arc(deployed.x, deployed.y, 21 + deployed.pulseAnim * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = spec.color;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`T${deployed.level}`, deployed.x, deployed.y + 4);
        }
      }

      // Shockwave rings
      for (const rg of sim.rings) {
        ctx.strokeStyle = rg.color;
        ctx.globalAlpha = Math.max(0, rg.life * 2);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rg.x, rg.y, rg.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Threat packets
      for (const e of sim.enemies) {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        if (e.slowTimer > 0) {
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Crisp HP bar
        const barW = e.radius * 2.2;
        const pct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 10, barW, 4);
        ctx.fillStyle = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#f43f5e';
        ctx.fillRect(e.x - barW / 2, e.y - e.radius - 10, barW * pct, 4);
      }

      // Projectiles
      for (const p of sim.projectiles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles
      for (const pt of sim.particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(handleFrame);
    };

    const onNativeCanvasClick = (ev: MouseEvent) => {
      if (phaseRef.current !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * LOGICAL_W;
      const y = ((ev.clientY - rect.top) / rect.height) * LOGICAL_H;

      const sim = simRef.current;
      const kind = selectedKindRef.current;
      const blueprint = TOWER_BLUEPRINTS[kind];

      for (const pad of SOCKET_PADS) {
        if (Math.hypot(x - pad.x, y - pad.y) <= 28) {
          const existing = sim.towers.find((t) => t.padId === pad.id);
          if (!existing) {
            if (sim.credits >= blueprint.cost) {
              sim.credits -= blueprint.cost;
              sim.towers.push({
                padId: pad.id,
                kind,
                x: pad.x,
                y: pad.y,
                level: 1,
                cooldown: 0.1,
                pulseAnim: 1,
              });
              getSynth().playDeploy();
            }
          } else if (existing.level < 3) {
            const upgradeCost = 45 + existing.level * 30;
            if (sim.credits >= upgradeCost) {
              sim.credits -= upgradeCost;
              existing.level += 1;
              existing.pulseAnim = 1;
              getSynth().playDeploy();
            }
          }
          return;
        }
      }

      if (sim.manualPulseCooldown <= 0) {
        sim.manualPulseCooldown = 0.55;
        sim.rings.push({
          x,
          y,
          radius: 6,
          maxRadius: 68,
          color: '#38bdf8',
          life: 0.32,
        });
        for (const enemy of sim.enemies) {
          if (Math.hypot(enemy.x - x, enemy.y - y) <= 72) {
            enemy.hp -= 38;
            enemy.slowTimer = Math.max(enemy.slowTimer, 0.8);
          }
        }
        getSynth().playZap();
      }
    };

    canvas.addEventListener('click', onNativeCanvasClick);
    rafId = requestAnimationFrame(handleFrame);
    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onNativeCanvasClick);
    };
  }, [isOpen, getSynth]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#03050c] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Compact Top Edge HUD */}
      <header className="h-12 border-b border-white/[0.08] bg-[#060a16] px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="font-display font-bold text-white tracking-tight text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4 text-sky-400" />
            <span>KERNEL DEFENSE</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="tabular-nums text-emerald-400 font-semibold">
            CORE {hud.integrity}%
          </span>
          <span className="tabular-nums text-amber-300 font-semibold">
            CYCLES {hud.credits}
          </span>
          <span className="tabular-nums text-sky-300">
            WAVE {hud.wave}/{hud.maxWaves}
          </span>
          <span className="tabular-nums text-slate-300 hidden md:inline">
            SCORE {hud.score.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {phase === 'playing' && (
            <button
              onClick={() => setPhase('paused')}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-mono text-slate-200 hover:bg-white/10 flex items-center gap-1 cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          )}
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-lg border border-white/10 bg-white/[0.05] p-1.5 text-slate-300 hover:text-white cursor-pointer"
            title={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            title="Exit Arena (Esc)"
          >
            <X className="h-3.5 w-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Playfield Canvas Area (>= 85% unobstructed area) */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 bg-[#03050c] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={LOGICAL_W}
          height={LOGICAL_H}
          className="w-full h-full max-w-[1160px] max-h-full aspect-[960/560] rounded-2xl border border-white/[0.1] shadow-2xl cursor-crosshair bg-[#050914] object-contain"
        />

        {/* Compact Bottom-Left Defense Blueprint Dock during active play */}
        {phase === 'playing' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-[#060a16]/95 px-2.5 py-1.5 shadow-xl">
            {(Object.keys(TOWER_BLUEPRINTS) as TowerKind[]).map((kind) => {
              const bp = TOWER_BLUEPRINTS[kind];
              const active = selectedKind === kind;
              const affordable = hud.credits >= bp.cost;
              return (
                <button
                  key={kind}
                  onClick={() => setSelectedKind(kind)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'border-sky-400/60 bg-sky-500/20 text-white font-semibold'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white'
                  } ${!affordable ? 'opacity-50' : ''}`}
                  title={`${bp.name}: ${bp.role} (${bp.cost} cycles) [Key ${bp.hotkey}]`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: bp.color }}
                  />
                  <span>{bp.hotkey}:{bp.name}</span>
                  <span className="text-amber-300">{bp.cost}</span>
                </button>
              );
            })}
            <span className="hidden md:inline-flex items-center gap-1 pl-2 text-[10px] font-mono text-slate-400">
              <Crosshair className="h-3 w-3 text-sky-400" />
              Click packets to zap · Click + pads to build/upgrade
            </span>
          </div>
        )}

        {/* TITLE SCREEN */}
        {phase === 'title' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#03050c]/92 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#070c1a] p-7 text-center space-y-5 shadow-2xl">
              {/* Bespoke Title Lockup Crest SVG (Title screen identity lockup) */}
              <div className="mx-auto w-20 h-20 flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden="true">
                  <defs>
                    <linearGradient id="kdCrest" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="40,4 72,22 72,58 40,76 8,58 8,22"
                    fill="#0b1326"
                    stroke="url(#kdCrest)"
                    strokeWidth="2.5"
                  />
                  <circle cx="40" cy="40" r="16" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />
                  <rect x="33" y="33" width="14" height="14" rx="3" fill="#38bdf8" />
                </svg>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-sky-400">
                  Interactive Systems Simulation
                </div>
                <h1 className="font-display text-3xl font-bold text-white tracking-tight">
                  KERNEL DEFENSE
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click socket pads to deploy &amp; upgrade defenses, or click incoming SYN floods and overflows to neutralize threats before they breach CPU Core.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setHardcore(false)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    !hardcore
                      ? 'border-sky-400/60 bg-sky-500/20 text-sky-200 font-semibold'
                      : 'border-white/10 bg-white/[0.03] text-slate-400'
                  }`}
                >
                  Standard Mode
                </button>
                <button
                  onClick={() => setHardcore(true)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
                    hardcore
                      ? 'border-rose-400/60 bg-rose-500/20 text-rose-200 font-semibold'
                      : 'border-white/10 bg-white/[0.03] text-slate-400'
                  }`}
                >
                  Hardcore (+Threat HP)
                </button>
              </div>

              <button
                onClick={() => startNewRun(hardcore)}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Defense Run</span>
              </button>
            </div>
          </div>
        )}

        {/* PAUSED OVERLAY */}
        {phase === 'paused' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#03050c]/88 p-4">
            <div className="w-full max-w-xs rounded-2xl border border-white/[0.12] bg-[#070c1a] p-6 text-center space-y-4">
              <Shield className="h-8 w-8 text-sky-400 mx-auto" />
              <h2 className="font-display text-xl font-bold text-white">Simulation Paused</h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPhase('playing')}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={() => startNewRun(hardcore)}
                  className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/10 font-medium text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restart Run</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Return to Workbench
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VICTORY / GAME OVER MODAL */}
        {(phase === 'victory' || phase === 'gameover') && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#03050c]/90 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/[0.12] bg-[#070c1a] p-6 text-center space-y-4 shadow-2xl">
              {phase === 'victory' ? (
                <Trophy className="h-10 w-10 text-amber-400 mx-auto" />
              ) : (
                <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
              )}

              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {phase === 'victory' ? 'Kernel Secured!' : 'Core Breached'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {phase === 'victory'
                    ? 'All 6 adversarial traffic waves neutralized with intact CPU registers.'
                    : `System bus saturated during Wave ${hud.wave} of ${hud.maxWaves}.`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs bg-[#04070f] rounded-xl p-3 border border-white/[0.08]">
                <div>
                  <div className="text-[10px] text-slate-500">SCORE</div>
                  <div className="font-bold text-white tabular-nums">{hud.score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">NEUTRALIZED</div>
                  <div className="font-bold text-emerald-400 tabular-nums">{hud.kills}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">XP GAINED</div>
                  <div className="font-bold text-sky-400 tabular-nums flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    +{phase === 'victory' ? Math.max(80, Math.round(hud.score * 0.12)) : hud.score > 100 ? 40 : 0}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => startNewRun(hardcore)}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Play Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 hover:text-white text-xs cursor-pointer"
                >
                  Back to CS Odyssey
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
