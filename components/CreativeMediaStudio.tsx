'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Film,
  Upload,
  Download,
  Sparkles,
  Grid,
  RefreshCw,
  Play,
  Trash2,
} from 'lucide-react';
import { SoapBubbleButton } from '@/components/soap-bubble';

type StudioTab = 'diagram' | 'animate';
type BlueprintPreset = 'cpu' | 'network' | 'memory' | 'raft';
type ThemePalette = 'cobalt' | 'emerald' | 'amber' | 'violet';
type MotionStyle = 'pulse' | 'stream' | 'zoom';
type AspectMode = '16:9' | '9:16';

const PALETTES: Record<
  ThemePalette,
  { name: string; bgTop: string; bgBottom: string; accent: string; secondary: string; text: string }
> = {
  cobalt: {
    name: 'Cobalt Circuit',
    bgTop: '#04091a',
    bgBottom: '#07122b',
    accent: '#38bdf8',
    secondary: '#818cf8',
    text: '#e0f2fe',
  },
  emerald: {
    name: 'Phosphor Matrix',
    bgTop: '#02120d',
    bgBottom: '#04221a',
    accent: '#34d399',
    secondary: '#10b981',
    text: '#d1fae5',
  },
  amber: {
    name: 'Amber Oscilloscope',
    bgTop: '#160d03',
    bgBottom: '#251404',
    accent: '#f59e0b',
    secondary: '#fb923c',
    text: '#fef3c7',
  },
  violet: {
    name: 'Ultraviolet Optics',
    bgTop: '#0f061e',
    bgBottom: '#1c0b36',
    accent: '#c084fc',
    secondary: '#f472b6',
    text: '#f3e8ff',
  },
};

const PRESET_NODES: Record<BlueprintPreset, Array<{ label: string; sub: string }>> = {
  cpu: [
    { label: 'FETCH', sub: 'PC -> L1 I-Cache' },
    { label: 'DECODE', sub: 'Micro-Op Unit' },
    { label: 'EXECUTE', sub: 'ALU / SIMD' },
    { label: 'WRITEBACK', sub: 'Register File' },
  ],
  network: [
    { label: 'DNS', sub: 'UDP Port 53' },
    { label: 'TCP SYN/ACK', sub: '3-Way Handshake' },
    { label: 'TLS 1.3', sub: 'AEAD Key Exchange' },
    { label: 'HTTP/2', sub: 'Multiplexed Stream' },
  ],
  memory: [
    { label: 'TEXT SEG', sub: 'Read-Only Machine Code' },
    { label: 'HEAP ->', sub: 'malloc / Dynamic Alloc' },
    { label: '<- STACK', sub: 'Frames & Return Addrs' },
    { label: 'MMU TLB', sub: 'Virtual -> Physical' },
  ],
  raft: [
    { label: 'FOLLOWER', sub: 'Election Timeout' },
    { label: 'CANDIDATE', sub: 'RequestVote RPC' },
    { label: 'LEADER', sub: 'AppendEntries Heartbeat' },
    { label: 'QUORUM', sub: 'N/2 + 1 Committed' },
  ],
};

interface AnnotationStamp {
  id: number;
  text: string;
  xRatio: number;
  yRatio: number;
}

