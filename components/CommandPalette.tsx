'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Compass,
  Terminal,
  BookOpen,
  ExternalLink,
  Cpu,
  Sparkles,
  ArrowRight,
  GitBranch,
  Grid3X3,
} from 'lucide-react';
import {
  STAGES_DATA,
  ADVANCED_HERO_TOPICS,
  ALL_GLOBAL_COMMANDS,
  PORTFOLIO_PROJECTS,
} from '@/lib/curriculum-data';
import { CURATED_CS_SOURCES } from '@/lib/sources-catalog';
import type { PrimaryWorkspace } from '@/components/Navbar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (workspace: PrimaryWorkspace, subTab?: string, stageId?: string) => void;
  onOpenAiMentor: (prompt?: string) => void;
  onOpenQuickQuiz: () => void;
  onOpenCheatSheet: () => void;
}

interface PaletteEntry {
  id: string;
  title: string;
  subtitle: string;
  category: 'Stage' | 'Topic' | 'Systems Lab' | 'CLI Command' | 'Source' | 'Project' | 'Hero Track' | 'Action';
  keywords: string;
  externalUrl?: string;
  action: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenAiMentor,
  onOpenQuickQuiz,
  onOpenCheatSheet,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const list: PaletteEntry[] = [
      {
        id: 'act-studio',
        title: 'Open Spatial & Optical Studio',
        subtitle: 'Depth cloud, WebGL refraction, soap optics, terrain & rigid-body physics',
        category: 'Systems Lab',
        keywords: 'futuristic spatial optical studio depth refraction fluid bubble terrain physics fan',
        action: () => {
          onNavigate('lab', 'studio');
          onClose();
        },
      },
      {
        id: 'act-visualizer',
        title: 'Open Sorting & Graph Pathfinding Visualizer',
        subtitle: 'Interactive Merge, Quick, Dijkstra, BFS, DFS sandbox',
        category: 'Systems Lab',
        keywords: 'sort merge quick insertion bubble dijkstra bfs dfs graph pathfinding visualizer',
        action: () => {
          onNavigate('lab', 'visualizer');
          onClose();
        },
      },
      {
        id: 'act-playground',
        title: 'Open C & Python Code Playground',
        subtitle: 'Sandboxed execution studio with saved snippets',
        category: 'Systems Lab',
        keywords: 'code python c compiler playground sandbox run',
        action: () => {
          onNavigate('lab', 'playground');
          onClose();
        },
      },
      {
        id: 'act-foundations',
        title: 'Open Binary, Hex & Hardware Lab',
        subtitle: 'Logic gates, two complement, bit inspection',
        category: 'Systems Lab',
        keywords: 'binary hex bits hardware foundations logic',
        action: () => {
          onNavigate('lab', 'foundations');
          onClose();
        },
      },
      {
        id: 'act-git',
        title: 'Open Git DAG Sandbox',
        subtitle: 'Commits, branches, merges, HEAD graph simulation',
        category: 'Systems Lab',
        keywords: 'git branch commit merge dag version control',
        action: () => {
          onNavigate('lab', 'git');
          onClose();
        },
      },
      {
        id: 'act-memory',
        title: 'Open RAM & Pointer Inspector',
        subtitle: 'Dereference pointers and inspect stack/heap memory addresses',
        category: 'Systems Lab',
        keywords: 'ram pointer memory address dereference c stack',
        action: () => {
          onNavigate('lab', 'memory');
          onClose();
        },
      },
      {
        id: 'act-packet',
        title: 'Open Network Packet Tracer',
        subtitle: 'Step-by-step ARP, DNS, TCP 3-way handshake, TLS 1.3',
        category: 'Systems Lab',
        keywords: 'packet tcp udp dns tls http network tracer',
        action: () => {
          onNavigate('lab', 'packet');
          onClose();
        },
      },
      {
        id: 'act-complexity',
        title: 'Open Big-O & Memory Latency Calculator',
        subtitle: 'Asymptotic growth and L1/L2/DRAM/NVMe hierarchy',
        category: 'Systems Lab',
        keywords: 'big o complexity algorithm performance cache latency',
        action: () => {
          onNavigate('lab', 'complexity');
          onClose();
        },
      },
      {
        id: 'act-shell',
        title: 'Open Interactive Shell Simulator',
        subtitle: 'Linux wargame sandbox, virtual FS & hardened SSH terminal',
        category: 'Action',
        keywords: 'shell terminal linux ssh wargame bash cli',
        action: () => {
          onNavigate('shell');
          onClose();
        },
      },
      {
        id: 'act-export',
        title: 'Open Open-Source Syllabus Exporter',
        subtitle: 'Download Student, Teacher, Printable HTML, CSV & GitHub packs',
        category: 'Action',
        keywords: 'export syllabus github markdown csv json html print teacher student',
        action: () => {
          onNavigate('curriculum', 'export');
          onClose();
        },
      },
      {
        id: 'act-sources',
        title: 'Open Curated CS Source Directory',
        subtitle: 'Browse MIT, Stanford, CMU, books, videos, papers & repos',
        category: 'Action',
        keywords: 'sources library books videos courses papers github',
        action: () => {
          onNavigate('reference', 'sources');
          onClose();
        },
      },
      {
        id: 'act-quiz',
        title: 'Launch Quick Knowledge Quiz',
        subtitle: 'Test mastery across current stage concepts',
        category: 'Action',
        keywords: 'quiz test practice check knowledge',
        action: () => {
          onClose();
          onOpenQuickQuiz();
        },
      },
      {
        id: 'act-cheatsheet',
        title: 'Open Linux & CLI Cheat Sheet',
        subtitle: 'Quick reference for Unix shell commands',
        category: 'Action',
        keywords: 'cheat sheet commands linux unix quick reference',
        action: () => {
          onClose();
          onOpenCheatSheet();
        },
      },
      {
        id: 'act-mentor',
        title: 'Ask Engineering Mentor',
        subtitle: 'Open guided explanation & Socratic problem-solving panel',
        category: 'Action',
        keywords: 'ai mentor ask help tutor explain',
        action: () => {
          onClose();
          onOpenAiMentor();
        },
      },
    ];

