'use client';

import React from 'react';
import { Terminal, Sparkles, Focus, Minimize2, Sun, Moon, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { SoapBubbleButton } from '@/components/soap-bubble';
import type { AppTheme } from '@/lib/session-timer';

export type PrimaryWorkspace = 'overview' | 'curriculum' | 'lab' | 'shell' | 'reference';

interface NavbarProps {
  activeWorkspace: PrimaryWorkspace;
  setActiveWorkspace: (workspace: PrimaryWorkspace) => void;
  openAiMentor: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  theme?: AppTheme;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  hasActiveReminder?: boolean;
}

const WORKSPACE_TABS: Array<{ id: PrimaryWorkspace; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'lab', label: 'Systems Lab' },
  { id: 'shell', label: 'Wargame Shell' },
  { id: 'reference', label: 'Reference' },
];

export function Navbar({
  activeWorkspace,
  setActiveWorkspace,
  openAiMentor,
  focusMode = false,
  onToggleFocusMode,
  theme = 'light',
  onToggleTheme,
  onOpenSettings,
  hasActiveReminder = false,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-white/[0.08] bg-white/92 dark:bg-[#03050b]/92 backdrop-blur-md shadow-[0_8px_30px_-20px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_30px_-18px_rgba(0,0,0,0.9)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Minimal Optical Brand Wordmark */}
        <button
          onClick={() => setActiveWorkspace('overview')}
          className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-85 cursor-pointer shrink-0 whitespace-nowrap"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-white/[0.05] text-sky-600 dark:text-sky-400">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
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
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-500 dark:from-sky-400 dark:via-indigo-400 dark:to-cyan-300"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Compact Utility & Primary CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer shrink-0"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon className="h-3.5 w-3.5 text-slate-700" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-300" />
              )}
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="relative rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer shrink-0"
              title="Settings & Study Notifications"
              aria-label="Open Settings"
            >
              <Settings className="h-3.5 w-3.5" />
              {hasActiveReminder && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#03050b]"
                  aria-hidden="true"
                />
              )}
            </button>
          )}

          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                focusMode
                  ? 'border-indigo-500/50 bg-indigo-600 text-white dark:bg-indigo-500/25 dark:text-indigo-100'
                  : 'border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20'
              }`}
              title="Toggle distraction-free Focus Mode (Ctrl+Shift+F)"
            >
              {focusMode ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Exit Focus</span>
                </>
              ) : (
                <>
                  <Focus className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                  <span className="hidden sm:inline">Focus</span>
                </>
              )}
            </button>
          )}

          <SoapBubbleButton
            onClick={openAiMentor}
            tint="rgb(2 132 199)"
            opacity={0.94}
            style={{ fontSize: 12 }}
            className="!min-h-[32px] !px-3.5 text-xs font-semibold text-white whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-100" />
            <span>AI Mentor</span>
          </SoapBubbleButton>
        </div>
      </div>

      {/* Responsive compact navigation strip for smaller viewports */}
      <nav className="flex md:hidden overflow-x-auto border-t border-slate-200 dark:border-white/[0.08] px-4 gap-5 text-xs font-medium no-scrollbar bg-white/95 dark:bg-[#03050b]/90">
        {WORKSPACE_TABS.map((item) => {
          const isActive = activeWorkspace === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveWorkspace(item.id)}
              className={`py-2.5 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-sky-600 dark:border-sky-400 text-slate-950 dark:text-white font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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

