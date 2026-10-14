'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Terminal as TerminalIcon,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  HelpCircle,
  Tag,
  Archive,
  Undo2,
  Split,
  Layers,
  Eye,
  FileText,
  ChevronRight,
  Info,
  ShieldCheck,
  AlertTriangle,
  Play,
  Copy,
  Check,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';

export interface GitCommitNode {
  id: string; // e.g. 'c0', 'c1'
  hash: string; // e.g. '4a9b1c'
  parents: string[]; // parent commit ids
  message: string;
  branchName: string;
  timestamp: string;
  author: string;
  files: Array<{ name: string; status: 'added' | 'modified' | 'deleted'; diff?: string }>;
  isMerge?: boolean;
  tags?: string[];
}

export interface GitRepoState {
  commits: GitCommitNode[];
  branches: Record<string, string>; // branchName -> commitId
  head: {
    type: 'branch' | 'commit'; // attached to branch vs detached
    target: string; // branchName or commitId
  };
  stagingArea: Array<{ name: string; status: 'added' | 'modified' }>;
  workingTree: Array<{ name: string; status: 'untracked' | 'modified' }>;
  stash: Array<{ id: string; message: string; branch: string; timestamp: string }>;
  tags: Record<string, string>; // tagName -> commitId
}

interface Scenario {
  id: string;
  title: string;
  badge: string;
  description: string;
  goal: string;
  initialState: () => GitRepoState;
  checkCompletion: (state: GitRepoState) => boolean;
  hint: string;
  explanation: string;
}

interface GitSandboxProps {
  onOpenAiMentor?: (prompt?: string) => void;
  onNavigateToProjects?: () => void;
}

const INITIAL_REPO_STATE: GitRepoState = {
  commits: [
    {
      id: 'c0',
      hash: 'e82a10',
      parents: [],
      message: 'Initial commit: repository scaffolding & README.md',
      branchName: 'main',
      timestamp: '2 hours ago',
      author: 'Alex Student <alex@cs-odyssey.dev>',
      files: [
        {
          name: 'README.md',
          status: 'added',
          diff: '+ # CS Odyssey Project\n+ Foundation workspace for systems engineering.',
        },
        {
          name: '.gitignore',
          status: 'added',
          diff: '+ __pycache__/\n+ *.pyc\n+ .env\n+ .venv/',
        },
      ],
    },
    {
      id: 'c1',
      hash: '9f4c3b',
      parents: ['c0'],
      message: 'feat: add main entrypoint app.py and helper module',
      branchName: 'main',
      timestamp: '1 hour ago',
      author: 'Alex Student <alex@cs-odyssey.dev>',
      files: [
        {
          name: 'app.py',
          status: 'added',
          diff: '+ def main():\n+     print("CS Odyssey Systems Core v1.0")\n+ if __name__ == "__main__":\n+     main()',
        },
      ],
    },
  ],
  branches: {
    main: 'c1',
  },
  head: {
    type: 'branch',
    target: 'main',
  },
  stagingArea: [],
  workingTree: [
    { name: 'config.json', status: 'untracked' },
    { name: 'app.py', status: 'modified' },
  ],
  stash: [],
  tags: {
    'v0.1.0': 'c0',
  },
};

