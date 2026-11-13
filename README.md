# 🌌 CS Odyssey: Zero to Hero Computer Science & Systems Mastery

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Regression Tests](https://img.shields.io/badge/tests-24%20passed-brightgreen.svg)]()
[![Platform: Next.js 15](https://img.shields.io/badge/Next.js-15.5-black.svg?logo=next.js)]()
[![React: 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)]()
[![TypeScript: 5](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg?logo=typescript)]()
[![Tailwind CSS: 4](https://img.shields.io/badge/TailwindCSS-4.1-38b2ac.svg?logo=tailwind-css)]()
[![Security Audit: Hardened](https://img.shields.io/badge/security-SSRF%20Hardened-blue.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive, self-paced, production-grade Computer Science & Systems Engineering platform engineered for ambitious high-schoolers (Grade 9+), university undergrads, and self-taught engineers to progress from absolute computational foundations (**Zero**) to collegiate-level systems programming (**Hero**).

---

## 🌟 Interactive Features & Architecture

### 1. 🛡️ Cyber Citadel Wargame & Linux Terminal Engine
- **100% Offline Virtual Sandbox**: A client-side simulated Linux filesystem containing 20+ progressively challenging cybersecurity levels. Fully playable offline with zero network latency and no external server requirements.
- **Interactive File System Explorer**: Visualizes the current working directory in real-time with clickable path breadcrumbs, parent directory (`..`) navigation, dotfile visibility toggle, and item counts. Automatically synchronizes with terminal commands (`cd`, `touch`, `mkdir`, `rm`, redirection `>`).
- **Split-View File Reader Pane**: Clicking any file in the file explorer opens it instantly in a side-by-side reading split-pane featuring:
  - Line-numbered monospace viewer with clean syntax presentation.
  - Plain Text vs. Hex Dump toggle (`00000000: xx xx ... |ascii|`) for binary inspection.
  - Automatic 32-character wargame password/flag detection with one-click "Save & Unlock Next Level".
- **Customizable Dynamic ASCII Art Header**:
  - Automatically updates based on the current active directory (e.g. `/home/bandit3/inhere`, `/var/log`) or Bandit level (Level 0–15+).
  - 5 switchable typography styles: **Slant**, **Block**, **Doom**, **Matrix**, and **Minimal**.
  - 5 retro CRT phosphor palettes: **Cyan Glow**, **Matrix Green**, **Amber CRT**, **Neon Purple**, and **Monochrome White**.
  - One-click collapse/expand toggle to maximize terminal screen real estate.
  - Full tracking mode options: Auto (Level + Dir), Level-only, or Directory-only.
- **Tactile Retro Audio Feedback**: Powered natively by the browser **Web Audio API** (`AudioContext`). Features volume-balanced mechanical keyclicks, carriage return thumps, 8-bit dual-tone success chimes, and modem connect chirps. 100% synthesis with **zero external MP3/WAV downloads**, instant offline availability, and persistent mute/unmute control.
- **Command Quick-Reference Side Panel**:
  - Dynamically highlights commands relevant to the current active level (e.g., `cat ./-` for dashed files, `file ./*` for magic byte inspection, `find -size 1033c` for byte filtering, `strings` for binary extraction, `tr` for ROT13 ciphers, `xxd -r` for hex dumps, `openssl s_client` for SSL/TLS encrypted sockets).
  - Search filter by keyword, category, and syntax.
  - One-click **"Insert ↵"** button to paste and format commands directly into the terminal prompt.
- **Optional External Wargame Gateway**:
  - Real-time SSH tunnel supporting educational connections to public wargame targets such as `bandit.labs.overthewire.org:2220`.
  - Built with a hardened Node.js backend proxy featuring strict SSRF IP whitelisting, connection pooling, and token-bucket rate limiting.

### 2. 📋 Interactive Master Cheat Sheet & Quick-Reference
- Accessible globally from the navigation bar or terminal prompt.
- Comprehensive coverage across 8 essential categories:
  - **Linux Core**: `ls -la`, `cat`, `find`, `file`, `chmod`, `diff`.
  - **Pipes & Stream Filters**: `sort`, `uniq -u`, `grep -rnE`, `tr`, `strings`, `xxd`.
  - **Security & Cryptography**: `base64 -d`, `openssl s_client`, `nmap -sV`, `sha256sum`.
  - **Git Version Control**: `git commit`, `git checkout -b`, `git rebase`, `git reset HEAD~1`.
  - **C Systems & Memory**: Pointer arithmetic (`*`, `&`), dynamic memory (`malloc`, `free`), hardened GCC flags (`-O2 -Wall -Wextra`).
  - **Python Engineering**: List comprehensions, generators, and context managers (`with` statement).
  - **Wargame Tactics**: Handling whitespace, leading-dash flags (`cat ./-`), multilayer decompression pipelines (`tar`, `gzip`, `bzip2`).
- Real-time search, one-click syntax copy, and direct terminal insertion.

### 3. 🌿 Interactive Git DAG Sandbox & Version Control Studio
- **Real-Time Directed Acyclic Graph (DAG)**: Visualizes commit nodes, parent hashes, branch pointers, and `HEAD` tracking in responsive SVG.
- **3-Trees Engine**: Models the working directory, staging area (index), and commit repository.
- **Interactive Scenarios**:
  1. *First Commit on Main*
  2. *Branching & Pointers*
  3. *Fast-Forward Merges*
  4. *3-Way Diverged Merges with Conflict Resolution*
  5. *Linear History Rebasing*
  6. *Detached HEAD State & Time Travel*

### 4. ⚡ Binary & Mathematical Foundations Lab
- Interactive 8-bit, 16-bit, and 32-bit binary flipper with power-of-two weights ($2^7$ to $2^0$).
- Hexadecimal nibble breakdown and address calculator.
- Two's Complement signed integer visualizer demonstrating negative sign bits and integer overflow.
- Boolean logic gate simulator (AND, OR, NOT, XOR, NAND, NOR, XNOR) with dynamic truth tables.
- Floating-Point IEEE 754 single-precision inspector and bitwise shifting workbench (`<<`, `>>`, `&`, `|`, `^`, `~`).

### 5. 🏆 Hero Advanced Systems Engineering & 14-Stage Curriculum
Progressive curriculum spanning Stages 0–13 (Zero to Collegiate & Systems Depth):
- **Foundations to Systems**: Binary/Logic, Python, Digital Logic, Linux/Git, Networking, Web/SQL, C Pointers, Modern C++, Go, x86-64 Assembly, Cybersecurity, Portfolio Prep, **Data Structures & Algorithms (Stage 12)**, and **Compilers & Distributed Systems (Stage 13)**.
- **Hero Modules**: Operating Systems, Databases, Computer Networking, DSA, Distributed Systems, Systems Security, **Compilers & Language Runtimes**, and **CPU Architecture, Pipelines & Cache Locality**.
- **Interactive Curriculum Competency Graph (`CurriculumSkillGraph`)**: Visual 7-tier prerequisite DAG spanning Stages 0–13, live completion rings, one-click single-stage `.md` handouts, and instant stage jumping.
- **Global Verified Source Library (`SourceLibraryView`)**: Searchable catalog across University Courses (MIT OCW, Harvard CS50, CMU, Stanford), Video Lectures, Open Textbooks, RFCs/Official Docs, Interactive Labs, Seminal Papers, and GitHub Repositories.
- **Open-Source Curriculum Exporter (`CurriculumExportHub`)**: Interactive weekly pacing calculator (`4–25 hrs/week`) with one-click generation of Student Roadmaps (`.md`), Educator Syllabi & Rubrics (`.md`), **Printable HTML Syllabi (`.html`)**, GitHub Curriculum Packs (`README-CURRICULUM.md`), **`CONTRIBUTING.md`**, LMS/Spreadsheet schedules (`.csv`), and structured machine-readable JSON schemas (`.json`) released under MIT License.

### 6. 💻 Systems Lab Workspace (`SystemsLabWorkspace`)
- Unified workbench hosting:
  - **Code Playground**: Embedded Monaco editor supporting Python 3 and GCC C11 with snippet manager.
  - **Algorithms & Graph Pathfinding Visualizer (`AlgorithmVisualizerLab`)**: Live interactive simulation engine supporting **Merge Sort**, **Quick Sort**, **Insertion Sort**, **Bubble Sort**, plus an editable weighted grid for **Dijkstra**, **BFS**, and **DFS** pathfinding.
  - **Hardened Execution Engine**: 5-second process timeout, 64MB memory limit, and 1MB stdout cap.
  - **Git DAG Sandbox & Foundations Studio**: Interactive commit graph, 3-trees model, and binary/hex/logic labs.
  - **RAM & Pointer Grid & Packet Tracer**: Live memory cell pointer dereferencing (`*ptr`) and 6-hop DNS → TCP → TLS 1.3 → HTTPS flow inspection.
  - **Big-O Asymptotics & Memory Latency Lab**: Interactive operation scaling slider (`N = 10..50,000`) alongside CPU Register / L1 / L2 / L3 / DRAM / NVMe latency hierarchy tables.
  - **Spatial & Optical Studio (`FuturisticStudio`)**: Futuristic optical workbench pairing perspective depth cloud (`DepthField`), WebGL 2.0 chromatic refraction (`RefractedText`), fluid typing ripples (`FluidTyping`), thin-film soap bubble controls (`SoapBubbleMaterial`), 3D sculpted terrain (`TopographicTerrain`), rigid-body 3D-volume physics (`ShapePhysics`), and spring-physics gallery (`FanGallery`), plus `LiquidGlassLogo` and `LiquidGlassOrb` agent visualization.

### 7. 🎯 Overview Workbench, `Cmd+K` Command Palette & Reference Library
- **Command Palette (`Cmd+K` / `Ctrl+K`)**: Instant keyboard Spotlight jump across all 14 stages, 40+ topics, Hero systems tracks, 40+ verified external sources, CLI commands, and interactive sandboxes.
- Unified **Overview Workspace** (`OverviewWorkspace`) featuring the live Prerequisite Skill Graph, inline telemetry strip, daily focus micro-tasks, weekly cadence streaks, and personalized milestone tracking.
- **Reference Library** (`ReferenceWorkspace`) unifying Global Source Library, Command Vault, Stage Study Notebook, Glossary Flashcards, and Field Directory.
- **100% Client-Side Privacy**: All student data, notes, and milestones are stored exclusively in browser `localStorage`, with one-click JSON backup export and import.

---

## 🔒 Security Architecture & Trust Boundary Hardening

CS Odyssey enforces an exhaustive zero-trust security architecture across both server-side routes and client-side simulation engines:

1. **SSRF Defense & IP Validation (`/app/api/ssh`)**:
   - Outbound connections are restricted strictly to authorized targets (`bandit.labs.overthewire.org:2220`).
   - Disallows loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS/GCP cloud metadata endpoints against SSRF, octal/hex IP obfuscation, and DNS rebinding attacks.
   - Client-isolated token-bucket rate limiter (max 20 requests/minute, 3 concurrent SSH sessions per IP).
2. **Subprocess Isolation (`/app/api/code`)**:
   - Completely eliminates unsafe shell-interpolation sinks (`child_process.exec`). Replaced exclusively with direct argument vectors via `child_process.execFile`.
   - Hard execution limits: 5-second timeout, 64MB maximum memory, 1MB output buffer, and dropped privileges.
3. **ANSI & DOM XSS Neutralization**:
   - Terminal stream output is sanitized through a strict regex filter removing hazardous ANSI control escape sequences (OSC hyperlinks, cursor repositioning sequences, and terminal escape injection).
4. **Automated Security Regression Suite**:
   - 24 comprehensive automated tests in `tests/security-regression.test.ts` validating SSRF blocking, hex IP normalization, token bucket rate limits, ANSI sanitization, and Git state invariants.

---

## ⚖️ Legal, Trademark & Ethical Wargame Notice

- **Original Wargame Engine**: CS Odyssey includes its own original, built-in security challenges under the **"Cyber Citadel"** simulation engine. All levels, virtual filesystem trees, and flags are self-contained within this repository.
- **External Gateway Interoperability**: For advanced practical training, the platform includes an optional SSH bridge connecting to public educational wargames such as **OverTheWire Bandit** (`bandit.labs.overthewire.org:2220`).
- **Attribution & Non-Affiliation**: OverTheWire and Bandit are independent community cybersecurity wargames hosted and maintained at [overthewire.org](https://overthewire.org). CS Odyssey is an independent open-source educational workstation and is **not affiliated with, endorsed by, or sponsored by OverTheWire**.
- **Server Safety**: The integrated SSH bridge enforces client-side rate limits and connection throttling to ensure zero abuse or denial-of-service load on external wargame infrastructure.

---

## 🚀 Quickstart & Local Development

This application is built with **Next.js 15 (App Router)** and optimized to run with zero friction.

### Prerequisites
- **Node.js**: v20 or higher (v22 LTS recommended)
- **npm** or **pnpm** or **bun**

### Installation

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/your-username/cs-odyssey.git
cd cs-odyssey

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env.local

# 4. Run automated security regression tests
npm test

# 5. Start development server (runs on http://localhost:3000)
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Production Build

\`\`\`bash
# Run security test suite
npm test

# Run TypeScript & ESLint validation
npm run lint

# Compile production bundle
npm run build

# Start production server
npm start
\`\`\`

---

## 🐙 Pushing to GitHub

To push your repository to GitHub:

\`\`\`bash
# Initialize git repository (if not already initialized)
git init

# Add all files
git add .

# Create initial commit following Conventional Commits
git commit -m "feat: complete CS Odyssey Zero-to-Hero workstation with hardened security, audio FX, and cheat sheet"

# Add your GitHub remote repository
git remote add origin https://github.com/<your-username>/cs-odyssey.git

# Set default branch to main and push
git branch -M main
git push -u origin main
\`\`\`

---

## 📁 Repository Structure

\`\`\`
cs-odyssey/
├── app/
│   ├── api/
│   │   ├── code/                  # Hardened sandboxed code runner (Python & C)
│   │   ├── ssh/                   # SSRF-protected SSH gateway
│   │   └── tutor/                 # AI mentor proxy
│   ├── globals.css                # Global Tailwind CSS styles
│   ├── layout.tsx                 # Root HTML layout & meta tags
│   └── page.tsx                   # Main workspace assembler & router
├── components/
│   ├── AdvancedHeroHub.tsx        # Hero advanced systems modules (OS, DB, DSA, Compilers, Hardware)
│   ├── AiMentorPanel.tsx          # Gemini AI study mentor slide-over
│   ├── AlgorithmVisualizerLab.tsx # Live Sorting & Weighted Graph Pathfinding visualizer
│   ├── AsciiTerminalHeader.tsx    # Dynamic ASCII banner generator for terminal workspace
│   ├── CheatSheetModal.tsx        # Master interactive 8-category Cheat Sheet
│   ├── CodePlayground.tsx         # Monaco editor workbench (Python/C)
│   ├── CommandPalette.tsx         # Global Cmd+K / Ctrl+K Spotlight navigation modal
│   ├── CommandVault.tsx           # Searchable CLI command database
│   ├── CurriculumExportHub.tsx    # Student/Teacher/GitHub Exporter (.md/.html/.csv/.json) + pacing calculator
│   ├── CurriculumSkillGraph.tsx   # Interactive 14-Stage prerequisite dependency DAG
│   ├── CurriculumWorkspace.tsx    # Unified Curriculum hub (Handbook, Graph, Hero, Projects, Export)
│   ├── DailyChallengeWidget.tsx   # Daily micro-tasks & streak keeper
│   ├── DirectoryView.tsx          # Resource directory with direct URLs
│   ├── FoundationsStudio.tsx      # Binary, hex, Boolean, and bitwise lab
│   ├── FuturisticStudio.tsx       # Spatial & Optical Studio (Depth, Refraction, Fluid, Soap Optics, Terrain, Physics, Fan)
│   ├── GitSandbox.tsx             # Interactive Git DAG, 3-Trees, and scenarios
│   ├── GlossaryFlashcards.tsx     # Computer Science terms flashcards
│   ├── Navbar.tsx                 # Top 3-zone 5-workspace responsive navigation
│   ├── NotebookView.tsx           # Student notebook with JSON export/import
│   ├── OverviewWorkspace.tsx      # Engineering workbench overview with optical hero, Skill Graph & telemetry
│   ├── ProjectsStudio.tsx         # 14 documented engineering portfolio projects
│   ├── QuickQuizModal.tsx         # Interactive concept test modal
│   ├── ReferenceWorkspace.tsx     # Unified Reference hub (Sources, Vault, Notebook, Glossary, Directory)
│   ├── SourceLibraryView.tsx      # Searchable Global Source Catalog (Videos, Courses, Books, Papers, Labs)
│   ├── StageExplorer.tsx          # 14-stage student handbook with single-stage .md export
│   ├── SystemsLabWorkspace.tsx    # Unified Lab hub (Playground, Visualizer, Foundations, Git, RAM, Packet, Big-O, Studio)
│   └── TerminalSimulator.tsx      # Real SSH + Cyber Citadel virtual sandbox with Quick-Ref
├── hooks/
│   └── use-odyssey-store.ts       # Client-side persistent state & local storage
├── lib/
│   ├── bandit-commands-data.ts    # Command dictionary with syntaxes & tips
│   ├── client-security.ts         # Browser-safe path normalization & ANSI sanitization
│   ├── code-runner.ts             # Hardened subprocess execution engine
│   ├── curriculum-data.ts         # 14-stage curriculum, Hero modules, projects, channels
│   ├── curriculum-export.ts       # Open-Source Markdown, CSV, & JSON syllabus generator
│   ├── gemini.ts                  # Gemini API client initialization
│   ├── rate-limiter.ts            # Token-bucket rate limiter & concurrency guard
│   ├── security.ts                # Server-side SSRF validation & IP restriction
│   ├── sources-catalog.ts         # Verified Global CS Knowledge Library (Videos, OCW, Books, Papers)
│   ├── terminal-audio.ts          # Native Web Audio API sound synthesizer
│   └── utils.ts                   # Styling utilities (clsx & twMerge)
├── tests/
│   └── security-regression.test.ts # 24 automated security & logic unit tests
├── .gitattributes                 # Cross-platform line ending normalization
├── .gitignore                     # Git ignore rules for node_modules, logs, and secrets
├── metadata.json                  # AI Studio application manifest
└── package.json                   # Dependencies, build scripts, and test runner
\`\`\`

---

## 📄 License

MIT License © 2026 CS Odyssey Project. Free and open-source for students, educators, and independent engineers worldwide.
