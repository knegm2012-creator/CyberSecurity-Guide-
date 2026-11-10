# 🌌 CS Odyssey: Zero to Hero 6-Month Mastery

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Platform: Next.js 15](https://img.shields.io/badge/Next.js-15.5-black.svg?logo=next.js)]()
[![React: 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)]()
[![TypeScript: 5](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg?logo=typescript)]()
[![Tailwind CSS: 4](https://img.shields.io/badge/TailwindCSS-4.1-38b2ac.svg?logo=tailwind-css)]()
[![Cybersecurity: OverTheWire Bandit](https://img.shields.io/badge/Wargame-OverTheWire%20Bandit-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive, self-paced, production-grade Computer Science & Systems Engineering platform specifically designed for high-school learners (Grade 9+) and self-taught software engineers to achieve CS mastery in 6 months.

---

## 🌟 Key Features & Interactive Architecture

### 1. 🛡️ Live OverTheWire Bandit Terminal Simulator with Command Quick-Reference
- **Real-Time SSH Bridge**: Live SSH client connection directly to `bandit.labs.overthewire.org:2220` with backend session proxying.
- **Offline Virtual Sandbox Mode**: Interactive client-side Linux file system emulator with commands (`ls -la`, `cat`, `grep`, `find`, `file`, `sort`, `uniq`, `strings`, `base64`, `tr`, `xxd`, `pwd`, `whoami`, `man`, etc.).
- **Command Quick-Reference Side Panel**:
  - Dynamically highlights commands relevant to the current Bandit level being attempted (e.g. `cat ./-` for Level 1, `file ./*` for Level 4, `find -size 1033c` for Level 5, `strings` for Level 9, `base64 -d` for Level 10, `tr` for Level 11, `xxd -r` for Level 12, `openssl s_client` for Level 15).
  - Search filter by keyword, category, and syntax.
  - One-click **"Insert ↵"** button to automatically paste and format commands into the active terminal prompt.
  - Copy syntax button and expandable pro-tips with common pitfalls.

### 2. 🌿 Interactive Git DAG Sandbox & Version Control Studio
- **Real-Time Directed Acyclic Graph (DAG)**: Visualizes commit nodes, parent pointers, branch tags, and `HEAD` tracking in real-time SVG.
- **Git State Engine**: Models the **3 Trees** of Git: *Working Directory*, *Staging Area (Index)*, and *Commit History (Repository)*.
- **Full CLI & GUI Control**: Supports both visual deck buttons and terminal commands (`git commit`, `git checkout`, `git branch`, `git merge`, `git rebase`, `git tag`, `git stash`).
- **Interactive Missions**:
  - *Scenario 1: First Commit on Main*
  - *Scenario 2: Creating and Switching to Feature Branches*
  - *Scenario 3: Fast-Forward Merges*
  - *Scenario 4: 3-Way Diverged Merges with Conflict Simulation*
  - *Scenario 5: Linear History Rebasing*
  - *Scenario 6: Detached HEAD State & Time Travel*
- **Engineering Specification**: Integrated Production README.md Generator, Conventional Commits guide, and `.gitignore` blueprints.

### 3. ⚡ Binary & Mathematical Foundations Lab
- Real-time 8-bit, 16-bit, and 32-bit binary flipper with byte weights ($2^7$ to $2^0$).
- Hexadecimal address calculator and nibble visualizer.
- Two's Complement signed integer calculator with negative sign bit and overflow demonstration.
- Interactive Boolean logic gates simulator (AND, OR, NOT, XOR, NAND, NOR, XNOR) with truth tables.
- Floating-Point IEEE 754 inspector and bitwise shifting simulator (`<<`, `>>`, `&`, `|`, `^`, `~`).

### 4. 💻 Embedded Concept Labs & Code Playground
- Embedded Monaco code editor supporting Python 3 and C.
- Syntax highlighting, sample templates for algorithms and systems calls.
- In-memory save/load snippet manager with local persistence.

### 5. 🎯 Progress Dashboard & Milestone Tracking
- Personalized milestone builder with target dates and XP rewards.
- Daily consistency streak counter (🔥) with a 7-day activity matrix.
- Stage-by-stage mastery checklists and exit requirements.

---

## 🚀 Quickstart & Local Development

This application is built with **Next.js 15 (App Router)** and optimized to run with zero friction on low-end laptops and workstations.

### Prerequisites
- Node.js 20+ installed
- npm or bun

### Installation
\`\`\`bash
# 1. Clone the repository
git clone https://github.com/your-username/cs-odyssey.git
cd cs-odyssey

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env.local

# 4. Run development server (runs on http://localhost:3000)
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to start your journey!

---

## 🛠️ Build & Verification

\`\`\`bash
# Run linting check
npm run lint

# Build production bundle
npm run build

# Start production server
npm start
\`\`\`

---

## 📁 Repository Structure

\`\`\`
cs-odyssey/
├── app/
│   ├── api/
│   │   ├── code/          # Remote code sandbox runner (Python & C)
│   │   ├── ssh/           # Real-time SSH bridge to OverTheWire Bandit
│   │   └── tutor/         # AI mentor guidance proxy
│   ├── globals.css        # Global Tailwind CSS styles
│   ├── layout.tsx         # Root HTML layout & meta tags
│   └── page.tsx           # Main workspace assembler & router
├── components/
│   ├── AdvancedHeroHub.tsx      # Collegiate CS topics (OS, DB, DSA, Networks, Security)
│   ├── AiMentorPanel.tsx        # Gemini AI study mentor
│   ├── CodePlayground.tsx       # Monaco editor workbench (Python/C)
│   ├── CommandVault.tsx         # Searchable CLI command database
│   ├── ConceptLabs.tsx          # Interactive memory, packet, and logic labs
│   ├── DailyChallengeWidget.tsx # Daily micro-tasks & streak keeper
│   ├── FoundationsStudio.tsx    # Binary, hex, Boolean, and bitwise lab
│   ├── GitSandbox.tsx           # Interactive Git DAG, 3-Trees, and scenarios
│   ├── MissionControl.tsx       # Hero control center, daily goals, quick actions
│   ├── Navbar.tsx               # Top 3-zone responsive navigation
│   ├── ProgressDashboard.tsx    # Milestones, streaks, and study logs
│   ├── ProjectsStudio.tsx       # 14 documented engineering portfolio projects
│   ├── StageExplorer.tsx        # 12-stage complete student handbook
│   └── TerminalSimulator.tsx    # Real SSH + Virtual Bandit simulator with Quick-Ref
├── hooks/
│   └── use-odyssey-store.ts     # Client-side persistent state & local storage
├── lib/
│   ├── bandit-commands-data.ts  # Bandit command dictionary with syntaxes & tips
│   ├── curriculum-data.ts       # 12-stage curriculum, Bandit levels, projects
│   ├── gemini.ts                # Gemini API client initialization
│   └── utils.ts                 # Styling utilities (clsx & twMerge)
├── metadata.json                # AI Studio manifest
└── package.json                 # Dependencies & scripts
\`\`\`

---

## 🔒 Security & Privacy Boundary

- **Client-Side Privacy**: All student notes, progress checklists, passwords, and custom milestones are stored in browser `localStorage`.
- **Safe SSH Isolation**: The live SSH proxy binds strictly to designated educational wargame servers (`bandit.labs.overthewire.org`) with strict command timeout and byte caps.
- **Secrets Management**: No API keys or credentials are ever checked into Git history or exposed to client-side bundles.

---

## 📄 License

MIT License © 2026 CS Odyssey Project. Free and open for students, teachers, and independent engineers worldwide.
