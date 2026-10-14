'use client';

import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, ShieldAlert, Terminal, Sparkles } from 'lucide-react';
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>COMMAND ARSENAL & SYNTAX VAULT</span>
            <span>·</span>
            <span>{allCommands.length} VERIFIED COMMANDS</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Searchable Command Cheat Sheet</h2>
          <p className="text-xs text-slate-400 mt-1">
            Instant command references with parameter explanations and safe examples. Click any command to copy.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands, flags, tools..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCat === cat
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
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
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 font-mono text-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-cyan-400 text-sm">{cmd.name}</span>
                <span className="text-[10px] bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-slate-400">
                  {cmd.category}
                </span>
              </div>

              {/* Syntax Box with Copy */}
              <div className="relative rounded-lg bg-slate-950 border border-slate-800/80 p-3 pr-12 text-slate-200 overflow-x-auto select-all">
                <code>{cmd.syntax}</code>
                <button
                  onClick={() => handleCopy(cmd.syntax)}
                  className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
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
                <div className="mt-2 rounded bg-amber-950/20 border border-amber-900/40 p-2 text-[11px] font-sans text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  <span>{cmd.safeNote}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
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