export function CreativeMediaStudio({ onAwardXp }: { onAwardXp?: (xp: number) => void }) {
  const [studioTab, setStudioTab] = useState<StudioTab>('diagram');
  const [preset, setPreset] = useState<BlueprintPreset>('cpu');
  const [paletteKey, setPaletteKey] = useState<ThemePalette>('cobalt');
  const [headline, setHeadline] = useState('CPU 4-Stage Superscalar Pipeline');
  const [caption, setCaption] = useState('Local Hardware Architecture Blueprint · CS Odyssey');
  const [showGrid, setShowGrid] = useState(true);
  const [scanlines, setScanlines] = useState(true);
  const [filterTone, setFilterTone] = useState<'none' | 'grayscale' | 'contrast' | 'blueprint'>('none');

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [stampText, setStampText] = useState('0x1000 PTR');
  const [stamps, setStamps] = useState<AnnotationStamp[]>([]);

  // Animation / Video settings
  const [aspect, setAspect] = useState<AspectMode>('16:9');
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('stream');
  const [recording, setRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  const diagramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const [imageVersion, setImageVersion] = useState(0);

  // Load uploaded image element cleanly in an effect
  useEffect(() => {
    if (!uploadedImageUrl) {
      loadedImageRef.current = null;
      return;
    }
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (active) {
        loadedImageRef.current = img;
        setImageVersion((v) => v + 1);
      }
    };
    img.src = uploadedImageUrl;
    return () => {
      active = false;
    };
  }, [uploadedImageUrl]);

  // Clean up created object URLs on unmount / replace
  useEffect(() => {
    return () => {
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    };
  }, [recordedVideoUrl]);

  const drawScene = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      phaseTime: number,
      animated: boolean
    ) => {
      const pal = PALETTES[paletteKey];

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, pal.bgTop);
      bg.addColorStop(1, pal.bgBottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Uploaded photo layer (fitted cleanly with optional tone filter)
      const img = loadedImageRef.current;
      if (img && img.naturalWidth > 0) {
        ctx.save();
        if (filterTone === 'grayscale') ctx.filter = 'grayscale(100%) contrast(1.15)';
        else if (filterTone === 'contrast') ctx.filter = 'contrast(1.32) saturate(1.2)';
        else if (filterTone === 'blueprint') ctx.filter = 'sepia(100%) hue-rotate(175deg) saturate(2.1)';

        const zoomScale = animated && motionStyle === 'zoom' ? 1 + 0.08 * Math.sin(phaseTime * 1.4) : 1.0;
        const panX = animated && motionStyle === 'zoom' ? Math.sin(phaseTime * 0.9) * 14 : 0;

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = width / height;
        let drawW = width;
        let drawH = height;
        if (imgAspect > canvasAspect) {
          drawW = width * zoomScale;
          drawH = drawW / imgAspect;
        } else {
          drawH = height * zoomScale;
          drawW = drawH * imgAspect;
        }
        const dx = (width - drawW) / 2 + panX;
        const dy = (height - drawH) / 2;

        ctx.globalAlpha = 0.85;
        ctx.drawImage(img, dx, dy, drawW, drawH);
        ctx.restore();

        // Dark readability scrim
        const scrim = ctx.createLinearGradient(0, height * 0.45, 0, height);
        scrim.addColorStop(0, 'rgba(3, 5, 12, 0.18)');
        scrim.addColorStop(1, 'rgba(3, 5, 12, 0.82)');
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, width, height);
      }

      // Engineering grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.055)';
        ctx.lineWidth = 1;
        const step = 36;
        for (let gx = 0; gx <= width; gx += step) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
          ctx.stroke();
        }
        for (let gy = 0; gy <= height; gy += step) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();
        }
      }

      // Architecture pipeline diagram nodes (when no photo overrides, or overlaid neatly)
      const nodes = PRESET_NODES[preset];
      const padX = Math.round(width * 0.07);
      const isPortrait = height > width;
      const boxY = img ? height * 0.62 : isPortrait ? height * 0.25 : height * 0.42;

      if (!img || animated) {
        const cols = isPortrait ? 2 : 4;
        const gap = 16;
        const usableW = width - padX * 2 - gap * (cols - 1);
        const cardW = usableW / cols;
        const cardH = isPortrait ? 92 : 96;

        nodes.forEach((node, idx) => {
          const row = isPortrait ? Math.floor(idx / 2) : 0;
          const col = isPortrait ? idx % 2 : idx;
          const x = padX + col * (cardW + gap);
          const y = boxY + row * (cardH + gap);

          // Connecting signal line
          if (!isPortrait && idx < nodes.length - 1) {
            ctx.strokeStyle = pal.secondary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x + cardW, y + cardH / 2);
            ctx.lineTo(x + cardW + gap, y + cardH / 2);
            ctx.stroke();

            if (animated) {
              const t = (phaseTime * 1.4 + idx * 0.3) % 1;
              const px = x + cardW + gap * t;
              ctx.fillStyle = pal.accent;
              ctx.beginPath();
              ctx.arc(px, y + cardH / 2, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          const activePulse = animated && motionStyle === 'pulse'
            ? 0.5 + 0.5 * Math.sin(phaseTime * 3.2 - idx * 0.9)
            : 0.35;

          ctx.fillStyle = 'rgba(6, 10, 22, 0.88)';
          ctx.strokeStyle = idx === Math.floor(phaseTime * 1.5) % 4 && animated ? '#ffffff' : pal.accent;
          ctx.lineWidth = 1.6 + activePulse * 1.2;

          ctx.beginPath();
          ctx.roundRect(x, y, cardW, cardH, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = pal.accent;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`0${idx + 1} · ${node.label}`, x + 12, y + 32);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '11px sans-serif';
          ctx.fillText(node.sub, x + 12, y + 58, cardW - 24);
        });
      }

      // Travelling data particles for stream motion
      if (animated && motionStyle === 'stream') {
        for (let i = 0; i < 14; i++) {
          const px = ((phaseTime * (120 + (i % 5) * 35) + i * 97) % (width + 40)) - 20;
          const py = ((i * 53) % (height - 80)) + 40;
          ctx.fillStyle = i % 2 === 0 ? pal.accent : pal.secondary;
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Header Banner
      ctx.fillStyle = pal.accent;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`CS ODYSSEY // ${preset.toUpperCase()} ARCHITECTURE`, padX, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${isPortrait ? 22 : 28}px sans-serif`;
      ctx.fillText(headline || 'Systems Diagram', padX, 78, width - padX * 2);

      ctx.fillStyle = pal.text;
      ctx.globalAlpha = 0.8;
      ctx.font = '13px sans-serif';
      ctx.fillText(caption, padX, height - 28, width - padX * 2);
      ctx.globalAlpha = 1;

      // Custom interactive callout stamps
      for (const s of stamps) {
        const sx = s.xRatio * width;
        const sy = s.yRatio * height;
        ctx.font = 'bold 11px monospace';
        const metrics = ctx.measureText(s.text);
        const bw = metrics.width + 18;
        ctx.fillStyle = 'rgba(2, 6, 18, 0.92)';
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(sx - bw / 2, sy - 14, bw, 28, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(s.text, sx, sy + 4);
      }

      if (scanlines) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1);
        }
      }
    },
    [paletteKey, preset, headline, caption, showGrid, scanlines, filterTone, stamps, motionStyle]
  );

  // Redraw static diagram editor preview whenever params or uploaded image change
  useEffect(() => {
    if (studioTab !== 'diagram') return;
    const canvas = diagramCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, canvas.width, canvas.height, 0, false);
  }, [studioTab, drawScene, imageVersion]);

  // Continuous live preview loop for Motion Animator
  useEffect(() => {
    if (studioTab !== 'animate') return;
    const canvas = animCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const started = performance.now();
    const renderLoop = (now: number) => {
      const t = (now - started) / 1000;
      drawScene(ctx, canvas.width, canvas.height, t, true);
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  }, [studioTab, drawScene, aspect, imageVersion]);

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setRecordError('Please select an image smaller than 12 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImageUrl(reader.result);
        setRecordError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasStampClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (studioTab !== 'diagram' || !stampText.trim()) return;
    const canvas = diagramCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    setStamps((prev) => [
      ...prev.slice(-11),
      { id: Date.now(), text: stampText.trim().slice(0, 28), xRatio, yRatio },
    ]);
  };

  const handleExportPng = () => {
    const canvas = diagramCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs-odyssey-${preset}-diagram.png`;
    a.click();
    onAwardXp?.(25);
  };

  const handleRenderWebmVideo = () => {
    const canvas = animCanvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
      setRecordError('MediaRecorder canvas capture is not supported in this browser.');
      return;
    }
    setRecordError(null);
    setRecording(true);
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }

    try {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecording(false);
        onAwardXp?.(40);
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 4000);
    } catch (err) {
      setRecording(false);
      setRecordError(err instanceof Error ? err.message : 'Unable to encode WebM video.');
    }
  };

  const animW = aspect === '16:9' ? 880 : 450;
  const animH = aspect === '16:9' ? 495 : 800;

  return (
    <div className="space-y-6">
      <div className="optical-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400 font-semibold">
              100% Local Browser Studio · Zero External Keys Required
            </span>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Architecture Diagram Editor &amp; Motion Video Lab
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Synthesize crisp CS architecture visuals or upload any local photo to annotate and animate directly into downloadable PNGs and WebM clips.
            </p>
          </div>

          <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium self-start">
            <button
              onClick={() => setStudioTab('diagram')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                studioTab === 'diagram'
                  ? 'bg-sky-500/15 text-sky-800 border border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/40 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-transparent'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Diagram &amp; Image Editor</span>
            </button>
            <button
              onClick={() => setStudioTab('animate')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                studioTab === 'animate'
                  ? 'bg-fuchsia-500/15 text-fuchsia-800 border border-fuchsia-500/40 dark:bg-fuchsia-500/20 dark:text-fuchsia-200 dark:border-fuchsia-400/40 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-transparent'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Animate to Video (WebM)</span>
            </button>
          </div>
        </div>

        {/* Shared Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-4 space-y-4 text-xs">
            <div className="optical-inset rounded-xl p-4 space-y-3">
              <div>
                <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Architecture Blueprint
                </label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as BlueprintPreset)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] px-2.5 py-1.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="cpu">CPU Fetch-Decode-Execute</option>
                  <option value="network">DNS / TCP / TLS 1.3 Stack</option>
                  <option value="memory">RAM Stack, Heap &amp; MMU</option>
                  <option value="raft">Distributed Raft Consensus</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Title &amp; Caption Overlay
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 mb-2"
                />
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(PALETTES) as ThemePalette[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setPaletteKey(k)}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] text-left cursor-pointer ${
                        paletteKey === k
                          ? 'border-sky-500/60 bg-sky-500/15 text-sky-900 dark:border-sky-400/60 dark:bg-sky-500/20 dark:text-white font-semibold'
                          : 'border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {PALETTES[k].name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                  Upload Base Image / Photo (Optional Edit or Animate)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 rounded-lg border border-slate-300 dark:border-white/15 bg-white hover:bg-slate-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] px-3 py-2 text-center cursor-pointer flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200">
                    <Upload className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{uploadedImageUrl ? 'Replace Photo' : 'Choose Image'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleUploadPhoto}
                      className="hidden"
                    />
                  </label>
                  {uploadedImageUrl && (
                    <button
                      onClick={() => {
                        setUploadedImageUrl(null);
                        setImageVersion((v) => v + 1);
                      }}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      title="Remove uploaded photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {uploadedImageUrl && (
                <div>
                  <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Image Filter
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['none', 'blueprint', 'grayscale', 'contrast'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterTone(f)}
                        className={`px-2 py-1 rounded-lg border capitalize text-[11px] cursor-pointer ${
                          filterTone === f
                            ? 'border-sky-500 bg-sky-500/15 text-sky-900 dark:border-sky-400 dark:bg-sky-500/20 dark:text-white font-semibold'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => setShowGrid((g) => !g)}
                  className={`flex-1 py-1.5 rounded-lg border text-[11px] font-mono cursor-pointer flex items-center justify-center gap-1 ${
                    showGrid
                      ? 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:border-sky-400/50 dark:text-sky-200 font-semibold'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Grid className="h-3 w-3" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setScanlines((s) => !s)}
                  className={`flex-1 py-1.5 rounded-lg border text-[11px] font-mono cursor-pointer flex items-center justify-center gap-1 ${
                    scanlines
                      ? 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:border-sky-400/50 dark:text-sky-200 font-semibold'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Scanlines</span>
                </button>
              </div>
            </div>

            {studioTab === 'diagram' ? (
              <div className="optical-inset rounded-xl p-4 space-y-3">
                <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  Click Canvas to Place Callout Badge
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stampText}
                    onChange={(e) => setStampText(e.target.value)}
                    placeholder="Badge label..."
                    className="flex-1 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#04070e] px-2.5 py-1.5 text-slate-900 dark:text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                  />
                  {stamps.length > 0 && (
                    <button
                      onClick={() => setStamps([])}
                      className="rounded-lg border border-slate-300 dark:border-white/10 px-2.5 py-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <SoapBubbleButton
                  onClick={handleExportPng}
                  tint="rgb(14 165 233)"
                  opacity={0.92}
                  style={{ fontSize: 12 }}
                  className="w-full !min-h-[36px] font-semibold text-white whitespace-nowrap"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download High-Res PNG</span>
                </SoapBubbleButton>
              </div>
            ) : (
              <div className="optical-inset rounded-xl p-4 space-y-3">
                <div>
                  <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                    Video Aspect Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['16:9', '9:16'] as AspectMode[]).map((ar) => (
                      <button
                        key={ar}
                        onClick={() => setAspect(ar)}
                        className={`py-1.5 rounded-lg border font-mono text-[11px] cursor-pointer ${
                          aspect === ar
                            ? 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-900 dark:border-fuchsia-400/60 dark:bg-fuchsia-500/20 dark:text-white font-semibold'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {ar === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                    Motion Dynamics
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['stream', 'pulse', 'zoom'] as MotionStyle[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMotionStyle(m)}
                        className={`py-1.5 rounded-lg border capitalize text-[11px] cursor-pointer ${
                          motionStyle === m
                            ? 'border-fuchsia-500/60 bg-fuchsia-500/15 text-fuchsia-900 dark:border-fuchsia-400/60 dark:bg-fuchsia-500/20 dark:text-white font-semibold'
                            : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <SoapBubbleButton
                  disabled={recording}
                  onClick={handleRenderWebmVideo}
                  tint="rgb(192 38 211)"
                  opacity={0.92}
                  style={{ fontSize: 12 }}
                  className="w-full !min-h-[36px] font-semibold text-white whitespace-nowrap"
                >
                  {recording ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  <span>{recording ? 'Encoding 4s WebM Clip...' : 'Record 4s Video Clip (WebM)'}</span>
                </SoapBubbleButton>

                {recordError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">{recordError}</p>
                )}

                {recordedVideoUrl && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
                    <video
                      src={recordedVideoUrl}
                      controls
                      loop
                      className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-black"
                    />
                    <a
                      href={recordedVideoUrl}
                      download={`cs-odyssey-${preset}-${aspect.replace(':', 'x')}.webm`}
                      className="w-full py-2 rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 font-semibold text-[11px] flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/25"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download WebM Video</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Canvas Viewport */}
          <div className="lg:col-span-8 optical-inset rounded-2xl p-3 flex items-center justify-center min-h-[360px]">
            {studioTab === 'diagram' ? (
              <canvas
                ref={diagramCanvasRef}
                width={880}
                height={500}
                onClick={handleCanvasStampClick}
                className="w-full h-auto rounded-xl border border-slate-300 dark:border-white/[0.08] cursor-crosshair shadow-xl"
                title="Click anywhere to stamp your label badge"
              />
            ) : (
              <canvas
                ref={animCanvasRef}
                width={animW}
                height={animH}
                className="max-w-full max-h-[540px] w-auto h-auto rounded-xl border border-slate-300 dark:border-white/[0.08] shadow-xl"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
