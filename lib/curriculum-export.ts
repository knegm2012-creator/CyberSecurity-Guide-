import {
  STAGES_DATA,
  ADVANCED_HERO_TOPICS,
  PORTFOLIO_PROJECTS,
  ESSENTIAL_BOOKS,
  YOUTUBE_CHANNELS,
  WEEKLY_SCHEDULE_ROUTINE,
  StageData,
} from './curriculum-data';
import { CURATED_CS_SOURCES, CuratedSource } from './sources-catalog';

export type ExportAudienceMode = 'student' | 'teacher' | 'github';

export interface CurriculumExportOptions {
  mode: ExportAudienceMode;
  includeStages: boolean;
  includeHeroModules: boolean;
  includeSourcesCatalog: boolean;
  includeProjects: boolean;
  includeCodeSnippets: boolean;
  includeRubrics: boolean;
  hoursPerWeek?: number;
}

const STAGE_ESTIMATED_HOURS: Record<number, number> = {
  0: 10,
  1: 14,
  2: 12,
  3: 14,
  4: 14,
  5: 18,
  6: 22,
  7: 20,
  8: 18,
  9: 16,
  10: 22,
  11: 20,
  12: 24,
  13: 24,
};

export function computePacingSummary(hoursPerWeek: number) {
  const safeHours = Math.max(4, Math.min(40, hoursPerWeek || 10));
  let cumulativeHours = 0;
  const rows = STAGES_DATA.map((stage) => {
    const estHours = STAGE_ESTIMATED_HOURS[stage.number] ?? 16;
    const startWeek = Math.floor(cumulativeHours / safeHours) + 1;
    cumulativeHours += estHours;
    const endWeek = Math.max(startWeek, Math.ceil(cumulativeHours / safeHours));
    return {
      stageNumber: stage.number,
      stageTitle: stage.title,
      estHours,
      startWeek,
      endWeek,
    };
  });
  const totalHours = cumulativeHours;
  const totalWeeks = Math.ceil(totalHours / safeHours);
  return { hoursPerWeek: safeHours, totalHours, totalWeeks, rows };
}

function escapeCsvCell(value: string): string {
  const cleaned = String(value ?? '').replace(/\r\n/g, '\n');
  if (cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')) {
    return `"${cleaned.replace(/"/g, '""')}"`;
  }
  return cleaned;
}

export function getSourcesForStage(stageId: string): CuratedSource[] {
  return CURATED_CS_SOURCES.filter((s) => s.stageIds.includes(stageId));
}

