# CS Odyssey: Zero to Hero A–Z Computer Science & Systems Mastery

[![Build Status](https://img.shields.io/badge/CI-GitHub%20Actions-2563eb.svg)](.github/workflows/ci.yml)
[![Curriculum: 16 Stages](https://img.shields.io/badge/Curriculum-16%20Stages%20(A--Z)-0284c7.svg)](#a-to-z-zero-to-hero-16-stage-roadmap)
[![License: MIT](https://img.shields.io/badge/License-MIT-059669.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black.svg?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Security Hardened](https://img.shields.io/badge/Security-SSRF%20%26%20Sandbox%20Hardened-0f172a.svg)](#security-architecture--trust-boundary-hardening)

An interactive, self-paced, open-source **Computer Science & Systems Engineering Workbench** guiding learners from electrical switches, binary, and Python fundamentals (**Stage 0**) all the way to operating systems, C/C++, Go, x86-64 reverse engineering, cybersecurity, algorithms, compilers, distributed consensus, cloud native SRE, and AI/HPC systems (**Stage 15**). Works 100% locally on macOS, Linux, and Windows with optional Gemini AI enhancement.

---

## A-to-Z Zero-to-Hero 16-Stage Roadmap

| Stage | Phase | Focus Title | Key Concepts & Hands-On Artifacts |
| :--- | :--- | :--- | :--- |
| **Stage 00** | Zero & Bedrock | Basics: Computers, Math, Binary & Digital Foundations | Bits/bytes, hex, Boolean logic gates, Two's Complement, UTF-8, CPU/RAM cycle, Git setup |
| **Stage 01** | Zero & Bedrock | Python: Beginner to Independent Scripts | Variables, control flow, loops, functions, dicts/lists, clean error handling & automation scripts |
| **Stage 02** | Zero & Bedrock | Computer Science Foundations & Digital Logic | Transistors, Half/Full Adders, CPU fetch-decode-execute, L1/RAM hierarchy, Big-O scaling |
| **Stage 03** | Core Infrastructure | Git, Linux & Operating Systems | POSIX shell pipelines, permissions, Git commit DAGs, virtual memory, syscalls & processes |
| **Stage 04** | Core Infrastructure | Networking Fundamentals & Web Protocols | Subnetting, ARP, DNS resolution, TCP 3-way handshake, ports, TLS 1.3 & HTTP packet inspection |
| **Stage 05** | Core Infrastructure | Web Basics & SQL Databases | HTTP lifecycle, normalized schemas, JOINs, Prepared Statements vs SQLi, XSS/CSRF defenses |
| **Stage 06** | Systems & Security | C Programming & Memory Foundations | Stack vs heap (`malloc`/`free`), pointer arithmetic, structs, buffer bounds & `-Wall -Wextra` |
| **Stage 07** | Systems & Security | Modern C++: Systems & RAII | Deterministic destructors, `unique_ptr`, `const&`, bounds-checked `.at()`, AddressSanitizer |
| **Stage 08** | Systems & Security | Go (Golang): CLI Tools & Microservices | Explicit `(val, error)`, goroutines & channels, `context.WithTimeout`, hardened HTTP clients |
| **Stage 09** | Systems & Security | x86-64 Assembly & Reverse Engineering | `RAX`/`RIP`/`RSP`, System V AMD64 ABI, ELF magic bytes, GDB step debugging, Ghidra CFG |
| **Stage 10** | Systems & Security | Cybersecurity Fundamentals & Legal Labs | CIA Triad, salted Argon2/SHA-256 hashing, AES-GCM, OWASP Top 10 & authorized CTF wargames |
| **Stage 11** | Systems & Security | Portfolio, Specialization & College Prep | 16 reproducible capstones, architectural READMEs, SOC/Systems career tracks & ethical scope |
| **Stage 12** | Hero Mastery | Data Structures, Algorithms & Discrete Math | Hash tables, heaps, Merge Sort, Dijkstra, BFS/DFS, dynamic programming & graph proofs |
| **Stage 13** | Hero Mastery | Compilers, OS Internals & Distributed Systems | Lexers, ASTs, SSA IR optimization, Lamport clocks, Raft quorum consensus & CAP theorem |
| **Stage 14** | Hero Mastery | Cloud Native Systems, Containers, Observability & CI/CD | Linux namespaces & cgroups, multi-stage Dockerfiles, K8s reconciliation loops, p99 SLOs & SBOMs |
| **Stage 15** | Hero Mastery | Linear Algebra, Neural Networks & High-Performance Computing | Dot products, backpropagation from scratch, numerical Softmax/Attention & cache-aware C compute |

---

## Core Platform Capabilities

### 1. Overview Command Workbench, A–Z Atlas & 3D Studio PBR Hero
- **3D Studio PBR Hero Backdrop (`SpatialBackdrop3D`)**: Three.js composite 3D CS sculptures (Logic ALU Monolith, Memory Bus Lattice, Packet Mesh Relay, **16-Stage Mastery Orrery**) illuminated with `RoomEnvironment` PMREM studio IBL, `ACESFilmicToneMapping`, damped OrbitControls, and a collapsible zero-occlusion inspect mode.
- **A–Z Master Atlas (`CurriculumAtoZAtlas`)**: Visualizes all 16 stages organized into 4 Mastery Tiers (*Zero to Scripting*, *Core Infrastructure*, *Systems & Security*, *Hero Engineering*) with live search, inline `+15m` topic check-offs, and direct **Playground** code launches.
- **Interactive Prerequisite Skill Graph (`CurriculumSkillGraph`)**: Interactive SVG dependency DAG from `Stage 0` (Hardware) through `Stage 14` (Cloud & SRE) and `Stage 15` (AI & HPC).
- **Progress Analytics & Personalized Deadlines (`ProgressAnalyticsDeck`)**: 28-day study consistency matrix, 4-step daily completion loop, per-stage target dates, and automatic `12w / 24w / 36w` study schedule generator.
- **Engineering Badges Collection (`BadgesCollection`)**: Automatically unlocks 13 tiered achievement badges (*Bronze*, *Silver*, *Gold*, *Obsidian*), including **A–Z Odyssey Hero**.
- **Hybrid Local Persistence**: Instant client `localStorage` synced transparently to atomic local JSON storage (`/api/progress` -> `.data/odyssey-progress.json` with `.bak.json` snapshots) plus full backup export/import.

### 2. Interactive Systems Lab, Code Playground & Optical Studio
- **Sandboxed Python 3 & C11 Code Playground (`/api/code/run`)**: Cross-platform isolated subprocess runner (`shell: false`, stripped secrets env, 5s timeout, 1MB cap, custom `stdin`, and saved snippet vault). Runnable scripts are embedded across all 16 curriculum stages.
- **Cyber Citadel Wargame & Kernel Defense Arcade (`TerminalSimulator`, `SystemsArcadeGame`)**: 16 offline POSIX wargame levels + split 16-byte hex viewer + optional rate-limited SSH bridge to `bandit.labs.overthewire.org:2220` + 60fps Canvas Kernel Defense wave strategy game.
- **Algorithms, Git DAG, Foundations, Memory & Packet Visualizers**: Step through Merge/Quick Sort, Dijkstra/BFS/DFS, Git 3-Trees commits, 8-bit registers, pointer memory cells, TCP 3-way handshakes, and Big-O curves live.
- **Local Diagram & Motion Animator (`CreativeMediaStudio`)**: Design CS blueprints and export `16:9` / `9:16` animated WebM clips locally in the browser.

### 3. Complete A–Z Dictionary, Curated Sources & Open-Source Exporter
- **Full A–Z Glossary & Active Recall Flashcards (`GlossaryFlashcards`)**: Every initial letter **A through Z** covered with plain-English intuition and interactive letter-by-letter filtering.
- **66 Verified Academic & Industry Sources (`CURATED_CS_SOURCES`)**: Primary courses from MIT, Stanford, CMU, Harvard, UC Berkeley, Google SRE, Kubernetes, Karpathy Neural Networks, Beej, and IETF RFCs mapped directly to Stages `0–15`.
- **16 Portfolio Projects (`ProjectsStudio`)**: Filterable across `Easy`, `Medium`, and `Hard` difficulty tiers with downloadable starter `README.md` specs.
- **Open-Source Curriculum Exporter (`/api/curriculum/export`)**: Generate Markdown syllabi (`student`, `teacher`, `github`), CSV rubrics, Printable HTML/PDF packets, and structured JSON v2 schemas with customizable hours/week pacing.
- **AI Study Mentor (`/api/tutor`)**: Powered by Gemini (`gemini-4-hydrogen`) when `GEMINI_API_KEY` is configured, seamlessly falling back offline to local grounded synthesis and verified 5-question quizzes for **all 16 stages (`stage-0`..`stage-15`)**.

---

## Security Architecture & Trust Boundary Hardening

1. **SSRF & DNS Rebinding Protection (`/app/api/ssh`, `/lib/security.ts`)**: Strictly whitelists `bandit.labs.overthewire.org:2220`, validates resolved IPv4/IPv6 addresses against loopback, RFC-1918, link-local, cloud metadata (`169.254.169.254`), and obfuscated notations, and pins the verified IP socket.
2. **Isolated Subprocess Sandbox (`/lib/code-runner.ts`)**: Zero shell invocation (`shell: false`), direct binary resolution (`python3`/`python`, `gcc`/`clang`), strictly whitelisted environment variables (zero API keys leaked), 5-second hard timeout, 1MB output cap, and guaranteed temp directory cleanup.
3. **Request & State Hardening (`/lib/client-security.ts`, `/app/api/progress`)**: Bounded JSON parsing (`parseJsonBodySafe`), prototype-pollution prevention (`sanitizeOdysseyStoreState`), stage bounds validation (`stage-0`..`stage-15`), atomic file writes, token-bucket rate limiting, and `X-Content-Type-Options: nosniff` / `Cache-Control: no-store`.
4. **Terminal Stream Sanitization**: Neutralizes OSC title/clipboard escapes, DCS sequences, cursor hijacking, and null bytes while preserving safe ANSI SGR formatting.

---

## Local Quickstart (macOS / Linux / Windows)

### Prerequisites
- **Node.js** 20+ (`v22` LTS recommended)
- **Optional (for local Code Playground execution)**: `python3` (or `python`) and `gcc` (or `clang`)

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure optional environment (works 100% locally without keys)
cp .env.example .env.local
# Optional: set GEMINI_API_KEY in .env.local for live Gemini Study Mentor responses.

# 3. Verify everything passes locally
npm run typecheck
npm run lint
npm test
npm run build

# 4. Start development or production server on http://localhost:3000
npm run dev
```

### Run via Docker (Zero Local Toolchain Setup)

Includes Node 22, Python 3, and GCC preinstalled:

```bash
docker build -t cs-odyssey .
docker run -p 3000:3000 --env-file .env.example cs-odyssey
```

---

## Backend API Reference

| Endpoint | Methods | Purpose |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Reports Node runtime, Python/GCC availability, Gemini readiness, SSH guard, 16-stage curriculum counts & disk status. |
| `/api/progress` | `GET`, `PUT`, `DELETE` | Reads, atomically saves, and resets sanitized student progress JSON in `.data/odyssey-progress.json`. |
| `/api/code/run` | `GET`, `POST` | Reports local toolchain capabilities (`GET`) or runs Python 3 / C11 in an isolated temp sandbox (`POST`). |
| `/api/curriculum/export` | `GET` | Streams `.json`, `.csv`, `.md` (`github` / `student` / `teacher` / single `stage-0..stage-15`), and printable `.html` syllabi. |
| `/api/tutor` | `POST` | AI Study Mentor (`eli9`, `quiz`, `debug`, `review`, `plan`, `search`) with live Gemini + offline 16-stage synthesis & quizzes. |
| `/api/ssh` | `POST` | Rate-limited, SSRF-hardened SSH terminal bridge whitelisted solely to `bandit.labs.overthewire.org:2220`. |

---

## Pushing to GitHub

This repository includes `package-lock.json`, `.gitignore`, `.github/workflows/ci.yml`, `SECURITY.md`, `CONTRIBUTING.md`, issue/PR templates, and `LICENSE` ready for immediate push:

```bash
git init
git add .
git commit -m "feat: cs-odyssey complete 16-stage A-Z CS curriculum, hardened backend & interactive workbench"
git branch -M main
git remote add origin https://github.com/<your-username>/cs-odyssey.git
git push -u origin main
```

Every push to `main` automatically runs **GitHub Actions CI** (`npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`).

---

## Ethical Wargame Notice

Built-in **Cyber Citadel** levels run 100% offline inside this application. Optional external SSH interoperability targets `bandit.labs.overthewire.org:2220`, an independent public cybersecurity wargame at [overthewire.org](https://overthewire.org). CS Odyssey is an independent open-source educational platform.

## License

Released under the [MIT License](LICENSE).
