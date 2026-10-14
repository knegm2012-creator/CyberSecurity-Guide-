'use client';

import React, { useState } from 'react';
import { Cpu, Binary, Network, ArrowRight, Play, RotateCcw, Check, Sparkles, Calculator, GitBranch } from 'lucide-react';
import { FoundationsStudio } from './FoundationsStudio';
import { GitSandbox } from './GitSandbox';

interface ConceptLabsProps {
  onOpenAiMentor?: (prompt?: string) => void;
}

export function ConceptLabs({ onOpenAiMentor }: ConceptLabsProps) {
  const [activeLab, setActiveLab] = useState<'foundations' | 'git' | 'binary' | 'ram' | 'packet'>('foundations');

  // --- 1. BINARY & HEX FLIPPER STATE ---
  const [bits, setBits] = useState<number[]>([0, 0, 1, 0, 1, 0, 1, 0]); // 42 in binary
  const bitWeights = [128, 64, 32, 16, 8, 4, 2, 1];

  const decimalVal = bits.reduce((acc, bit, idx) => acc + bit * bitWeights[idx], 0);
  const hexVal = '0x' + decimalVal.toString(16).toUpperCase().padStart(2, '0');
  const asciiChar = decimalVal >= 32 && decimalVal <= 126 ? String.fromCharCode(decimalVal) : '(non-printable)';

  const toggleBit = (idx: number) => {
    setBits((prev) => {
      const next = [...prev];
      next[idx] = next[idx] === 1 ? 0 : 1;
      return next;
    });
  };

  const setPreset = (num: number) => {
    const binaryStr = (num >>> 0).toString(2).padStart(8, '0').slice(-8);
    setBits(binaryStr.split('').map(Number));
  };

  // --- 2. RAM & POINTER LAB STATE ---
  const [ramData, setRamData] = useState([
    { address: '0x1000', varName: 'score', type: 'int', value: '42' },
    { address: '0x1004', varName: 'ptr_score', type: 'int*', value: '0x1000' },
    { address: '0x1008', varName: 'status', type: 'char', value: "'A'" },
    { address: '0x100C', varName: 'buffer[0]', type: 'char', value: "'H'" },
    { address: '0x100D', varName: 'buffer[1]', type: 'char', value: "'i'" },
    { address: '0x100E', varName: 'buffer[2]', type: 'char', value: "'\\0'" },
  ]);
  const [derefValue, setDerefValue] = useState('99');

  const updateThroughPointer = () => {
    setRamData((prev) =>
      prev.map((cell) => (cell.address === '0x1000' ? { ...cell, value: derefValue } : cell))
    );
  };

  // --- 3. PACKET JOURNEY ANIMATOR STATE ---
  const packetSteps = [
    {
      step: 1,
      title: 'Browser Initiation (Application Layer)',
      actor: 'Laptop (Browser)',
      action: 'You type "https://example.com". The browser checks its local cache and discovers it does not know the IP address.',
      payload: 'DNS Query: "What is the IPv4 address for example.com?"',
      packetType: 'UDP / DNS (Port 53)',
    },
    {
      step: 2,
      title: 'Local Gateway Hop (Data Link Layer)',
      actor: 'Home Wi-Fi Router (Default Gateway)',
      action: 'Laptop broadcasts an ARP request to find the router’s MAC address. The packet is forwarded out to your ISP resolver.',
      payload: 'Frames with MAC: AA:BB:CC:DD:EE:FF -> Router WAN interface',
      packetType: 'Ethernet + IP Routing',
    },
    {
      step: 3,
      title: 'DNS Resolution (UDP Port 53)',
      actor: 'ISP / Cloudflare DNS (1.1.1.1)',
      action: 'DNS server responds with an A Record: "example.com is at 93.184.216.34".',
      payload: 'Answer: 93.184.216.34 (TTL: 300s)',
      packetType: 'DNS Response',
    },
    {
      step: 4,
      title: 'TCP 3-Way Handshake (Transport Layer)',
      actor: 'Client <---> Server (93.184.216.34:443)',
      action: '1. Client sends SYN (seq=100)\n2. Server responds SYN-ACK (seq=500, ack=101)\n3. Client sends ACK (ack=501). Reliable TCP pipe established!',
      payload: 'SYN -> SYN-ACK -> ACK sequence established',
      packetType: 'TCP (Port 443)',
    },
    {
      step: 5,
      title: 'TLS 1.3 Cryptographic Handshake',
      actor: 'Client & Server Cryptography',
      action: 'Client and server exchange cryptographic keys (Diffie-Hellman) and verify the server’s TLS digital certificate. All subsequent traffic is encrypted.',
      payload: 'TLS ClientHello -> ServerHello -> Finished (Encrypted Session Key)',
      packetType: 'TLS Handshake',
    },
    {
      step: 6,
      title: 'HTTP GET Request & Response',
      actor: 'Web Server',
      action: 'Client sends "GET / HTTP/1.1". Server responds with "HTTP/1.1 200 OK" and streams the HTML bytes. The browser parses the DOM and renders!',
      payload: 'HTTP/1.1 200 OK (Content-Type: text/html, length: 1256 bytes)',
      packetType: 'HTTPS Data Stream',
    },
  ];

  const [currentPacketStep, setCurrentPacketStep] = useState(0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interactive Concept Sandboxes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual interactive simulators designed to build rock-solid mental models for Grade 9 students.
          </p>
        </div>

        {/* Lab Switcher Tabs */}
        <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 gap-1 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveLab('foundations')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeLab === 'foundations' ? 'bg-cyan-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Math & Foundations Studio</span>
          </button>
          <button
            onClick={() => setActiveLab('git')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeLab === 'git' ? 'bg-cyan-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>🌿 Git Sandbox</span>
          </button>
          <button
            onClick={() => setActiveLab('binary')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeLab === 'binary' ? 'bg-cyan-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="h-3.5 w-3.5" />
            <span>8-Bit Flipper</span>
          </button>
          <button
            onClick={() => setActiveLab('ram')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeLab === 'ram' ? 'bg-cyan-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>RAM & Pointer Grid</span>
          </button>
          <button
            onClick={() => setActiveLab('packet')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeLab === 'packet' ? 'bg-cyan-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Packet Hop Journey</span>
          </button>
        </div>
      </div>

      {/* LAB 0: FOUNDATIONS STUDIO */}
      {activeLab === 'foundations' && (
        <FoundationsStudio onOpenAiMentor={onOpenAiMentor || (() => {})} />
      )}

      {/* LAB 0.5: GIT SANDBOX */}
      {activeLab === 'git' && (
        <GitSandbox onOpenAiMentor={onOpenAiMentor} />
      )}

      {/* LAB 1: BINARY & HEX FLIPPER */}
      {activeLab === 'binary' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Stage 2 Lab · Digital Logic
            </span>
            <h3 className="text-lg font-bold text-white mt-1">8-Bit Interactive Flipper & Converter</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Click each bit to toggle between 0 and 1. Watch how the powers of 2 sum up to create decimal numbers, hex codes, and ASCII letters!
            </p>
          </div>

          {/* Interactive Bit Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-4">
            {bits.map((bit, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-[11px] font-mono text-slate-400 mb-1.5 font-bold">
                  2^{7 - idx} ({bitWeights[idx]})
                </span>
                <button
                  onClick={() => toggleBit(idx)}
                  className={`h-16 w-12 sm:h-20 sm:w-16 rounded-xl border-2 font-mono text-2xl sm:text-3xl font-extrabold flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-lg ${
                    bit === 1
                      ? 'border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-cyan-950/50'
                      : 'border-slate-800 bg-slate-950 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  {bit}
                </button>
              </div>
            ))}
          </div>

          {/* Live Conversions Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-xs font-mono text-slate-400">DECIMAL (BASE 10)</div>
              <div className="text-3xl font-mono font-bold text-cyan-400 mt-1 tabular-nums">
                {decimalVal}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Sum of active powers of 2
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-xs font-mono text-slate-400">HEXADECIMAL (BASE 16)</div>
              <div className="text-3xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                {hexVal}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Used in memory & colors
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-xs font-mono text-slate-400">ASCII CHARACTER</div>
              <div className="text-3xl font-mono font-bold text-amber-400 mt-1">
                {asciiChar}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Text representation of byte
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-mono">Try common bytes:</span>
            {[0, 1, 42, 65, 97, 127, 255].map((val) => (
              <button
                key={val}
                onClick={() => setPreset(val)}
                className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                {val} {val === 65 ? "('A')" : val === 97 ? "('a')" : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LAB 2: RAM & POINTER GRID */}
      {activeLab === 'ram' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Stage 6 Lab · C Memory Foundations
            </span>
            <h3 className="text-lg font-bold text-white mt-1">RAM Address Grid & Pointer Dereferencing</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Memory in C is like a numbered shelf of lockers. A regular variable stores a value directly; a pointer stores the locker address of another variable!
            </p>
          </div>

          {/* Memory Visualizer Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="p-3">RAM Address</th>
                  <th className="p-3">Variable Name</th>
                  <th className="p-3">Data Type</th>
                  <th className="p-3">Stored Value</th>
                  <th className="p-3">Memory Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ramData.map((row) => {
                  const isTarget = row.address === '0x1000';
                  const isPointer = row.varName === 'ptr_score';

                  return (
                    <tr
                      key={row.address}
                      className={
                        isPointer
                          ? 'bg-indigo-950/20 text-indigo-300'
                          : isTarget
                          ? 'bg-cyan-950/20 text-cyan-300'
                          : 'text-slate-300'
                      }
                    >
                      <td className="p-3 font-bold text-slate-400">{row.address}</td>
                      <td className="p-3 font-semibold text-white">{row.varName}</td>
                      <td className="p-3 text-slate-400">{row.type}</td>
                      <td className="p-3 font-bold">{row.value}</td>
                      <td className="p-3 text-slate-400 font-sans text-[11px]">
                        {isPointer && 'Holds address 0x1000 (points to score)'}
                        {isTarget && 'Target integer variable in memory'}
                        {row.address === '0x100E' && 'Null terminator (\\0) marks string end'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Interactive Dereferencing Action */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="text-xs font-bold text-white">Interactive C Pointer Experiment:</div>
            <p className="text-xs text-slate-300">
              In C, typing <code className="bg-slate-900 px-1 py-0.5 rounded text-cyan-400">*ptr_score = newValue;</code> follows the pointer to address <code className="text-cyan-400">0x1000</code> and rewrites the value of <code className="text-cyan-400">score</code>!
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">*ptr_score = </span>
              <input
                type="text"
                value={derefValue}
                onChange={(e) => setDerefValue(e.target.value)}
                className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
              />
              <button
                onClick={updateThroughPointer}
                className="rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors cursor-pointer"
              >
                Execute Dereference & Update RAM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAB 3: PACKET JOURNEY ANIMATOR */}
      {activeLab === 'packet' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Stage 4 Lab · Networking & Web Protocols
            </span>
            <h3 className="text-lg font-bold text-white mt-1">The Journey of a Packet: From Click to Render</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              What actually happens when you type a website name into your browser? Trace the packet through routers, DNS resolvers, handshakes, and encryption!
            </p>
          </div>

          {/* Step Timeline Indicator */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
            {packetSteps.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentPacketStep(idx)}
                className={`flex-1 min-w-[120px] p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  currentPacketStep === idx
                    ? 'border-cyan-500 bg-cyan-950/60 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] font-mono text-cyan-400">STEP 0{s.step}</div>
                <div className="text-xs font-bold truncate mt-0.5">{s.actor}</div>
              </button>
            ))}
          </div>

          {/* Step Detail Card */}
          {(() => {
            const cur = packetSteps[currentPacketStep];
            return (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-bold">
                      Step {cur.step} of 6
                    </span>
                    <span className="text-sm font-bold text-white">{cur.title}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                    {cur.packetType}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-400">Actor in Action:</div>
                  <div className="text-xs font-semibold text-cyan-300">{cur.actor}</div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{cur.action}</p>
                </div>

                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs">
                  <span className="text-slate-400 text-[11px]">Wire Payload / Inspection Data:</span>
                  <div className="mt-1 text-emerald-400 font-semibold">{cur.payload}</div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={currentPacketStep === 0}
                    onClick={() => setCurrentPacketStep((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded text-xs font-semibold border border-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    Previous Hop
                  </button>
                  <button
                    disabled={currentPacketStep === packetSteps.length - 1}
                    onClick={() => setCurrentPacketStep((p) => Math.min(packetSteps.length - 1, p + 1))}
                    className="flex items-center gap-1 px-4 py-1.5 rounded text-xs font-semibold bg-cyan-600 text-white disabled:opacity-30 hover:bg-cyan-500 cursor-pointer"
                  >
                    <span>Next Hop</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
