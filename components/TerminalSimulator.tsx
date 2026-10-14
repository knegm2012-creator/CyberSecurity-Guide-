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
  AlertTriangle
} from 'lucide-react';
import { BANDIT_LEVELS, BanditLevel } from '@/lib/curriculum-data';

interface TerminalSimulatorProps {
  solvedLevels: number[];
  banditPasswords?: Record<number, string>;
  onSaveBanditPassword?: (level: number, password: string) => void;
  onToggleLevel: (level: number) => void;
  onOpenAiMentor: (context?: string) => void;
}

interface FileSystemNode {
  type: 'file' | 'dir';
  content?: string;
  size?: number;
  permissions?: string;
  owner?: string;
  children?: Record<string, FileSystemNode>;
}

export function TerminalSimulator({
  solvedLevels,
  banditPasswords = {},
  onSaveBanditPassword,
  onToggleLevel,
  onOpenAiMentor,
}: TerminalSimulatorProps) {
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

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
    { type: 'output', text: 'CS Odyssey Linux & Bandit Real-Time Terminal Engine [Version 6.2.0-odyssey]' },
    { type: 'output', text: '🟢 REAL SSH AVAILABLE: You can live SSH directly to OverTheWire Bandit servers!' },
    { type: 'output', text: 'Commands: Type "ssh bandit0" to connect to Bandit, or use the top "Connect Live" button.' },
    { type: 'output', text: 'Logged in as: guest@odyssey-box:~$' },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
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
              'notes.txt': { type: 'file', content: 'Welcome to Linux! Practice cat, ls, touch, grep, and pipes.', size: 62 },
            },
          },
          bandit1: {
            type: 'dir',
            children: {
              '-': { type: 'file', content: '263QgYKgLtSmLiBu16ZwHeEpWfh0Zw0A', size: 33 },
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
                  '-file07': { type: 'file', content: '4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw', size: 33 },
                },
              },
            },
          },
        },
      },
    },
  });

  const level = BANDIT_LEVELS[selectedLevelIndex] || BANDIT_LEVELS[0];

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
            text: `🎉 [FLAG DETECTED] OverTheWire Bandit Password Found: ${mainFlag}\nThis is the password for bandit${nextLvlNum}! Save it to unlock the next level.`,
            isSuccess: true,
          },
        ]);
      }
    } catch (err: any) {
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

    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    // If awaiting password for interactive SSH
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

        if (target === '..') {
          if (currentPath.length > 1) {
            setCurrentPath((prev) => prev.slice(0, prev.length - 1));
          }
          break;
        }

        if (target === '/') {
          setCurrentPath([]);
          break;
        }

        const segments = target.split('/').filter(Boolean);
        const newPath = target.startsWith('/') ? [...segments] : [...currentPath, ...segments];

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
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          setHistory((prev) => [...prev, { type: 'output', text: 'cat: missing file operand' }]);
          break;
        }

        let target = args.join(' ');
        if (target.startsWith('./')) target = target.slice(2);

        const currNode = getNodeAtPath(currentPath);
        if (currNode && currNode.type === 'dir' && currNode.children && currNode.children[target]) {
          const file = currNode.children[target];
          if (file.type === 'dir') {
            setHistory((prev) => [...prev, { type: 'output', text: `cat: ${target}: Is a directory` }]);
          } else {
            setHistory((prev) => [...prev, { type: 'output', text: file.content || '' }]);
          }
        } else {
          setHistory((prev) => [
            ...prev,
            { type: 'output', text: `cat: ${target}: No such file or directory` },
          ]);
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

    const currNode = getNodeAtPath(currentPath);
    if (currNode && currNode.type === 'dir') {
      if (!currNode.children) currNode.children = {};
      const existing = currNode.children[targetFile];

      if (isAppend && existing && existing.type === 'file') {
        existing.content = (existing.content || '') + '\n' + contentToWrite;
        existing.size = (existing.content || '').length;
      } else {
        currNode.children[targetFile] = {
          type: 'file',
          content: contentToWrite,
          size: contentToWrite.length,
        };
      }
      setHistory((prev) => [...prev, { type: 'output', text: '' }]);
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
      executeCommand(inputVal);
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      if (cmdHistory.length > 0) {
        const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx >= cmdHistory.length) {
          setHistoryIdx(-1);
          setInputVal('');
        } else {
          setHistoryIdx(nextIdx);
          setInputVal(cmdHistory[nextIdx]);
        }
      }
    }
  };

  const isLevelSolved = solvedLevels.includes(level.level);
  const savedPasswordForSelected = banditPasswords[level.level] || (level.level === 0 ? 'bandit0' : '');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: Real Live SSH Status & Fast Switch */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isLiveSshMode
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-950/50'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isLiveSshMode ? <Wifi className="h-5 w-5 animate-pulse" /> : <Terminal className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {isLiveSshMode ? 'LIVE OVERTHEWIRE SSH SESSION' : 'TERMINAL ENGINE: DUAL REAL & SANDBOX MODE'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isLiveSshMode
                    ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                {isLiveSshMode ? `🟢 Connected to ${sshHost}:${sshPort}` : '💻 Offline Sandbox Ready'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLiveSshMode
                ? `Logged in as ${sshUser}. Commands execute in real-time on OverTheWire Bandit servers.`
                : 'Connect to real OverTheWire servers via backend SSH or practice in the local sandbox.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isLiveSshMode ? (
            <button
              onClick={disconnectLiveSsh}
              className="px-3.5 py-2 rounded-xl border border-rose-800/80 bg-rose-950/40 text-xs font-mono font-bold text-rose-300 hover:bg-rose-900/50 transition-all cursor-pointer"
            >
              Disconnect SSH
            </button>
          ) : (
            <button
              onClick={() => connectToLiveBandit(selectedLevelIndex, levelPasswordInput)}
              disabled={isConnectingSsh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-mono font-bold text-white shadow-lg shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
            >
              <Wifi className="h-3.5 w-3.5" />
              <span>{isConnectingSsh ? 'Connecting to Bandit...' : `Live SSH to Level ${selectedLevelIndex}`}</span>
            </button>
          )}

          <button
            onClick={() => onOpenAiMentor(`ELI9: Explain the goal of Bandit Level ${level.level} and what command I should use on the remote server.`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/50 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Ask AI Coach</span>
          </button>
        </div>
      </div>

      {/* Flag / Password Unlocked Banner */}
      {unlockedNotice && (
        <div className="rounded-xl border border-emerald-500/60 bg-emerald-950/40 p-4 text-xs font-mono text-emerald-300 flex items-center justify-between gap-3 animate-fade-in shadow-xl shadow-emerald-950/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-white">{unlockedNotice}</span>
          </div>
          <button
            onClick={() => setUnlockedNotice(null)}
            className="text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split: Left Sidebar & Right Terminal */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Pane: Bandit Level Navigator */}
        <div className="lg:w-80 shrink-0 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold">OVERTHEWIRE BANDIT</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {solvedLevels.length} / {BANDIT_LEVELS.length} Solved
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Linux Wargame Levels</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Real servers hosted by OverTheWire. Connect to retrieve each level&apos;s password!
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
                    }}
                    className={`py-2 px-1 text-xs font-mono rounded border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold shadow-md shadow-cyan-950'
                        : isSolved
                        ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-400 font-semibold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{level.title}</h4>
              <button
                onClick={() => onToggleLevel(level.level)}
                className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded cursor-pointer ${
                  isLevelSolved
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isLevelSolved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                <span>{isLevelSolved ? 'Solved!' : 'Mark Solved'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{level.goal}</p>

            {/* Saved Password for this level */}
            <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1">
                  <Key className="h-3 w-3 text-amber-400" />
                  <span>Bandit Level {level.level} Password:</span>
                </span>
                {savedPasswordForSelected && (
                  <button
                    onClick={() => copyToClipboard(savedPasswordForSelected)}
                    className="text-slate-400 hover:text-white flex items-center gap-1"
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
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-amber-300 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Commands to research */}
            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-slate-400">Commands to research:</div>
              <div className="flex flex-wrap gap-1">
                {level.usefulCommands.map((cmd) => (
                  <span key={cmd} className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-cyan-300">
                    {cmd}
                  </span>
                ))}
              </div>
            </div>

            {/* Hint Revealer */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded bg-slate-800/70 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {showHint ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-amber-400" />}
                <span>{showHint ? 'Hide Hint' : 'Reveal Helpful Hint'}</span>
              </button>

              {showHint && (
                <div className="mt-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 p-2.5 text-xs text-amber-300/90 leading-relaxed font-sans">
                  {level.hint}
                </div>
              )}
            </div>

            {/* Live SSH Connect Button */}
            <button
              onClick={() => connectToLiveBandit(level.level, levelPasswordInput)}
              disabled={isConnectingSsh}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-mono font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-md shadow-emerald-950/50 cursor-pointer"
            >
              <Wifi className="h-3.5 w-3.5" />
              <span>{isConnectingSsh ? 'Connecting...' : `Connect Live to Level ${level.level}`}</span>
            </button>
          </div>
        </div>

        {/* Right Pane: Interactive Terminal Window */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col h-[650px] overflow-hidden font-mono">
          {/* Terminal Window Chrome / Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-300 flex items-center gap-1.5">
                {isLiveSshMode ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-400 font-bold">{sshUser}@bandit.labs.overthewire.org</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-cyan-300">{sshCwd}</span>
                  </>
                ) : (
                  <span>bash — guest@odyssey-box: ~ (Sandbox)</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              {isExecutingRemote && (
                <span className="text-[11px] font-mono text-cyan-400 animate-pulse flex items-center gap-1">
                  <RotateCcw className="h-3 w-3 animate-spin" />
                  <span>Executing on Bandit...</span>
                </span>
              )}
              <button
                onClick={() => setHistory([])}
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear
              </button>
              {isLiveSshMode ? (
                <button
                  onClick={disconnectLiveSsh}
                  className="text-rose-400 hover:text-rose-300 cursor-pointer font-bold"
                >
                  Exit SSH
                </button>
              ) : (
                <button
                  onClick={() => connectToLiveBandit(selectedLevelIndex)}
                  className="text-emerald-400 hover:text-emerald-300 cursor-pointer font-bold"
                >
                  Live SSH
                </button>
              )}
            </div>
          </div>

          {/* Detected Flags Quick-Action Banner */}
          {detectedFlags.length > 0 && (
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Key className="h-3.5 w-3.5" />
                  <span>Found Password:</span>
                </span>
                <span className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 select-all">
                  {detectedFlags[detectedFlags.length - 1]}
                </span>
              </div>
              <button
                onClick={() => handleSaveAndUnlockNext(detectedFlags[detectedFlags.length - 1])}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors"
              >
                Save &amp; Unlock Next Level →
              </button>
            </div>
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
                    ? 'text-cyan-300 font-bold'
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
          <div className="border-t border-slate-800/80 bg-slate-900/60 px-4 py-2.5 flex items-center gap-2 text-xs">
            <span
              className={`font-bold shrink-0 font-mono ${
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
              onChange={(e) => setInputVal(e.target.value)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
