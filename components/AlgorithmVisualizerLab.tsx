'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  SlidersHorizontal,
  GitCommitHorizontal,
  Grid3X3,
} from 'lucide-react';
import { SoapBubbleButton, SoapBubbleSlider } from '@/components/soap-bubble';

type LabMode = 'sorting' | 'pathfinding';
type SortAlgo = 'merge' | 'quick' | 'insertion' | 'bubble';
type PathAlgo = 'dijkstra' | 'bfs' | 'dfs';

interface SortStep {
  values: number[];
  comparing: number[];
  writing: number[];
  sorted: number[];
  note: string;
}

function buildSortSteps(initial: number[], algo: SortAlgo): SortStep[] {
  const arr = [...initial];
  const steps: SortStep[] = [
    {
      values: [...arr],
      comparing: [],
      writing: [],
      sorted: [],
      note: `Initialized ${arr.length} unsorted integers.`,
    },
  ];
  const n = arr.length;

  if (algo === 'bubble') {
    const sorted: number[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        steps.push({
          values: [...arr],
          comparing: [j, j + 1],
          writing: [],
          sorted: [...sorted],
          note: `Comparing index ${j} (${arr[j]}) and ${j + 1} (${arr[j + 1]})`,
        });
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          steps.push({
            values: [...arr],
            comparing: [],
            writing: [j, j + 1],
            sorted: [...sorted],
            note: `Swapped ${arr[j + 1]} <-> ${arr[j]}`,
          });
        }
      }
      sorted.push(n - i - 1);
    }
    steps.push({
      values: [...arr],
      comparing: [],
      writing: [],
      sorted: Array.from({ length: n }, (_, i) => i),
      note: 'Bubble Sort complete.',
    });
  } else if (algo === 'insertion') {
    const sorted = [0];
    for (let i = 1; i < n; i++) {
      const key = arr[i];
      let j = i - 1;
      while (j >= 0 && arr[j] > key) {
        steps.push({
          values: [...arr],
          comparing: [j, j + 1],
          writing: [],
          sorted: [...sorted],
          note: `Shifting ${arr[j]} right to insert ${key}`,
        });
        arr[j + 1] = arr[j];
        steps.push({
          values: [...arr],
          comparing: [],
          writing: [j + 1],
          sorted: [...sorted],
          note: `Wrote ${arr[j]} at index ${j + 1}`,
        });
        j--;
      }
      arr[j + 1] = key;
      sorted.push(i);
      steps.push({
        values: [...arr],
        comparing: [],
        writing: [j + 1],
        sorted: [...sorted],
        note: `Placed key ${key} at sorted index ${j + 1}`,
      });
    }
    steps.push({
      values: [...arr],
      comparing: [],
      writing: [],
      sorted: Array.from({ length: n }, (_, i) => i),
      note: 'Insertion Sort complete.',
    });
  } else if (algo === 'quick') {
    const fixed = new Set<number>();
    const partition = (lo: number, hi: number): number => {
      const pivot = arr[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) {
        steps.push({
          values: [...arr],
          comparing: [j, hi],
          writing: [],
          sorted: Array.from(fixed),
          note: `Comparing arr[${j}]=${arr[j]} against pivot ${pivot}`,
        });
        if (arr[j] <= pivot) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push({
            values: [...arr],
            comparing: [],
            writing: [i, j],
            sorted: Array.from(fixed),
            note: `Partition swap index ${i} <-> ${j}`,
          });
          i++;
        }
      }
      [arr[i], arr[hi]] = [arr[hi], arr[i]];
      fixed.add(i);
      steps.push({
        values: [...arr],
        comparing: [],
        writing: [i, hi],
        sorted: Array.from(fixed),
        note: `Pivot ${pivot} locked at final index ${i}`,
      });
      return i;
    };
    const qsort = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) {
        fixed.add(lo);
        return;
      }
      const p = partition(lo, hi);
      qsort(lo, p - 1);
      qsort(p + 1, hi);
    };
    qsort(0, n - 1);
    steps.push({
      values: [...arr],
      comparing: [],
      writing: [],
      sorted: Array.from({ length: n }, (_, i) => i),
      note: 'Quicksort partition tree complete.',
    });
  } else {
    const mergeSort = (lo: number, hi: number) => {
      if (lo >= hi) return;
      const mid = Math.floor((lo + hi) / 2);
      mergeSort(lo, mid);
      mergeSort(mid + 1, hi);
      const left = arr.slice(lo, mid + 1);
      const right = arr.slice(mid + 1, hi + 1);
      let i = 0;
      let j = 0;
      let k = lo;
      while (i < left.length && j < right.length) {
        steps.push({
          values: [...arr],
          comparing: [lo + i, mid + 1 + j],
          writing: [],
          sorted: [],
          note: `Merging subarrays [${lo}..${mid}] and [${mid + 1}..${hi}]`,
        });
        if (left[i] <= right[j]) {
          arr[k] = left[i++];
        } else {
          arr[k] = right[j++];
        }
        steps.push({
          values: [...arr],
          comparing: [],
          writing: [k],
          sorted: [],
          note: `Wrote ${arr[k]} into merged slot ${k}`,
        });
        k++;
      }
      while (i < left.length) {
        arr[k] = left[i++];
        steps.push({
          values: [...arr],
          comparing: [],
          writing: [k],
          sorted: [],
          note: `Flushed left remainder ${arr[k]} to index ${k}`,
        });
        k++;
      }
      while (j < right.length) {
        arr[k] = right[j++];
        steps.push({
          values: [...arr],
          comparing: [],
          writing: [k],
          sorted: [],
          note: `Flushed right remainder ${arr[k]} to index ${k}`,
        });
        k++;
      }
    };
    mergeSort(0, n - 1);
    steps.push({
      values: [...arr],
      comparing: [],
      writing: [],
      sorted: Array.from({ length: n }, (_, i) => i),
      note: 'Merge Sort O(n log n) complete.',
    });
  }
  return steps;
}