export function generateSingleStageMarkdown(stageId: string): string {
  const stage: StageData = STAGES_DATA.find((s) => s.id === stageId) || STAGES_DATA[0];
  const catalogSources = getSourcesForStage(stage.id);

  const lines: string[] = [
    `# Stage ${stage.number}: ${stage.title}`,
    '',
    `> **Subtitle:** ${stage.subtitle}  `,
    `> **Estimated Time:** ${stage.timeEstimate} · **Phase:** ${stage.sprintMonth}`,
    '',
    `## Learning Objective`,
    stage.goal,
    '',
    `### Mental Model & Intuition`,
    stage.eli9Metaphor,
    '',
    `## Core Topics (${stage.topics.length})`,
  ];

  stage.topics.forEach((topic, idx) => {
    lines.push(``);
    lines.push(`### ${stage.number}.${idx + 1} ${topic.title}`);
    lines.push(`- [ ] Completed and verified independently`);
    lines.push('');
    lines.push(topic.description);
    lines.push('');
    lines.push(`**Intuition:** ${topic.eli9}`);

    if (topic.codeSnippet) {
      lines.push('');
      lines.push(`**Reference Exercise (${topic.codeSnippet.language.toUpperCase()}):** ${topic.codeSnippet.explanation}`);
      lines.push('');
      lines.push('```' + topic.codeSnippet.language);
      lines.push(topic.codeSnippet.code.trimEnd());
      lines.push('```');
    }

    if (topic.externalLinks && topic.externalLinks.length > 0) {
      lines.push('');
      lines.push('**Topic Links:**');
      topic.externalLinks.forEach((l) => {
        lines.push(`- [${l.title}](${l.url}) (${l.type})`);
      });
    }
  });

  if (stage.commands.length > 0) {
    lines.push('');
    lines.push('## Essential CLI Commands');
    lines.push('');
    lines.push('| Command | Category | Purpose | Example |');
    lines.push('| :--- | :--- | :--- | :--- |');
    stage.commands.forEach((cmd) => {
      lines.push(`| \`${cmd.name}\` | ${cmd.category} | ${cmd.explanation} | \`${cmd.example}\` |`);
    });
  }

  lines.push('');
  lines.push('## Curated Sites, Videos, Books & Labs');
  stage.resources.forEach((r) => {
    lines.push(`- **[${r.title}](${r.url})** — ${r.type} · ${r.isFree ? 'Free' : r.costNote || 'Audit Free'}: ${r.notes}`);
  });
  catalogSources.forEach((src) => {
    lines.push(`- **[${src.title}](${src.url})** (${src.authorOrOrg}) — ${src.medium} · ${src.level} · ${src.cost}: ${src.whyItMatters}`);
  });

  lines.push('');
  lines.push(`## Deliverable Assignment: ${stage.practiceTask.title}`);
  lines.push(stage.practiceTask.description);
  lines.push('');
  lines.push(`**Required Deliverable:** ${stage.practiceTask.deliverable}`);

  lines.push('');
  lines.push('## Exit Gate Verification Checklist');
  stage.exitChecklist.forEach((chk) => {
    lines.push(`- [ ] ${chk}`);
  });

  lines.push('');
  lines.push(`> **Safety & Ethics Notice:** ${stage.safetyWarning}`);
  lines.push('');
  lines.push('---');
  lines.push('*Licensed under MIT License — Open-Source CS Odyssey Curriculum*');

  return lines.join('\n');
}

export function generateCuratedSourcesMarkdown(sources: CuratedSource[] = CURATED_CS_SOURCES): string {
  const lines: string[] = [
    '# CS Odyssey: Verified Global Computer Science Source Directory',
    '',
    'A curated open-source catalog of university courses, video lectures, textbooks, primary RFCs/documentation, interactive practice labs, and seminal engineering papers.',
    '',
    '## Quick Index by Domain',
  ];

  const domains = Array.from(new Set(sources.map((s) => s.domain)));
  domains.forEach((d) => {
    const count = sources.filter((s) => s.domain === d).length;
    lines.push(`- **${d}** (${count} sources)`);
  });

  domains.forEach((domain) => {
    const items = sources.filter((s) => s.domain === domain);
    lines.push('');
    lines.push(`## ${domain}`);
    lines.push('');
    lines.push('| Resource | Author / Institution | Medium | Level | Access | Stages |');
    lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');
    items.forEach((item) => {
      const stages = item.stageIds.map((id) => id.replace('stage-', 'S')).join(', ');
      lines.push(
        `| [${item.title}](${item.url}) | ${item.authorOrOrg} | ${item.medium} | ${item.level} | ${item.cost} | ${stages} |`
      );
    });
    lines.push('');
    items.forEach((item) => {
      lines.push(`- **${item.title}**: ${item.whyItMatters}`);
    });
  });

  lines.push('');
  lines.push('## Essential Books & Channels Reference');
  lines.push('');
  lines.push('### Open & Classic Textbooks');
  ESSENTIAL_BOOKS.forEach((b) => {
    lines.push(`- [${b.title}](${b.url}) — *${b.author}* (${b.level}): ${b.why}`);
  });

  lines.push('');
  lines.push('### Recommended Video Channels');
  YOUTUBE_CHANNELS.forEach((ch) => {
    lines.push(`- [${ch.name}](${ch.url}) — ${ch.level}: ${ch.focus}`);
  });

  lines.push('');
  lines.push('---');
  lines.push('*Released under the MIT Open-Source License for students, teachers, and self-learners worldwide.*');

  return lines.join('\n');
}

