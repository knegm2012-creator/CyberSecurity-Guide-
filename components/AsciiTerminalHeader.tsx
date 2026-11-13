'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  ChevronUp,
  ChevronDown,
  Terminal,
  Folder,
  Shield,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
  Hash,
} from 'lucide-react';
import { BANDIT_LEVELS } from '@/lib/curriculum-data';
import { terminalAudio } from '@/lib/terminal-audio';

export type AsciiStyle = 'slant' | 'block' | 'doom' | 'matrix' | 'minimal';
export type AsciiColor = 'cyan' | 'green' | 'amber' | 'purple' | 'white';
export type AsciiTargetMode = 'auto' | 'level' | 'directory';

interface AsciiTerminalHeaderProps {
  currentPath: string[];
  selectedLevelIndex: number;
  currentUser: string;
  isLiveSshMode: boolean;
  sshUser?: string;
  sshCwd?: string;
}

// 3-Row Mini Unicode Block Alphabet for dynamic rendering of any directory or level
const BLOCK_ALPHABET: Record<string, [string, string, string]> = {
  A: ['█▀█', '█▀█', '▀ ▀'],
  B: ['█▀▄', '█▀▄', '▀▀ '],
  C: ['█▀▀', '█  ', '▀▀▀'],
  D: ['█▀▄', '█ █', '▀▀ '],
  E: ['█▀▀', '██▄', '▀▀▀'],
  F: ['█▀▀', '█▀ ', '▀  '],
  G: ['█▀▀', '█ █', '▀▀▀'],
  H: ['█ █', '███', '▀ ▀'],
  I: ['█', '█', '▀'],
  J: ['  █', '  █', '▀▀ '],
  K: ['█▄▀', '█▀▄', '▀ ▀'],
  L: ['█  ', '█  ', '▀▀▀'],
  M: ['█▄█', '█ █', '▀ ▀'],
  N: ['█▄ █', '█ ▀█', '▀  ▀'],
  O: ['█▀█', '█ █', '▀▀▀'],
  P: ['█▀█', '█▀▀', '▀  '],
  Q: ['█▀█', '█▀█', '▀▀█'],
  R: ['█▀▄', '█▀▄', '▀ ▀'],
  S: ['█▀▀', '▀▀█', '▀▀▀'],
  T: ['▀█▀', ' █ ', ' ▀ '],
  U: ['█ █', '█ █', '▀▀▀'],
  V: ['█ █', '▀▄▀', ' ▀ '],
  W: ['█ █', '█▄█', '▀ ▀'],
  X: ['▀▄▀', ' █ ', '▀ ▀'],
  Y: ['▀▄▀', ' █ ', ' ▀ '],
  Z: ['▀▀█', ' ▄▀', '█▄▄'],
  '0': ['█▀█', '█ █', '▀▀▀'],
  '1': [' █', ' █', ' ▀'],
  '2': ['▀▀█', '█▀▀', '▀▀▀'],
  '3': ['▀▀█', ' ▀█', '▀▀▀'],
  '4': ['█ █', '▀▀█', '  ▀'],
  '5': ['█▀▀', '▀▀█', '▀▀▀'],
  '6': ['█▀▀', '█▀█', '▀▀▀'],
  '7': ['▀▀█', '  █', '  ▀'],
  '8': ['█▀█', '█▀█', '▀▀▀'],
  '9': ['█▀█', '▀▀█', '▀▀▀'],
  '-': ['   ', '▀▀▀', '   '],
  '_': ['   ', '   ', '▀▀▀'],
  '/': [' ▄▀', '▄▀ ', '▀  '],
  '.': [' ', ' ', '▄'],
  ':': ['▄', ' ', '▄'],
  ' ': ['  ', '  ', '  '],
};

function renderBlockText(text: string): string {
  const upper = text.toUpperCase();
  const rows: [string[], string[], string[]] = [[], [], []];

  for (const ch of upper) {
    const glyph = BLOCK_ALPHABET[ch] || ['█', '█', '▀'];
    rows[0].push(glyph[0]);
    rows[1].push(glyph[1]);
    rows[2].push(glyph[2]);
  }

  return [rows[0].join(' '), rows[1].join(' '), rows[2].join(' ')].join('\n');
}

