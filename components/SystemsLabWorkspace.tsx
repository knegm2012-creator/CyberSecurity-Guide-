'use client';

import React, { useState } from 'react';
import {
  Code2,
  Calculator,
  GitBranch,
  Cpu,
  Network,
  ArrowRight,
  RotateCcw,
  Gauge,
  Grid3X3,
  Orbit,
} from 'lucide-react';
import { CodePlayground } from '@/components/CodePlayground';
import { FoundationsStudio } from '@/components/FoundationsStudio';
import { GitSandbox } from '@/components/GitSandbox';
import { AlgorithmVisualizerLab } from '@/components/AlgorithmVisualizerLab';
import { FuturisticStudio } from '@/components/FuturisticStudio';
import { SavedCodeSnippet } from '@/hooks/use-odyssey-store';
import { SoapBubbleButton, SoapBubbleSlider } from '@/components/soap-bubble';

export type SystemsLabTab =
  | 'playground'
  | 'visualizer'
  | 'foundations'
  | 'git'
  | 'memory'
  | 'packet'
  | 'complexity'
  | 'studio';

interface SystemsLabWorkspaceProps {
  activeLab: SystemsLabTab;
  onSelectLab: (lab: SystemsLabTab) => void;
  playgroundKey: number;
  initialLanguage?: 'python' | 'c';
  initialCode?: string;
  savedSnippets?: SavedCodeSnippet[];
  onSaveSnippet?: (snippet: {
    title: string;
    language: 'python' | 'c';
    code: string;
    tags?: string[];
  }) => void;
  onDeleteSnippet?: (id: string) => void;
  onAwardXp?: (xp: number) => void;
  onNavigateToProjects?: () => void;
  onNavigateToStage?: () => void;
  onNavigateToShell?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAiMentor: (prompt?: string) => void;
}

const PACKET_STEPS = [
  {
    step: 1,
    title: 'Browser Initiation (Application Layer)',
    actor: 'Client Browser',
    action:
      'You enter "https://example.com". The browser checks its local DNS cache and discovers no cached IPv4 mapping.',
    payload: 'DNS Query: IN A example.com?',
    packetType: 'UDP / DNS (Port 53)',
  },
  {
    step: 2,
    title: 'Local Gateway Hop (Data Link Layer)',
    actor: 'Default Gateway Router',
    action:
      'The host resolves the gateway MAC via ARP and wraps the IP packet inside an Ethernet frame toward the ISP resolver.',
    payload: 'Ethernet Frame -> Gateway WAN interface',
    packetType: 'Ethernet + IPv4',
  },
  {
    step: 3,
    title: 'DNS Resolution (UDP Port 53)',
    actor: 'Recursive Resolver (1.1.1.1)',
    action: 'The resolver returns the authoritative A record IP address with its TTL.',
    payload: 'Answer: 93.184.216.34 (TTL: 300s)',
    packetType: 'DNS Response',
  },
  {
    step: 4,
    title: 'TCP 3-Way Handshake (Transport Layer)',
    actor: 'Client <-> 93.184.216.34:443',
    action:
      '1. Client sends SYN (seq=100)\n2. Server responds SYN-ACK (seq=500, ack=101)\n3. Client sends ACK (ack=501). Reliable stream ready.',
    payload: 'SYN -> SYN-ACK -> ACK',
    packetType: 'TCP (Port 443)',
  },
  {
    step: 5,
    title: 'TLS 1.3 Cryptographic Handshake',
    actor: 'Diffie-Hellman & X.509 Verification',
    action:
      'Client and server derive shared symmetric session keys and verify the certificate chain before sending HTTP data.',
    payload: 'ClientHello -> ServerHello -> Finished (AEAD Encrypted)',
    packetType: 'TLS 1.3',
  },
  {
    step: 6,
    title: 'HTTP Request & Response Stream',
    actor: 'Origin HTTP Server',
    action:
      'Client transmits GET / HTTP/1.1 inside the TLS record. Server streams HTTP/1.1 200 OK HTML bytes for DOM parsing.',
    payload: 'HTTP/1.1 200 OK (Content-Type: text/html)',
    packetType: 'HTTPS',
  },
];

const INITIAL_RAM_CELLS = [
  { address: '0x1000', varName: 'score', type: 'int', value: '42' },
  { address: '0x1004', varName: 'ptr_score', type: 'int*', value: '0x1000' },
  { address: '0x1008', varName: 'status', type: 'char', value: "'A'" },
  { address: '0x100C', varName: 'buffer[0]', type: 'char', value: "'H'" },
  { address: '0x100D', varName: 'buffer[1]', type: 'char', value: "'i'" },
  { address: '0x100E', varName: 'buffer[2]', type: 'char', value: "'\\0'" },
];

