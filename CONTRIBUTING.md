# Contributing to CS Odyssey

Thank you for helping make **CS Odyssey** a rigorous, accessible, open-source A-to-Z Computer Science & Systems Engineering workbench for students, classrooms, and self-learners worldwide.

## Local Setup

```bash
git clone https://github.com/<your-username>/cs-odyssey.git
cd cs-odyssey
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. All interactive labs, the Linux terminal simulator, verified 16-stage quizzes (`stage-0` through `stage-15`), and local progress persistence work immediately with zero required cloud keys.

## Quality & Security Standards

Before opening a Pull Request, please verify all checks pass locally:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

### Pull Request Guidelines

1. **Curriculum & Sources (`lib/curriculum-data.ts`, `lib/sources-catalog.ts`)**:
   - Link directly to authoritative primary sources (university OCW, official specifications/RFCs, open textbooks, or reputable interactive labs).
   - Tag every stage (`stage-0`..`stage-15`) and mark access/cost accurately (`Free`, `Free Audit`, `Open Source`, or `Paid Book`).
   - Verify any added stage or topic maintains matching quiz questions in `lib/local-mentor.ts` and daily challenges in `components/DailyChallengeWidget.tsx`.
   - Any external security resource must stay strictly within authorized legal wargames (e.g., OverTheWire, picoCTF, PortSwigger Academy, CryptoHack).
2. **Backend Security (`app/api/*`, `lib/security.ts`, `lib/code-runner.ts`)**:
   - Never use `child_process.exec` or invoke shells (`shell: true`) on user-controlled input.
   - Maintain strict secret isolation (`GEMINI_API_KEY` must remain server-side only and never enter subprocess environments).
   - Validate and size-bound JSON payloads via `parseJsonBodySafe`.
3. **Pull Requests & Commits**:
   - Keep commits focused and descriptive (`feat:`, `fix:`, `docs:`, `security:`, `test:`).
   - Include notes summarizing verification steps run locally.
