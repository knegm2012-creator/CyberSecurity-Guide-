'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { SoapBubbleSearch } from '@/components/soap-bubble';
import { STAGES_DATA, ALL_GLOBAL_COMMANDS, CommandItem } from '@/lib/curriculum-data';

interface CommandVaultProps {
  onOpenAiMentor: (context?: string) => void;
}

export function CommandVault({ onOpenAiMentor }: CommandVaultProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Extract all commands across stages + global encyclopedia
  const allCommands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];
    
    // Add all global commands
    ALL_GLOBAL_COMMANDS.forEach((c) => {
      if (!list.some((existing) => existing.name === c.name)) {
        list.push(c);
      }
    });

    // Add stage-specific commands
    STAGES_DATA.forEach((s) => {
      s.commands.forEach((c) => {
        if (!list.some((existing) => existing.name === c.name)) {
          list.push(c);
        }
      });
    });

    return list;
  }, []);

  const categories = ['All', 'Linux', 'Git', 'Networking', 'Security', 'SQL', 'C/C++', 'Dev', 'System', 'Docker'];

  const filtered = allCommands.filter((cmd) => {
    const matchesCat = selectedCat === 'All' || cmd.category === selectedCat;
    const matchesSearch =
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.syntax.toLowerCase().includes(search.toLowerCase()) ||
      cmd.explanation.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="optical-panel rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-cyan-400 mb-1">
            <span>Command Arsenal &amp; Syntax Vault</span>
            <span>·</span>
            <span className="tabular-nums">{allCommands.length} Verified Commands</span>
          </div>
          <h2 className="font-display text-xl font-bold text-white tracking-tight [text-wrap:balance]">
            Searchable Command Cheat Sheet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Instant command references with parameter explanations and safe examples.
          </p>
        </div>

        {/* Soap Bubble Search Bar */}
        <div className="w-full sm:w-72">
          <SoapBubbleSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands, flags, tools..."
            style={{ fontSize: 12 }}
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="optical-subnav flex gap-1 p-1 rounded-xl overflow-x-auto no-scrollbar w-fit max-w-full">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCat === cat
                ? 'bg-cyan-500/18 border-cyan-400/35 text-cyan-200 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Commands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cmd, idx) => (
          <div
            key={idx}
            className="optical-card rounded-2xl p-5 space-y-3 font-mono text-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="font-semibold text-cyan-300 text-sm">{cmd.name}</span>
                <span className="text-[11px] text-slate-400">
                  · {cmd.category}
                </span>
              </div>

              {/* Syntax Box with Copy */}
              <div className="optical-inset relative rounded-xl p-3 pr-12 text-slate-200 overflow-x-auto select-all">
                <code>{cmd.syntax}</code>
                <button
                  onClick={() => handleCopy(cmd.syntax)}
                  className="absolute right-2 top-2 p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:bg-white/[0.12] transition-colors cursor-pointer"
                  title="Copy command"
                >
                  {copiedText === cmd.syntax ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-300 font-sans mt-3 leading-relaxed">
                {cmd.explanation}
              </p>

              {cmd.example && (
                <div className="mt-2 text-[11px] text-slate-400 font-mono">
                  <span className="text-slate-500">Example: </span>
                  <span className="text-slate-300">{cmd.example}</span>
                </div>
              )}

              {cmd.safeNote && (
                <div className="mt-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 p-2.5 text-[11px] font-sans text-amber-200 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>{cmd.safeNote}</span>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() =>
                  onOpenAiMentor(
                    `ELI9: Can you explain the command "${cmd.syntax}" line by line and show me 2 safe exercises for a Grade 9 student?`
                  )
                }
                className="flex items-center gap-1 text-[11px] font-sans text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Explain in Detail</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