    STAGES_DATA.forEach((stage) => {
      list.push({
        id: `stage-${stage.id}`,
        title: `Stage ${stage.number}: ${stage.title}`,
        subtitle: `${stage.timeEstimate} · ${stage.sprintMonth}`,
        category: 'Stage',
        keywords: `stage ${stage.number} ${stage.title} ${stage.subtitle} ${stage.goal}`.toLowerCase(),
        action: () => {
          onNavigate('curriculum', 'stages', stage.id);
          onClose();
        },
      });

      stage.topics.forEach((topic, idx) => {
        list.push({
          id: `topic-${topic.id}`,
          title: `${stage.number}.${idx + 1} ${topic.title}`,
          subtitle: `Stage ${stage.number} Topic`,
          category: 'Topic',
          keywords: `${topic.title} ${topic.description} stage ${stage.number}`.toLowerCase(),
          action: () => {
            onNavigate('curriculum', 'stages', stage.id);
            onClose();
          },
        });
      });
    });

    ADVANCED_HERO_TOPICS.forEach((hero) => {
      list.push({
        id: `hero-${hero.id}`,
        title: `${hero.subjectArea}: ${hero.title}`,
        subtitle: hero.overview.slice(0, 88) + '...',
        category: 'Hero Track',
        keywords: `${hero.title} ${hero.subjectArea} ${hero.keyConcepts.join(' ')}`.toLowerCase(),
        action: () => {
          onNavigate('curriculum', 'hero');
          onClose();
        },
      });
    });

    PORTFOLIO_PROJECTS.forEach((proj) => {
      list.push({
        id: `proj-${proj.id}`,
        title: `Project ${proj.number}: ${proj.title}`,
        subtitle: `${proj.difficulty} · ${proj.tools.join(', ')}`,
        category: 'Project',
        keywords: `${proj.title} ${proj.tools.join(' ')} ${proj.brief}`.toLowerCase(),
        action: () => {
          onNavigate('curriculum', 'projects');
          onClose();
        },
      });
    });