// Handcrafted Slant Banners for common levels & directories
const SLANT_BANNERS: Record<string, string> = {
  BANDIT_0: `  ___   _   _  _ ___ ___ _____   ___ 
 | _ ) /_\\ | \\| |   \\_ _|_   _| / _ \\
 | _ \\/ _ \\| .\` | |) | |  | |  | (_) |
 |___/_/ \\_\\_|\\_|___/___| |_|   \\___/ `,
  BANDIT_1: `  ___   _   _  _ ___ ___ _____   _ 
 | _ ) /_\\ | \\| |   \\_ _|_   _| / |
 | _ \\/ _ \\| .\` | |) | |  | |   | |
 |___/_/ \\_\\_|\\_|___/___| |_|   |_|`,
  BANDIT_2: `  ___   _   _  _ ___ ___ _____  ___ 
 | _ ) /_\\ | \\| |   \\_ _|_   _||_  )
 | _ \\/ _ \\| .\` | |) | |  | |   / / 
 |___/_/ \\_\\_|\\_|___/___| |_|  /___|`,
  BANDIT_3: `  ___   _   _  _ ___ ___ _____  ____ 
 | _ ) /_\\ | \\| |   \\_ _|_   _||__ / 
 | _ \\/ _ \\| .\` | |) | |  | |   |_ \\ 
 |___/_/ \\_\\_|\\_|___/___| |_|  |___/ `,
  BANDIT_4: `  ___   _   _  _ ___ ___ _____  _ _  
 | _ ) /_\\ | \\| |   \\_ _|_   _|| | | 
 | _ \\/ _ \\| .\` | |) | |  | |  |_  _|
 |___/_/ \\_\\_|\\_|___/___| |_|    |_| `,
  BANDIT_5: `  ___   _   _  _ ___ ___ _____  ___ 
 | _ ) /_\\ | \\| |   \\_ _|_   _|| __|
 | _ \\/ _ \\| .\` | |) | |  | |  |__ \\
 |___/_/ \\_\\_|\\_|___/___| |_|  |___/`,
  BANDIT_6: `  ___   _   _  _ ___ ___ _____   __  
 | _ ) /_\\ | \\| |   \\_ _|_   _| / /  
 | _ \\/ _ \\| .\` | |) | |  | |  / _ \\ 
 |___/_/ \\_\\_|\\_|___/___| |_|  \\___/ `,
  BANDIT_7: `  ___   _   _  _ ___ ___ _____  ____ 
 | _ ) /_\\ | \\| |   \\_ _|_   _||__  |
 | _ \\/ _ \\| .\` | |) | |  | |    / / 
 |___/_/ \\_\\_|\\_|___/___| |_|   /_/  `,
  BANDIT_8: `  ___   _   _  _ ___ ___ _____   ___ 
 | _ ) /_\\ | \\| |   \\_ _|_   _| ( _ )
 | _ \\/ _ \\| .\` | |) | |  | |   / _ \\
 |___/_/ \\_\\_|\\_|___/___| |_|   \\___/`,
  BANDIT_9: `  ___   _   _  _ ___ ___ _____   ___ 
 | _ ) /_\\ | \\| |   \\_ _|_   _| / _ \\
 | _ \\/ _ \\| .\` | |) | |  | |  | (_) |
 |___/_/ \\_\\_|\\_|___/___| |_|   \\__, |
                                |___/ `,
  INHERE: `  ___ _  _ _  _ ___ ___ ___ 
 |_ _| \\| | || | __| _ \\ __|
  | || .\` | __ | _||   / _| 
 |___|_|\\_|_||_|___|_|_\\___|`,
  HOME: `  _  _  ___  __  __ ___ 
 | || |/ _ \\|  \\/  | __|
 | __ | (_) | |\\/| | _| 
 |_||_|\\___/|_|  |_|___|`,
  ROOT: `  ___  ___   ___ _____ 
 | _ \\/ _ \\ / _ \\_   _|
 |   / (_) | (_) || |  
 |_|_\\\\___/ \\___/ |_|  `,
  CYBER_CITADEL: `   ___ _   _ ___ ___ ___    ___ ___ _____ _   ___  ___ _    
  / __| \\_/ | _ ) __| _ \\  / __|_ _|_   _/_\\ |   \\| __| |   
 | (__ \\   /| _ \\ _||   / | (__ | |  | |/ _ \\| |) | _|| |__ 
  \\___| |_| |___/___|_|_\\  \\___|___| |_/_/ \\_\\___/|___|____|`,
};

