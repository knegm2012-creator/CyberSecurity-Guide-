'use client';

import React from 'react';
import { Terminal, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { SoapBubbleButton } from '@/components/soap-bubble';

export type PrimaryWorkspace = 'overview' | 'curriculum' | 'lab' | 'shell' | 'reference';

interface NavbarProps {
  activeWorkspace: PrimaryWorkspace;
  setActiveWorkspace: (workspace: PrimaryWorkspace) => void;
  openAiMentor: () => void;
}

const WORKSPACE_TABS: Array<{ id: PrimaryWorkspace; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'lab', label: 'Systems Lab' },
  { id: 'shell', label: 'Wargame Shell' },
  { id: 'reference', label: 'Reference' },
];

export function Navbar({ activeWorkspace, setActiveWorkspace, openAiMentor }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#03050b]/80 backdrop-blur-2xl shadow-[0_8px_30px_-18px_rgba(0,0,0,0.9)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Minimal Optical Brand Wordmark */}
        <button
          onClick={() => setActiveWorkspace('overview')}
          className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90 cursor-pointer shrink-0"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-sky-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight text-slate-100 whitespace-nowrap">
            CS Odyssey
          </span>
        </button>

        {/* Zone 2: Primary Workspace Tabs (5 clean unboxed links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium h-full">
          {WORKSPACE_TABS.map((item) => {
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={`relative h-full flex items-center whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.65)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Header Action */}
        <div className="flex items-center shrink-0">
          <SoapBubbleButton
            onClick={openAiMentor}
            tint="rgb(56 189 248)"
            opacity={0.92}
            style={{ fontSize: 12 }}
            className="!min-h-[32px] !px-3.5 text-xs font-medium text-sky-100 whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            <span>AI Mentor</span>
          </SoapBubbleButton>
        </div>
      </div>

      {/* Responsive compact navigation strip for smaller viewports */}
      <nav className="flex md:hidden overflow-x-auto border-t border-white/[0.08] px-4 gap-5 text-xs font-medium no-scrollbar bg-[#03050b]/90">
        {WORKSPACE_TABS.map((item) => {
          const isActive = activeWorkspace === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveWorkspace(item.id)}
              className={`py-2.5 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-sky-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