const ROWS = 8;
const COLS = 14;
const START_CELL = 1 * COLS + 1;
const TARGET_CELL = 6 * COLS + 12;

interface PathStep {
  visited: number[];
  frontier: number[];
  path: number[];
  note: string;
}

function createDeterministicTerrain(): Record<number, 'wall' | 'weight'> {
  const terrain: Record<number, 'wall' | 'weight'> = {};
  const walls = [
    1 * COLS + 5,
    2 * COLS + 5,
    3 * COLS + 5,
    4 * COLS + 5,
    3 * COLS + 9,
    4 * COLS + 9,
    5 * COLS + 9,
    6 * COLS + 9,
  ];
  const weights = [0 * COLS + 5, 5 * COLS + 5, 1 * COLS + 9, 2 * COLS + 9];
  walls.forEach((idx) => (terrain[idx] = 'wall'));
  weights.forEach((idx) => (terrain[idx] = 'weight'));
  return terrain;
}

function buildPathSteps(
  terrain: Record<number, 'wall' | 'weight'>,
  algo: PathAlgo
): PathStep[] {
  const steps: PathStep[] = [];
  const visitedOrder: number[] = [];
  const visitedSet = new Set<number>();
  const parent: Record<number, number> = {};
  const dist: Record<number, number> = { [START_CELL]: 0 };

  const neighborsOf = (idx: number) => {
    const r = Math.floor(idx / COLS);
    const c = idx % COLS;
    const dirs = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    const res: number[] = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        const nIdx = nr * COLS + nc;
        if (terrain[nIdx] !== 'wall') res.push(nIdx);
      }
    }
    return res;
  };

  let found = false;

  if (algo === 'dfs') {
    const stack: number[] = [START_CELL];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (visitedSet.has(cur)) continue;
      visitedSet.add(cur);
      visitedOrder.push(cur);
      steps.push({
        visited: [...visitedOrder],
        frontier: [...stack],
        path: [],
        note: `DFS popping node (${Math.floor(cur / COLS)}, ${cur % COLS})`,
      });
      if (cur === TARGET_CELL) {
        found = true;
        break;
      }
      for (const nxt of neighborsOf(cur)) {
        if (!visitedSet.has(nxt)) {
          if (parent[nxt] === undefined) parent[nxt] = cur;
          stack.push(nxt);
        }
      }
    }
  } else if (algo === 'bfs') {
    const queue: number[] = [START_CELL];
    const seen = new Set<number>([START_CELL]);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      visitedOrder.push(cur);
      steps.push({
        visited: [...visitedOrder],
        frontier: [...queue],
        path: [],
        note: `BFS dequeuing ring node (${Math.floor(cur / COLS)}, ${cur % COLS})`,
      });
      if (cur === TARGET_CELL) {
        found = true;
        break;
      }
      for (const nxt of neighborsOf(cur)) {
        if (!seen.has(nxt)) {
          seen.add(nxt);
          parent[nxt] = cur;
          queue.push(nxt);
        }
      }
    }
  } else {
    const pq: Array<{ node: number; cost: number }> = [{ node: START_CELL, cost: 0 }];
    while (pq.length > 0) {
      pq.sort((a, b) => a.cost - b.cost);
      const { node: cur, cost } = pq.shift()!;
      if (visitedSet.has(cur)) continue;
      visitedSet.add(cur);
      visitedOrder.push(cur);
      steps.push({
        visited: [...visitedOrder],
        frontier: pq.map((x) => x.node),
        path: [],
        note: `Dijkstra settling (${Math.floor(cur / COLS)}, ${cur % COLS}) with min cost ${cost}`,
      });
      if (cur === TARGET_CELL) {
        found = true;
        break;
      }
      for (const nxt of neighborsOf(cur)) {
        const edgeCost = terrain[nxt] === 'weight' ? 5 : 1;
        const cand = cost + edgeCost;
        if (cand < (dist[nxt] ?? Infinity)) {
          dist[nxt] = cand;
          parent[nxt] = cur;
          pq.push({ node: nxt, cost: cand });
        }
      }
    }
  }

  const finalPath: number[] = [];
  if (found) {
    let curr: number | undefined = TARGET_CELL;
    while (curr !== undefined) {
      finalPath.unshift(curr);
      if (curr === START_CELL) break;
      curr = parent[curr];
    }
    steps.push({
      visited: [...visitedOrder],
      frontier: [],
      path: finalPath,
      note:
        algo === 'dijkstra'
          ? `Path found across ${finalPath.length - 1} steps (total weighted cost: ${dist[TARGET_CELL]}).`
          : `Path found across ${finalPath.length - 1} hops.`,
    });
  } else {
    steps.push({
      visited: [...visitedOrder],
      frontier: [],
      path: [],
      note: 'No reachable path: Target is completely walled off.',
    });
  }

  return steps;
}

