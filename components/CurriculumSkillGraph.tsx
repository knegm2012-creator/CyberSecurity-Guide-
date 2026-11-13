'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight, CheckCircle2, Circle, Download, Compass } from 'lucide-react';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { generateSingleStageMarkdown } from '@/lib/curriculum-export';
import { SoapBubbleButton } from './soap-bubble';

interface CurriculumSkillGraphProps {
  completedTopics: Record<string, boolean>;
  currentStageId: string;
  onOpenStage: (stageId: string) => void;
}

interface GraphNodeLayout {
  stageNumber: number;
  x: number;
  y: number;
  track: 'Foundations' | 'Infrastructure' | 'Systems & Security' | 'Theory & Capstone';
  prereqs: number[];
}

const GRAPH_LAYOUT: GraphNodeLayout[] = [
  // Column 0: Absolute Bedrock
  { stageNumber: 0, x: 70, y: 150, track: 'Foundations', prereqs: [] },

  // Column 1: Core Languages & Logic
  { stageNumber: 1, x: 240, y: 80, track: 'Foundations', prereqs: [0] },
  { stageNumber: 2, x: 240, y: 220, track: 'Foundations', prereqs: [0] },

  // Column 2: OS Shell & Tooling
  { stageNumber: 3, x: 410, y: 150, track: 'Infrastructure', prereqs: [1, 2] },

  // Column 3: Parallel Engineering Branches
  { stageNumber: 4, x: 580, y: 65, track: 'Infrastructure', prereqs: [3] },
  { stageNumber: 5, x: 580, y: 150, track: 'Infrastructure', prereqs: [1, 3] },
  { stageNumber: 6, x: 580, y: 235, track: 'Systems & Security', prereqs: [2, 3] },

  // Column 4: Specialization Languages & Low-Level
  { stageNumber: 8, x: 750, y: 65, track: 'Infrastructure', prereqs: [4, 5] },
  { stageNumber: 7, x: 750, y: 150, track: 'Systems & Security', prereqs: [6] },
  { stageNumber: 9, x: 750, y: 235, track: 'Systems & Security', prereqs: [6] },

  // Column 5: Security & Theory
  { stageNumber: 12, x: 920, y: 80, track: 'Theory & Capstone', prereqs: [1, 7] },
  { stageNumber: 10, x: 920, y: 220, track: 'Systems & Security', prereqs: [4, 5, 9] },

  // Column 6: Graduate Systems & Capstone
  { stageNumber: 13, x: 1090, y: 105, track: 'Theory & Capstone', prereqs: [7, 8, 12] },
  { stageNumber: 11, x: 1090, y: 205, track: 'Theory & Capstone', prereqs: [10, 12] },
];