export function SystemsLabWorkspace({
  activeLab,
  onSelectLab,
  playgroundKey,
  initialLanguage = 'python',
  initialCode,
  savedSnippets,
  onSaveSnippet,
  onDeleteSnippet,
  onAwardXp,
  onNavigateToProjects,
  onNavigateToStage,
  onNavigateToShell,
  onOpenCommandPalette,
  onOpenAiMentor,
}: SystemsLabWorkspaceProps) {
  const [ramData, setRamData] = useState(INITIAL_RAM_CELLS);
  const [derefValue, setDerefValue] = useState('99');
  const [currentPacketStep, setCurrentPacketStep] = useState(0);
  const [inputSizeN, setInputSizeN] = useState(1024);

  const MEMORY_LATENCY_TIERS = [
    { tier: 'CPU Register', ns: 0.3, ratio: '1x', role: 'Immediate instruction operands on ALU' },
    { tier: 'L1 Data Cache (64B line)', ns: 1, ratio: '3x', role: 'Fastest SRAM per core (32-64 KB)' },
    { tier: 'L2 Cache', ns: 4, ratio: '13x', role: 'Core-private SRAM (256 KB - 1 MB)' },
    { tier: 'L3 Shared Cache', ns: 15, ratio: '50x', role: 'Shared LLC slice across CPU cores' },
    { tier: 'Main Memory (DRAM)', ns: 80, ratio: '266x', role: 'Gigabytes of volatile working storage' },
    { tier: 'NVMe SSD Random Read', ns: 25000, ratio: '83,000x', role: 'Persistent flash block page fetch' },
    { tier: 'Cross-Region Network RTT', ns: 50000000, ratio: '166,000,000x', role: 'Intercontinental TCP round trip' },
  ];

  const updateThroughPointer = () => {
    const clean = derefValue.trim() || '0';
    setRamData((prev) =>
      prev.map((cell) => (cell.address === '0x1000' ? { ...cell, value: clean } : cell))
    );
  };

  const resetRam = () => {
    setRamData(INITIAL_RAM_CELLS);
    setDerefValue('99');
  };

  const subTabs: Array<{ id: SystemsLabTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'playground', label: 'Code Playground', icon: Code2 },
    { id: 'visualizer', label: 'Algorithms & Graphs', icon: Grid3X3 },
    { id: 'foundations', label: 'Binary & Hardware', icon: Calculator },
    { id: 'git', label: 'Git DAG Sandbox', icon: GitBranch },
    { id: 'memory', label: 'RAM & Pointers', icon: Cpu },
    { id: 'packet', label: 'Packet Tracer', icon: Network },
    { id: 'complexity', label: 'Big-O & Cache', icon: Gauge },
    { id: 'studio', label: 'Spatial Studio', icon: Orbit },
  ];

  const curPacket = PACKET_STEPS[currentPacketStep];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Sub-navigation bar */}
      <div className="optical-panel rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-sky-400">
            Interactive Engineering Workbench
          </p>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5 [text-wrap:balance]">
            Systems Lab
          </h1>
        </div>

        <div className="optical-subnav flex items-center gap-1 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeLab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectLab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'text-slate-400 hover:text-slate-100 border border-transparent hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-views */}
      {activeLab === 'playground' && (
        <CodePlayground
          key={`${playgroundKey}-${initialLanguage}`}
          initialLanguage={initialLanguage}
          initialCode={initialCode}
          onOpenAiMentor={onOpenAiMentor}
          savedSnippets={savedSnippets}
          onSaveSnippet={onSaveSnippet}
          onDeleteSnippet={onDeleteSnippet}
        />
      )}

      {activeLab === 'visualizer' && <AlgorithmVisualizerLab />}

      {activeLab === 'foundations' && (
        <FoundationsStudio
          onOpenAiMentor={onOpenAiMentor}
          onAwardXp={onAwardXp}
        />
      )}

      {activeLab === 'git' && (
        <GitSandbox
          onOpenAiMentor={onOpenAiMentor}
          onNavigateToProjects={onNavigateToProjects}
        />
      )}

      {activeLab === 'studio' && (
        <FuturisticStudio
          onNavigateToStage={onNavigateToStage ?? onNavigateToProjects}
          onNavigateToVisualizer={() => onSelectLab('visualizer')}
          onNavigateToShell={onNavigateToShell}
          onOpenCommandPalette={onOpenCommandPalette}
        />
      )}

      {activeLab === 'memory' && (
        <div className="optical-panel rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
                Stage 6 · C Memory Model
              </span>
              <h2 className="font-display text-lg font-bold text-white mt-0.5">
                RAM Address Grid &amp; Pointer Dereferencing
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Memory in C behaves like an indexed array of numbered lockers. A scalar variable holds a value directly; a pointer holds another variable&apos;s address.
              </p>
            </div>
            <button
              onClick={resetRam}
              className="optical-card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 cursor-pointer self-start"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset RAM</span>
            </button>
          </div>

          <div className="optical-inset rounded-xl overflow-x-auto font-mono text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-white/[0.08] bg-white/[0.03] text-slate-400">
                <tr>
                  <th className="p-3">Address</th>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Value</th>
                  <th className="p-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {ramData.map((row) => {
                  const isTarget = row.address === '0x1000';
                  const isPointer = row.varName === 'ptr_score';

                  return (
                    <tr
                      key={row.address}
                      className={
                        isPointer
                          ? 'bg-indigo-500/10 text-indigo-300'
                          : isTarget
                          ? 'bg-sky-500/10 text-sky-300'
                          : 'text-slate-300'
                      }
                    >
                      <td className="p-3 font-semibold text-slate-400 tabular-nums">{row.address}</td>
                      <td className="p-3 font-semibold text-white">{row.varName}</td>
                      <td className="p-3 text-slate-400">{row.type}</td>
                      <td className="p-3 font-bold tabular-nums">{row.value}</td>
                      <td className="p-3 text-slate-400 font-sans text-[11px]">
                        {isPointer && 'Holds address 0x1000 (points to score)'}
                        {isTarget && 'Target int variable stored at 0x1000'}
                        {row.address === '0x100E' && 'Null terminator (\\0) marks C string boundary'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="optical-inset rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-white">Interactive Pointer Dereference Experiment</div>
            <p className="text-xs text-slate-400">
              Executing <code className="bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded text-sky-300">*ptr_score = value;</code> follows address <code className="text-sky-300">0x1000</code> and mutates <code className="text-sky-300">score</code> in place.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-slate-400">*ptr_score =</span>
              <input
                type="text"
                value={derefValue}
                onChange={(e) => setDerefValue(e.target.value)}
                className="w-24 rounded-lg border border-white/[0.1] bg-black/40 px-2.5 py-1.5 text-xs font-mono text-sky-300 focus:outline-none focus:border-sky-400/60"
              />
              <SoapBubbleButton
                onClick={updateThroughPointer}
                tint="rgb(14 165 233)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-semibold text-white"
              >
                Write via Pointer
              </SoapBubbleButton>
            </div>
          </div>
        </div>
      )}

      {activeLab === 'packet' && (
        <div className="optical-panel rounded-2xl p-6 space-y-6">
          <div>
            <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
              Stage 4 · Networking &amp; Web Protocols
            </span>
            <h2 className="font-display text-lg font-bold text-white mt-0.5">
              Packet Hop Journey: Click to Render
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Step through ARP resolution, DNS lookup, the TCP 3-way handshake, TLS 1.3 negotiation, and HTTPS delivery.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
            {PACKET_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentPacketStep(idx)}
                className={`flex-1 min-w-[130px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currentPacketStep === idx
                    ? 'border-sky-400/50 bg-sky-500/15 text-white shadow-[0_0_20px_-8px_rgba(56,189,248,0.45),inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'optical-card text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono text-sky-400 tabular-nums">HOP 0{s.step}</div>
                <div className="text-xs font-semibold truncate mt-0.5">{s.actor}</div>
              </button>
            ))}
          </div>

          <div className="optical-inset rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono bg-sky-500/15 text-sky-300 border border-sky-400/35 px-2.5 py-0.5 rounded-md font-semibold tabular-nums">
                  Step {curPacket.step} / {PACKET_STEPS.length}
                </span>
                <span className="text-sm font-semibold text-white">{curPacket.title}</span>
              </div>
              <span className="text-xs font-mono text-slate-300 border border-white/[0.1] bg-white/[0.03] px-2.5 py-0.5 rounded-md">
                {curPacket.packetType}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-mono text-slate-500">Network Node</div>
              <div className="text-xs font-semibold text-sky-300">{curPacket.actor}</div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pt-1">
                {curPacket.action}
              </p>
            </div>

            <div className="rounded-xl bg-black/45 border border-white/[0.08] p-3.5 font-mono text-xs">
              <span className="text-slate-500 text-[11px]">Wire Frame / Payload</span>
              <div className="mt-1 text-emerald-400 font-semibold">{curPacket.payload}</div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                disabled={currentPacketStep === 0}
                onClick={() => setCurrentPacketStep((p) => Math.max(0, p - 1))}
                className="optical-card px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 disabled:opacity-35 cursor-pointer"
              >
                Previous Hop
              </button>
              <SoapBubbleButton
                disabled={currentPacketStep === PACKET_STEPS.length - 1}
                onClick={() => setCurrentPacketStep((p) => Math.min(PACKET_STEPS.length - 1, p + 1))}
                tint="rgb(14 165 233)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-semibold text-white disabled:opacity-35"
              >
                <span>Next Hop</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </SoapBubbleButton>
            </div>
          </div>
        </div>
      )}

      {activeLab === 'complexity' && (
        <div className="space-y-6">
          <div className="optical-panel rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
                  Stage 12 · Asymptotics &amp; Microarchitecture
                </span>
                <h2 className="font-display text-lg font-bold text-white mt-0.5">
                  Big-O Growth Calculator &amp; Latency Hierarchy
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Compare asymptotic operation growth as input elements scale and contrast CPU cache vs DRAM vs NVMe disk vs network round-trip latency.
                </p>
              </div>
              <div className="optical-inset font-mono text-xs rounded-xl px-3.5 py-2 tabular-nums">
                Input Size: <strong className="text-sky-400">N = {inputSizeN.toLocaleString()} items</strong>
              </div>
            </div>

            <div className="optical-inset space-y-2 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Input Elements: <strong className="text-sky-300 tabular-nums">{inputSizeN.toLocaleString()} items</strong></span>
                <span className="text-slate-400">Range: 10 — 50,000</span>
              </div>
              <div className="py-1">
                <SoapBubbleSlider
                  value={inputSizeN}
                  min={10}
                  max={50000}
                  step={50}
                  onValueChange={setInputSizeN}
                  label="Input Elements (N)"
                  from="#38bdf8"
                  to="#a855f7"
                  scale={0.75}
                />
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: 'O(1) — Hash Lookup',
                  ops: 1,
                  color: 'bg-emerald-400',
                  example: 'Dictionary get, array index read',
                },
                {
                  name: 'O(log n) — Binary Search / Balanced Tree',
                  ops: Math.max(1, Math.round(Math.log2(inputSizeN))),
                  color: 'bg-sky-400',
                  example: 'Binary search, B-Tree point lookup',
                },
                {
                  name: 'O(n) — Linear Scan',
                  ops: inputSizeN,
                  color: 'bg-sky-500',
                  example: 'Single loop, unsliced copy',
                },
                {
                  name: 'O(n log n) — Merge / Timsort',
                  ops: Math.round(inputSizeN * Math.log2(inputSizeN)),
                  color: 'bg-amber-400',
                  example: 'Comparison sort, FFT, spatial divide',
                },
                {
                  name: 'O(n^2) — Nested Pair Loop',
                  ops: inputSizeN * inputSizeN,
                  color: 'bg-rose-400',
                  example: 'All-pairs brute force, naive bubble sort',
                },
              ].map((row) => {
                const maxLog = Math.log10(50000 * 50000 + 1);
                const widthPct = Math.max(2, Math.min(100, (Math.log10(row.ops + 1) / maxLog) * 100));
                const estMs = (row.ops * 1e-6).toFixed(row.ops > 100000 ? 1 : 4);
                return (
                  <div key={row.name} className="optical-inset rounded-xl p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono font-semibold text-white">{row.name}</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {row.ops.toLocaleString()} ops (~{estMs} ms @ 1ns/op)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full ${row.color} transition-all duration-200`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400">{row.example}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="optical-panel rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-white">Hardware Memory Latency Hierarchy</h3>
              <p className="text-xs text-slate-400 mt-1">
                Every Systems Engineer knows numbers every programmer should internalize: a single DRAM miss costs ~80 L1 hits, and an SSD read costs thousands of DRAM cycles.
              </p>
            </div>
            <div className="optical-inset rounded-xl overflow-x-auto font-mono text-xs">
              <table className="w-full text-left">
                <thead className="border-b border-white/[0.08] bg-white/[0.03] text-slate-400">
                  <tr>
                    <th className="p-3">Storage Tier</th>
                    <th className="p-3">Typical Latency</th>
                    <th className="p-3">Relative Cost</th>
                    <th className="p-3">Engineering Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {MEMORY_LATENCY_TIERS.map((tier) => (
                    <tr key={tier.tier} className="text-slate-200">
                      <td className="p-3 font-semibold text-white">{tier.tier}</td>
                      <td className="p-3 text-sky-400 tabular-nums">
                        {tier.ns >= 1000000
                          ? `${(tier.ns / 1000000).toLocaleString()} ms`
                          : tier.ns >= 1000
                          ? `${(tier.ns / 1000).toLocaleString()} us`
                          : `${tier.ns} ns`}
                      </td>
                      <td className="p-3 text-amber-400 tabular-nums">{tier.ratio}</td>
                      <td className="p-3 font-sans text-slate-400">{tier.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