export function generateFullCurriculumMarkdown(options: CurriculumExportOptions): string {
  const lines: string[] = [];

  if (options.mode === 'github') {
    lines.push('# CS Odyssey: Complete Open-Source Computer Science Curriculum (Zero to Systems Engineer)');
    lines.push('');
    lines.push('[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)');
    lines.push('[![Curriculum: 14 Stages](https://img.shields.io/badge/Stages-0%20to%2013-0284c7.svg)](#stage-by-stage-curriculum)');
    lines.push('[![Open Education](https://img.shields.io/badge/Open%20Education-Students%20%26%20Teachers-059669.svg)](#how-to-use-this-repository)');
    lines.push('');
    lines.push('An open-source, self-paced & classroom-ready **14-Stage Computer Science and Systems Engineering Curriculum** taking learners from electrical switches, binary, and Python fundamentals all the way to operating systems, C memory safety, x86-64 reverse engineering, algorithms, compilers, and distributed consensus.');
    lines.push('');
    lines.push('## How to Use This Repository');
    lines.push('- **Students**: Fork this repository and check off `[x]` topic boxes and Exit Gate items as you complete each stage.');
    lines.push('- **Teachers & Instructors**: Adapt the weekly cadence, deliverables, and grading rubrics for high school AP/honors tracks, coding clubs, or undergraduate intro sequences.');
    lines.push('- **Contributors**: Open a Pull Request adding verified free courses, open textbooks, interactive labs, or translations.');
  } else if (options.mode === 'teacher') {
    lines.push('# CS Odyssey — Educator Syllabus, Lab Pacing & Assessment Guide');
    lines.push('');
    lines.push('**Academic Track:** Foundations through Systems Architecture (14 Sequential Modules)  ');
    lines.push('**Instructional Format:** 10–12 hours/week lecture + guided sandbox labs + portfolio artifacts  ');
    lines.push('**License:** MIT Open Educational Resource (free to remix, print, distribute, and adapt for classrooms)');
    lines.push('');
    lines.push('## Instructor Pacing & Weekly Schedule Model');
    lines.push('');
    lines.push('| Day | Time Allocation | Instructional Focus | Student Deliverable |');
    lines.push('| :--- | :--- | :--- | :--- |');
    WEEKLY_SCHEDULE_ROUTINE.forEach((row) => {
      lines.push(`| ${row.day} | ${row.hours} | ${row.focus} | ${row.deliverable} |`);
    });
    lines.push('');
    lines.push('## Classroom Safety & Ethical Engineering Policy');
    lines.push('All systems, security, and network exercises must be executed strictly within isolated local VMs, approved local sandboxes, or designated public educational platforms (OverTheWire, picoCTF, PortSwigger Web Security Academy, CryptoHack). Unauthorized scanning or testing against school or external production networks is strictly prohibited.');
  } else {
    lines.push('# CS Odyssey — Student Self-Study Master Roadmap');
    lines.push('');
    lines.push('Track every concept from **Stage 0 (Binary & Hardware Foundations)** through **Stage 13 (Compilers & Distributed Consensus)**. Do not rush—verify each Exit Gate item independently before moving forward.');
    lines.push('');
    lines.push('## Suggested Weekly Rhythm (10–12 Hours / Week)');
    WEEKLY_SCHEDULE_ROUTINE.forEach((row) => {
      lines.push(`- **${row.day} (${row.hours})**: ${row.focus} → *Deliverable:* ${row.deliverable}`);
    });
  }

  const pacing = options.hoursPerWeek ? computePacingSummary(options.hoursPerWeek) : null;
  if (pacing) {
    lines.push('');
    lines.push(`## Customized Study Pacing Plan (${pacing.hoursPerWeek} Hours / Week — ${pacing.totalWeeks} Weeks Total)`);
    lines.push('');
    lines.push('| Stage | Focus Title | Est. Hours | Target Window | Deliverable |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    pacing.rows.forEach((row) => {
      const stage = STAGES_DATA.find((s) => s.number === row.stageNumber);
      const weekLabel = row.startWeek === row.endWeek ? `Week ${row.startWeek}` : `Weeks ${row.startWeek}–${row.endWeek}`;
      lines.push(`| Stage ${row.stageNumber} | ${row.stageTitle} | ${row.estHours}h | ${weekLabel} | ${stage?.practiceTask.title || 'Stage Lab'} |`);
    });
  } else {
    lines.push('');
    lines.push('## Stage-by-Stage Curriculum');
    lines.push('');
    lines.push('| Stage | Focus Title | Phase | Est. Time | Deliverable |');
    lines.push('| :--- | :--- | :--- | :--- | :--- |');
    STAGES_DATA.forEach((s) => {
      lines.push(`| Stage ${s.number} | ${s.title} | ${s.sprintMonth} | ${s.timeEstimate} | ${s.practiceTask.title} |`);
    });
  }

  if (options.includeStages) {
    STAGES_DATA.forEach((stage) => {
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push(`## Stage ${stage.number}: ${stage.title}`);
      lines.push(`*${stage.subtitle}* · **Time:** ${stage.timeEstimate} · **Phase:** ${stage.sprintMonth}`);
      lines.push('');
      lines.push(`**Objective:** ${stage.goal}`);

      if (options.includeRubrics) {
        lines.push('');
        lines.push('**Assessment Deliverable & Rubric Basis:**');
        lines.push(`- **Assignment:** ${stage.practiceTask.title} — ${stage.practiceTask.description}`);
        lines.push(`- **Evidence Required:** ${stage.practiceTask.deliverable}`);
      }

      lines.push('');
      lines.push('### Topics');
      stage.topics.forEach((topic, tIdx) => {
        lines.push(`- [ ] **${stage.number}.${tIdx + 1} ${topic.title}** — ${topic.description}`);
        if (options.includeCodeSnippets && topic.codeSnippet) {
          lines.push('');
          lines.push('```' + topic.codeSnippet.language);
          lines.push(topic.codeSnippet.code.trimEnd());
          lines.push('```');
        }
        if (topic.externalLinks && topic.externalLinks.length > 0) {
          const linkStr = topic.externalLinks.map((l) => `[${l.title}](${l.url})`).join(' · ');
          lines.push(`  - *Sources:* ${linkStr}`);
        }
      });

      const stageCatalog = getSourcesForStage(stage.id);
      if (stage.resources.length > 0 || stageCatalog.length > 0) {
        lines.push('');
        lines.push('### Recommended Readings, Videos & Labs');
        stage.resources.forEach((r) => {
          lines.push(`- [${r.title}](${r.url}) (${r.type}) — ${r.notes}`);
        });
        stageCatalog.slice(0, 4).forEach((src) => {
          lines.push(`- [${src.title}](${src.url}) (${src.medium} · ${src.authorOrOrg}) — ${src.whyItMatters}`);
        });
      }

      if (options.includeRubrics) {
        lines.push('');
        lines.push('### Mastery Exit Gate');
        stage.exitChecklist.forEach((chk) => {
          lines.push(`- [ ] ${chk}`);
        });
      }
    });
  }

  if (options.includeHeroModules) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Collegiate Systems Engineering Modules (Hero Track)');
    ADVANCED_HERO_TOPICS.forEach((mod) => {
      lines.push('');
      lines.push(`### ${mod.subjectArea}: ${mod.title}`);
      lines.push(mod.overview);
      lines.push('');
      lines.push('**Key Mastery Concepts:**');
      mod.keyConcepts.forEach((c) => lines.push(`- ${c}`));
      lines.push('');
      lines.push('**Authoritative Textbooks & Courses:**');
      mod.recommendedSources.forEach((src) => {
        lines.push(`- [${src.title}](${src.url}) — *${src.authorOrPlatform}* (${src.type}): ${src.notes}`);
      });
    });
  }

  if (options.includeProjects) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 14 Capstone Engineering Portfolio Projects');
    PORTFOLIO_PROJECTS.forEach((proj) => {
      lines.push('');
      lines.push(`### Project ${proj.number}: ${proj.title} (${proj.difficulty})`);
      lines.push(`**Stack:** ${proj.tools.join(', ')}  `);
      lines.push(`**Brief:** ${proj.brief}`);
      lines.push('');
      lines.push('**Acceptance Criteria:**');
      proj.acceptanceCriteria.forEach((ac) => lines.push(`- [ ] ${ac}`));
    });
  }

  if (options.includeSourcesCatalog) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(generateCuratedSourcesMarkdown());
  }

  if (options.mode === 'github') {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Contributing to This Open-Source Curriculum');
    lines.push('1. Ensure any proposed resource is freely accessible or clearly labeled as a paid textbook.');
    lines.push('2. Prefer primary university courses (MIT, Stanford, CMU, Harvard, UC Berkeley), official RFCs/docs, or openly licensed books.');
    lines.push('3. Verify every URL resolves cleanly without paywalls before submitting a Pull Request.');
  }

  return lines.join('\n');
}

