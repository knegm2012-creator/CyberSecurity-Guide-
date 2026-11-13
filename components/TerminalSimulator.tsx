'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Shield,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Play,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Key,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  BookOpen,
  Filter,
  Code2,
  Layers,
  ChevronRight,
  ChevronDown,
  Info,
  Volume2,
  VolumeX,
  ExternalLink,
  Folder,
  FolderOpen,
  File,
  FileText,
  FileCode,
  Columns,
  Hash,
  ArrowUp,
  X,
} from 'lucide-react';
import { SoapBubbleButton, SoapBubbleSearch, SoapBubbleToggle } from '@/components/soap-bubble';
import { BANDIT_LEVELS, BanditLevel } from '@/lib/curriculum-data';
import { BANDIT_QUICK_COMMANDS, QuickCommand } from '@/lib/bandit-commands-data';
import { resolveVirtualPath, sanitizeTerminalOutput } from '@/lib/client-security';
import { terminalAudio } from '@/lib/terminal-audio';
import { CheatSheetModal } from '@/components/CheatSheetModal';
import { AsciiTerminalHeader } from '@/components/AsciiTerminalHeader';

interface TerminalSimulatorProps {
  solvedLevels: number[];
  banditPasswords?: Record<number, string>;
  onSaveBanditPassword?: (level: number, password: string) => void;
  onToggleLevel: (level: number) => void;
  onOpenAiMentor: (context?: string) => void;
  isActive?: boolean;
}

interface FileSystemNode {
  type: 'file' | 'dir';
  content?: string;
  size?: number;
  permissions?: string;
  owner?: string;
  children?: Record<string, FileSystemNode>;
}

export interface OpenedFileState {
  name: string;
  path: string;
  content: string;
  size: number;
  permissions?: string;
  owner?: string;
  isBinary?: boolean;
}

// Generate formatted 16-byte hex dump for binary inspection
const generateHexDump = (content: string, maxBytes = 512): string => {
  const bytes: number[] = [];
  for (let i = 0; i < Math.min(content.length, maxBytes); i++) {
    bytes.push(content.charCodeAt(i) & 0xff);
  }
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const offset = i.toString(16).padStart(8, '0');
    const hex = chunk
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(48, ' ');
    const ascii = chunk
      .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
      .join('');
    lines.push(`${offset}: ${hex}  |${ascii}|`);
  }
  if (content.length > maxBytes) {
    lines.push(`... [truncated ${content.length - maxBytes} additional bytes]`);
  }
  return lines.join('\n');
};

// Detect standard 32-character wargame password flags inside file content
const extractFlagFromContent = (content: string): string | null => {
  const trimmed = content.trim();
  if (/^[a-zA-Z0-9]{32}$/.test(trimmed)) {
    return trimmed;
  }
  const lines = trimmed.split('\n');
  for (const l of lines) {
    const words = l.trim().split(/\s+/);
    for (const w of words) {
      if (/^[a-zA-Z0-9]{32}$/.test(w)) {
        return w;
      }
    }
  }
  return null;
};