const SCENARIOS: Scenario[] = [
  {
    id: 'intro',
    title: '1. First Commit on Main',
    badge: 'Beginner',
    description: 'Learn the lifecycle of files: Untracked → Staging Area (`git add`) → Commit history (`git commit`).',
    goal: 'Stage working files and make a new commit on main branch with a clear message.',
    initialState: () => JSON.parse(JSON.stringify(INITIAL_REPO_STATE)),
    checkCompletion: (s) => s.commits.length >= 3 && s.branches.main === s.commits[s.commits.length - 1].id,
    hint: 'Use the "+ Commit" button or type: `git add .` then `git commit -m "feat: add config file"`',
    explanation: 'A Git commit is an immutable snapshot of all staged files linked to its parent via cryptographic SHA-1 hash.',
  },
  {
    id: 'feature-branch',
    title: '2. Isolated Feature Branching',
    badge: 'Core Workflow',
    description: 'Never work directly on main! Create a feature branch so your experimental code stays isolated.',
    goal: 'Create and checkout a new branch named `feature/auth`, then record at least one commit on it.',
    initialState: () => JSON.parse(JSON.stringify(INITIAL_REPO_STATE)),
    checkCompletion: (s) =>
      Boolean(s.branches['feature/auth']) &&
      s.head.target === 'feature/auth' &&
      s.commits.some((c) => c.branchName === 'feature/auth' || c.parents.includes('c1')),
    hint: 'Type: `git checkout -b feature/auth` (or use "+ Branch" button), then make a commit!',
    explanation: 'A Git branch is literally just a 41-byte text pointer pointing to a commit hash. Creating a branch is instant (O(1)).',
  },
  {
    id: 'fast-forward-merge',
    title: '3. Fast-Forward Merge',
    badge: 'Branching',
    description: 'When `main` has no new commits since the branch split, Git simply moves the `main` pointer forward.',
    goal: 'Merge `feature/login` into `main` using Fast-Forward.',
    initialState: () => {
      return {
        commits: [
          {
            id: 'c0',
            hash: 'e82a10',
            parents: [],
            message: 'Initial commit',
            branchName: 'main',
            timestamp: '3 hours ago',
            author: 'Alex Student',
            files: [{ name: 'README.md', status: 'added' }],
          },
          {
            id: 'c1',
            hash: '9f4c3b',
            parents: ['c0'],
            message: 'feat: setup core framework',
            branchName: 'main',
            timestamp: '2 hours ago',
            author: 'Alex Student',
            files: [{ name: 'main.py', status: 'added' }],
          },
          {
            id: 'c2',
            hash: '7d1e8a',
            parents: ['c1'],
            message: 'feat(auth): implement token generator',
            branchName: 'feature/login',
            timestamp: '30 mins ago',
            author: 'Alex Student',
            files: [{ name: 'auth.py', status: 'added', diff: '+ def generate_token():\n+     return "secret-token"' }],
          },
        ],
        branches: {
          main: 'c1',
          'feature/login': 'c2',
        },
        head: { type: 'branch', target: 'main' },
        stagingArea: [],
        workingTree: [],
        stash: [],
        tags: {},
      };
    },
    checkCompletion: (s) => s.head.target === 'main' && s.branches.main === s.branches['feature/login'],
    hint: 'Make sure you are on `main` (`git checkout main`), then execute `git merge feature/login`.',
    explanation: 'Fast-forward merges create zero extra commit nodes because history remained strictly linear.',
  },
  {
    id: 'three-way-merge',
    title: '4. Three-Way Merge (Diverged History)',
    badge: 'Collaboration',
    description: 'When both `main` and your feature branch have new commits, Git creates a dedicated merge commit with two parents.',
    goal: 'Merge `feature/payment` into `main` to create a 3-way merge commit.',
    initialState: () => {
      return {
        commits: [
          {
            id: 'c0',
            hash: 'e82a10',
            parents: [],
            message: 'Initial commit',
            branchName: 'main',
            timestamp: '4 hours ago',
            author: 'Alex Student',
            files: [{ name: 'README.md', status: 'added' }],
          },
          {
            id: 'c1',
            hash: '9f4c3b',
            parents: ['c0'],
            message: 'feat: base server setup',
            branchName: 'main',
            timestamp: '3 hours ago',
            author: 'Alex Student',
            files: [{ name: 'server.py', status: 'added' }],
          },
          {
            id: 'c2',
            hash: '3a11b2',
            parents: ['c1'],
            message: 'feat(payment): add stripe checkout integration',
            branchName: 'feature/payment',
            timestamp: '2 hours ago',
            author: 'Alex Student',
            files: [{ name: 'billing.py', status: 'added', diff: '+ def checkout():\n+     pass' }],
          },
          {
            id: 'c3',
            hash: '5d89f0',
            parents: ['c1'],
            message: 'fix: update server telemetry port to 8080',
            branchName: 'main',
            timestamp: '1 hour ago',
            author: 'Alex Student',
            files: [{ name: 'server.py', status: 'modified', diff: '- PORT = 3000\n+ PORT = 8080' }],
          },
        ],
        branches: {
          main: 'c3',
          'feature/payment': 'c2',
        },
        head: { type: 'branch', target: 'main' },
        stagingArea: [],
        workingTree: [],
        stash: [],
        tags: {},
      };
    },
    checkCompletion: (s) =>
      s.head.target === 'main' &&
      s.commits.some((c) => c.isMerge && c.parents.includes('c3') && c.parents.includes('c2')),
    hint: 'On `main`, run `git merge feature/payment` to combine the diverged timelines.',
    explanation: 'A 3-way merge commit has two parent hashes. It ties together the separate branches in the DAG.',
  },
  {
    id: 'rebase-workflow',
    title: '5. Rebase onto Main (Linear History)',
    badge: 'Pro Workflow',
    description: 'Rebasing rewinds your feature branch, pulls in latest main, and replays your commits one by one on top.',
    goal: 'Rebase `feature/ui` onto `main` to create a clean, single-line Git history.',
    initialState: () => {
      return {
        commits: [
          {
            id: 'c0',
            hash: 'e82a10',
            parents: [],
            message: 'Initial commit',
            branchName: 'main',
            timestamp: '5 hours ago',
            author: 'Alex Student',
            files: [{ name: 'README.md', status: 'added' }],
          },
          {
            id: 'c1',
            hash: '9f4c3b',
            parents: ['c0'],
            message: 'chore: setup project structure',
            branchName: 'main',
            timestamp: '4 hours ago',
            author: 'Alex Student',
            files: [{ name: 'app.py', status: 'added' }],
          },
          {
            id: 'c2',
            hash: '6a4b2c',
            parents: ['c1'],
            message: 'feat: add dark theme styles',
            branchName: 'feature/ui',
            timestamp: '2 hours ago',
            author: 'Alex Student',
            files: [{ name: 'styles.css', status: 'added' }],
          },
          {
            id: 'c3',
            hash: '2f11c9',
            parents: ['c1'],
            message: 'chore: update python dependencies',
            branchName: 'main',
            timestamp: '1 hour ago',
            author: 'Alex Student',
            files: [{ name: 'requirements.txt', status: 'added' }],
          },
        ],
        branches: {
          main: 'c3',
          'feature/ui': 'c2',
        },
        head: { type: 'branch', target: 'feature/ui' },
        stagingArea: [],
        workingTree: [],
        stash: [],
        tags: {},
      };
    },
    checkCompletion: (s) => {
      const uiCommit = s.commits.find((c) => c.id === s.branches['feature/ui']);
      return Boolean(uiCommit && uiCommit.parents.includes(s.branches.main));
    },
    hint: 'Switch to `feature/ui`, then run `git rebase main` (or click "⤴️ Rebase").',
    explanation: 'Rebase rewrites commit history by generating brand new commit SHAs on top of the target branch.',
  },
  {
    id: 'detached-head',
    title: '6. Detached HEAD & Time Travel',
    badge: 'Under the Hood',
    description: 'Inspect what happens when HEAD points directly to a commit hash instead of a branch name.',
    goal: 'Checkout commit `c0` directly to enter Detached HEAD mode.',
    initialState: () => JSON.parse(JSON.stringify(INITIAL_REPO_STATE)),
    checkCompletion: (s) => s.head.type === 'commit' && s.head.target === 'c0',
    hint: 'Type: `git checkout c0` (or click on node c0 and select "Checkout this commit").',
    explanation: 'When in detached HEAD, commits you make are not attached to any branch and can get lost (pruned by garbage collection)!',
  },
];

