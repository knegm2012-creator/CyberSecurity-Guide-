'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Check, X, BookOpen, Terminal } from 'lucide-react';
import { SoapBubbleSearch } from '@/components/soap-bubble';

import {
  CHEAT_SHEET_DATA,
  CHEAT_SHEET_CATEGORIES,
  type CheatSheetEntry,
} from '@/lib/cheat-sheets-data';

export type { CheatSheetEntry };
export { CHEAT_SHEET_DATA };

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCommand?: (cmd: string) => void;
}

export function CheatSheetModal({ isOpen, onClose, onInsertCommand }: CheatSheetModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', ...CHEAT_SHEET_CATEGORIES];

  const filteredEntries = useMemo(() => {
    return CHEAT_SHEET_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03050b]/92">
      <div className="optical-panel relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border-white/[0.12] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#040710]/65">
          <div className="flex items-center gap-2.5">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <div>
              <h2 className="font-display text-sm font-semibold text-white">
                Master Syntax Cheat Sheet ({CHEAT_SHEET_DATA.length} Cards · 13 Categories)
              </h2>
              <p className="text-xs text-slate-400">
                Linux, Pipes, Network, Security, Git, Python, C/C++, Go, SQL, Docker/K8s &amp; Algorithms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/[0.08] bg-[#040710]/45 space-y-3">
          <SoapBubbleSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search syntax, commands, flags, or topics..."
            style={{ fontSize: 12 }}
          />

          <div className="optical-subnav flex items-center gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar">
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
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500/18 border-cyan-400/35 text-cyan-200 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat} <span className="opacity-70 font-mono text-[10px] tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 divide-y divide-white/[0.07]">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No matches for &quot;{search}&quot;
            </div>
          ) : (
            filteredEntries.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-display text-sm font-semibold text-white">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 uppercase">
                        · {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <button
                      onClick={() => handleCopy(item.id, item.syntax)}
                      className="px-2.5 py-1 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onInsertCommand && (
                      <button
                        onClick={() => {
                          onInsertCommand(item.example || item.syntax);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg border border-cyan-400/35 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Terminal className="h-3 w-3" />
                        <span>Run</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="optical-inset rounded-xl p-3 font-mono text-xs space-y-1">
                  <div>
                    <span className="text-slate-500 select-none mr-2">syntax </span>
                    <code className="text-cyan-300">{item.syntax}</code>
                  </div>
                  <div>
                    <span className="text-slate-500 select-none mr-2">ex     </span>
                    <code className="text-emerald-400">{item.example}</code>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