export function CurriculumSkillGraph({
  completedTopics,
  currentStageId,
  onOpenStage,
}: CurriculumSkillGraphProps) {
  const initialNum = Number(currentStageId.replace('stage-', '')) || 0;
  const [selectedNumber, setSelectedNumber] = useState<number>(initialNum);

  const stageByNum = useMemo(() => {
    const map = new Map<number, (typeof STAGES_DATA)[number]>();
    STAGES_DATA.forEach((s) => map.set(s.number, s));
    return map;
  }, []);

  const nodeByNum = useMemo(() => {
    const map = new Map<number, GraphNodeLayout>();
    GRAPH_LAYOUT.forEach((n) => map.set(n.stageNumber, n));
    return map;
  }, []);

  const activeStage = stageByNum.get(selectedNumber) || STAGES_DATA[0];
  const activeNode = nodeByNum.get(selectedNumber) || GRAPH_LAYOUT[0];
  const activeDoneCount = activeStage.topics.filter((t) => completedTopics[t.id]).length;
  const activePct = Math.round((activeDoneCount / Math.max(activeStage.topics.length, 1)) * 100);

  const handleDownloadHandout = () => {
    const md = generateSingleStageMarkdown(activeStage.id);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs-odyssey-stage-${activeStage.number}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="optical-panel rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#050811]/70">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-sky-400" />
          <h2 className="font-display text-sm font-semibold text-white">
            Curriculum Competency Graph (Stages 0–13)
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
          <span>Click any node to inspect prerequisites</span>
          <span className="text-emerald-400">Complete</span>
          <span className="text-sky-400">Active Focus</span>
        </div>
      </div>

      {/* Interactive SVG DAG Viewport */}
      <div className="bg-[#03050b]/90 border-b border-white/[0.08] overflow-x-auto">
        <svg
          viewBox="0 0 1160 300"
          className="w-full min-w-[820px] h-[270px] select-none"
          role="img"
          aria-label="Interactive 14-Stage Computer Science Prerequisite Graph"
        >
          {/* Track Band Labels */}
          <text x="70" y="24" className="fill-slate-500 text-[10px] font-mono" textAnchor="middle">
            01. BEDROCK
          </text>
          <text x="240" y="24" className="fill-slate-500 text-[10px] font-mono" textAnchor="middle">
            02. CODE &amp; LOGIC
          </text>
          <text x="410" y="24" className="fill-slate-500 text-[10px] font-mono" textAnchor="middle">
            03. SHELL &amp; GIT
          </text>
          <text x="580" y="24" className="fill-slate-500 text-[10px] font-mono" textAnchor="middle">
            04. CORE SYSTEMS
          </text>
          <text x="750" y="24" className="fill-slate-500 text-[10px] font-mono" textAnchor="middle">
            05. LANGUAGES &amp; ASM
          </text>
          <text x="920" y="24" className="fill-slate-500 text-[10px] font-mono" textAnchor="middle">
            06. SECURITY &amp; DSA
          </text>
          <text x="1090" y="24" className="fill-slate-500 text-[10px] font-mono" textAnchor="middle">
            07. CAPSTONE
          </text>

          {/* Prerequisite Connectors */}
          {GRAPH_LAYOUT.map((node) =>
            node.prereqs.map((preNum) => {
              const from = nodeByNum.get(preNum);
              if (!from) return null;
              const highlighted =
                selectedNumber === node.stageNumber || selectedNumber === preNum;
              const midX = (from.x + node.x) / 2;
              return (
                <path
                  key={`${preNum}-${node.stageNumber}`}
                  d={`M ${from.x + 28} ${from.y} C ${midX} ${from.y}, ${midX} ${node.y}, ${node.x - 28} ${node.y}`}
                  fill="none"
                  stroke={highlighted ? '#38bdf8' : '#1e293b'}
                  strokeWidth={highlighted ? 2 : 1.5}
                  strokeOpacity={highlighted ? 0.95 : 0.85}
                />
              );
            })
          )}

          {/* Stage Nodes */}
          {GRAPH_LAYOUT.map((node) => {
            const st = stageByNum.get(node.stageNumber);
            if (!st) return null;
            const doneCount = st.topics.filter((t) => completedTopics[t.id]).length;
            const isComplete = doneCount === st.topics.length && st.topics.length > 0;
            const isSelected = selectedNumber === node.stageNumber;
            const isCurrent = st.id === currentStageId;
            const shortTitle = st.title.split(':')[0].slice(0, 14);

            return (
              <g
                key={node.stageNumber}
                onClick={() => setSelectedNumber(node.stageNumber)}
                className="cursor-pointer group"
              >
                <rect
                  x={node.x - 42}
                  y={node.y - 24}
                  width={84}
                  height={48}
                  rx={8}
                  fill={isSelected ? '#0b1830' : '#070b15'}
                  stroke={
                    isSelected
                      ? '#38bdf8'
                      : isComplete
                      ? '#10b981'
                      : isCurrent
                      ? '#0ea5e9'
                      : 'rgba(255,255,255,0.14)'
                  }
                  strokeWidth={isSelected ? 2 : 1.25}
                />
                <text
                  x={node.x}
                  y={node.y - 5}
                  textAnchor="middle"
                  className={`font-mono text-[11px] font-bold ${
                    isComplete
                      ? 'fill-emerald-400'
                      : isSelected || isCurrent
                      ? 'fill-sky-400'
                      : 'fill-slate-300'
                  }`}
                >
                  S{String(node.stageNumber).padStart(2, '0')} · {doneCount}/{st.topics.length}
                </text>
                <text
                  x={node.x}
                  y={node.y + 12}
                  textAnchor="middle"
                  className="font-sans text-[10px] fill-slate-400"
                >
                  {shortTitle}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Dossier Bar */}
      <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#070b14]/60">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-sky-400 font-semibold">
              Stage {activeStage.number} · {activeNode.track}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeStage.timeEstimate}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-slate-300 tabular-nums">
              {activePct === 100 ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <Circle className="h-3 w-3 text-slate-500" />
              )}
              {activeDoneCount}/{activeStage.topics.length} topics ({activePct}%)
            </span>
            {activeNode.prereqs.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Requires: {activeNode.prereqs.map((p) => `S${p}`).join(', ')}
                </span>
              </>
            )}
          </div>
          <h3 className="font-display text-base font-bold text-white">{activeStage.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{activeStage.goal}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadHandout}
            className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span>Stage Handout (.md)</span>
          </button>

          <SoapBubbleButton
            onClick={() => onOpenStage(activeStage.id)}
            tint="rgb(14 165 233)"
            opacity={0.92}
            style={{ fontSize: 12 }}
            className="!min-h-[34px] !px-4 text-xs font-semibold text-white whitespace-nowrap"
          >
            <span>Open Stage {activeStage.number}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </SoapBubbleButton>
        </div>
      </div>
    </div>
  );
}