export function GitSandbox({ onOpenAiMentor, onNavigateToProjects }: GitSandboxProps) {
  const [repo, setRepo] = useState<GitRepoState>(INITIAL_REPO_STATE);
  const [selectedCommitId, setSelectedCommitId] = useState<string>('c1');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('intro');
  const [viewMode, setViewMode] = useState<'graph' | 'staging' | 'cheatsheet'>('graph');
  const [completedScenarios, setCompletedScenarios] = useState<Record<string, boolean>>({});

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string; isError?: boolean }>>([
    {
      cmd: 'git status',
      output: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\tmodified:   app.py\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tconfig.json\n\nno changes added to commit (use "git add" to track)',
    },
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandList, setCommandList] = useState<string[]>(['git status']);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Modals / Quick Actions
  const [commitMessageInput, setCommitMessageInput] = useState('');
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showRebaseModal, setShowRebaseModal] = useState(false);
  const [mergeTargetBranch, setMergeTargetBranch] = useState('');
  const [rebaseTargetBranch, setRebaseTargetBranch] = useState('');

  // Conflict simulator state
  const [conflictState, setConflictState] = useState<{
    file: string;
    currentText: string;
    incomingText: string;
    resolvedText?: string;
  } | null>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  // Current scenario check
  const currentScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0],
    [activeScenarioId]
  );

  const isCurrentScenarioDone = useMemo(() => {
    if (completedScenarios[currentScenario.id]) return true;
    return currentScenario.checkCompletion(repo);
  }, [repo, currentScenario, completedScenarios]);

  useEffect(() => {
    if (currentScenario.checkCompletion(repo) && !completedScenarios[currentScenario.id]) {
      setCompletedScenarios((prev) => ({ ...prev, [currentScenario.id]: true }));
    }
  }, [repo, currentScenario, completedScenarios]);

  // Generate random short hash
  const generateHash = () => Math.random().toString(16).substring(2, 8);

  // Selected commit details
  const selectedCommit = useMemo(() => {
    return repo.commits.find((c) => c.id === selectedCommitId) || repo.commits[repo.commits.length - 1];
  }, [repo.commits, selectedCommitId]);

  // Reset sandbox to current scenario
  const resetToScenario = (scenarioId: string) => {
    const sc = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
    setActiveScenarioId(scenarioId);
    const fresh = sc.initialState();
    setRepo(fresh);
    const lastCommit = fresh.commits[fresh.commits.length - 1];
    setSelectedCommitId(lastCommit.id);
    setTerminalHistory([
      {
        cmd: `git status (Scenario loaded: ${sc.title})`,
        output: `Initialized repository state for "${sc.title}".\nType commands or use the visual control buttons to solve the goal!`,
      },
    ]);
    setConflictState(null);
  };

  // Branch layout calculation for SVG graph
  const graphLayout = useMemo(() => {
    // Unique branches
    const allBranches = Object.keys(repo.branches);
    const branchLanes: Record<string, number> = { main: 0 };
    let laneCounter = 1;
    allBranches.forEach((b) => {
      if (b !== 'main') {
        branchLanes[b] = laneCounter++;
      }
    });

    // Map each commit to a lane
    const commitPositions: Record<string, { x: number; y: number; lane: number }> = {};
    const laneYOffset = 65;
    const startY = 60;
    const stepX = 110;

    repo.commits.forEach((c, idx) => {
      const lane = branchLanes[c.branchName] ?? 0;
      const x = 70 + idx * stepX;
      const y = startY + lane * laneYOffset;
      commitPositions[c.id] = { x, y, lane };
    });

    const totalWidth = Math.max(700, 100 + repo.commits.length * stepX);
    const totalHeight = Math.max(220, startY + laneCounter * laneYOffset + 40);

    return { commitPositions, totalWidth, totalHeight, branchLanes };
  }, [repo.commits, repo.branches]);

  // Handler: Add commit
  const handleCreateCommit = (customMessage?: string) => {
    const currentHeadCommitId =
      repo.head.type === 'branch' ? repo.branches[repo.head.target] : repo.head.target;

    const currentBranchName = repo.head.type === 'branch' ? repo.head.target : 'detached';
    const newId = `c${repo.commits.length}`;
    const newHash = generateHash();
    const msg = customMessage || commitMessageInput.trim() || `feat: update on ${currentBranchName}`;

    // Staged files snapshot
    const staged = repo.stagingArea.length > 0 ? repo.stagingArea : [{ name: 'work.py', status: 'modified' as const }];

    const newCommit: GitCommitNode = {
      id: newId,
      hash: newHash,
      parents: currentHeadCommitId ? [currentHeadCommitId] : [],
      message: msg,
      branchName: currentBranchName,
      timestamp: 'just now',
      author: 'Alex Student <alex@cs-odyssey.dev>',
      files: staged.map((f) => ({
        name: f.name,
        status: f.status,
        diff: `+ // Committed update in ${f.name}\n+ log("Commit ${newHash}: ${msg}")`,
      })),
    };

    setRepo((prev) => {
      const nextCommits = [...prev.commits, newCommit];
      const nextBranches = { ...prev.branches };
      let nextHead = { ...prev.head };

      if (prev.head.type === 'branch') {
        nextBranches[prev.head.target] = newId;
      } else {
        nextHead = { type: 'commit', target: newId };
      }

      return {
        ...prev,
        commits: nextCommits,
        branches: nextBranches,
        head: nextHead,
        stagingArea: [],
        workingTree: prev.workingTree.filter((w) => !staged.some((s) => s.name === w.name)),
      };
    });

    setSelectedCommitId(newId);
    setCommitMessageInput('');

    return `[${currentBranchName} ${newHash}] ${msg}\n ${staged.length} file(s) changed, ${staged.length * 4} insertions(+)`;
  };

  // Handler: Create new branch
  const handleCreateBranch = (branchName: string, checkoutImmediately = true) => {
    const cleanName = branchName.trim().replace(/\s+/g, '-');
    if (!cleanName) return 'fatal: empty branch name';
    if (repo.branches[cleanName]) return `fatal: a branch named '${cleanName}' already exists.`;

    const currentCommitId =
      repo.head.type === 'branch' ? repo.branches[repo.head.target] : repo.head.target;

    setRepo((prev) => {
      const nextBranches = { ...prev.branches, [cleanName]: currentCommitId };
      const nextHead = checkoutImmediately ? { type: 'branch' as const, target: cleanName } : prev.head;
      return {
        ...prev,
        branches: nextBranches,
        head: nextHead,
      };
    });

    setNewBranchInput('');
    setShowBranchModal(false);

    return checkoutImmediately
      ? `Switched to a new branch '${cleanName}'`
      : `Created branch '${cleanName}' pointing to ${currentCommitId}`;
  };

  // Handler: Checkout
  const handleCheckout = (target: string) => {
    const clean = target.trim();
    if (repo.branches[clean]) {
      setRepo((prev) => ({
        ...prev,
        head: { type: 'branch', target: clean },
      }));
      setSelectedCommitId(repo.branches[clean]);
      return `Switched to branch '${clean}'`;
    }

    const matchedCommit = repo.commits.find((c) => c.id === clean || c.hash === clean);
    if (matchedCommit) {
      setRepo((prev) => ({
        ...prev,
        head: { type: 'commit', target: matchedCommit.id },
      }));
      setSelectedCommitId(matchedCommit.id);
      return `Note: switching to '${clean}'.\n\nYou are in 'detached HEAD' state. You can look around, make experimental\nchanges and commit them, and you can discard any commits you make in this\nstate without impacting any branches.`;
    }

    return `error: pathspec '${clean}' did not match any file(s) known to git`;
  };

  // Handler: Merge
  const handleMerge = (sourceBranch: string) => {
    const currentBranch = repo.head.type === 'branch' ? repo.head.target : null;
    if (!currentBranch) {
      return 'fatal: You are in "detached HEAD" state. Please checkout a branch to merge into.';
    }
    if (sourceBranch === currentBranch) {
      return `fatal: Cannot merge branch '${sourceBranch}' into itself.`;
    }
    const sourceCommitId = repo.branches[sourceBranch];
    const currentCommitId = repo.branches[currentBranch];

    if (!sourceCommitId) {
      return `merge: ${sourceBranch} - not something we can merge`;
    }

    // Check if already up to date
    if (currentCommitId === sourceCommitId) {
      return 'Already up to date.';
    }

    // Check if Fast-Forward is possible: is currentCommitId an ancestor of sourceCommitId?
    const isAncestor = (ancestorId: string, descendantId: string): boolean => {
      if (ancestorId === descendantId) return true;
      const desc = repo.commits.find((c) => c.id === descendantId);
      if (!desc || !desc.parents || desc.parents.length === 0) return false;
      return desc.parents.some((p) => isAncestor(ancestorId, p));
    };

    if (isAncestor(currentCommitId, sourceCommitId)) {
      // Fast forward!
      setRepo((prev) => ({
        ...prev,
        branches: {
          ...prev.branches,
          [currentBranch]: sourceCommitId,
        },
      }));
      setSelectedCommitId(sourceCommitId);
      setShowMergeModal(false);
      return `Updating ${currentCommitId.slice(0, 6)}..${sourceCommitId.slice(0, 6)}\nFast-forward\n Merged branch '${sourceBranch}' into '${currentBranch}' cleanly.`;
    }

    // Diverged: 3-way merge commit
    const newId = `c${repo.commits.length}`;
    const newHash = generateHash();
    const mergeCommit: GitCommitNode = {
      id: newId,
      hash: newHash,
      parents: [currentCommitId, sourceCommitId],
      message: `Merge branch '${sourceBranch}' into ${currentBranch}`,
      branchName: currentBranch,
      timestamp: 'just now',
      author: 'Alex Student <alex@cs-odyssey.dev>',
      isMerge: true,
      files: [
        {
          name: 'merge_result.txt',
          status: 'added',
          diff: `+ Successfully combined trees from ${currentBranch} (${currentCommitId}) and ${sourceBranch} (${sourceCommitId})`,
        },
      ],
    };

    setRepo((prev) => ({
      ...prev,
      commits: [...prev.commits, mergeCommit],
      branches: {
        ...prev.branches,
        [currentBranch]: newId,
      },
    }));
    setSelectedCommitId(newId);
    setShowMergeModal(false);

    return `Merge made by the 'ort' strategy.\n Recorded merge commit [${newHash}] Merge branch '${sourceBranch}' into ${currentBranch}`;
  };

  // Handler: Rebase
  const handleRebase = (targetBaseBranch: string) => {
    const currentBranch = repo.head.type === 'branch' ? repo.head.target : null;
    if (!currentBranch) {
      return 'fatal: You are in "detached HEAD" state. Cannot rebase without a branch.';
    }
    if (targetBaseBranch === currentBranch) {
      return `Current branch ${currentBranch} is up to date.`;
    }
    const targetCommitId = repo.branches[targetBaseBranch];
    if (!targetCommitId) {
      return `fatal: invalid upstream '${targetBaseBranch}'`;
    }

    // Rebase current branch commit on top of targetBaseBranch
    const newId = `c${repo.commits.length}`;
    const newHash = generateHash();
    const currentCommit = repo.commits.find((c) => c.id === repo.branches[currentBranch]);

    const rebasedCommit: GitCommitNode = {
      id: newId,
      hash: newHash,
      parents: [targetCommitId],
      message: currentCommit ? `${currentCommit.message} (rebased)` : `feat on ${currentBranch}`,
      branchName: currentBranch,
      timestamp: 'just now',
      author: 'Alex Student <alex@cs-odyssey.dev>',
      files: currentCommit?.files || [{ name: 'feature.py', status: 'added' }],
    };

    setRepo((prev) => ({
      ...prev,
      commits: [...prev.commits, rebasedCommit],
      branches: {
        ...prev.branches,
        [currentBranch]: newId,
      },
    }));
    setSelectedCommitId(newId);
    setShowRebaseModal(false);

    return `Successfully rebased and updated refs/heads/${currentBranch}.\nRewound and replayed commits onto '${targetBaseBranch}' (${targetCommitId}).`;
  };

  // Handler: Reset HEAD~1
  const handleResetHead = () => {
    if (repo.head.type !== 'branch') {
      return 'Cannot reset detached HEAD.';
    }
    const currentBranch = repo.head.target;
    const currentCommitId = repo.branches[currentBranch];
    const currentCommit = repo.commits.find((c) => c.id === currentCommitId);

    if (!currentCommit || currentCommit.parents.length === 0) {
      return 'fatal: Cannot reset initial commit.';
    }

    const parentId = currentCommit.parents[0];
    setRepo((prev) => ({
      ...prev,
      branches: {
        ...prev.branches,
        [currentBranch]: parentId,
      },
    }));
    setSelectedCommitId(parentId);

    return `HEAD is now at ${parentId} (moved back 1 commit)`;
  };

  // Handler: Stash
  const handleStash = () => {
    if (repo.workingTree.length === 0 && repo.stagingArea.length === 0) {
      return 'No local changes to save.';
    }
    const stashId = `stash@{${repo.stash.length}}`;
    const curBranch = repo.head.type === 'branch' ? repo.head.target : 'detached';
    const newStash = {
      id: stashId,
      message: `WIP on ${curBranch}: temporary snapshot`,
      branch: curBranch,
      timestamp: 'just now',
    };

    setRepo((prev) => ({
      ...prev,
      stash: [newStash, ...prev.stash],
      stagingArea: [],
      workingTree: [],
    }));

    return `Saved working directory and index state "${newStash.message}"`;
  };

  const handleStashPop = () => {
    if (repo.stash.length === 0) {
      return 'error: No stash entries found.';
    }
    const popped = repo.stash[0];
    setRepo((prev) => ({
      ...prev,
      stash: prev.stash.slice(1),
      workingTree: [{ name: 'work.py', status: 'modified' }],
    }));
    return `Dropped ${popped.id} (${popped.message})\nRestored modified changes to working tree.`;
  };

  // Parse and execute CLI commands
  const executeGitCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    setCommandList((prev) => [...prev, raw]);
    setHistoryIndex(-1);

    const parts = raw.split(/\s+/);
    const mainCmd = parts[0];
    const subCmd = parts[1];

    let output = '';
    let isError = false;

    if (raw === 'clear') {
      setTerminalHistory([]);
      return;
    }

    if (raw === 'help') {
      output = `CS Odyssey Git CLI Cheat Sheet:
  git status                Show working directory and staging index
  git add <file> | git add . Stage file(s) for the next commit snapshot
  git commit -m "<msg>"     Record staged snapshot into repository DAG
  git branch                List all branches (* marks HEAD)
  git branch <name>         Create new branch at current commit
  git branch -d <name>      Delete branch
  git checkout <branch>     Switch branch or checkout commit
  git checkout -b <name>    Create and switch to new branch
  git switch <branch>       Modern shorthand to switch branches
  git merge <branch>        Merge branch into current HEAD
  git rebase <branch>       Replay current commits on top of target branch
  git reset HEAD~1          Move branch pointer back by 1 commit
  git stash / git stash pop Save or restore working changes
  git log --oneline --graph Display visual ASCII commit history
  git diff                  View unstaged differences
  clear                     Clear the terminal screen`;
    } else if (mainCmd === 'git') {
      switch (subCmd) {
        case 'status': {
          const cur = repo.head.type === 'branch' ? `On branch ${repo.head.target}` : `HEAD detached at ${repo.head.target}`;
          const stagedList = repo.stagingArea.length
            ? `Changes to be committed:\n${repo.stagingArea.map((f) => `  \x1b[32m${f.status}:   ${f.name}\x1b[0m`).join('\n')}`
            : 'No changes added to commit (use "git add" to track)';
          const workingList = repo.workingTree.length
            ? `Untracked / Modified files:\n${repo.workingTree.map((f) => `  \x1b[31m${f.status}: ${f.name}\x1b[0m`).join('\n')}`
            : 'working tree clean';
          output = `${cur}\n\n${stagedList}\n\n${workingList}`;
          break;
        }

        case 'add': {
          const fileArg = parts[2];
          if (!fileArg) {
            output = 'Nothing specified, nothing added. (use `git add .` or file name)';
            isError = true;
          } else {
            setRepo((prev) => ({
              ...prev,
              stagingArea: [
                ...prev.stagingArea,
                ...prev.workingTree.map((w) => ({ name: w.name, status: 'modified' as const })),
              ],
              workingTree: [],
            }));
            output = `Staged files for commit.`;
          }
          break;
        }

        case 'commit': {
          // parse -m "message"
          const mIndex = parts.indexOf('-m');
          let msg = '';
          if (mIndex !== -1 && parts[mIndex + 1]) {
            msg = raw.substring(raw.indexOf('-m') + 2).trim().replace(/^["']|["']$/g, '');
          }
          output = handleCreateCommit(msg || undefined);
          break;
        }

        case 'branch': {
          const branchArg = parts[2];
          if (!branchArg) {
            // list branches
            const list = Object.keys(repo.branches)
              .map((b) => {
                const isCurrent = repo.head.type === 'branch' && repo.head.target === b;
                return isCurrent ? `* \x1b[32m${b}\x1b[0m` : `  ${b}`;
              })
              .join('\n');
            output = list;
          } else if (branchArg === '-d') {
            const delBranch = parts[3];
            if (!delBranch || !repo.branches[delBranch]) {
              output = `error: branch '${delBranch}' not found.`;
              isError = true;
            } else if (repo.head.type === 'branch' && repo.head.target === delBranch) {
              output = `error: Cannot delete branch '${delBranch}' checked out at ${repo.branches[delBranch]}`;
              isError = true;
            } else {
              setRepo((prev) => {
                const nextB = { ...prev.branches };
                delete nextB[delBranch];
                return { ...prev, branches: nextB };
              });
              output = `Deleted branch ${delBranch} (was ${repo.branches[delBranch]}).`;
            }
          } else {
            output = handleCreateBranch(branchArg, false);
          }
          break;
        }

        case 'checkout':
        case 'switch': {
          if (parts[2] === '-b' || parts[2] === '-c') {
            const newB = parts[3];
            if (!newB) {
              output = 'fatal: Missing new branch name.';
              isError = true;
            } else {
              output = handleCreateBranch(newB, true);
            }
          } else if (parts[2]) {
            output = handleCheckout(parts[2]);
          } else {
            output = 'fatal: branch name or commit hash required.';
            isError = true;
          }
          break;
        }

        case 'merge': {
          const targetB = parts[2];
          if (!targetB) {
            output = 'fatal: branch name to merge is required (e.g. `git merge feature-login`)';
            isError = true;
          } else {
            output = handleMerge(targetB);
          }
          break;
        }

        case 'rebase': {
          const targetB = parts[2];
          if (!targetB) {
            output = 'fatal: target branch name to rebase onto is required (e.g. `git rebase main`)';
            isError = true;
          } else {
            output = handleRebase(targetB);
          }
          break;
        }

        case 'reset': {
          output = handleResetHead();
          break;
        }

        case 'stash': {
          if (parts[2] === 'pop') {
            output = handleStashPop();
          } else {
            output = handleStash();
          }
          break;
        }

        case 'log': {
          output = repo.commits
            .slice()
            .reverse()
            .map((c) => {
              const branchTags = Object.entries(repo.branches)
                .filter(([_, cid]) => cid === c.id)
                .map(([b]) => b);
              const isHead =
                (repo.head.type === 'branch' && branchTags.includes(repo.head.target)) ||
                (repo.head.type === 'commit' && repo.head.target === c.id);

              let header = `commit ${c.hash} (${c.id})`;
              if (branchTags.length > 0 || isHead) {
                const labels = [];
                if (isHead) labels.push(repo.head.type === 'branch' ? `HEAD -> ${repo.head.target}` : 'HEAD');
                branchTags.forEach((b) => {
                  if (repo.head.type !== 'branch' || repo.head.target !== b) labels.push(b);
                });
                header += ` (${labels.join(', ')})`;
              }
              return `${header}\nAuthor: ${c.author}\nDate:   ${c.timestamp}\n\n    ${c.message}\n`;
            })
            .join('\n');
          break;
        }

        case 'diff': {
          output = `diff --git a/app.py b/app.py
--- a/app.py
+++ b/app.py
@@ -1,4 +1,5 @@
 def main():
+    # Initialize logging subsystem
     print("CS Odyssey Systems Core v1.0")`;
          break;
        }

        default:
          output = `git: '${subCmd || ''}' is not a recognized git command. Type 'help' for available commands.`;
          isError = true;
      }
    } else {
      output = `bash: command not found: ${mainCmd}. Type 'help' or try git commands.`;
      isError = true;
    }

    setTerminalHistory((prev) => [...prev, { cmd: raw, output, isError }]);
    setTerminalInput('');
  };

  // Keyboard navigation for terminal history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeGitCommand(terminalInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandList.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandList.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setTerminalInput(commandList[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandList.length) {
        setHistoryIndex(-1);
        setTerminalInput('');
      } else {
        setHistoryIndex(nextIdx);
        setTerminalInput(commandList[nextIdx]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Callout Deck */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <GitBranch className="h-3.5 w-3.5" />
                Interactive Version Control Lab
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
                Stage 0 & 1 Bedrock → Stage 2
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Interactive Git Sandbox</span>
              <span className="text-sm font-normal text-slate-400 hidden sm:inline">
                · Visual DAG & Terminal Simulation
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Visualize branch pointers, commit lineages, fast-forward vs 3-way merges, and rebasing in real-time.
              Build an unshakable mental model of the Git Directed Acyclic Graph before jumping into GitHub repositories!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenAiMentor && (
              <button
                onClick={() =>
                  onOpenAiMentor(
                    'Explain Git branches and the Directed Acyclic Graph (DAG) for a high school computer science student. Why are branches so lightweight in Git compared to copying folders?'
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Ask AI Mentor</span>
              </button>
            )}

            {onNavigateToProjects && (
              <button
                onClick={onNavigateToProjects}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 transition-all cursor-pointer shadow-md"
              >
                <FolderGit2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>14 GitHub Projects Studio →</span>
              </button>
            )}

            <button
              onClick={() => resetToScenario(activeScenarioId)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
              title="Reset current sandbox state"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Quick View Mode Switcher */}
        <div className="mt-6 flex border-b border-slate-800 gap-6 text-xs font-medium overflow-x-auto no-scrollbar">
          {[
            { id: 'graph', label: '🌿 Visual Git DAG & Terminal', icon: GitBranch },
            { id: 'staging', label: '🗂️ The 3 Trees: Working vs Staging vs Repo', icon: Layers },
            { id: 'cheatsheet', label: '📘 Mental Models & Golden Rules', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex items-center gap-2 py-3 border-b-2 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Guided Scenarios Carousel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Play className="h-3.5 w-3.5 text-emerald-400" />
            <span>Interactive Guided Missions ({Object.keys(completedScenarios).length}/{SCENARIOS.length} Solved)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Click any mission to auto-load setup</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCENARIOS.map((sc) => {
            const isSelected = activeScenarioId === sc.id;
            const isDone = completedScenarios[sc.id] || sc.checkCompletion(repo);
            return (
              <button
                key={sc.id}
                onClick={() => resetToScenario(sc.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-emerald-500/70 bg-emerald-950/20 ring-1 ring-emerald-500/40'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-600 shrink-0" />
                    )}
                    <span className="truncate">{sc.title}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                    {sc.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{sc.description}</p>
                <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1 mt-1">
                  <ChevronRight className="h-3 w-3" />
                  <span>Goal: {sc.goal}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Scenario Goal Status Banner */}
        <div
          className={`mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            isCurrentScenarioDone
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isCurrentScenarioDone ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="font-bold">
                {isCurrentScenarioDone
                  ? `🎉 Goal Achieved: ${currentScenario.title}`
                  : `Active Challenge: ${currentScenario.goal}`}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Hint: {currentScenario.hint}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-mono text-[11px]">
              {isCurrentScenarioDone ? '✅ Verified (+50 XP)' : 'In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE VIEW (DAG + Controls + Terminal) */}
      {viewMode === 'graph' && (
        <div className="space-y-6">
          {/* Top Control Deck: Visual Buttons */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1.5">
                  <Split className="h-3.5 w-3.5 text-cyan-400" />
                  Quick Actions:
                </span>

                {/* + New Commit */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={commitMessageInput}
                    onChange={(e) => setCommitMessageInput(e.target.value)}
                    placeholder="commit message..."
                    className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCommit();
                    }}
                  />
                  <button
                    onClick={() => handleCreateCommit()}
                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                  >
                    <GitCommit className="h-3.5 w-3.5" />
                    <span>Commit</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

                {/* + New Branch */}
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="h-8 px-3 rounded-lg border border-indigo-500/50 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span>+ Branch</span>
                </button>

                {/* Merge Branch */}
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="h-8 px-3 rounded-lg border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  <span>🔀 Merge</span>
                </button>

                {/* Rebase Branch */}
                <button
                  onClick={() => setShowRebaseModal(true)}
                  className="h-8 px-3 rounded-lg border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Split className="h-3.5 w-3.5" />
                  <span>⤴️ Rebase</span>
                </button>

                {/* Reset HEAD */}
                <button
                  onClick={() => {
                    const res = handleResetHead();
                    setTerminalHistory((p) => [...p, { cmd: 'git reset HEAD~1', output: res }]);
                  }}
                  className="h-8 px-2.5 rounded-lg border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs transition-all flex items-center gap-1 cursor-pointer"
                  title="Undo last commit on current branch (git reset HEAD~1)"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Undo</span>
                </button>

                {/* Stash */}
                <button
                  onClick={() => {
                    const res = handleStash();
                    setTerminalHistory((p) => [...p, { cmd: 'git stash', output: res }]);
                  }}
                  className="h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all flex items-center gap-1 cursor-pointer"
                  title="Stash working changes"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Stash ({repo.stash.length})</span>
                </button>
              </div>

              {/* Current HEAD indicator badge */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">HEAD:</span>
                {repo.head.type === 'branch' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    <span>{repo.head.target}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>detached at {repo.head.target}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SVG Visual Directed Acyclic Graph (DAG) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 relative overflow-x-auto shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GitCommit className="h-4 w-4 text-emerald-400" />
                  Commit Graph (DAG)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {repo.commits.length} commits · {Object.keys(repo.branches).length} branches
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                  <span>main branch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-indigo-500 inline-block" />
                  <span>feature branches</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-400 ring-2 ring-amber-400/30 inline-block" />
                  <span>HEAD pointer</span>
                </div>
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="min-w-full overflow-x-auto pb-4">
              <svg
                width={graphLayout.totalWidth}
                height={graphLayout.totalHeight}
                className="select-none"
              >
                <defs>
                  <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="featureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>

                {/* 1. Parent-to-Child Commit Connecting Edges */}
                {repo.commits.map((c) => {
                  const targetPos = graphLayout.commitPositions[c.id];
                  if (!targetPos) return null;

                  return c.parents.map((pId) => {
                    const sourcePos = graphLayout.commitPositions[pId];
                    if (!sourcePos) return null;

                    // Smooth Bezier Curve from parent to child
                    const midX = (sourcePos.x + targetPos.x) / 2;
                    const pathData = `M ${sourcePos.x} ${sourcePos.y} C ${midX} ${sourcePos.y}, ${midX} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;

                    const isMergeEdge = c.parents.length > 1;

                    return (
                      <g key={`${pId}->${c.id}`}>
                        <path
                          d={pathData}
                          fill="none"
                          stroke={isMergeEdge ? '#38bdf8' : '#334155'}
                          strokeWidth={isMergeEdge ? 2.5 : 2}
                          strokeDasharray={isMergeEdge ? '4 2' : undefined}
                          className="transition-all duration-300"
                        />
                        {/* Little directional dot on curve */}
                        <circle
                          cx={midX}
                          cy={(sourcePos.y + targetPos.y) / 2}
                          r={2}
                          fill="#64748b"
                        />
                      </g>
                    );
                  });
                })}

                {/* 2. Commit Nodes */}
                {repo.commits.map((c) => {
                  const pos = graphLayout.commitPositions[c.id];
                  if (!pos) return null;

                  const isSelected = selectedCommitId === c.id;
                  const isMain = c.branchName === 'main';

                  // Branch references pointing to this commit
                  const branchPointers = Object.entries(repo.branches)
                    .filter(([_, cid]) => cid === c.id)
                    .map(([bName]) => bName);

                  const isHeadHere =
                    (repo.head.type === 'branch' && branchPointers.includes(repo.head.target)) ||
                    (repo.head.type === 'commit' && repo.head.target === c.id);

                  return (
                    <g
                      key={c.id}
                      onClick={() => setSelectedCommitId(c.id)}
                      className="cursor-pointer group"
                    >
                      {/* Selection Aura */}
                      {isSelected && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={24}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          className="animate-spin-slow origin-center"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Head pointer ring */}
                      {isHeadHere && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={22}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                        />
                      )}

                      {/* Commit Circle Body */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={16}
                        fill={isMain ? 'url(#mainGradient)' : 'url(#featureGradient)'}
                        stroke="#0f172a"
                        strokeWidth={2}
                        className="transition-transform duration-200 group-hover:scale-110"
                      />

                      {/* Inner Node Icon / Letter */}
                      <text
                        x={pos.x}
                        y={pos.y + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        pointerEvents="none"
                      >
                        {c.id}
                      </text>

                      {/* Short Hash Tag under node */}
                      <text
                        x={pos.x}
                        y={pos.y + 30}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                        pointerEvents="none"
                      >
                        {c.hash}
                      </text>

                      {/* Branch & HEAD Pill Labels above node */}
                      {branchPointers.length > 0 && (
                        <g transform={`translate(${pos.x}, ${pos.y - 32})`}>
                          {branchPointers.map((bName, bIdx) => {
                            const isCurrentHeadBranch =
                              repo.head.type === 'branch' && repo.head.target === bName;

                            return (
                              <g key={bName} transform={`translate(0, ${-bIdx * 18})`}>
                                <rect
                                  x={-34}
                                  y={-10}
                                  width={68}
                                  height={15}
                                  rx={4}
                                  fill={isCurrentHeadBranch ? '#f59e0b' : '#1e293b'}
                                  stroke={isCurrentHeadBranch ? '#fbbf24' : '#475569'}
                                  strokeWidth={1}
                                />
                                <text
                                  x={0}
                                  y={1}
                                  textAnchor="middle"
                                  fill={isCurrentHeadBranch ? '#0f172a' : '#e2e8f0'}
                                  fontSize="9"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  {isCurrentHeadBranch ? `HEAD -> ${bName}` : bName}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      )}

                      {/* Detached HEAD label */}
                      {repo.head.type === 'commit' && repo.head.target === c.id && (
                        <g transform={`translate(${pos.x}, ${pos.y - 32})`}>
                          <rect
                            x={-42}
                            y={-10}
                            width={84}
                            height={15}
                            rx={4}
                            fill="#dc2626"
                            stroke="#f87171"
                            strokeWidth={1}
                          />
                          <text
                            x={0}
                            y={1}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            HEAD (detached)
                          </text>
                        </g>
                      )}

                      {/* Merge badge */}
                      {c.isMerge && (
                        <g transform={`translate(${pos.x + 10}, ${pos.y - 12})`}>
                          <circle cx={0} cy={0} r={6} fill="#0284c7" />
                          <text
                            x={0}
                            y={2}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="7"
                            fontWeight="bold"
                          >
                            M
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-900 pt-3">
              <span>💡 Click any commit node above to view its contents, parent hashes, and file diffs.</span>
              <span className="font-mono text-emerald-400">Selected: {selectedCommit.id} ({selectedCommit.hash})</span>
            </div>
          </div>

          {/* Dual Panel: Commit Inspector + Terminal CLI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Commit Node Inspector (4 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                    {selectedCommit.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Commit {selectedCommit.hash}</span>
                      {selectedCommit.isMerge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300">
                          3-way merge
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Branch: <span className="text-indigo-400">{selectedCommit.branchName}</span> · {selectedCommit.timestamp}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const res = handleCheckout(selectedCommit.id);
                    setTerminalHistory((p) => [...p, { cmd: `git checkout ${selectedCommit.id}`, output: res }]);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-all cursor-pointer"
                  title="Checkout this commit directly"
                >
                  Checkout
                </button>
              </div>

              {/* Message */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Commit Message
                </span>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono">
                  {selectedCommit.message}
                </div>
              </div>

              {/* Author & Lineage */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Parents</span>
                  <span className="text-cyan-400 font-bold">
                    {selectedCommit.parents.length > 0 ? selectedCommit.parents.join(', ') : '(root)'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Author</span>
                  <span className="text-slate-300 truncate block">{selectedCommit.author}</span>
                </div>
              </div>

              {/* Changed Files & Diffs */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Changed Files &amp; Tree Snapshot ({selectedCommit.files.length})
                </span>
                <div className="space-y-2">
                  {selectedCommit.files.map((f, i) => (
                    <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300 mb-1">
                        <span className="flex items-center gap-1.5 font-bold">
                          <FileText className="h-3.5 w-3.5 text-cyan-400" />
                          {f.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                          {f.status}
                        </span>
                      </div>
                      {f.diff && (
                        <pre className="p-2 rounded bg-slate-900 text-[11px] text-slate-300 overflow-x-auto whitespace-pre font-mono">
                          {f.diff.split('\n').map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className={
                                line.startsWith('+')
                                  ? 'text-emerald-400'
                                  : line.startsWith('-')
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Functional Terminal CLI (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col h-[480px] shadow-2xl overflow-hidden">
              {/* Terminal Window Header */}
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <TerminalIcon className="h-3.5 w-3.5 text-emerald-400" />
                    git bash · ~/cs-odyssey/repo (
                    <span className="text-emerald-400">
                      {repo.head.type === 'branch' ? repo.head.target : `detached:${repo.head.target}`}
                    </span>
                    )
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>Press Tab or type 'help'</span>
                </div>
              </div>

              {/* Terminal Output Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs text-slate-200">
                <div className="text-slate-500 text-[11px] leading-relaxed border-b border-slate-900 pb-2">
                  💡 Type commands like <span className="text-emerald-400">git status</span>,{' '}
                  <span className="text-emerald-400">git add .</span>,{' '}
                  <span className="text-emerald-400">git commit -m "msg"</span>,{' '}
                  <span className="text-indigo-400">git branch feature-x</span>,{' '}
                  <span className="text-indigo-400">git checkout feature-x</span>,{' '}
                  <span className="text-cyan-400">git merge</span>, or{' '}
                  <span className="text-amber-400">help</span>.
                </div>

                {terminalHistory.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-emerald-400 font-bold">$</span>
                      <span className="text-white font-semibold">{item.cmd}</span>
                    </div>
                    {item.output && (
                      <pre
                        className={`whitespace-pre-wrap leading-relaxed text-[11px] pl-4 border-l-2 ${
                          item.isError
                            ? 'border-rose-500/50 text-rose-300'
                            : 'border-slate-800 text-slate-300'
                        }`}
                      >
                        {item.output}
                      </pre>
                    )}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Terminal Input Bar */}
              <div className="border-t border-slate-800 bg-slate-900/60 p-3 shrink-0">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                    <span>user@cs-odyssey</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-cyan-400">~/repo</span>
                    <span className="text-slate-500">(</span>
                    <span className="text-amber-300">
                      {repo.head.type === 'branch' ? repo.head.target : `detached:${repo.head.target}`}
                    </span>
                    <span className="text-slate-500">)$</span>
                  </span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. git commit -m 'feat: my change' or git merge"
                    className="flex-1 bg-transparent text-white placeholder-slate-600 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => executeGitCommand(terminalInput)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer shrink-0"
                  >
                    Run
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: THE 3 TREES OF GIT (Working Tree vs Staging vs Repo) */}
      {viewMode === 'staging' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              The Three Trees of Git: How Code Moves to GitHub
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unlike Google Docs or typical backup tools, Git has a two-phase commit system. Changes live in your
              working folder, move to the Staging Area (index) via <code className="text-cyan-400">git add</code>,
              get permanently saved in the local repository via <code className="text-emerald-400">git commit</code>,
              and finally get pushed to GitHub via <code className="text-indigo-400">git push</code>.
            </p>
          </div>

          {/* 4 Columns Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Column 1: Working Directory */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Working Directory
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Local Files
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Your actual files on your SSD/laptop where you edit Python and C++ in VS Code.
              </p>
              <div className="space-y-1.5 pt-2">
                {repo.workingTree.length === 0 ? (
                  <div className="text-[11px] font-mono text-slate-500 italic">Working tree clean</div>
                ) : (
                  repo.workingTree.map((w, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between">
                      <span className="text-rose-400">{w.name}</span>
                      <span className="text-[10px] text-slate-500">{w.status}</span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  executeGitCommand('git add .');
                }}
                disabled={repo.workingTree.length === 0}
                className="w-full mt-3 py-2 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600/80 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>git add . →</span>
              </button>
            </div>

            {/* Column 2: Staging Area */}
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  2. Staging Area (Index)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  Ready to Commit
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                The drafting board. You select precisely which files and lines should be bundled into the next snapshot.
              </p>
              <div className="space-y-1.5 pt-2">
                {repo.stagingArea.length === 0 ? (
                  <div className="text-[11px] font-mono text-slate-500 italic">Staging area empty</div>
                ) : (
                  repo.stagingArea.map((s, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900 border border-cyan-500/30 text-xs font-mono flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">{s.name}</span>
                      <span className="text-[10px] text-cyan-300">staged</span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => {
                  executeGitCommand('git commit -m "feat: staged changes snapshot"');
                }}
                disabled={repo.stagingArea.length === 0}
                className="w-full mt-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>git commit -m →</span>
              </button>
            </div>

            {/* Column 3: Local Repository (.git) */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  3. Local Repo (.git DAG)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  {repo.commits.length} Snapshots
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                The permanent immutable database inside <code className="text-slate-300">.git/</code> with all commit nodes and branch pointers.
              </p>
              <div className="space-y-1.5 pt-2 max-h-40 overflow-y-auto">
                {repo.commits.slice(-3).reverse().map((c) => (
                  <div key={c.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>{c.id} ({c.hash})</span>
                      <span className="text-[10px] text-slate-400">{c.branchName}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate mt-0.5">{c.message}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setTerminalHistory((p) => [
                    ...p,
                    {
                      cmd: 'git push origin main',
                      output: 'Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nWriting objects: 100% (3/3), 482 bytes | 482.00 KiB/s, done.\nTo https://github.com/student/cs-odyssey.git\n   9f4c3b..4a9b1c  main -> main',
                    },
                  ]);
                  setViewMode('graph');
                }}
                className="w-full mt-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>git push origin →</span>
              </button>
            </div>

            {/* Column 4: Remote GitHub */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  4. Remote (GitHub)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-400">
                  Cloud Proof
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                The cloud backup, team collaboration hub, and collegiate admissions portfolio where your commits are public proof of mastery.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  <FolderGit2 className="h-4 w-4 text-indigo-400" />
                  <span>github.com/alex-student</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Default branch: <span className="font-mono text-emerald-400">main</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Continuous Integration: <span className="text-emerald-400 font-semibold">Passing</span>
                </div>
              </div>
              {onNavigateToProjects && (
                <button
                  onClick={onNavigateToProjects}
                  className="w-full mt-3 py-2 rounded-lg border border-indigo-500/50 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Build Portfolio Projects →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: MENTAL MODELS & CHEAT SHEET */}
      {viewMode === 'cheatsheet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: What is a Commit? */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <GitCommit className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">What Actually is a Git Commit?</h3>
                <span className="text-xs text-slate-400">Mental Model 1</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A Git commit is <strong>NOT</strong> a diff of changes. It is a full snapshot of all tracked files at
              that moment in time. If a file didn&apos;t change, Git simply stores a lightweight cryptographic pointer to
              the identical blob from the previous commit!
            </p>
            <div className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-300 space-y-1">
              <div>commit 9f4c3b (SHA-1 hash of contents + metadata)</div>
              <div>tree: 7d1e8a (root folder structure)</div>
              <div>parent: e82a10 (previous commit hash)</div>
              <div>author: Alex Student &lt;alex@cs-odyssey.dev&gt;</div>
            </div>
          </div>

          {/* Card 2: What is a Branch? */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">What is a Git Branch?</h3>
                <span className="text-xs text-slate-400">Mental Model 2</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In other tools, branching copies entire folders. In Git, a branch is literally just a tiny 41-byte text
              file in <code className="text-cyan-400">.git/refs/heads/branch-name</code> containing the 40-character
              SHA hash of its newest commit! Creating a branch takes microseconds and uses almost zero disk space.
            </p>
            <div className="rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-300 space-y-1">
              <div>cat .git/refs/heads/main</div>
              <div className="text-emerald-400">9f4c3b52a1d82f7e0018ac49...</div>
            </div>
          </div>

          {/* Card 3: Merge vs Rebase */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Split className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Merge vs Rebase: The Golden Rule</h3>
                <span className="text-xs text-slate-400">Team Strategy</span>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>Merge (<code className="text-cyan-400">git merge</code>):</strong> Preserves the exact chronological history.
                Creates a merge bubble commit with two parents. Safe for public/shared branches.
              </p>
              <p>
                <strong>Rebase (<code className="text-amber-400">git rebase</code>):</strong> Replays your local commits on top of the
                latest main branch, producing a strictly linear history without merge bubbles.
              </p>
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] font-mono">
                ⚠️ Golden Rule: Never rebase commits that you have already pushed to a shared public branch!
              </div>
            </div>
          </div>

          {/* Card 4: Golden Privacy Rule */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Golden Privacy &amp; Security Rules</h3>
                <span className="text-xs text-slate-400">Cybersecurity Bedrock</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
              <li>
                <strong>Never commit secrets:</strong> Passwords, API tokens, <code className="text-amber-300">.env</code> files, and SSH private keys.
              </li>
              <li>
                <strong>Use <code className="text-cyan-300">.gitignore</code> early:</strong> Add patterns before making your first commit so credentials are never tracked.
              </li>
              <li>
                <strong>Git history is permanent:</strong> Deleting a password in commit #2 does <em>not</em> erase it from commit #1 in the public log!
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL 1: Create New Branch */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-indigo-400" />
                Create New Git Branch
              </h3>
              <button
                onClick={() => setShowBranchModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Branches let you develop features, fix bugs, or safely experiment without disturbing the{' '}
              <code className="text-emerald-400">main</code> branch.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Branch Name:</label>
              <input
                type="text"
                value={newBranchInput}
                onChange={(e) => setNewBranchInput(e.target.value)}
                placeholder="e.g. feature/auth, bugfix/packet-leak"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBranchModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const res = handleCreateBranch(newBranchInput, true);
                  setTerminalHistory((p) => [
                    ...p,
                    { cmd: `git checkout -b ${newBranchInput.trim()}`, output: res },
                  ]);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer"
              >
                Create &amp; Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Merge Branch */}
      {showMergeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-cyan-400" />
                Merge Branch into {repo.head.type === 'branch' ? repo.head.target : 'HEAD'}
              </h3>
              <button
                onClick={() => setShowMergeModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select which branch history you wish to integrate into your currently checked-out branch.
            </p>

            <div className="space-y-2">
              {Object.keys(repo.branches)
                .filter((b) => repo.head.type !== 'branch' || repo.head.target !== b)
                .map((bName) => (
                  <button
                    key={bName}
                    onClick={() => {
                      const res = handleMerge(bName);
                      setTerminalHistory((p) => [...p, { cmd: `git merge ${bName}`, output: res }]);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/50 hover:bg-slate-900 text-left transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{bName}</div>
                      <div className="text-[11px] text-slate-400">
                        Points to commit {repo.branches[bName]}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400">Merge →</span>
                  </button>
                ))}
              {Object.keys(repo.branches).length <= 1 && (
                <div className="text-xs text-slate-400 italic p-3 text-center">
                  Only one branch exists! Create another branch first to practice merging.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Rebase Branch */}
      {showRebaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Split className="h-4 w-4 text-amber-400" />
                Rebase {repo.head.type === 'branch' ? repo.head.target : 'HEAD'} onto Upstream
              </h3>
              <button
                onClick={() => setShowRebaseModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Rewinds your current branch commits, pulls in the latest target branch commits, and replays your work on top.
            </p>

            <div className="space-y-2">
              {Object.keys(repo.branches)
                .filter((b) => repo.head.type !== 'branch' || repo.head.target !== b)
                .map((bName) => (
                  <button
                    key={bName}
                    onClick={() => {
                      const res = handleRebase(bName);
                      setTerminalHistory((p) => [...p, { cmd: `git rebase ${bName}`, output: res }]);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-amber-500/50 hover:bg-slate-900 text-left transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{bName}</div>
                      <div className="text-[11px] text-slate-400">
                        Base onto commit {repo.branches[bName]}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-400">Rebase →</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
