'use client';

import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Terminal,
  Sparkles,
  Layers,
  Cpu,
  Network,
  Shield,
  BookOpen,
} from 'lucide-react';
import { SoapBubbleSearch } from '@/components/soap-bubble';
import {
  CHEAT_SHEET_DATA,
  CHEAT_SHEET_CATEGORIES,
  BIG_O_MATRIX,
  OSI_TCP_LAYER_MATRIX,
  HTTP_STATUS_REFERENCE,
  LINUX_PERMISSIONS_MATRIX,
  POWERS_OF_TWO_AND_LATENCY,
} from '@/lib/cheat-sheets-data';

interface CheatSheetsReferenceViewProps {
  onOpenAiMentor: (context?: string) => void;
  onOpenShell?: (command: string) => void;
}

export function CheatSheetsReferenceView({
  onOpenAiMentor,
  onOpenShell,
}: CheatSheetsReferenceViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMatrix, setActiveMatrix] = useState<
    'bigo' | 'osi' | 'http' | 'perms' | 'latency'
  >('bigo');

  const categories = ['All', ...CHEAT_SHEET_CATEGORIES];

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CHEAT_SHEET_DATA.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [search, selectedCategory]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="optical-panel rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-400 mb-1">
            <span>A–Z Engineering Syntax Encyclopedia</span>
            <span>·</span>
            <span className="tabular-nums">{CHEAT_SHEET_DATA.length} Cards · 13 Categories</span>
          </div>
          <h2 className="font-display text-xl font-bold text-white tracking-tight [text-wrap:balance]">
            Master Cheat Sheets &amp; Quick-Reference Matrices
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Production syntax for Linux, Pipes, Networking, Security, Git, Python, C, C++, Go, SQL, Docker/Kubernetes, Algorithms, and Legal Wargames.
          </p>
        </div>

        <div className="w-full lg:w-80">
          <SoapBubbleSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter syntax, flags, C++, Go, SQL, K8s..."
            style={{ fontSize: 12 }}
          />
        </div>
      </div>

      {/* Quick-Reference Engineering Matrices */}
      <section className="optical-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <h3 className="font-display text-sm font-semibold text-white">
              Core Systems Reference Matrices
            </h3>
          </div>

          <div className="optical-subnav flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar text-[11px] font-mono">
            {[
              { id: 'bigo' as const, label: 'Big-O Scaling', icon: Cpu },
              { id: 'osi' as const, label: 'OSI / TCP-IP', icon: Network },
              { id: 'http' as const, label: 'HTTP Status', icon: BookOpen },
              { id: 'perms' as const, label: 'Linux Octal rwx', icon: Shield },
              { id: 'latency' as const, label: 'Powers of 2 & Latency', icon: Cpu },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMatrix(tab.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
                  activeMatrix === tab.id
                    ? 'bg-sky-500/18 border-sky-400/35 text-sky-200 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeMatrix === 'bigo' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-white/[0.08] text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2 pr-4">Complexity</th>
                  <th className="py-2 pr-4">Growth Class</th>
                  <th className="py-2 pr-4">N = 1,000</th>
                  <th className="py-2 pr-4">N = 1,000,000</th>
                  <th className="py-2">Canonical Examples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {BIG_O_MATRIX.map((row) => (
                  <tr key={row.complexity} className="text-slate-300">
                    <td className="py-2.5 pr-4 font-bold text-cyan-300 whitespace-nowrap">{row.complexity}</td>
                    <td className="py-2.5 pr-4 font-sans text-slate-200">{row.name}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-emerald-400">{row.ops1k}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-amber-300">{row.ops1m}</td>
                    <td className="py-2.5 font-sans text-slate-400">{row.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeMatrix === 'osi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-white/[0.08] text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2 pr-4">Layer</th>
                  <th className="py-2 pr-4">Data Unit (PDU)</th>
                  <th className="py-2 pr-4">Protocols</th>
                  <th className="py-2">Diagnostic Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {OSI_TCP_LAYER_MATRIX.map((row) => (
                  <tr key={row.layer} className="text-slate-300">
                    <td className="py-2.5 pr-4 font-bold text-cyan-300 whitespace-nowrap">{row.layer}</td>
                    <td className="py-2.5 pr-4 text-slate-200 whitespace-nowrap">{row.pdu}</td>
                    <td className="py-2.5 pr-4 font-sans text-slate-300">{row.protocols}</td>
                    <td className="py-2.5 text-emerald-400">{row.tools}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeMatrix === 'http' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {HTTP_STATUS_REFERENCE.map((item) => (
              <div key={item.code} className="optical-inset rounded-xl p-3 space-y-1">
                <div className="font-mono text-xs font-bold text-cyan-300">{item.code}</div>
                <div className="text-[11px] text-slate-300 leading-snug">{item.meaning}</div>
              </div>
            ))}
          </div>
        )}

        {activeMatrix === 'perms' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {LINUX_PERMISSIONS_MATRIX.map((p) => (
              <div key={p.octal} className="optical-inset rounded-xl p-3 space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-emerald-400">{p.octal}</span>
                  <span className="text-xs text-cyan-300">{p.rwx}</span>
                </div>
                <div className="font-sans text-[11px] text-slate-300 leading-snug">{p.meaning}</div>
              </div>
            ))}
          </div>
        )}

        {activeMatrix === 'latency' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {POWERS_OF_TWO_AND_LATENCY.map((row) => (
              <div
                key={row.metric}
                className="optical-inset rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-semibold text-slate-200">{row.metric}</span>
                <span className="font-mono text-cyan-300 text-right tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Category Filter Tabs */}
      <div className="optical-subnav flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const count =
            cat === 'All'
              ? CHEAT_SHEET_DATA.length
              : CHEAT_SHEET_DATA.filter((d) => d.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                isSelected
                  ? 'bg-cyan-500/18 border-cyan-400/35 text-cyan-200 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}{' '}
              <span className="opacity-70 font-mono text-[10px] tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Cheat Sheet Cards Grid */}
      {filteredEntries.length === 0 ? (
        <div className="optical-panel rounded-2xl p-10 text-center text-xs font-mono text-slate-500">
          No cheat sheet cards match &quot;{search}&quot;. Try &quot;malloc&quot;, &quot;kubectl&quot;, &quot;goroutine&quot;, or &quot;bfs&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((item) => (
            <article
              key={item.id}
              className="optical-card rounded-2xl p-5 flex flex-col justify-between gap-3.5"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                      {item.category}
                    </span>
                    <h3 className="font-display text-sm font-semibold text-white mt-0.5">
                      {item.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy(item.id, item.syntax)}
                    className="px-2.5 py-1 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[11px] font-mono inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Syntax</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                <div className="optical-inset rounded-xl p-3 font-mono text-[11.5px] space-y-1.5 overflow-x-auto">
                  <div>
                    <span className="text-slate-500 select-none mr-2">syntax </span>
                    <code className="text-cyan-300 whitespace-pre-wrap">{item.syntax}</code>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-slate-500 select-none mr-2">ex     </span>
                      <code className="text-emerald-400 whitespace-pre-wrap">{item.example}</code>
                    </div>
                    <button
                      onClick={() => handleCopy(`${item.id}-ex`, item.example)}
                      className="text-[10px] text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      title="Copy example"
                    >
                      {copiedId === `${item.id}-ex` ? 'Copied!' : 'Copy ex'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.08] text-[11px]">
                <span className="font-mono text-slate-500 truncate">
                  {item.tags.slice(0, 4).map((t) => `#${t}`).join('  ')}
                </span>

                <div className="flex items-center gap-3 shrink-0">
                  {onOpenShell &&
                    ['Linux', 'Pipes', 'Network', 'Security', 'Git', 'Wargame'].includes(
                      item.category
                    ) && (
                      <button
                        onClick={() => onOpenShell(item.example)}
                        className="inline-flex items-center gap-1 font-mono text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <Terminal className="h-3 w-3" />
                        <span>Shell</span>
                      </button>
                    )}

                  <button
                    onClick={() =>
                      onOpenAiMentor(
                        `Explain "${item.name}" (${item.syntax}) with a clear analogy, edge cases, and a quick exercise.`
                      )
                    }
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Explain</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