export function generateCurriculumCsv(): string {
  const headers = [
    'Stage Number',
    'Stage ID',
    'Stage Title',
    'Phase',
    'Estimated Time',
    'Learning Objective',
    'Topics Covered',
    'Assignment Deliverable',
    'Exit Gate Criteria',
    'Primary Sources',
  ];

  const rows = [headers.map(escapeCsvCell).join(',')];

  STAGES_DATA.forEach((stage) => {
    const catalog = getSourcesForStage(stage.id);
    const topicList = stage.topics.map((t, idx) => `${stage.number}.${idx + 1} ${t.title}`).join(' | ');
    const exitList = stage.exitChecklist.join(' | ');
    const sourcesList = [
      ...stage.resources.map((r) => `${r.title} (${r.url})`),
      ...catalog.map((c) => `${c.title} (${c.url})`),
    ].join(' | ');

    rows.push(
      [
        String(stage.number),
        stage.id,
        stage.title,
        stage.sprintMonth,
        stage.timeEstimate,
        stage.goal,
        topicList,
        `${stage.practiceTask.title}: ${stage.practiceTask.deliverable}`,
        exitList,
        sourcesList,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  });

  return rows.join('\n');
}

export function generateOpenSourceJson(): string {
  const payload = {
    schema: 'cs-odyssey-open-curriculum/v2',
    license: 'MIT',
    generatedAt: new Date().toISOString(),
    summary: {
      totalStages: STAGES_DATA.length,
      totalTopics: STAGES_DATA.reduce((acc, s) => acc + s.topics.length, 0),
      totalHeroModules: ADVANCED_HERO_TOPICS.length,
      totalPortfolioProjects: PORTFOLIO_PROJECTS.length,
      totalCuratedSources: CURATED_CS_SOURCES.length,
    },
    weeklySchedule: WEEKLY_SCHEDULE_ROUTINE,
    stages: STAGES_DATA,
    heroModules: ADVANCED_HERO_TOPICS,
    portfolioProjects: PORTFOLIO_PROJECTS,
    curatedSources: CURATED_CS_SOURCES,
    essentialBooks: ESSENTIAL_BOOKS,
    youtubeChannels: YOUTUBE_CHANNELS,
  };

  return JSON.stringify(payload, null, 2);
}

export function generateContributingMarkdown(): string {
  return [
    '# Contributing to CS Odyssey Open-Source Curriculum',
    '',
    'Thank you for helping make rigorous Computer Science education open, verifiable, and freely accessible for students, classrooms, and self-learners worldwide.',
    '',
    '## Contribution Standards',
    '',
    '1. **Verify Primary Sources**: Every external course, video series, textbook, paper, or interactive lab must point directly to its authoritative source (e.g., MIT OCW, Stanford Online, CMU, OSTEP, Beej, MDN, IETF RFCs). Never submit pirated mirrors or link aggregators.',
    '2. **State Access & Cost Clearly**: Label every submission explicitly as `Free`, `Free Audit`, `Open Source`, or `Paid Book`. Free and open-licensed resources take priority.',
    '3. **Map to Stages (0–13)**: Every resource should indicate which stage(s) (`stage-0` through `stage-13`) and mastery prerequisite it serves.',
    '4. **Safety & Legal Compliance**: Security modules must only reference authorized local VMs or designated public educational wargame arenas (such as picoCTF, PortSwigger Web Security Academy, OverTheWire, or CryptoHack).',
    '',
    '## Suggested Pull Request Checklist',
    '',
    '- [ ] Resource URL checked (HTTPS, no dead redirects, no paywall surprise)',
    '- [ ] Tested code snippets inside CS Odyssey Code Playground (Python/C)',
    '- [ ] Exit Gate checklist criteria written clearly so an instructor or learner can objectively verify mastery',
    '- [ ] Ran `npm test` and `npm run lint` locally before pushing',
    '',
    '## Educator Remix Rights (MIT License)',
    'Teachers, bootcamps, and university TAs may fork, translate, print, and adapt any stage handout, pacing plan, or CSV rubric with zero licensing fees.',
  ].join('\n');
}

function escapeHtml(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function generatePrintableHtmlSyllabus(hoursPerWeek = 10): string {
  const pacing = computePacingSummary(hoursPerWeek);
  const stageCards = STAGES_DATA.map((stage) => {
    const pRow = pacing.rows.find((r) => r.stageNumber === stage.number);
    const weekLabel = pRow
      ? pRow.startWeek === pRow.endWeek
        ? `Week ${pRow.startWeek}`
        : `Weeks ${pRow.startWeek}–${pRow.endWeek}`
      : stage.sprintMonth;
    const topicsHtml = stage.topics
      .map(
        (t, idx) =>
          `<li><strong>${stage.number}.${idx + 1} ${escapeHtml(t.title)}</strong> — ${escapeHtml(t.description)}</li>`
      )
      .join('');
    const checksHtml = stage.exitChecklist
      .map((chk) => `<li>&#9744; ${escapeHtml(chk)}</li>`)
      .join('');

    return `
      <section class="stage">
        <div class="stage-head">
          <div>
            <span class="tag">STAGE ${stage.number} · ${escapeHtml(weekLabel)} (${pRow?.estHours ?? 16}h)</span>
            <h2>${escapeHtml(stage.title)}</h2>
          </div>
        </div>
        <p class="goal"><strong>Objective:</strong> ${escapeHtml(stage.goal)}</p>
        <h3>Core Topics</h3>
        <ul>${topicsHtml}</ul>
        <p class="deliverable"><strong>Deliverable (${escapeHtml(stage.practiceTask.title)}):</strong> ${escapeHtml(stage.practiceTask.deliverable)}</p>
        <h3>Mastery Exit Gate</h3>
        <ul class="checklist">${checksHtml}</ul>
      </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CS Odyssey — Printable Syllabus (${pacing.hoursPerWeek}h/week)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; max-width: 900px; margin: 0 auto; padding: 32px 24px; line-height: 1.55; }
    header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    .meta { font-size: 13px; color: #475569; }
    .stage { border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px 20px; margin-bottom: 20px; page-break-inside: avoid; }
    .tag { font-family: monospace; font-size: 11px; color: #0284c7; font-weight: 700; letter-spacing: 0.05em; }
    h2 { margin: 4px 0 8px; font-size: 18px; }
    h3 { margin: 12px 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: #334155; }
    ul { margin: 4px 0 10px 18px; padding: 0; font-size: 13px; }
    li { margin-bottom: 4px; }
    .checklist { list-style: none; margin-left: 0; }
    .deliverable { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 4px; font-size: 13px; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
      <h1>CS Odyssey: Complete 14-Stage Computer Science Syllabus</h1>
      <button class="no-print" onclick="window.print()" style="padding:8px 14px;background:#0f172a;color:#fff;border:none;border-radius:4px;cursor:pointer;">Print / Save PDF</button>
    </div>
    <div class="meta">Pacing Plan: <strong>${pacing.hoursPerWeek} hrs/week</strong> · Estimated Total: <strong>${pacing.totalHours} hours (${pacing.totalWeeks} weeks)</strong> · License: MIT Open Educational Resource</div>
  </header>
  ${stageCards}
</body>
</html>`;
}