    ALL_GLOBAL_COMMANDS.forEach((cmd) => {
      list.push({
        id: `cmd-${cmd.name}`,
        title: cmd.name,
        subtitle: `${cmd.category} — ${cmd.explanation}`,
        category: 'CLI Command',
        keywords: `${cmd.name} ${cmd.category} ${cmd.explanation} ${cmd.example}`.toLowerCase(),
        action: () => {
          onNavigate('reference', 'commands');
          onClose();
        },
      });
    });

    CURATED_CS_SOURCES.forEach((src) => {
      list.push({
        id: `src-${src.id}`,
        title: src.title,
        subtitle: `${src.medium} · ${src.authorOrOrg} (${src.domain})`,
        category: 'Source',
        keywords: `${src.title} ${src.authorOrOrg} ${src.domain} ${src.medium} ${src.whyItMatters}`.toLowerCase(),
        externalUrl: src.url,
        action: () => {
          onNavigate('reference', 'sources');
          onClose();
        },
      });
    });

    return list;
  }, [onNavigate, onClose, onOpenAiMentor, onOpenQuickQuiz, onOpenCheatSheet]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return entries.slice(0, 14);
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    return entries
      .filter((entry) => {
        const hay = `${entry.title.toLowerCase()} ${entry.subtitle.toLowerCase()} ${entry.keywords}`;
        return tokens.every((tok) => hay.includes(tok));
      })
      .slice(0, 18);
  }, [entries, query]);

  if (!isOpen) return null;

  const safeIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length === 0 ? 0 : (prev + 1) % filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filtered.length === 0 ? 0 : (prev - 1 + filtered.length) % filtered.length
      );
    } else if (e.key === 'Enter' && filtered[safeIndex]) {
      e.preventDefault();
      filtered[safeIndex].action();
    }
  };

  const renderIcon = (cat: PaletteEntry['category']) => {
    switch (cat) {
      case 'Stage':
      case 'Topic':
        return <Compass className="h-4 w-4 text-sky-400 shrink-0" />;
      case 'Systems Lab':
        return <Grid3X3 className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'CLI Command':
        return <Terminal className="h-4 w-4 text-amber-400 shrink-0" />;
      case 'Source':
        return <BookOpen className="h-4 w-4 text-sky-300 shrink-0" />;
      case 'Project':
        return <GitBranch className="h-4 w-4 text-emerald-300 shrink-0" />;
      case 'Hero Track':
        return <Cpu className="h-4 w-4 text-amber-300 shrink-0" />;
      default:
        return <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#03050b]/80 backdrop-blur-md px-4 pt-16 sm:pt-24"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="optical-panel w-full max-w-2xl rounded-2xl border-white/[0.12] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Global Command Palette"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] bg-[#040710]/75 px-4 py-3.5">
          <Search className="h-4 w-4 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Jump to stages, algorithms, CLI commands, sources, or labs..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close command palette"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-white/[0.06]">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-slate-500 font-mono">
              No matches found for &ldquo;{query}&rdquo;. Try &ldquo;dijkstra&rdquo;, &ldquo;stage 6&rdquo;, &ldquo;pointers&rdquo;, or &ldquo;export&rdquo;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === safeIndex;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                    active ? 'bg-cyan-500/15' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <button
                    onClick={item.action}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    {renderIcon(item.category)}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.category}
                    </span>
                    {item.externalUrl ? (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="rounded-lg border border-white/[0.1] bg-white/[0.04] p-1 text-cyan-400 hover:text-white"
                        title="Open source URL directly"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <button
                        onClick={item.action}
                        className="p-1 text-slate-400 hover:text-cyan-300 cursor-pointer"
                        aria-label={`Go to ${item.title}`}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] bg-[#040710]/75 px-4 py-2.5 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
          <span className="tabular-nums">
            Indexing {STAGES_DATA.length} stages · {CURATED_CS_SOURCES.length} verified sources · {ALL_GLOBAL_COMMANDS.length} commands
          </span>
        </div>
      </div>
    </div>
  );
}