function generateArray(size: number): number[] {
  return Array.from({ length: size }, (_, i) => {
    const raw = ((i * 37 + 19) % 85) + 12;
    return raw;
  });
}

export function AlgorithmVisualizerLab() {
  const [mode, setMode] = useState<LabMode>('sorting');

  // Sorting state
  const [sortAlgo, setSortAlgo] = useState<SortAlgo>('merge');
  const [arraySize, setArraySize] = useState(20);
  const [sortSteps, setSortSteps] = useState<SortStep[]>(() =>
    buildSortSteps(generateArray(20), 'merge')
  );
  const [sortStepIdx, setSortStepIdx] = useState(0);

  // Pathfinding state
  const [pathAlgo, setPathAlgo] = useState<PathAlgo>('dijkstra');
  const [terrain, setTerrain] = useState<Record<number, 'wall' | 'weight'>>(() =>
    createDeterministicTerrain()
  );
  const [paintMode, setPaintMode] = useState<'wall' | 'weight'>('wall');
  const [pathSteps, setPathSteps] = useState<PathStep[]>(() =>
    buildPathSteps(createDeterministicTerrain(), 'dijkstra')
  );
  const [pathStepIdx, setPathStepIdx] = useState(0);

  // Playback shared controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(80);

  const rebuildSort = useCallback((size: number, algo: SortAlgo) => {
    const shuffled = Array.from(
      { length: size },
      () => Math.floor(Math.random() * 82) + 12
    );
    setSortSteps(buildSortSteps(shuffled, algo));
    setSortStepIdx(0);
    setIsPlaying(false);
  }, []);

  const rebuildPath = useCallback(
    (nextTerrain: Record<number, 'wall' | 'weight'>, algo: PathAlgo) => {
      setTerrain(nextTerrain);
      setPathSteps(buildPathSteps(nextTerrain, algo));
      setPathStepIdx(0);
      setIsPlaying(false);
    },
    []
  );

  // Async interval ticker for playback (only mutates state inside timer callback)
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (mode === 'sorting') {
        setSortStepIdx((prev) => {
          if (prev >= sortSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      } else {
        setPathStepIdx((prev) => {
          if (prev >= pathSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
    }, speedMs);
    return () => clearInterval(timer);
  }, [isPlaying, speedMs, mode, sortSteps.length, pathSteps.length]);

  const currentSort = sortSteps[sortStepIdx] || sortSteps[0];
  const currentPath = pathSteps[pathStepIdx] || pathSteps[0];
  const visitedSet = new Set(currentPath.visited);
  const frontierSet = new Set(currentPath.frontier);
  const pathSet = new Set(currentPath.path);

  const totalSteps = mode === 'sorting' ? sortSteps.length : pathSteps.length;
  const currentIdx = mode === 'sorting' ? sortStepIdx : pathStepIdx;

  const handleCellClick = (idx: number) => {
    if (idx === START_CELL || idx === TARGET_CELL) return;
    const next = { ...terrain };
    if (next[idx] === paintMode) {
      delete next[idx];
    } else {
      next[idx] = paintMode;
    }
    rebuildPath(next, pathAlgo);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switch */}
      <div className="optical-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
            Stage 12 · Live Algorithm Simulation Engine
          </span>
          <h2 className="font-display text-lg font-bold text-white mt-0.5 [text-wrap:balance]">
            Interactive Sorting &amp; Graph Pathfinding Visualizer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Step through divide-and-conquer sorting comparisons or edit obstacles and weighted terrain to watch BFS, DFS, and Dijkstra settle shortest paths.
          </p>
        </div>

        <div className="optical-subnav flex rounded-xl p-1 text-xs font-medium shrink-0 self-start">
          <button
            onClick={() => {
              setIsPlaying(false);
              setMode('sorting');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              mode === 'sorting'
                ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                : 'text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            <span>Sorting Visualizer</span>
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setMode('pathfinding');
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              mode === 'pathfinding'
                ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                : 'text-slate-400 hover:text-slate-100 border border-transparent'
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            <span>Graph Pathfinding</span>
          </button>
        </div>
      </div>

      {/* Two-Zone Education Sandbox Layout (Stage Left 8 cols, Control Deck Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Interactive Stage */}
        <section className="lg:col-span-8 optical-panel rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.08] bg-white/[0.03] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="text-white font-semibold">
              {mode === 'sorting'
                ? `Algorithm: ${sortAlgo.toUpperCase()} SORT`
                : `Solver: ${pathAlgo.toUpperCase()} GRAPH SEARCH`}
            </span>
            <span className="text-slate-400 tabular-nums">
              Step {currentIdx + 1} / {totalSteps}
            </span>
          </div>

          <div className="p-6 bg-[#040710]/70 space-y-5">
            {mode === 'sorting' ? (
              <>
                <div className="h-64 flex items-end gap-1.5 border-b border-white/[0.08] pb-2">
                  {currentSort.values.map((val, idx) => {
                    const isCmp = currentSort.comparing.includes(idx);
                    const isWrt = currentSort.writing.includes(idx);
                    const isDone = currentSort.sorted.includes(idx);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                        <div
                          className={`w-full rounded-t transition-all duration-100 ${
                            isWrt
                              ? 'bg-amber-400'
                              : isCmp
                              ? 'bg-sky-400'
                              : isDone
                              ? 'bg-emerald-400'
                              : 'bg-slate-600'
                          }`}
                          style={{ height: `${val}%` }}
                          title={`Index ${idx}: value ${val}`}
                        />
                        {arraySize <= 24 && (
                          <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                            {val}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Dual-coded state legend (no hue-only) */}
                <div className="flex flex-wrap items-center gap-5 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 bg-sky-400 rounded-xs" />
                    Comparing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 bg-amber-400 rounded-xs" />
                    Writing / Swap
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 bg-emerald-400 rounded-xs" />
                    Sorted Position
                  </span>
                </div>
              </>
            ) : (
              <>
                <div
                  className="grid gap-1 mx-auto max-w-2xl"
                  style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: ROWS * COLS }, (_, idx) => {
                    const isStart = idx === START_CELL;
                    const isTarget = idx === TARGET_CELL;
                    const kind = terrain[idx];
                    const isPath = pathSet.has(idx);
                    const isFrontier = frontierSet.has(idx);
                    const isVisited = visitedSet.has(idx);

                    let cellClass = 'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-600';
                    let symbol = '';
                    if (isStart) {
                      cellClass = 'bg-sky-500 text-slate-950 border-sky-400 font-bold';
                      symbol = 'S';
                    } else if (isTarget) {
                      cellClass = 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold';
                      symbol = 'T';
                    } else if (kind === 'wall') {
                      cellClass = 'bg-slate-700 border-slate-600 text-slate-300';
                      symbol = '#';
                    } else if (isPath) {
                      cellClass = 'bg-amber-400 text-slate-950 border-amber-300 font-bold';
                      symbol = '*';
                    } else if (isVisited) {
                      cellClass = 'bg-sky-500/25 border-sky-500/40 text-sky-300';
                      symbol = kind === 'weight' ? '5' : '.';
                    } else if (isFrontier) {
                      cellClass = 'bg-amber-500/20 border-amber-500/40 text-amber-300';
                      symbol = '+';
                    } else if (kind === 'weight') {
                      cellClass = 'bg-amber-950/40 border-amber-700/50 text-amber-400';
                      symbol = '5';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleCellClick(idx)}
                        className={`aspect-square rounded border text-[11px] font-mono flex items-center justify-center transition-colors cursor-pointer ${cellClass}`}
                        title={`Row ${Math.floor(idx / COLS)}, Col ${idx % COLS}`}
                      >
                        {symbol}
                      </button>
                    );
                  })}
                </div>

                {/* Dual-coded cell symbol legend */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
                  <span><strong className="text-sky-400">S</strong> Start</span>
                  <span><strong className="text-emerald-400">T</strong> Target</span>
                  <span><strong className="text-slate-300">#</strong> Wall</span>
                  <span><strong className="text-amber-400">5</strong> Weighted Mud (Cost 5)</span>
                  <span><strong className="text-sky-300">.</strong> Visited</span>
                  <span><strong className="text-amber-300">*</strong> Optimal Path</span>
                </div>
              </>
            )}

            {/* Live Step Annotation */}
            <div className="optical-inset rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200">
              {mode === 'sorting' ? currentSort.note : currentPath.note}
            </div>
          </div>
        </section>

        {/* Right Control Deck */}
        <aside className="lg:col-span-4 optical-panel rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <SlidersHorizontal className="h-4 w-4 text-sky-400" />
            <h3 className="font-display text-sm font-semibold text-white">Simulation Controls</h3>
          </div>

          {mode === 'sorting' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400">Algorithm</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {(
                    [
                      { id: 'merge', label: 'Merge Sort' },
                      { id: 'quick', label: 'Quick Sort' },
                      { id: 'insertion', label: 'Insertion' },
                      { id: 'bubble', label: 'Bubble Sort' },
                    ] as const
                  ).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSortAlgo(a.id);
                        setSortSteps(buildSortSteps(sortSteps[0].values, a.id));
                        setSortStepIdx(0);
                        setIsPlaying(false);
                      }}
                      className={`px-3 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
                        sortAlgo === a.id
                          ? 'border-sky-400/50 bg-sky-500/20 text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                          : 'optical-inset text-slate-300 hover:border-white/[0.14]'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Array Size</span>
                  <span className="text-sky-300 font-bold tabular-nums">{arraySize} items</span>
                </div>
                <div className="py-1">
                  <SoapBubbleSlider
                    value={arraySize}
                    min={8}
                    max={36}
                    step={2}
                    onValueChange={(nextSize) => {
                      setArraySize(nextSize);
                      rebuildSort(nextSize, sortAlgo);
                    }}
                    label="Array Size (items)"
                    from="#38bdf8"
                    to="#a855f7"
                    scale={0.7}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400">Traversal Strategy</span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(
                    [
                      { id: 'dijkstra', label: 'Dijkstra' },
                      { id: 'bfs', label: 'BFS' },
                      { id: 'dfs', label: 'DFS' },
                    ] as const
                  ).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setPathAlgo(a.id);
                        setPathSteps(buildPathSteps(terrain, a.id));
                        setPathStepIdx(0);
                        setIsPlaying(false);
                      }}
                      className={`px-2.5 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
                        pathAlgo === a.id
                          ? 'border-sky-400/50 bg-sky-500/20 text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                          : 'optical-inset text-slate-300 hover:border-white/[0.14]'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400">Grid Click Brush</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => setPaintMode('wall')}
                    className={`px-3 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
                      paintMode === 'wall'
                        ? 'border-sky-400/50 bg-sky-500/20 text-sky-200'
                        : 'optical-inset text-slate-300'
                    }`}
                  >
                    Place Wall (#)
                  </button>
                  <button
                    onClick={() => setPaintMode('weight')}
                    className={`px-3 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
                      paintMode === 'weight'
                        ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                        : 'optical-inset text-slate-300'
                    }`}
                  >
                    Weighted Mud (5)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Speed Slider */}
          <div className="space-y-1.5 pt-3 border-t border-white/[0.08]">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Step Delay</span>
              <span className="text-sky-300 font-bold tabular-nums">
                {speedMs} ms · {speedMs <= 40 ? 'Fast' : speedMs >= 160 ? 'Slow' : 'Medium'}
              </span>
            </div>
            <div className="py-1">
              <SoapBubbleSlider
                value={speedMs}
                min={20}
                max={240}
                step={20}
                onValueChange={setSpeedMs}
                label="Step Delay (ms)"
                from="#38bdf8"
                to="#6366f1"
                scale={0.7}
              />
            </div>
          </div>

          {/* Transport Controls */}
          <div className="grid grid-cols-3 gap-2 pt-2 items-center">
            <SoapBubbleButton
              onClick={() => setIsPlaying((p) => !p)}
              tint={isPlaying ? 'rgb(245 158 11)' : 'rgb(14 165 233)'}
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-3 font-semibold text-white justify-center"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </SoapBubbleButton>

            <button
              onClick={() => {
                setIsPlaying(false);
                if (mode === 'sorting') {
                  setSortStepIdx((p) => Math.min(sortSteps.length - 1, p + 1));
                } else {
                  setPathStepIdx((p) => Math.min(pathSteps.length - 1, p + 1));
                }
              }}
              className="optical-card inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 cursor-pointer"
            >
              <SkipForward className="h-3.5 w-3.5" />
              <span>Step</span>
            </button>

            <button
              onClick={() => {
                if (mode === 'sorting') {
                  rebuildSort(arraySize, sortAlgo);
                } else {
                  rebuildPath(createDeterministicTerrain(), pathAlgo);
                }
              }}
              className="optical-card inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