// Handcrafted Doom Banners
const DOOM_BANNERS: Record<string, string> = {
  BANDIT: `  _                   _ _ _   
 | |                 | (_) |  
 | |__   __ _ _ __   | |_| |_ 
 | '_ \\ / _\` | '_ \\  | | | __|
 | |_) | (_| | | | | | | | |_ 
 |_.__/ \\__,_|_| |_| |_|_|\\__|`,
  INHERE: `  _       _                   
 (_)_ __ | |__   ___ _ __ ___ 
 | | '_ \\| '_ \\ / _ \\ '__/ _ \\
 | | | | | | | |  __/ | |  __/
 |_|_| |_|_| |_|\\___|_|  \\___|`,
  ROOT: `                       _   
                      | |  
  _ __ ___   ___   ___| |_ 
 | '__/ _ \\ / _ \\ / _ \\ __|
 | | | (_) | (_) | (_) | |_ 
 |_|  \\___/ \\___/ \\___/ \\__|`,
};

export function AsciiTerminalHeader({
  currentPath,
  selectedLevelIndex,
  currentUser,
  isLiveSshMode,
  sshUser,
  sshCwd,
}: AsciiTerminalHeaderProps) {
  // Local state with lazy localStorage hydration
  const [style, setStyle] = useState<AsciiStyle>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('odyssey_ascii_style') as AsciiStyle | null;
        if (saved && ['slant', 'block', 'doom', 'matrix', 'minimal'].includes(saved)) {
          return saved;
        }
      } catch {}
    }
    return 'slant';
  });

  const [color, setColor] = useState<AsciiColor>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('odyssey_ascii_color') as AsciiColor | null;
        if (saved && ['cyan', 'green', 'amber', 'purple', 'white'].includes(saved)) {
          return saved;
        }
      } catch {}
    }
    return 'cyan';
  });

  const [targetMode, setTargetMode] = useState<AsciiTargetMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('odyssey_ascii_mode') as AsciiTargetMode | null;
        if (saved && ['auto', 'level', 'directory'].includes(saved)) {
          return saved;
        }
      } catch {}
    }
    return 'auto';
  });

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('odyssey_ascii_collapsed');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch {}
    }
    return false;
  });
  const [showConfig, setShowConfig] = useState(false);

  const handleSetStyle = (s: AsciiStyle) => {
    terminalAudio.playKeyClick();
    setStyle(s);
    try {
      localStorage.setItem('odyssey_ascii_style', s);
    } catch {}
  };

  const handleSetColor = (c: AsciiColor) => {
    terminalAudio.playKeyClick();
    setColor(c);
    try {
      localStorage.setItem('odyssey_ascii_color', c);
    } catch {}
  };

  const handleSetTargetMode = (m: AsciiTargetMode) => {
    terminalAudio.playKeyClick();
    setTargetMode(m);
    try {
      localStorage.setItem('odyssey_ascii_mode', m);
    } catch {}
  };

  const handleToggleCollapse = () => {
    terminalAudio.playKeyClick();
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('odyssey_ascii_collapsed', String(next));
    } catch {}
  };

  // Determine current active directory label and level details
  const activeDirName = useMemo(() => {
    if (isLiveSshMode && sshCwd) {
      const segments = sshCwd.split('/').filter(Boolean);
      return segments[segments.length - 1] || 'root';
    }
    return currentPath[currentPath.length - 1] || 'root';
  }, [currentPath, isLiveSshMode, sshCwd]);

  const activeFullPath = useMemo(() => {
    if (isLiveSshMode && sshCwd) return sshCwd;
    return '/' + currentPath.join('/');
  }, [currentPath, isLiveSshMode, sshCwd]);

  const levelInfo = useMemo(() => {
    const lvlNum = isLiveSshMode && sshUser
      ? parseInt(sshUser.replace(/\D/g, ''), 10) || selectedLevelIndex
      : selectedLevelIndex;
    return BANDIT_LEVELS[lvlNum] || BANDIT_LEVELS[0];
  }, [selectedLevelIndex, isLiveSshMode, sshUser]);

  // Compute ASCII artwork based on style, level, and active directory
  const asciiArt = useMemo(() => {
    const isSubdir = currentPath.length > 2 && currentPath[currentPath.length - 1] !== `bandit${selectedLevelIndex}`;
    const showDir = targetMode === 'directory' || (targetMode === 'auto' && isSubdir);

    if (style === 'block') {
      const title = showDir ? activeDirName : `BANDIT ${levelInfo.level}`;
      return renderBlockText(title);
    }

    if (style === 'doom') {
      if (showDir) {
        const key = activeDirName.toUpperCase();
        if (DOOM_BANNERS[key]) return DOOM_BANNERS[key];
        return renderBlockText(activeDirName);
      }
      return `${DOOM_BANNERS.BANDIT}\n [ LEVEL ${levelInfo.level} • ${levelInfo.title.toUpperCase()} ]`;
    }

    if (style === 'matrix') {
      const targetLabel = isLiveSshMode
        ? `LIVE SSH: ${sshUser || 'bandit'}@bandit.labs.overthewire.org:2220`
        : `CITADEL VIRTUAL ENGINE // LEVEL ${levelInfo.level}`;
      return [
        '╔══════════════════════════════════════════════════════════════════════════════════════╗',
        `║  [>] TARGET: ${targetLabel.padEnd(70, ' ')} ║`,
        `║  [/] PWD:    ${activeFullPath.padEnd(70, ' ')} ║`,
        `║  [!] GOAL:   ${levelInfo.goal.slice(0, 68).padEnd(70, ' ')} ║`,
        '╚══════════════════════════════════════════════════════════════════════════════════════╝',
      ].join('\n');
    }

    if (style === 'minimal') {
      return `┌──(${isLiveSshMode ? (sshUser || 'bandit') : currentUser}@cyber-box)-[${activeFullPath}]\n└─▶ [CITADEL L${levelInfo.level}: ${levelInfo.title}]`;
    }

    // Default 'slant'
    if (showDir) {
      const key = activeDirName.toUpperCase();
      if (SLANT_BANNERS[key]) return SLANT_BANNERS[key];
      return renderBlockText(activeDirName);
    }

    const key = `BANDIT_${levelInfo.level}`;
    if (SLANT_BANNERS[key]) {
      return SLANT_BANNERS[key];
    }
    return renderBlockText(`BANDIT ${levelInfo.level}`);
  }, [style, targetMode, activeDirName, activeFullPath, levelInfo, currentPath, selectedLevelIndex, isLiveSshMode, sshUser, currentUser]);

  // Color classes map
  const colorClasses = {
    cyan: {
      text: 'text-cyan-400',
      border: 'border-cyan-400/30',
      bg: 'bg-cyan-500/[0.05]',
      badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
      pill: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    },
    green: {
      text: 'text-emerald-400',
      border: 'border-emerald-400/30',
      bg: 'bg-emerald-500/[0.05]',
      badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      pill: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    },
    amber: {
      text: 'text-amber-400',
      border: 'border-amber-400/30',
      bg: 'bg-amber-500/[0.05]',
      badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
      pill: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    },
    purple: {
      text: 'text-fuchsia-400',
      border: 'border-fuchsia-400/30',
      bg: 'bg-fuchsia-500/[0.05]',
      badge: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40',
      pill: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40',
    },
    white: {
      text: 'text-slate-200',
      border: 'border-white/[0.14]',
      bg: 'bg-white/[0.03]',
      badge: 'bg-white/[0.1] text-slate-100 border-white/[0.18]',
      pill: 'bg-white/[0.08] text-slate-200 border-white/[0.16]',
    },
  }[color];

  return (
    <div className={`border-b border-white/[0.08] bg-[#040710]/75 backdrop-blur-md font-mono transition-all duration-200 ${colorClasses.bg}`}>
      {/* Header Bar Controls */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] border-b border-white/[0.07] bg-white/[0.025] select-none">
        <div className="flex items-center gap-2">
          <Terminal className={`h-3 w-3 ${colorClasses.text}`} />
          <span className="font-bold text-slate-300 tracking-wider text-[10px] uppercase">
            ASCII Banner
          </span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] border font-semibold ${colorClasses.badge}`}>
            {targetMode === 'auto'
              ? (currentPath.length > 2 ? `DIR: ${activeDirName}` : `LVL ${levelInfo.level}`)
              : targetMode === 'level'
              ? `LVL ${levelInfo.level}`
              : `DIR: ${activeDirName}`}
          </span>
          {isLiveSshMode && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/35 flex items-center gap-1 font-bold">
              <span>LIVE SSH</span>
            </span>
          )}
        </div>

        {/* Action Buttons: Palette / Config Toggle & Collapse Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              terminalAudio.playKeyClick();
              setShowConfig(!showConfig);
            }}
            className={`p-1 px-1.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 text-[10px] ${
              showConfig
                ? colorClasses.pill
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Customize ASCII Header Font, Theme, and Target"
          >
            <Sliders className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>

          <button
            onClick={handleToggleCollapse}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand ASCII Header' : 'Collapse ASCII Header'}
          >
            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Customizable Settings Drawer (When showConfig is open) */}
      {showConfig && (
        <div className="p-2.5 bg-black/50 border-b border-white/[0.07] space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            {/* Style Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Font:</span>
              {(['slant', 'block', 'doom', 'matrix', 'minimal'] as AsciiStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSetStyle(s)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all cursor-pointer capitalize ${
                    style === s
                      ? `${colorClasses.badge} font-bold shadow-sm`
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Color Palette Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Color:</span>
              {(
                [
                  { id: 'cyan', label: 'Cyan', dot: 'bg-cyan-400' },
                  { id: 'green', label: 'Matrix', dot: 'bg-emerald-400' },
                  { id: 'amber', label: 'Amber', dot: 'bg-amber-400' },
                  { id: 'purple', label: 'Neon', dot: 'bg-fuchsia-400' },
                  { id: 'white', label: 'Mono', dot: 'bg-slate-200' },
                ] as Array<{ id: AsciiColor; label: string; dot: string }>
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSetColor(c.id)}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] border flex items-center gap-1 transition-all cursor-pointer ${
                    color === c.id
                      ? `${colorClasses.badge} font-bold`
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${c.label} palette`}
                >
                  <span className={`h-2 w-2 rounded-sm ${c.dot}`} />
                  <span className="hidden sm:inline">{c.label}</span>
                </button>
              ))}
            </div>

            {/* Target Mode Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Track:</span>
              {(
                [
                  { id: 'auto', label: 'Auto (Lvl+Dir)' },
                  { id: 'level', label: 'Level' },
                  { id: 'directory', label: 'Directory' },
                ] as Array<{ id: AsciiTargetMode; label: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSetTargetMode(m.id)}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] border transition-all cursor-pointer ${
                    targetMode === m.id
                      ? `${colorClasses.badge} font-bold`
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main ASCII Artwork Banner Display */}
      {!isCollapsed ? (
        <div className="p-3 overflow-x-auto select-none no-scrollbar flex flex-col justify-center">
          <pre
            className={`font-mono leading-none tracking-normal font-bold text-[10px] sm:text-[11px] md:text-xs select-all whitespace-pre transition-colors duration-200 ${colorClasses.text}`}
          >
            {asciiArt}
          </pre>

          {/* Subtext Context Strip */}
          <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="truncate">
              PATH: <span className="text-slate-300 font-semibold">{activeFullPath}</span>
              {levelInfo && (
                <span className="ml-2 text-slate-400 hidden sm:inline">
                  • GOAL: {levelInfo.goal}
                </span>
              )}
            </span>
            <span className="shrink-0 text-slate-500 hidden md:inline">
              Style: {style} · Theme: {color}
            </span>
          </div>
        </div>
      ) : (
        /* Collapsed Mini Banner */
        <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-white/[0.02]">
          <div className="flex items-center gap-2 truncate">
            <span className={`font-bold text-xs ${colorClasses.text}`}>
              [{activeDirName.toUpperCase()}]
            </span>
            <span className="text-slate-500 truncate">
              {activeFullPath} · Bandit Level {levelInfo.level}
            </span>
          </div>
          <button
            onClick={handleToggleCollapse}
            className="text-[10px] text-slate-400 hover:text-cyan-400 cursor-pointer shrink-0 ml-2"
          >
            Expand ▾
          </button>
        </div>
      )}
    </div>
  );
}
