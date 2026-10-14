'use client';

import React from 'react';
import { Terminal, Sparkles, BookOpen, Layers, Laptop, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAiMentor: () => void;
  openQuickQuiz: () => void;
  stats: {
    levelNumber: number;
    heroTitle: string;
    topicPercent: number;
    currentStreak: number;
  };
}

export function Navbar({ activeTab, setActiveTab, openAiMentor, openQuickQuiz, stats }: NavbarProps) {
  const navItems = [
    { id: 'roadmap', label: '12 Stages' },
    { id: 'foundations', label: '⚡ Binary & Math Lab' },
    { id: 'git', label: '🌿 Git Sandbox' },
    { id: 'bandit', label: 'Bandit & Shell' },
    { id: 'labs', label: 'Concept Labs' },
    { id: 'projects', label: '14 Projects' },
    { id: 'vault', label: 'Command Vault' },
    { id: 'directory', label: 'Resources & Tracks' },
    { id: 'glossary', label: 'Glossary' },
    { id: 'notebook', label: 'Notes & Review' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          onClick={() => setActiveTab('roadmap')}
          className="flex items-center gap-2 text-left transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              CS Odyssey
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Grade 9 · 6-Month Hero
            </div>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Clean unboxed text links) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap transition-colors py-1 relative ${
                  isActive
                    ? 'text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action (AI Mentor & Quick Quiz) & Level info */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={openQuickQuiz}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Quick Quiz</span>
          </button>

          <button
            onClick={openAiMentor}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-cyan-500 hover:to-indigo-500 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-3 text-xs font-medium no-scrollbar bg-slate-950">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === item.id
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