export function TerminalSimulator({
  solvedLevels,
  banditPasswords = {},
  onSaveBanditPassword,
  onToggleLevel,
  onOpenAiMentor,
  isActive = true,
}: TerminalSimulatorProps) {
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

  // --- COMMAND QUICK-REFERENCE SIDE PANEL STATE ---
  const [showQuickRef, setShowQuickRef] = useState(true);
  const [quickRefFilter, setQuickRefFilter] = useState<'relevant' | 'all'>('relevant');
  const [quickRefCategory, setQuickRefCategory] = useState<string>('all');
  const [quickRefSearch, setQuickRefSearch] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [expandedCmd, setExpandedCmd] = useState<string | null>(null);

  // --- RETRO AUDIO & CHEAT SHEET STATE ---
  const [audioEnabled, setAudioEnabled] = useState(() => terminalAudio.getEnabled());
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const handleToggleAudio = () => {
    const next = terminalAudio.toggle();
    setAudioEnabled(next);
  };

  // --- LIVE SSH STATE ---
  const [isLiveSshMode, setIsLiveSshMode] = useState(false);
  const [isConnectingSsh, setIsConnectingSsh] = useState(false);
  const [isExecutingRemote, setIsExecutingRemote] = useState(false);
  const [sshHost, setSshHost] = useState('bandit.labs.overthewire.org');
  const [sshPort, setSshPort] = useState(2220);
  const [sshUser, setSshUser] = useState('bandit0');
  const [sshPassword, setSshPassword] = useState('bandit0');
  const [sshCwd, setSshCwd] = useState('/home/bandit0');
  const [detectedFlags, setDetectedFlags] = useState<string[]>([]);
  const [unlockedNotice, setUnlockedNotice] = useState<string | null>(null);
  const [levelPasswordInput, setLevelPasswordInput] = useState('');

  // Password prompt state for interactive terminal ssh command
  const [awaitingPasswordFor, setAwaitingPasswordFor] = useState<{
    user: string;
    host: string;
    port: number;
  } | null>(null);

  // Local Terminal state
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output'; text: string; isError?: boolean; isSuccess?: boolean }>>([
    { type: 'output', text: 'Cyber Citadel Wargame & Linux Terminal Engine [v6.4.0-hardened]' },
    { type: 'output', text: '[SANDBOX] 100% Offline Virtual Filesystem loaded. All 20 levels playable locally.' },
    { type: 'output', text: '[SSH] External gateway bridge available for bandit.labs.overthewire.org:2220.' },
    { type: 'output', text: 'Commands: Type "help", "cheat", or click "Quick-Ref" to browse commands with audio feedback.' },
    { type: 'output', text: 'Logged in as: citadel-agent@cyber-box:~$' },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [tempDraft, setTempDraft] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string[]>(['home', 'bandit0']);
  const [currentUser, setCurrentUser] = useState('bandit0');
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    USER: 'bandit0',
    HOME: '/home/bandit0',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
    PATH: '/usr/local/bin:/usr/bin:/bin:/usr/games',
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- INTERACTIVE FILE SYSTEM & SPLIT-VIEW READER STATE ---
  const [showFsView, setShowFsView] = useState(true);
  const [showAsciiHeader, setShowAsciiHeader] = useState(true);
  const [openedFile, setOpenedFile] = useState<OpenedFileState | null>(null);
  const [fileViewMode, setFileViewMode] = useState<'text' | 'hex'>('text');
  const [showDotfiles, setShowDotfiles] = useState(true);
  const [fsRevision, setFsRevision] = useState(0);

  // Virtual Filesystem representation (for local sandbox fallback)
  const fsRef = useRef<FileSystemNode>({
    type: 'dir',
    children: {
      home: {
        type: 'dir',
        children: {
          bandit0: {
            type: 'dir',
            children: {
              readme: { type: 'file', content: '6y2kwnwK6grgvwvpvLaa2T1cpFEKOhNR', size: 33 },
              'notes.txt': { type: 'file', content: 'Welcome to Cyber Citadel! Practice cat, ls, touch, grep, and pipes.', size: 62 },
            },
          },
          bandit1: {
            type: 'dir',
            children: {
              '-': { type: 'file', content: '263QgYKgLtSmLiBu16ZwHeEpWfh0Zw0A', size: 33 },
              'hints.txt': { type: 'file', content: 'Leading dashes can be opened with: cat ./- or cat -- -', size: 52 },
            },
          },
          bandit2: {
            type: 'dir',
            children: {
              'spaces in this filename': { type: 'file', content: 'MNk8KAF3cggoVxd6qq5SyMoNYb22jDe2', size: 33 },
            },
          },
          bandit3: {
            type: 'dir',
            children: {
              inhere: {
                type: 'dir',
                children: {
                  '.hidden': { type: 'file', content: '2WmrDFRmJIq3kgx4tKPrLfdRTbv3ZxAY', size: 33 },
                },
              },
            },
          },
          bandit4: {
            type: 'dir',
            children: {
              inhere: {
                type: 'dir',
                children: {
                  '-file00': { type: 'file', content: '\x00\x01\x02\x03\x04', size: 50 },
                  '-file01': { type: 'file', content: '\x10\x11\x12\x13', size: 60 },
                  '-file02': { type: 'file', content: '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR', size: 120 },
                  '-file03': { type: 'file', content: '\x7fELF\x02\x01\x01\x00\x00\x00', size: 240 },
                  '-file04': { type: 'file', content: '\x1f\x8b\x08\x00\x00\x00\x00\x00', size: 85 },
                  '-file07': { type: 'file', content: '4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw', size: 33 },
                },
              },
            },
          },
          bandit5: {
            type: 'dir',
            children: {
              inhere: {
                type: 'dir',
                children: {
                  maybehere01: {
                    type: 'dir',
                    children: {
                      file1: { type: 'file', content: 'Not this one', size: 12 },
                    },
                  },
                  maybehere07: {
                    type: 'dir',
                    children: {
                      '.file2': { type: 'file', content: 'HWasnPhtq9AVKe0dmk45nxy20cvUa6EG\n' + 'padding_data_to_reach_1033_bytes_'.repeat(30), size: 1033 },
                    },
                  },
                },
              },
            },
          },
          bandit6: {
            type: 'dir',
            children: {
              'task.txt': { type: 'file', content: 'Find a file owned by user bandit7, group bandit6, 33 bytes in size.', size: 67 },
            },
          },
          bandit7: {
            type: 'dir',
            children: {
              'data.txt': { type: 'file', content: 'millionth\tz7WtoNQU2XfjmMtWA8u5rN4vzqu4v99S\nsecond\tabc123\nthird\txyz789', size: 75 },
            },
          },
          bandit8: {
            type: 'dir',
            children: {
              'data.txt': { type: 'file', content: 'repeated_line_abc\nrepeated_line_abc\nTESKZC0XvTetysLTcq5ZWVTLL922CAmp\nrepeated_line_xyz\nrepeated_line_xyz', size: 110 },
            },
          },
          bandit9: {
            type: 'dir',
            children: {
              'data.txt': { type: 'file', content: '\x00\x01\x02========== the password is G7w8LIi6J3IVbDTbuHGDesymDaoPtKW8\x00\x03', size: 68 },
            },
          },
        },
      },
      etc: {
        type: 'dir',
        children: {
          bandit_pass: {
            type: 'dir',
            children: {
              bandit0: { type: 'file', content: 'bandit0', size: 7 },
              bandit1: { type: 'file', content: '6y2kwnwK6grgvwvpvLaa2T1cpFEKOhNR', size: 33 },
              bandit2: { type: 'file', content: '263QgYKgLtSmLiBu16ZwHeEpWfh0Zw0A', size: 33 },
              bandit3: { type: 'file', content: 'MNk8KAF3cggoVxd6qq5SyMoNYb22jDe2', size: 33 },
              bandit4: { type: 'file', content: '2WmrDFRmJIq3kgx4tKPrLfdRTbv3ZxAY', size: 33 },
            },
          },
        },
      },
      var: {
        type: 'dir',
        children: {
          log: {
            type: 'dir',
            children: {
              syslog: { type: 'file', content: 'Oct 14 06:25:01 systemd[1]: Started Cyber Citadel Linux Sandbox.', size: 64 },
            },
          },
        },
      },
    },
  });

  // Query items in current working directory for the visual explorer
  const directoryItems = React.useMemo(() => {
    // Reference fsRevision to ensure re-eval on file mutations
    void fsRevision;
    let curr: FileSystemNode | undefined = fsRef.current;
    for (const segment of currentPath) {
      if (!curr || curr.type !== 'dir' || !curr.children) return [];
      curr = curr.children[segment];
    }
    if (!curr || curr.type !== 'dir' || !curr.children) return [];

    const names = Object.keys(curr.children);
    const items = names.map((name) => {
      const child = curr!.children![name];
      const isDir = child.type === 'dir';
      const count = isDir && child.children ? Object.keys(child.children).length : undefined;
      const isBinary = !isDir && (child.content?.includes('\x00') || /[\x00-\x08\x0E-\x1F]/.test(child.content || ''));
      return {
        name,
        type: child.type,
        size: child.size || (isDir ? 4096 : (child.content?.length || 0)),
        permissions: child.permissions || (isDir ? 'drwxr-xr-x' : '-rw-r--r--'),
        owner: child.owner || currentUser,
        itemCount: count,
        content: child.content,
        isBinary,
        isHidden: name.startsWith('.'),
      };
    });

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return showDotfiles ? items : items.filter((it) => !it.isHidden);
  }, [currentPath, showDotfiles, fsRevision, currentUser]);

  // Click on a file in the explorer to open in the split-view reader
  const handleOpenFile = (item: {
    name: string;
    content?: string;
    size: number;
    permissions?: string;
    owner?: string;
    isBinary?: boolean;
  }) => {
    terminalAudio.playKeyClick();
    const fullPath = '/' + currentPath.join('/') + '/' + item.name;
    setOpenedFile({
      name: item.name,
      path: fullPath,
      content: item.content ?? '',
      size: item.size,
      permissions: item.permissions,
      owner: item.owner,
      isBinary: item.isBinary,
    });
    if (item.isBinary) {
      setFileViewMode('hex');
    } else {
      setFileViewMode('text');
    }
  };

  // Click on a folder to cd into it or up
  const handleNavigateDir = (dirName: string) => {
    terminalAudio.playKeyClick();
    if (dirName === '..') {
      if (currentPath.length > 0) {
        setCurrentPath((prev) => prev.slice(0, -1));
      }
    } else {
      setCurrentPath((prev) => [...prev, dirName]);
    }
  };

  // Breadcrumb segment click to jump to parent directory
  const handleBreadcrumbClick = (index: number) => {
    terminalAudio.playKeyClick();
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath((prev) => prev.slice(0, index + 1));
    }
  };

  // Execute cat command from file reader in the active terminal
  const handleRunCatInTerminal = (fileName: string) => {
    let formattedCmd = `cat ${fileName}`;
    if (fileName.includes(' ')) {
      formattedCmd = `cat "${fileName}"`;
    } else if (fileName.startsWith('-')) {
      formattedCmd = `cat ./${fileName}`;
    } else if (fileName.startsWith('.')) {
      formattedCmd = `cat ./${fileName}`;
    }
    terminalAudio.playReturnClick();
    executeCommand(formattedCmd);
  };

  const level = BANDIT_LEVELS[selectedLevelIndex] || BANDIT_LEVELS[0];

  const handleInsertCommand = (cmdText: string) => {
    // If command has placeholder or example, extract first executable command
    const primaryCmd = cmdText.split('\n')[0].trim();
    setInputVal(primaryCmd);
    setHistoryIdx(-1);
    setTempDraft('');
    inputRef.current?.focus();
  };

  const handleCopyCommand = (name: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(name);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Automatically focus command input field when tab becomes active, on mount, or when browser tab/window is focused
  useEffect(() => {
    if (!isActive) return;

    const focusInput = () => {
      // Focus command input if element is present in DOM
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Immediate focus call and microtask frame for initial render
    focusInput();
    const frameId = requestAnimationFrame(focusInput);
    const timeoutId = setTimeout(focusInput, 60);

    // Focus when browser window or document tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        focusInput();
      }
    };

    const handleWindowFocus = () => {
      if (isActive) {
        focusInput();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isActive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Keep selected level password input synced
  useEffect(() => {
    const saved = banditPasswords[selectedLevelIndex] || (selectedLevelIndex === 0 ? 'bandit0' : '');
    setLevelPasswordInput(saved);
  }, [selectedLevelIndex, banditPasswords]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFlag(text);
    setTimeout(() => setCopiedFlag(null), 2500);
  };

  // =========================================================================
  // LIVE SSH ENGINE: CONNECT & EXECUTE
  // =========================================================================
  const connectToLiveBandit = async (levelNumber: number, explicitPassword?: string) => {
    setIsConnectingSsh(true);
    const targetUser = `bandit${levelNumber}`;
    const targetHost = 'bandit.labs.overthewire.org';
    const targetPort = 2220;
    const pwd = explicitPassword ?? (banditPasswords[levelNumber] || (levelNumber === 0 ? 'bandit0' : levelPasswordInput));

    setHistory((prev) => [
      ...prev,
      {
        type: 'output',
        text: `[SSH CONNECTING] Connecting to ${targetUser}@${targetHost}:${targetPort}...`,
      },
    ]);

    try {
      const res = await fetch('/api/ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          host: targetHost,
          port: targetPort,
          username: targetUser,
          password: pwd,
          timeoutMs: 12000,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        terminalAudio.playErrorBeep();
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `[SSH ERROR] ${data.error || 'Failed to authenticate on Bandit server.'}\nTip: Ensure you have the correct password for bandit${levelNumber}!`,
            isError: true,
          },
        ]);
        setIsConnectingSsh(false);
        return;
      }

      // Successful connection!
      terminalAudio.playConnectChime();
      setIsLiveSshMode(true);
      setSshUser(targetUser);
      setSshPassword(pwd);
      setSshHost(targetHost);
      setSshPort(targetPort);
      setSshCwd(data.defaultDir || `/home/${targetUser}`);

      // Auto-save password if valid
      if (onSaveBanditPassword && pwd) {
        onSaveBanditPassword(levelNumber, pwd);
      }

      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `=================================================================\n[LIVE SSH CONNECTED] Real OverTheWire Bandit Session Established!\nHost: ${targetHost}:${targetPort}\nUser: ${targetUser}\nRemote System: ${data.systemInfo || 'Linux gibson-1 Ubuntu'}\nWorking Directory: ${data.defaultDir || `/home/${targetUser}`}\n=================================================================\nEvery command you type now executes directly on the remote Bandit server.\nType "exit" or "logout" to disconnect.`,
          isSuccess: true,
        },
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `[SSH NETWORK ERROR] ${err?.message || 'Could not reach SSH gateway.'}`,
          isError: true,
        },
      ]);
    } finally {
      setIsConnectingSsh(false);
    }
  };

  const disconnectLiveSsh = () => {
    setIsLiveSshMode(false);
    setHistory((prev) => [
      ...prev,
      {
        type: 'output',
        text: `Connection to ${sshHost}:${sshPort} closed. Switched back to local virtual sandbox.`,
      },
    ]);
  };

  const executeRemoteCommand = async (cmd: string) => {
    setIsExecutingRemote(true);
    try {
      const res = await fetch('/api/ssh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'exec',
          host: sshHost,
          port: sshPort,
          username: sshUser,
          password: sshPassword,
          command: cmd,
          cwd: sshCwd,
          timeoutMs: 15000,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        terminalAudio.playErrorBeep();
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `[REMOTE ERROR]: ${data.error || 'Remote command failed.'}`,
            isError: true,
          },
        ]);
        return;
      }

      if (data.stdout) {
        setHistory((prev) => [...prev, { type: 'output', text: data.stdout }]);
      }
      if (data.stderr) {
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: data.stderr, isError: true },
        ]);
      }

      // Update remote working directory if cd changed it
      if (data.newCwd) {
        setSshCwd(data.newCwd);
      }

      // Check if any Bandit passwords / flags were discovered!
      if (data.detectedFlags && data.detectedFlags.length > 0) {
        terminalAudio.playSuccessBeep();
        const foundFlags = data.detectedFlags as string[];
        setDetectedFlags((prev) => Array.from(new Set([...prev, ...foundFlags])));

        const currentLvlNum = parseInt(sshUser.replace('bandit', ''), 10);
        const nextLvlNum = isNaN(currentLvlNum) ? 1 : currentLvlNum + 1;
        const mainFlag = foundFlags[0];

        setUnlockedNotice(
          `Level ${nextLvlNum} Password Found: ${mainFlag}`
        );

        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `🎉 [FLAG DETECTED] Password Found: ${mainFlag}\nThis is the password for Level ${nextLvlNum}! Save it to unlock the next level.`,
            isSuccess: true,
          },
        ]);
      }
    } catch (err: any) {
      terminalAudio.playErrorBeep();
      setHistory((prev) => [
        ...prev,
        {
          type: 'output',
          text: `[REMOTE EXEC ERROR]: ${err?.message || 'Failed to communicate with remote server.'}`,
          isError: true,
        },
      ]);
    } finally {
      setIsExecutingRemote(false);
    }
  };

  // Helper to resolve paths in virtual filesystem
  const getNodeAtPath = (pathArray: string[]): FileSystemNode | null => {
    let curr: FileSystemNode | undefined = fsRef.current;
    for (const segment of pathArray) {
      if (!curr || curr.type !== 'dir' || !curr.children) return null;
      curr = curr.children[segment];
    }
    return curr || null;
  };

  // Save detected flag and unlock level
  const handleSaveAndUnlockNext = (flag: string) => {
    const currentLvlNum = parseInt(sshUser.replace('bandit', ''), 10);
    const nextLvlNum = isNaN(currentLvlNum) ? 1 : currentLvlNum + 1;

    if (onSaveBanditPassword) {
      onSaveBanditPassword(nextLvlNum, flag);
    }
    if (!solvedLevels.includes(currentLvlNum)) {
      onToggleLevel(currentLvlNum);
    }

    setUnlockedNotice(`Saved password for Level ${nextLvlNum} and unlocked!`);
    setTimeout(() => setUnlockedNotice(null), 4000);
  };

  // Main command executor
  const executeCommand = (cmdLine: string) => {
    const trimmed = cmdLine.trim();
    if (!trimmed) return;

    // If awaiting password for interactive SSH, do NOT store credentials in command history!
    if (awaitingPasswordFor) {
      const { user, host, port } = awaitingPasswordFor;
      setAwaitingPasswordFor(null);
      setHistory((prev) => [
        ...prev,
        { type: 'input', text: '••••••••••••' },
      ]);
      const levelMatch = user.match(/bandit(\d+)/);
      const lvlNum = levelMatch ? parseInt(levelMatch[1], 10) : 0;
      connectToLiveBandit(lvlNum, trimmed);
      return;
    }

    // Save command to history (avoid consecutive duplicates)
    setCmdHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === trimmed) {
        return prev;
      }
      return [...prev, trimmed];
    });
    setHistoryIdx(-1);
    setTempDraft('');

    // --- MODE 1: LIVE SSH MODE TO OVERTHEWIRE ---
    if (isLiveSshMode) {
      setHistory((prev) => [
        ...prev,
        {
          type: 'input',
          text: `${sshUser}@bandit:${sshCwd}$ ${trimmed}`,
        },
      ]);

      if (trimmed === 'exit' || trimmed === 'logout') {
        disconnectLiveSsh();
        return;
      }

      if (trimmed === 'clear') {
        setHistory([]);
        return;
      }

      // Execute on remote real server!
      executeRemoteCommand(trimmed);
      return;
    }

    // --- MODE 2: LOCAL VIRTUAL SANDBOX ---
    setHistory((prev) => [
      ...prev,
      {
        type: 'input',
        text: `${currentUser}@odyssey-box:~${currentPath.length > 2 ? '/' + currentPath.slice(2).join('/') : ''}$ ${trimmed}`,
      },
    ]);

    // Check for SSH command in sandbox mode to jump directly into Live SSH!
    if (trimmed.startsWith('ssh ')) {
      const parts = trimmed.split(/\s+/);
      const userAndHost = parts.find((p) => p.includes('@') || p.startsWith('bandit')) || 'bandit0';
      const user = userAndHost.includes('@') ? userAndHost.split('@')[0] : userAndHost;
      const host = userAndHost.includes('@') ? userAndHost.split('@')[1] : 'bandit.labs.overthewire.org';
      const portIdx = parts.indexOf('-p');
      const port = portIdx !== -1 && parts[portIdx + 1] ? parseInt(parts[portIdx + 1], 10) : 2220;

      const levelMatch = user.match(/bandit(\d+)/);
      const levelNum = levelMatch ? parseInt(levelMatch[1], 10) : 0;

      const knownPwd = banditPasswords[levelNum] || (levelNum === 0 ? 'bandit0' : '');

      if (knownPwd) {
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `[SSH] Found saved credentials for ${user}. Authenticating...`,
          },
        ]);
        connectToLiveBandit(levelNum, knownPwd);
      } else {
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `${user}@${host}'s password: `,
          },
        ]);
        setAwaitingPasswordFor({ user, host, port });
      }
      return;
    }

    // Handle redirection (e.g. echo "hello" > file.txt)
    if (trimmed.includes('>') || trimmed.includes('>>')) {
      handleRedirection(trimmed);
      return;
    }

    // Handle pipes
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map((p) => p.trim());
      handlePipedCommand(parts);
      return;
    }

    const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const command = tokens[0]?.toLowerCase();
    const args = tokens.slice(1).map((a) => a.replace(/^"|"$/g, ''));

    switch (command) {
      case 'clear':
        setHistory([]);
        break;

      case 'help':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `CS Odyssey Linux & Bandit Wargame Shell:
  OverTheWire Live SSH:
    ssh bandit0           Connect to OverTheWire Bandit Level 0 (Live!)
    ssh banditX           Connect to any Bandit level using saved password
    exit                  Disconnect from Live SSH and return to sandbox
    
  File Operations:
    ls [-la]              List directory files (use -la for hidden files)
    cd <dir>              Change directory (e.g. cd inhere, cd ..)
    pwd                   Print working directory path
    cat <file>            Print file content (e.g. cat readme, cat ./-)
    head / tail [-n X]    Print first or last X lines of a file
    touch <file>          Create a new empty file
    mkdir [-p] <dir>      Create directory
    rm [-r] <file>        Remove file or directory
    cp <src> <dst>        Copy file
    mv <src> <dst>        Move/rename file
    
  Text & Filtering:
    grep <pattern> <file> Search text in file
    sort <file>           Sort lines alphabetically
    uniq [-u]             Omit or filter repeated lines (use -u for unique)
    strings <file>        Print printable strings in binary file
    base64 [-d] <file>    Encode or decode Base64 strings
    tr <set1> <set2>      Translate characters (ROT13 decoding)
    find <dir> -type f    Search for files by type/size
    file <file>           Determine file type and MIME
    
  System & Diagnostics:
    whoami, uname, df, free, ps aux, tree, which, sudo, nmap, wget
    env / export          View or set environment variables
    man <cmd>             Show comprehensive manual page for command`,
          },
        ]);
        break;

      case 'pwd':
        setHistory((prev) => [
          ...prev,
          { type: 'output', text: '/' + currentPath.join('/') },
        ]);
        break;

      case 'whoami':
        setHistory((prev) => [...prev, { type: 'output', text: currentUser }]);
        break;

      case 'ls': {
        const currNode = getNodeAtPath(currentPath);
        if (!currNode || currNode.type !== 'dir' || !currNode.children) {
          setHistory((prev) => [...prev, { type: 'output', text: '' }]);
          break;
        }

        const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
        const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');

        const entries = Object.keys(currNode.children).filter((name) =>
          showAll ? true : !name.startsWith('.')
        );

        if (showLong) {
          const lines = entries.map((name) => {
            const child = currNode.children![name];
            const isDir = child.type === 'dir';
            const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
            const size = child.size || (isDir ? 4096 : 33);
            const owner = child.owner || currentUser;
            return `${perm} 1 ${owner} ${owner} ${size.toString().padStart(5, ' ')} Oct 14 12:00 ${name}`;
          });
          setHistory((prev) => [
            ...prev,
            { type: 'output', text: `total ${entries.length * 4}\n` + lines.join('\n') },
          ]);
        } else {
          setHistory((prev) => [
            ...prev,
            { type: 'output', text: entries.join('  ') },
          ]);
        }
        break;
      }

      case 'cd': {
        const target = args[0];
        if (!target || target === '~') {
          setCurrentPath(['home', currentUser]);
          break;
        }

        try {
          const newPath = resolveVirtualPath(currentPath, target);
          const node = getNodeAtPath(newPath);
          if (!node) {
            setHistory((prev) => [
              ...prev,
              { type: 'output', text: `bash: cd: ${target}: No such file or directory` },
            ]);
          } else if (node.type !== 'dir') {
            setHistory((prev) => [
              ...prev,
              { type: 'output', text: `bash: cd: ${target}: Not a directory` },
            ]);
          } else {
            setCurrentPath(newPath);
          }
        } catch (pathErr: any) {
          setHistory((prev) => [
            ...prev,
            { type: 'output', text: `bash: cd: ${pathErr.message}`, isError: true },
          ]);
        }
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          setHistory((prev) => [...prev, { type: 'output', text: 'cat: missing file operand' }]);
          break;
        }

        const target = args.join(' ');
        try {
          const targetSegments = resolveVirtualPath(currentPath, target);
          if (targetSegments.length === 0) {
            setHistory((prev) => [...prev, { type: 'output', text: `cat: ${target}: Is a directory` }]);
            break;
          }
          const parentSegments = targetSegments.slice(0, -1);
          const fileName = targetSegments[targetSegments.length - 1];
          const parentNode = getNodeAtPath(parentSegments);

          if (parentNode && parentNode.type === 'dir' && parentNode.children && parentNode.children[fileName]) {
            const file = parentNode.children[fileName];
            if (file.type === 'dir') {
              setHistory((prev) => [...prev, { type: 'output', text: `cat: ${target}: Is a directory` }]);
            } else {
              setHistory((prev) => [...prev, { type: 'output', text: sanitizeTerminalOutput(file.content || '') }]);
              setOpenedFile({
                name: fileName,
                path: '/' + targetSegments.join('/'),
                content: file.content || '',
                size: file.size || (file.content || '').length,
                permissions: file.permissions || '-rw-r--r--',
                owner: file.owner || currentUser,
                isBinary: file.content?.includes('\x00') || /[\x00-\x08\x0E-\x1F]/.test(file.content || ''),
              });
            }
          } else {
            setHistory((prev) => [
              ...prev,
              { type: 'output', text: `cat: ${target}: No such file or directory` },
            ]);
          }
        } catch (pathErr: any) {
          setHistory((prev) => [
            ...prev,
            { type: 'output', text: `cat: ${pathErr.message}`, isError: true },
          ]);
        }
        break;
      }

      case 'touch': {
        if (args.length === 0) {
          setHistory((prev) => [...prev, { type: 'output', text: 'touch: missing file operand' }]);
          break;
        }
        const target = args[0];
        try {
          const targetSegments = resolveVirtualPath(currentPath, target);
          const parentSegments = targetSegments.slice(0, -1);
          const fileName = targetSegments[targetSegments.length - 1];
          const parentNode = getNodeAtPath(parentSegments);
          if (parentNode && parentNode.type === 'dir') {
            if (!parentNode.children) parentNode.children = {};
            if (!parentNode.children[fileName]) {
              parentNode.children[fileName] = {
                type: 'file',
                content: '',
                size: 0,
                permissions: '-rw-r--r--',
                owner: currentUser,
              };
            }
            setFsRevision((r) => r + 1);
          } else {
            setHistory((prev) => [...prev, { type: 'output', text: `touch: cannot touch '${target}': No such file or directory`, isError: true }]);
          }
        } catch (err: any) {
          setHistory((prev) => [...prev, { type: 'output', text: `touch: ${err.message}`, isError: true }]);
        }
        break;
      }

      case 'mkdir': {
        if (args.length === 0) {
          setHistory((prev) => [...prev, { type: 'output', text: 'mkdir: missing operand' }]);
          break;
        }
        const target = args[0];
        try {
          const targetSegments = resolveVirtualPath(currentPath, target);
          const parentSegments = targetSegments.slice(0, -1);
          const dirName = targetSegments[targetSegments.length - 1];
          const parentNode = getNodeAtPath(parentSegments);
          if (parentNode && parentNode.type === 'dir') {
            if (!parentNode.children) parentNode.children = {};
            if (parentNode.children[dirName]) {
              setHistory((prev) => [...prev, { type: 'output', text: `mkdir: cannot create directory '${target}': File exists`, isError: true }]);
            } else {
              parentNode.children[dirName] = {
                type: 'dir',
                children: {},
                permissions: 'drwxr-xr-x',
                owner: currentUser,
              };
              setFsRevision((r) => r + 1);
            }
          } else {
            setHistory((prev) => [...prev, { type: 'output', text: `mkdir: cannot create directory '${target}': No such file or directory`, isError: true }]);
          }
        } catch (err: any) {
          setHistory((prev) => [...prev, { type: 'output', text: `mkdir: ${err.message}`, isError: true }]);
        }
        break;
      }

      case 'rm': {
        if (args.length === 0) {
          setHistory((prev) => [...prev, { type: 'output', text: 'rm: missing operand' }]);
          break;
        }
        const isRecursive = args.includes('-r') || args.includes('-rf') || args.includes('-R');
        const target = args.find((a) => !a.startsWith('-')) || '';
        if (!target) {
          setHistory((prev) => [...prev, { type: 'output', text: 'rm: missing operand' }]);
          break;
        }
        try {
          const targetSegments = resolveVirtualPath(currentPath, target);
          const parentSegments = targetSegments.slice(0, -1);
          const itemName = targetSegments[targetSegments.length - 1];
          const parentNode = getNodeAtPath(parentSegments);
          if (parentNode && parentNode.type === 'dir' && parentNode.children && parentNode.children[itemName]) {
            const item = parentNode.children[itemName];
            if (item.type === 'dir' && !isRecursive) {
              setHistory((prev) => [...prev, { type: 'output', text: `rm: cannot remove '${target}': Is a directory`, isError: true }]);
            } else {
              delete parentNode.children[itemName];
              if (openedFile && openedFile.name === itemName) {
                setOpenedFile(null);
              }
              setFsRevision((r) => r + 1);
            }
          } else {
            setHistory((prev) => [...prev, { type: 'output', text: `rm: cannot remove '${target}': No such file or directory`, isError: true }]);
          }
        } catch (err: any) {
          setHistory((prev) => [...prev, { type: 'output', text: `rm: ${err.message}`, isError: true }]);
        }
        break;
      }

      case 'uname':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: args.includes('-a')
              ? 'Linux odyssey-box 6.2.0-39-generic #40-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'
              : 'Linux',
          },
        ]);
        break;

      case 'free':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: '               total        used        free      shared  buff/cache   available\nMem:        16384 MB     4210 MB    10820 MB      256 MB     1354 MB    11818 MB\nSwap:        4096 MB        0 MB     4096 MB',
          },
        ]);
        break;

      case 'df':
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: 'Filesystem     1K-blocks      Used Available Use% Mounted on\n/dev/root       98304000  24576000  68728000  27% /\ntmpfs            8192000         0   8192000   0% /dev/shm\n/dev/sda1         512000     64000    448000  13% /boot',
          },
        ]);
        break;

      case 'echo': {
        let output = args.join(' ');
        output = output.replace(/\$([A-Za-z_]+)/g, (_, varName) => envVars[varName] || '');
        setHistory((prev) => [...prev, { type: 'output', text: output }]);
        break;
      }

      default:
        setHistory((prev) => [
          ...prev,
          {
            type: 'output',
            text: `bash: ${command}: command not found. Type "help" or connect to Live SSH to run native OverTheWire Linux commands.`,
          },
        ]);
        break;
    }
  };

  const handleRedirection = (line: string) => {
    const isAppend = line.includes('>>');
    const separator = isAppend ? '>>' : '>';
    const [left, right] = line.split(separator).map((s) => s.trim());
    const targetFile = right;

    let contentToWrite = left;
    if (left.startsWith('echo ')) {
      contentToWrite = left.slice(5).replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }

    try {
      const targetSegments = resolveVirtualPath(currentPath, targetFile);
      if (targetSegments.length === 0) {
        setHistory((prev) => [...prev, { type: 'output', text: `bash: ${targetFile}: Is a directory`, isError: true }]);
        return;
      }
      const parentSegments = targetSegments.slice(0, -1);
      const fileName = targetSegments[targetSegments.length - 1];
      const parentNode = getNodeAtPath(parentSegments);

      if (parentNode && parentNode.type === 'dir') {
        if (!parentNode.children) parentNode.children = {};
        const existing = parentNode.children[fileName];

        if (isAppend && existing && existing.type === 'file') {
          existing.content = (existing.content || '') + '\n' + contentToWrite;
          existing.size = (existing.content || '').length;
        } else {
          parentNode.children[fileName] = {
            type: 'file',
            content: contentToWrite,
            size: contentToWrite.length,
          };
        }
        setFsRevision((r) => r + 1);
        setHistory((prev) => [...prev, { type: 'output', text: '' }]);
      } else {
        setHistory((prev) => [...prev, { type: 'output', text: `bash: ${targetFile}: No such directory`, isError: true }]);
      }
    } catch (err: any) {
      setHistory((prev) => [...prev, { type: 'output', text: `bash: ${err.message}`, isError: true }]);
    }
  };

  const handlePipedCommand = (pipeline: string[]) => {
    const full = pipeline.join(' | ');
    if (full.includes('sort') && full.includes('uniq')) {
      setHistory((prev) => [
        ...prev,
        { type: 'output', text: '4CKM11Rhssfk2019UNIQUEFLAG  (Unique line found!)' },
      ]);
    } else if (full.includes('grep')) {
      setHistory((prev) => [
        ...prev,
        { type: 'output', text: 'millionth\tdf763n810dksl2019a83jdhf7823' },
      ]);
    } else {
      setHistory((prev) => [
        ...prev,
        { type: 'output', text: `[Pipe executed]: Output filtered.` },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      terminalAudio.playReturnClick();
      executeCommand(inputVal);
      setInputVal('');
      setHistoryIdx(-1);
      setTempDraft('');
    } else if (e.key === 'ArrowUp') {
      // Don't browse history if entering interactive password or if history is empty
      if (awaitingPasswordFor || cmdHistory.length === 0) return;
      e.preventDefault();
      terminalAudio.playKeyClick();

      let targetIdx: number;
      if (historyIdx === -1) {
        // Cache current draft input before navigating backward
        setTempDraft(inputVal);
        targetIdx = cmdHistory.length - 1;
      } else if (historyIdx > 0) {
        targetIdx = historyIdx - 1;
      } else {
        // Already at oldest recorded command
        targetIdx = 0;
      }

      setHistoryIdx(targetIdx);
      const targetCmd = cmdHistory[targetIdx];
      setInputVal(targetCmd);

      // Keep input reactive and position caret at end of text
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(targetCmd.length, targetCmd.length);
        }
      });
    } else if (e.key === 'ArrowDown') {
      // Don't browse history if entering interactive password or not in history browsing mode
      if (awaitingPasswordFor || historyIdx === -1) return;
      e.preventDefault();
      terminalAudio.playKeyClick();

      if (historyIdx < cmdHistory.length - 1) {
        const targetIdx = historyIdx + 1;
        setHistoryIdx(targetIdx);
        const targetCmd = cmdHistory[targetIdx];
        setInputVal(targetCmd);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(targetCmd.length, targetCmd.length);
          }
        });
      } else {
        // Returned to newest prompt: restore drafted input
        setHistoryIdx(-1);
        setInputVal(tempDraft);
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(tempDraft.length, tempDraft.length);
          }
        });
      }
    } else if (e.key === 'Escape') {
      // Escape key cancels history browsing and restores original draft
      if (historyIdx !== -1) {
        e.preventDefault();
        terminalAudio.playKeyClick();
        setHistoryIdx(-1);
        setInputVal(tempDraft);
      }
    }
  };

  const isLevelSolved = solvedLevels.includes(level.level);
  const savedPasswordForSelected = banditPasswords[level.level] || (level.level === 0 ? 'bandit0' : '');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Banner: Real Live SSH Status & Fast Switch */}
      <div className="optical-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border backdrop-blur-sm ${
              isLiveSshMode
                ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                : 'bg-cyan-500/12 border-cyan-400/30 text-cyan-300'
            }`}
          >
            {isLiveSshMode ? <Wifi className="h-5 w-5" /> : <Terminal className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-sm font-semibold text-white tracking-tight">
                {isLiveSshMode ? 'Live Wargame SSH Session' : 'Cyber Citadel Linux Shell'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                · {isLiveSshMode ? `Connected · ${sshHost}:${sshPort}` : 'Offline Citadel Sandbox'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLiveSshMode
                ? `Logged in as ${sshUser}. Commands execute in real time over the hardened SSH bridge.`
                : 'Practice in the self-contained virtual Citadel filesystem or connect live via the educational SSH bridge.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#040710]/70 px-2.5 py-1.5"
            title={audioEnabled ? 'Retro Audio Feedback: Enabled' : 'Retro Audio Feedback: Muted'}
          >
            {audioEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="text-[11px] font-mono text-slate-300">Audio</span>
            <SoapBubbleToggle
              checked={audioEnabled}
              onCheckedChange={() => handleToggleAudio()}
              aria-label="Toggle terminal retro audio feedback"
              scale={0.55}
              color="#f59e0b"
            />
          </div>

          <button
            onClick={() => setShowCheatSheet(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] hover:border-indigo-400/40 text-xs font-mono font-semibold text-indigo-300 transition-colors cursor-pointer"
            title="Open Interactive Master Cheat Sheet"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>Cheat Sheet</span>
          </button>

          {isLiveSshMode ? (
            <SoapBubbleButton
              onClick={disconnectLiveSsh}
              tint="rgb(244 63 94)"
              opacity={0.9}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-4 font-mono font-semibold text-white"
            >
              Disconnect SSH
            </SoapBubbleButton>
          ) : (
            <SoapBubbleButton
              onClick={() => connectToLiveBandit(selectedLevelIndex, levelPasswordInput)}
              disabled={isConnectingSsh}
              tint="rgb(16 185 129)"
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="!min-h-[34px] !px-4 font-mono font-semibold text-white"
            >
              <span className="inline-flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5" />
                <span>{isConnectingSsh ? 'Connecting...' : `Live SSH: L${selectedLevelIndex}`}</span>
              </span>
            </SoapBubbleButton>
          )}

          <button
            onClick={() => onOpenAiMentor(`ELI9: Explain the goal of Citadel Level ${level.level} and what command I should use on the remote server.`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-xs font-mono font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <span>AI Coach</span>
          </button>

          <button
            onClick={() => setShowQuickRef(!showQuickRef)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-semibold transition-colors cursor-pointer ${
              showQuickRef
                ? 'border-indigo-400/45 bg-indigo-500/15 text-indigo-200'
                : 'border-white/[0.08] bg-[#040710]/70 text-slate-400 hover:text-slate-200 hover:border-white/[0.15]'
            }`}
            title="Toggle Command Quick-Reference side panel"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
            <span>{showQuickRef ? 'Hide Ref' : 'Quick Ref'}</span>
          </button>
        </div>
      </div>

      {/* Flag / Password Unlocked Banner */}
      {unlockedNotice && (
        <div className="optical-panel rounded-2xl border-emerald-400/40 bg-emerald-500/10 p-4 text-xs font-mono text-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">{unlockedNotice}</span>
          </div>
          <button
            onClick={() => setUnlockedNotice(null)}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split: Left Sidebar & Right Terminal */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Pane: Bandit Level Navigator */}
        <div className="lg:w-80 shrink-0 space-y-4">
          <div className="optical-panel rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">OverTheWire Bandit</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold tabular-nums">
                {solvedLevels.length} / {BANDIT_LEVELS.length} Solved
              </span>
            </div>
            <h3 className="font-display text-sm font-semibold text-white mb-1">Linux Wargame Levels</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Real servers hosted by OverTheWire. Connect to retrieve each level&apos;s password.
            </p>

            {/* Level Quick Grid */}
            <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {BANDIT_LEVELS.map((lvl) => {
                const isSelected = lvl.level === selectedLevelIndex;
                const isSolved = solvedLevels.includes(lvl.level);
                return (
                  <button
                    key={lvl.level}
                    onClick={() => {
                      setSelectedLevelIndex(lvl.level);
                      setShowHint(false);
                      terminalAudio.playKeyClick();
                      if (!isLiveSshMode) {
                        setCurrentPath(['home', `bandit${lvl.level}`]);
                        setCurrentUser(`bandit${lvl.level}`);
                        setOpenedFile(null);
                      }
                    }}
                    className={`py-2 px-1 text-xs font-mono rounded-lg border transition-colors flex items-center justify-center gap-1 cursor-pointer tabular-nums ${
                      isSelected
                        ? 'border-cyan-400/50 bg-cyan-500/18 text-cyan-200 font-semibold'
                        : isSolved
                        ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 font-medium'
                        : 'border-white/[0.07] bg-[#040710]/70 text-slate-400 hover:text-slate-200 hover:border-white/[0.15]'
                    }`}
                  >
                    <span>L{lvl.level}</span>
                    {isSolved && <CheckCircle2 className="h-2.5 w-2.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level Details Card */}
          <div className="optical-panel rounded-2xl p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-display text-sm font-semibold text-white">{level.title}</h4>
              <button
                onClick={() => onToggleLevel(level.level)}
                className={`flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isLevelSolved
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                    : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                {isLevelSolved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                <span>{isLevelSolved ? 'Solved' : 'Mark Solved'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{level.goal}</p>

            {/* Saved Password for this level */}
            <div className="optical-inset p-3 rounded-xl space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <Key className="h-3 w-3 text-amber-400" />
                  <span>Bandit Level {level.level} Password</span>
                </span>
                {savedPasswordForSelected && (
                  <button
                    onClick={() => copyToClipboard(savedPasswordForSelected)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedFlag === savedPasswordForSelected ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>Copy</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={levelPasswordInput}
                onChange={(e) => {
                  setLevelPasswordInput(e.target.value);
                  if (onSaveBanditPassword && e.target.value) {
                    onSaveBanditPassword(level.level, e.target.value);
                  }
                }}
                placeholder={level.level === 0 ? 'bandit0' : 'Paste retrieved password...'}
                className="w-full bg-[#040710]/90 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            {/* Commands to research */}
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-400">Commands to research:</div>
              <div className="flex flex-wrap gap-1.5">
                {level.usefulCommands.map((cmd) => (
                  <code key={cmd} className="bg-[#040710]/80 border border-white/[0.08] rounded-md px-2 py-0.5 text-cyan-300">
                    {cmd}
                  </code>
                ))}
              </div>
            </div>

            {/* Hint Revealer */}
            <div className="pt-2.5 border-t border-white/[0.08]">
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] transition-colors cursor-pointer"
              >
                {showHint ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-amber-400" />}
                <span>{showHint ? 'Hide Hint' : 'Reveal Helpful Hint'}</span>
              </button>

              {showHint && (
                <div className="mt-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 p-3 text-xs text-amber-200 leading-relaxed font-sans">
                  {level.hint}
                </div>
              )}
            </div>

            {/* Live SSH Connect Button */}
            <SoapBubbleButton
              onClick={() => connectToLiveBandit(level.level, levelPasswordInput)}
              disabled={isConnectingSsh}
              tint="rgb(16 185 129)"
              opacity={0.92}
              style={{ fontSize: 12 }}
              className="w-full !min-h-[38px] font-mono font-semibold text-white"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <Wifi className="h-3.5 w-3.5" />
                <span>{isConnectingSsh ? 'Connecting...' : `Connect Live to Level ${level.level}`}</span>
              </span>
            </SoapBubbleButton>
          </div>
        </div>

        {/* Right Pane: Interactive Terminal Window */}
        <div className="flex-1 optical-panel rounded-2xl flex flex-col h-[650px] overflow-hidden font-mono">
          {/* Terminal Window Chrome / Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#040710]/85 px-4 py-2.5 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5 truncate">
                {isLiveSshMode ? (
                  <>
                    <Wifi className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-semibold">{sshUser}@bandit.labs.overthewire.org</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-cyan-300 truncate">{sshCwd}</span>
                  </>
                ) : (
                  <span className="truncate">bash — guest@odyssey-box: ~ (Sandbox)</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
              {isExecutingRemote && (
                <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 mr-1">
                  <RotateCcw className="h-3 w-3 animate-spin" />
                  <span>Executing...</span>
                </span>
              )}
              {openedFile && (
                <button
                  onClick={() => {
                    terminalAudio.playKeyClick();
                    setOpenedFile(null);
                  }}
                  className="flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg text-[11px] font-mono bg-cyan-500/15 text-cyan-200 border border-cyan-400/35"
                  title="Close split-view reader"
                >
                  <Columns className="h-3 w-3 text-cyan-400" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">{openedFile.name}</span>
                  <span className="text-slate-400 hover:text-white ml-0.5">✕</span>
                </button>
              )}
              <button
                onClick={() => {
                  terminalAudio.playKeyClick();
                  setShowFsView(!showFsView);
                }}
                className={`flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg text-[11px] font-mono border ${
                  showFsView
                    ? 'bg-cyan-500/15 text-cyan-200 border-cyan-400/35 font-semibold'
                    : 'border-transparent hover:bg-white/[0.05] hover:text-slate-200'
                }`}
                title="Toggle Interactive Working Directory Explorer"
              >
                <Folder className="h-3 w-3 text-cyan-400" />
                <span>Files</span>
              </button>
              <button
                onClick={() => {
                  terminalAudio.playKeyClick();
                  setShowAsciiHeader(!showAsciiHeader);
                }}
                className={`flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg text-[11px] font-mono border ${
                  showAsciiHeader
                    ? 'bg-purple-500/15 text-purple-200 border-purple-400/35 font-semibold'
                    : 'border-transparent hover:bg-white/[0.05] hover:text-slate-200'
                }`}
                title="Toggle Customizable ASCII Art Header"
              >
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span>ASCII</span>
              </button>
              <button
                onClick={() => setShowQuickRef(!showQuickRef)}
                className={`flex items-center gap-1 transition-colors cursor-pointer px-2 py-1 rounded-lg text-[11px] font-mono border ${
                  showQuickRef
                    ? 'bg-indigo-500/15 text-indigo-200 border-indigo-400/35'
                    : 'border-transparent hover:bg-white/[0.05] hover:text-slate-200'
                }`}
                title="Toggle Command Quick-Reference panel"
              >
                <BookOpen className="h-3 w-3 text-indigo-400" />
                <span>Quick-Ref</span>
              </button>
              <button
                onClick={() => setHistory([])}
                className="px-2 py-1 rounded-lg hover:bg-white/[0.05] hover:text-slate-200 transition-colors cursor-pointer text-[11px]"
              >
                Clear
              </button>
              {isLiveSshMode ? (
                <button
                  onClick={disconnectLiveSsh}
                  className="px-2 py-1 rounded-lg text-rose-400 hover:text-rose-300 cursor-pointer font-semibold text-[11px]"
                >
                  Exit SSH
                </button>
              ) : (
                <button
                  onClick={() => connectToLiveBandit(selectedLevelIndex)}
                  className="px-2 py-1 rounded-lg text-emerald-400 hover:text-emerald-300 cursor-pointer font-semibold text-[11px]"
                >
                  Live SSH
                </button>
              )}
            </div>
          </div>

          {/* Interactive Working Directory Explorer Bar */}
          {showFsView && (
            <div className="border-b border-white/[0.08] bg-[#040710]/75 px-3.5 py-2 flex flex-col gap-1.5 transition-all">
              {/* Path Breadcrumbs & Controls */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                    <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">DIR:</span>
                  </span>

                  {/* Root button */}
                  <button
                    onClick={() => handleBreadcrumbClick(-1)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      currentPath.length === 0
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/35'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                    title="Root directory (/)"
                  >
                    /
                  </button>

                  {/* Path segments */}
                  {currentPath.map((seg, idx) => {
                    const isLast = idx === currentPath.length - 1;
                    return (
                      <React.Fragment key={idx}>
                        <span className="text-slate-600">/</span>
                        <button
                          onClick={() => handleBreadcrumbClick(idx)}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                            isLast
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/35'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                          }`}
                          title={`Navigate to /${currentPath.slice(0, idx + 1).join('/')}`}
                        >
                          {seg}
                        </button>
                      </React.Fragment>
                    );
                  })}

                  {/* Up button if not at root */}
                  {currentPath.length > 0 && (
                    <button
                      onClick={() => handleNavigateDir('..')}
                      className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-0.5 cursor-pointer"
                      title="Parent Directory (cd ..)"
                    >
                      <ArrowUp className="h-2.5 w-2.5" />
                      <span>..</span>
                    </button>
                  )}
                </div>

                {/* Right controls: Item count & Dotfiles toggle */}
                <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                  <span className="text-slate-500 font-mono text-[10px] tabular-nums">
                    {directoryItems.length} {directoryItems.length === 1 ? 'item' : 'items'}
                  </span>

                  <button
                    onClick={() => setShowDotfiles(!showDotfiles)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors flex items-center gap-1 cursor-pointer ${
                      showDotfiles
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/35'
                        : 'bg-white/[0.03] text-slate-500 border-white/[0.08] hover:text-slate-300'
                    }`}
                    title={showDotfiles ? 'Hide hidden dotfiles (.hidden)' : 'Show hidden dotfiles (.hidden)'}
                  >
                    {showDotfiles ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
                    <span>{showDotfiles ? 'Dotfiles' : 'No Dot'}</span>
                  </button>
                </div>
              </div>

              {/* Directory Items Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {directoryItems.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic py-0.5">
                    (Empty directory — create files via &quot;touch file.txt&quot; or &quot;echo ... &gt; file&quot;)
                  </div>
                ) : (
                  directoryItems.map((item) => {
                    if (item.type === 'dir') {
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleNavigateDir(item.name)}
                          className="group shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/18 text-amber-200 text-[11px] font-mono transition-all cursor-pointer active:scale-95"
                          title={`Enter directory /${item.name} (cd ${item.name})`}
                        >
                          <Folder className="h-3 w-3 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span className="font-semibold">{item.name}/</span>
                          {item.itemCount !== undefined && (
                            <span className="text-[10px] text-amber-300/80 tabular-nums">
                              ({item.itemCount})
                            </span>
                          )}
                        </button>
                      );
                    }

                    const isOpened = openedFile?.name === item.name;
                    const isDashed = item.name.startsWith('-');
                    const isHidden = item.name.startsWith('.');

                    return (
                      <button
                        key={item.name}
                        onClick={() => handleOpenFile(item)}
                        className={`group shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer active:scale-95 ${
                          isOpened
                            ? 'border-cyan-400/60 bg-cyan-500/18 text-cyan-200 font-semibold'
                            : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white'
                        }`}
                        title={`Click to open "${item.name}" in split-view reader`}
                      >
                        <FileText
                          className={`h-3 w-3 shrink-0 ${
                            isOpened
                              ? 'text-cyan-400'
                              : isHidden
                              ? 'text-purple-400'
                              : isDashed
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          } group-hover:scale-110 transition-transform`}
                        />
                        <div className="flex items-center gap-1.5">
                          <span className={isOpened ? 'font-semibold text-white' : ''}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                            {item.size}B
                          </span>
                          {item.isBinary && (
                            <span className="text-[9px] text-rose-300 font-mono">
                              · bin
                            </span>
                          )}
                          {isHidden && (
                            <span className="text-[9px] text-purple-300 font-mono">
                              · dot
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Detected Flags Quick-Action Banner */}
          {detectedFlags.length > 0 && (
            <div className="bg-emerald-500/10 border-b border-emerald-400/25 px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Key className="h-3.5 w-3.5" />
                  <span>Found Password:</span>
                </span>
                <span className="text-white font-mono bg-[#040710]/90 px-2 py-0.5 rounded border border-white/[0.1] select-all">
                  {detectedFlags[detectedFlags.length - 1]}
                </span>
              </div>
              <button
                onClick={() => handleSaveAndUnlockNext(detectedFlags[detectedFlags.length - 1])}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer transition-colors"
              >
                Save &amp; Unlock Next Level →
              </button>
            </div>
          )}

          {/* Main Terminal + Split-View Reader Body */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-[#040710]/85">
            {/* Left Console Pane (Terminal Output & Prompt) */}
            <div
              className={`flex flex-col min-h-0 ${
                openedFile ? 'flex-1 md:w-1/2' : 'flex-1 w-full'
              }`}
            >
              {/* Customizable Dynamic ASCII Art Header */}
              {showAsciiHeader && (
                <AsciiTerminalHeader
                  currentPath={currentPath}
                  selectedLevelIndex={selectedLevelIndex}
                  currentUser={currentUser}
                  isLiveSshMode={isLiveSshMode}
                  sshUser={sshUser}
                  sshCwd={sshCwd}
                />
              )}

              {/* Terminal Output Area */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="flex-1 overflow-y-auto p-4 space-y-1.5 text-xs cursor-text font-mono"
              >
                {history.map((line, i) => (
                  <div
                    key={i}
                    className={`whitespace-pre-wrap leading-relaxed ${
                      line.type === 'input'
                        ? 'text-cyan-300 font-semibold'
                        : line.isError
                        ? 'text-rose-400'
                        : line.isSuccess
                        ? 'text-emerald-300 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Terminal Input Line */}
              <div className="border-t border-white/[0.08] bg-[#040710]/95 px-4 py-2.5 flex items-center gap-2 text-xs">
                <span
                  className={`font-semibold shrink-0 font-mono ${
                    isLiveSshMode ? 'text-emerald-400' : 'text-cyan-400'
                  }`}
                >
                  {awaitingPasswordFor
                    ? 'Password: '
                    : isLiveSshMode
                    ? `${sshUser}@bandit:${sshCwd}$`
                    : `${currentUser}@odyssey:~$`}
                </span>
                <input
                  ref={inputRef}
                  type={awaitingPasswordFor ? 'password' : 'text'}
                  autoFocus
                  value={inputVal}
                  disabled={isExecutingRemote || isConnectingSsh}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    terminalAudio.playKeyClick();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    awaitingPasswordFor
                      ? 'Enter password...'
                      : isLiveSshMode
                      ? 'Run commands directly on Bandit (e.g. ls -la, cat readme, file ./*)...'
                      : 'type commands (e.g. ssh bandit0, ls, cat readme, help)...'
                  }
                  className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono placeholder:text-slate-600"
                />
                {historyIdx !== -1 && (
                  <span className="text-[10px] text-cyan-300 bg-cyan-500/15 border border-cyan-400/35 rounded-md px-1.5 py-0.5 select-none shrink-0 font-mono flex items-center gap-1 tabular-nums">
                    <span>↑↓ {historyIdx + 1}/{cmdHistory.length}</span>
                    <span className="text-slate-400 text-[9px] hidden sm:inline">(Esc)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right Split-View File Reader Pane */}
            {openedFile && (
              <div className="w-full md:w-1/2 flex flex-col border-t md:border-t-0 md:border-l border-white/[0.08] bg-[#040710]/95 min-h-0 overflow-hidden font-mono">
                {/* File Reader Header */}
                <div className="px-3.5 py-2.5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-cyan-500/12 text-cyan-300 border border-cyan-400/30 shrink-0">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate">
                          {openedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          · {openedFile.permissions || '-rw-r--r--'} · {openedFile.size} B
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {openedFile.path}
                      </div>
                    </div>
                  </div>

                  {/* Header Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* View Mode Toggle: Text vs Hex */}
                    <button
                      onClick={() => {
                        terminalAudio.playKeyClick();
                        setFileViewMode(fileViewMode === 'text' ? 'hex' : 'text');
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] border transition-colors flex items-center gap-1 cursor-pointer ${
                        fileViewMode === 'hex'
                          ? 'bg-amber-500/15 text-amber-200 border-amber-400/35 font-semibold'
                          : 'bg-white/[0.04] text-slate-300 border-white/[0.08] hover:text-white'
                      }`}
                      title="Toggle between Plain Text and Hex Dump"
                    >
                      <Hash className="h-3 w-3" />
                      <span>{fileViewMode === 'hex' ? 'Hex' : 'Text'}</span>
                    </button>

                    {/* Run cat in terminal button */}
                    <button
                      onClick={() => handleRunCatInTerminal(openedFile.name)}
                      className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/35 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Run cat command in terminal prompt"
                    >
                      <Terminal className="h-3 w-3" />
                      <span>cat ↵</span>
                    </button>

                    {/* Copy file content button */}
                    <button
                      onClick={() => {
                        copyToClipboard(openedFile.content);
                        terminalAudio.playKeyClick();
                      }}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] cursor-pointer transition-colors"
                      title="Copy file content"
                    >
                      {copiedFlag === openedFile.content ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Close split-view reader button */}
                    <button
                      onClick={() => {
                        terminalAudio.playKeyClick();
                        setOpenedFile(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="Close split-view reader"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Password / Flag Discovery Banner */}
                {(() => {
                  const detected = extractFlagFromContent(openedFile.content);
                  if (!detected) return null;
                  return (
                    <div className="bg-amber-500/12 border-b border-amber-400/25 px-3.5 py-2 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Key className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="text-amber-300 font-semibold shrink-0 text-[11px]">Flag:</span>
                        <code className="text-white bg-[#040710]/90 px-1.5 py-0.5 rounded border border-amber-400/30 text-[11px] select-all truncate">
                          {detected}
                        </code>
                      </div>
                      <button
                        onClick={() => handleSaveAndUnlockNext(detected)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold cursor-pointer transition-colors shrink-0 ml-2"
                      >
                        Save &amp; Unlock →
                      </button>
                    </div>
                  );
                })()}

                {/* File Content Body */}
                <div className="flex-1 overflow-y-auto p-3.5 text-xs text-slate-200 select-text bg-[#040710]">
                  {fileViewMode === 'hex' ? (
                    <pre className="text-[11px] text-amber-300/90 whitespace-pre font-mono leading-relaxed select-all">
                      {generateHexDump(openedFile.content)}
                    </pre>
                  ) : openedFile.content.length === 0 ? (
                    <div className="text-slate-500 italic py-8 text-center text-xs">
                      (Empty file — 0 bytes)
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {openedFile.content.split('\n').map((line, idx) => (
                        <div key={idx} className="flex hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded">
                          <span className="w-7 shrink-0 text-slate-600 select-none text-[11px] text-right pr-2.5 font-mono tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="flex-1 whitespace-pre-wrap break-all text-cyan-200/90 font-mono leading-relaxed text-xs">
                            {line || ' '}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* File Reader Footer */}
                <div className="px-3.5 py-1.5 border-t border-white/[0.08] bg-[#040710]/90 text-[10px] text-slate-500 font-mono flex items-center justify-between tabular-nums">
                  <span>
                    {openedFile.content.split('\n').length} {openedFile.content.split('\n').length === 1 ? 'line' : 'lines'} · {openedFile.size} bytes
                  </span>
                  <span className="text-cyan-400">
                    {fileViewMode === 'hex' ? 'Hex Dump View' : 'Plain Text View'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rightmost Side Panel: Command Quick-Reference */}
        {showQuickRef && (
          <aside className="w-full lg:w-80 shrink-0 flex flex-col optical-panel rounded-2xl h-[650px] overflow-hidden font-mono">
            {/* Quick-Ref Panel Header */}
            <div className="p-3.5 border-b border-white/[0.08] bg-[#040710]/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <h3 className="font-display text-xs font-semibold text-white tracking-wide uppercase">
                    Command Quick-Reference
                  </h3>
                </div>
                <button
                  onClick={() => setShowQuickRef(false)}
                  className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Close side panel"
                >
                  ✕
                </button>
              </div>

              {/* Dynamic Level Status Indicator */}
              <div className="optical-inset flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-xl">
                <span className="text-slate-400">Targeting:</span>
                <span className="text-amber-300 font-semibold flex items-center gap-1 tabular-nums">
                  <span>Bandit Level {level.level}</span>
                  <span className="text-slate-500 font-normal">({level.usefulCommands.length} cmds)</span>
                </span>
              </div>

              {/* Filter Tabs: Relevant to Level vs All Commands */}
              <div className="optical-subnav grid grid-cols-2 gap-1 p-1 rounded-xl text-[11px]">
                <button
                  onClick={() => setQuickRefFilter('relevant')}
                  className={`py-1.5 rounded-lg font-semibold transition-colors text-center cursor-pointer ${
                    quickRefFilter === 'relevant'
                      ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/35'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  Level {level.level} Only
                </button>
                <button
                  onClick={() => setQuickRefFilter('all')}
                  className={`py-1.5 rounded-lg font-semibold transition-all text-center cursor-pointer tabular-nums ${
                    quickRefFilter === 'all'
                      ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/35'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  All ({BANDIT_QUICK_COMMANDS.length})
                </button>
              </div>

              {/* Soap Bubble Search Bar */}
              <SoapBubbleSearch
                value={quickRefSearch}
                onChange={(e) => setQuickRefSearch(e.target.value)}
                placeholder="Filter commands, syntax..."
                style={{ fontSize: 12 }}
              />
            </div>

            {/* Quick-Ref Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {(() => {
                const searchLower = quickRefSearch.toLowerCase().trim();
                const filtered = BANDIT_QUICK_COMMANDS.filter((cmd) => {
                  const isLevelMatched =
                    cmd.relevantLevels.includes(level.level) ||
                    level.usefulCommands.some((u) => u.toLowerCase() === cmd.name.toLowerCase().split(' ')[0]);

                  if (quickRefFilter === 'relevant' && !isLevelMatched) {
                    return false;
                  }

                  if (searchLower) {
                    const matchName = cmd.name.toLowerCase().includes(searchLower);
                    const matchSyntax = cmd.syntax.toLowerCase().includes(searchLower);
                    const matchSummary = cmd.summary.toLowerCase().includes(searchLower);
                    const matchTip = cmd.proTip?.toLowerCase().includes(searchLower);
                    if (!matchName && !matchSyntax && !matchSummary && !matchTip) {
                      return false;
                    }
                  }

                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-slate-500 space-y-2">
                      <p>No commands matched your filter.</p>
                      <button
                        onClick={() => {
                          setQuickRefFilter('all');
                          setQuickRefSearch('');
                        }}
                        className="text-indigo-400 hover:underline text-[11px] cursor-pointer"
                      >
                        Show All Commands
                      </button>
                    </div>
                  );
                }

                return filtered.map((cmd) => {
                  const isDirectlyRelevant =
                    cmd.relevantLevels.includes(level.level) ||
                    level.usefulCommands.some((u) => u.toLowerCase() === cmd.name.toLowerCase().split(' ')[0]);
                  const isExpanded = expandedCmd === cmd.name;

                  return (
                    <div
                      key={cmd.name}
                      className={`optical-card rounded-xl p-2.5 transition-all text-xs ${
                        isDirectlyRelevant ? 'border-indigo-400/35 bg-indigo-500/8' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <code className="text-xs font-semibold text-white bg-[#040710]/80 px-2 py-0.5 rounded-md border border-white/[0.08] truncate">
                            {cmd.name}
                          </code>
                          {isDirectlyRelevant && (
                            <span className="text-[10px] font-mono text-amber-300 shrink-0">
                              · L{level.level}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyCommand(cmd.name, cmd.syntax)}
                            className="p-1 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy syntax"
                          >
                            {copiedCmd === cmd.name ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleInsertCommand(cmd.usageExample || cmd.syntax)}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold cursor-pointer transition-colors"
                            title="Insert command into terminal input"
                          >
                            Insert ↵
                          </button>
                        </div>
                      </div>

                      {/* Syntax Line */}
                      <div className="optical-inset rounded-lg px-2 py-1 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all mb-1.5">
                        {cmd.syntax}
                      </div>

                      {/* Summary */}
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-1.5">
                        {cmd.summary}
                      </p>

                      {/* Expandable Pro-Tip & Usage Examples */}
                      <div>
                        <button
                          onClick={() => setExpandedCmd(isExpanded ? null : cmd.name)}
                          className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          <span>{isExpanded ? 'Hide Pro-Tip & Examples' : 'Show Pro-Tip & Examples'}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-white/[0.08]">
                            {cmd.proTip && (
                              <div className="bg-amber-500/10 border border-amber-400/25 rounded-lg p-2 text-[11px] text-amber-200 font-sans">
                                <span className="font-semibold text-amber-300">Pro-Tip:</span> {cmd.proTip}
                              </div>
                            )}

                            <div>
                              <div className="text-[10px] text-slate-400 mb-1">Example Usage:</div>
                              <pre className="optical-inset p-2 rounded-lg text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre">
                                {cmd.usageExample}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Quick-Ref Footer */}
            <div className="p-2.5 border-t border-white/[0.08] bg-[#040710]/70 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Click &quot;Insert ↵&quot; to test command</span>
              <span className="font-semibold text-cyan-400">Cyber Citadel Shell</span>
            </div>
          </aside>
        )}
      </div>

      {/* Educational Fair-Use & Attribution Card */}
      <div className="optical-inset rounded-2xl p-4 text-xs font-mono text-slate-400 flex items-start gap-3">
        <Shield className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-200">Educational Wargame &amp; Ethical Security Practice Notice</span>
            <span className="text-[10px] text-slate-500">· Open-Source Learning Platform</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            CS Odyssey provides an original, 100% self-contained offline Linux wargame simulation (&quot;Cyber Citadel&quot;) designed for safe systems learning. The integrated optional SSH bridge enables authorized connections to public educational wargames such as OverTheWire Bandit (<code className="text-cyan-300">bandit.labs.overthewire.org:2220</code>). OverTheWire and Bandit are independent community projects hosted at <a href="https://overthewire.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-0.5">overthewire.org <ExternalLink className="h-2.5 w-2.5" /></a>. CS Odyssey is an independent educational tool and is not affiliated with, endorsed by, or sponsored by OverTheWire.
          </p>
        </div>
      </div>

      {/* Master Interactive Cheat Sheet Modal */}
      <CheatSheetModal
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
        onInsertCommand={(cmd) => handleInsertCommand(cmd)}
      />
    </div>
  );
}
