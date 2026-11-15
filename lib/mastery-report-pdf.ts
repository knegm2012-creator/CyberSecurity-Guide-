import { jsPDF } from 'jspdf';
import { STAGES_DATA, PORTFOLIO_PROJECTS } from './curriculum-data';
import type { EvaluatedBadge } from './badges-data';
import type {
  OdysseyStoreData,
  StageProgressSummary,
  CadenceDayCell,
} from '@/hooks/use-odyssey-store';

export interface MasteryReportInput {
  stats: {
    totalTopicsCount: number;
    completedTopicsCount: number;
    topicPercent: number;
    completedProjectsCount: number;
    totalProjectsCount: number;
    banditCount: number;
    totalMinutesLogged: number;
    todayMinutesLogged: number;
    dailyGoalMinutes: number;
    dailyGoalPercent: number;
    completedMilestonesCount: number;
    totalMilestonesCount: number;
    xp: number;
    levelNumber: number;
    heroTitle: string;
    currentStreak: number;
  };
  stageProgressList: StageProgressSummary[];
  cadenceMetrics: {
    last28Days: CadenceDayCell[];
    weeklyMinutes: number;
    daysGoalMet7: number;
    activeDays28: number;
  };
  badgesSummary: {
    badges: EvaluatedBadge[];
    unlockedCount: number;
    totalCount: number;
  };
  data: OdysseyStoreData;
  generatedAt?: Date;
}

/**
 * Normalizes strings to clean ASCII/Latin-1 safe characters so jsPDF's built-in
 * Helvetica/Courier fonts never render missing glyph boxes.
 */
export function cleanPdfText(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2022/g, '*')
    .replace(/\u00B7/g, '|')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2248/g, '~')
    .replace(/\r\n/g, '\n')
    .replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF]/g, '');
}

const COLORS = {
  navy: [15, 23, 42] as const,
  slate900: [15, 23, 42] as const,
  slate700: [51, 65, 85] as const,
  slate500: [100, 116, 139] as const,
  slate300: [203, 213, 225] as const,
  bgLight: [248, 250, 252] as const,
  cardBorder: [226, 232, 240] as const,
  sky: [2, 132, 199] as const,
  emerald: [5, 150, 105] as const,
  amber: [217, 119, 6] as const,
  white: [255, 255, 255] as const,
};

export function buildMasteryReportPdfDocument(input: MasteryReportInput): {
  doc: jsPDF;
  filename: string;
} {
  const { stats, stageProgressList, cadenceMetrics, badgesSummary, data } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const dateIso = generatedAt.toISOString().split('T')[0];
  const filename = `CS-Odyssey-Mastery-Report-${dateIso}.pdf`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 50;
  let y = 0;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = 44;
    }
  };

  const drawSectionHeading = (title: string, subtitle?: string) => {
    ensureSpace(44);
    y += 10;
    doc.setFillColor(...COLORS.sky);
    doc.rect(marginX, y, 4, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.slate900);
    doc.text(cleanPdfText(title), marginX + 12, y + 12);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.slate500);
      doc.text(cleanPdfText(subtitle), marginX + 12, y + 24);
      y += 34;
    } else {
      y += 24;
    }
  };

  // --------------------------------------------------------------------------
  // 1. COVER HEADER BANNER
  // --------------------------------------------------------------------------
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 108, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(56, 189, 248);
  doc.text('CS ODYSSEY  |  ZERO TO HERO A-Z SYSTEMS WORKBENCH', marginX, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.white);
  doc.text('Official Learner Mastery Report', marginX, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    cleanPdfText(
      `Generated ${generatedAt.toUTCString()}   |   Started ${data.startDate || dateIso}`
    ),
    marginX,
    76
  );

  // Rank Badge on right of banner
  const rankBoxW = 160;
  const rankBoxX = pageWidth - marginX - rankBoxW;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(rankBoxX, 24, rankBoxW, 60, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(56, 189, 248);
  doc.text(`LEVEL ${stats.levelNumber}`, rankBoxX + 12, 42);
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);
  doc.text(cleanPdfText(stats.heroTitle), rankBoxX + 12, 58, { maxWidth: rankBoxW - 24 });
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153);
  doc.text(`${stats.xp.toLocaleString()} XP  |  ${stats.currentStreak}d streak`, rankBoxX + 12, 74);

  y = 128;

  // --------------------------------------------------------------------------
  // 2. EXECUTIVE KPI SUMMARY CARDS
  // --------------------------------------------------------------------------
  const totalHours = (stats.totalMinutesLogged / 60).toFixed(1);
  const weeklyHours = (cadenceMetrics.weeklyMinutes / 60).toFixed(1);
  const completedStagesCount = stageProgressList.filter((s) => s.isComplete).length;

  const kpis = [
    {
      label: 'CURRICULUM TOPICS',
      value: `${stats.completedTopicsCount} / ${stats.totalTopicsCount}`,
      sub: `${stats.topicPercent}% mastery (${completedStagesCount}/16 stages)`,
      accent: COLORS.sky,
    },
    {
      label: 'PORTFOLIO BUILDS',
      value: `${stats.completedProjectsCount} / ${stats.totalProjectsCount}`,
      sub: 'Documented capstone projects',
      accent: COLORS.emerald,
    },
    {
      label: 'STUDY VOLUME',
      value: `${totalHours} hrs`,
      sub: `${weeklyHours}h past 7d | ${cadenceMetrics.activeDays28}/28d active`,
      accent: COLORS.sky,
    },
    {
      label: 'MILESTONES & SHELL',
      value: `${stats.completedMilestonesCount}/${stats.totalMilestonesCount} MS`,
      sub: `${stats.banditCount}/16 Wargame | ${badgesSummary.unlockedCount}/${badgesSummary.totalCount} Badges`,
      accent: COLORS.amber,
    },
  ];

  const gap = 10;
  const cardW = (contentWidth - gap * 3) / 4;
  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (cardW + gap);
    doc.setFillColor(...COLORS.bgLight);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.roundedRect(x, y, cardW, 64, 5, 5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.slate500);
    doc.text(kpi.label, x + 10, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...kpi.accent);
    doc.text(cleanPdfText(kpi.value), x + 10, y + 36);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.slate700);
    doc.text(cleanPdfText(kpi.sub), x + 10, y + 52, { maxWidth: cardW - 18 });
  });

  y += 82;

  // --------------------------------------------------------------------------
  // 3. 16-STAGE A-Z CURRICULUM PROGRESS BREAKDOWN
  // --------------------------------------------------------------------------
  drawSectionHeading(
    '16-Stage A-Z Curriculum Mastery',
    'Stage-by-stage completion across topics, exit verification gates, and personal deadlines'
  );

  const drawStageTableHeader = () => {
    ensureSpace(24);
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, y, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate700);
    doc.text('STAGE', marginX + 8, y + 13);
    doc.text('TOPICS', marginX + 275, y + 13);
    doc.text('EXIT GATE', marginX + 345, y + 13);
    doc.text('TARGET', marginX + 412, y + 13);
    doc.text('STATUS', marginX + 468, y + 13);
    y += 22;
  };

  drawStageTableHeader();

  stageProgressList.forEach((stage, idx) => {
    if (y + 20 > bottomLimit) {
      doc.addPage();
      y = 44;
      drawStageTableHeader();
    }

    if (idx % 2 === 1) {
      doc.setFillColor(250, 251, 253);
      doc.rect(marginX, y - 2, contentWidth, 18, 'F');
    }

    const stageLabel = `Stage ${String(stage.stageNumber).padStart(2, '0')}: ${stage.shortTitle}`;
    const statusText = stage.isComplete
      ? 'Mastered'
      : stage.topicsDone > 0 || stage.exitDone > 0
      ? 'Active'
      : 'Pending';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.slate900);
    doc.text(cleanPdfText(stageLabel).slice(0, 52), marginX + 8, y + 10);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.slate700);
    doc.text(`${stage.topicsDone}/${stage.topicsTotal} (${stage.topicPercent}%)`, marginX + 275, y + 10);
    doc.text(`${stage.exitDone}/${stage.exitTotal}`, marginX + 345, y + 10);
    doc.text(stage.targetDate ? cleanPdfText(stage.targetDate) : '-', marginX + 412, y + 10);

    doc.setFont('helvetica', 'bold');
    if (statusText === 'Mastered') {
      doc.setTextColor(...COLORS.emerald);
    } else if (statusText === 'Active') {
      doc.setTextColor(...COLORS.sky);
    } else {
      doc.setTextColor(...COLORS.slate500);
    }
    doc.text(statusText, marginX + 468, y + 10);

    y += 18;
  });

  y += 8;

  // --------------------------------------------------------------------------
  // 4. COMPLETED & ACTIVE MILESTONES
  // --------------------------------------------------------------------------
  const milestones = data.userMilestones || [];
  drawSectionHeading(
    `Personal Engineering Milestones (${stats.completedMilestonesCount}/${milestones.length} Complete)`,
    'Custom & generated study checkpoints verified in your workspace'
  );

  if (milestones.length === 0) {
    ensureSpace(24);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.slate500);
    doc.text('No custom milestones recorded yet.', marginX + 12, y + 10);
    y += 22;
  } else {
    milestones.slice(0, 28).forEach((m) => {
      const wrappedTitle = doc.splitTextToSize(cleanPdfText(m.title), contentWidth - 150);
      const rowH = Math.max(18, wrappedTitle.length * 11 + 6);
      ensureSpace(rowH);

      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...(m.completed ? COLORS.emerald : COLORS.amber));
      doc.text(m.completed ? '[DONE]' : '[OPEN]', marginX + 8, y + 10);

      doc.setFont('helvetica', m.completed ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.slate900);
      doc.text(wrappedTitle, marginX + 48, y + 10);

      const meta = `${m.category.toUpperCase()} | +${m.xpReward}XP${
        m.completedAt
          ? ` | Done ${m.completedAt.split('T')[0]}`
          : m.targetDate
          ? ` | Due ${m.targetDate}`
          : ''
      }`;
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.slate500);
      doc.text(cleanPdfText(meta), pageWidth - marginX - 4, y + 10, { align: 'right' });

      y += rowH;
    });
    if (milestones.length > 28) {
      ensureSpace(16);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.slate500);
      doc.text(`...plus ${milestones.length - 28} additional milestones recorded.`, marginX + 8, y + 10);
      y += 16;
    }
  }

  y += 6;

  // --------------------------------------------------------------------------
  // 5. PORTFOLIO CAPSTONE PROJECTS STATUS
  // --------------------------------------------------------------------------
  drawSectionHeading(
    `Portfolio Capstone Builds (${stats.completedProjectsCount}/${PORTFOLIO_PROJECTS.length} Completed)`,
    'Hands-on engineering builds with stack & status verification'
  );

  PORTFOLIO_PROJECTS.forEach((proj) => {
    const status = data.projectStatuses[proj.id] || 'not_started';
    const note = (data.projectNotes?.[proj.id] || '').trim();
    const rowH = note ? 28 : 17;
    ensureSpace(rowH);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    if (status === 'completed') doc.setTextColor(...COLORS.emerald);
    else if (status === 'in_progress') doc.setTextColor(...COLORS.sky);
    else doc.setTextColor(...COLORS.slate500);

    const statusTag =
      status === 'completed' ? '[DONE]' : status === 'in_progress' ? '[WIP ]' : '[TODO]';
    doc.text(statusTag, marginX + 8, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.slate900);
    doc.text(
      cleanPdfText(`#${String(proj.number).padStart(2, '0')} ${proj.title}`).slice(0, 56),
      marginX + 48,
      y + 10
    );

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.slate500);
    doc.text(
      cleanPdfText(`${proj.difficulty} | ${proj.tools.slice(0, 3).join(', ')}`),
      pageWidth - marginX - 4,
      y + 10,
      { align: 'right' }
    );

    if (note) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.slate700);
      doc.text(cleanPdfText(`Note: ${note}`).slice(0, 105), marginX + 48, y + 21);
    }

    y += rowH;
  });

  y += 6;

  // --------------------------------------------------------------------------
  // 6. ACHIEVEMENT BADGES & CYBER CITADEL SHELL SUMMARY
  // --------------------------------------------------------------------------
  const unlockedBadges = badgesSummary.badges.filter((b) => b.unlocked);
  drawSectionHeading(
    `Achievement Badges (${unlockedBadges.length}/${badgesSummary.totalCount}) & Wargame Progress`,
    `OverTheWire / Cyber Citadel Levels Cleared: ${stats.banditCount} / 16`
  );

  if (unlockedBadges.length === 0) {
    ensureSpace(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.slate500);
    doc.text('Complete milestones, stages, shell levels, or projects to unlock achievement badges.', marginX + 8, y + 10);
    y += 18;
  } else {
    const colW = contentWidth / 2 - 4;
    for (let i = 0; i < unlockedBadges.length; i += 2) {
      ensureSpace(22);
      [0, 1].forEach((offset) => {
        const badge = unlockedBadges[i + offset];
        if (!badge) return;
        const bx = marginX + offset * (colW + 8);
        doc.setFillColor(...COLORS.bgLight);
        doc.setDrawColor(...COLORS.cardBorder);
        doc.roundedRect(bx, y, colW, 18, 3, 3, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.emerald);
        doc.text(cleanPdfText(`[${badge.tier}] ${badge.title}`), bx + 8, y + 12);
        if (badge.unlockedAt) {
          doc.setFont('courier', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...COLORS.slate500);
          doc.text(badge.unlockedAt.split('T')[0], bx + colW - 8, y + 12, { align: 'right' });
        }
      });
      y += 22;
    }
  }

  y += 6;

  // --------------------------------------------------------------------------
  // 7. CHRONOLOGICAL STUDY LOGS & LAB EVIDENCE
  // --------------------------------------------------------------------------
  const logs = data.studyLogs || [];
  drawSectionHeading(
    `Study Sessions & Engineering Logs (${logs.length} Recorded)`,
    `Total logged practice time: ${stats.totalMinutesLogged} minutes (${totalHours} hours)`
  );

  if (logs.length === 0) {
    ensureSpace(20);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.slate500);
    doc.text('No study sessions logged yet.', marginX + 8, y + 10);
    y += 18;
  } else {
    const stageLookup = new Map(STAGES_DATA.map((s) => [s.id, `Stage ${s.number}`]));
    logs.slice(0, 45).forEach((entry) => {
      const cleanNote = cleanPdfText(entry.notes || 'Study practice session');
      const wrappedNote = doc.splitTextToSize(cleanNote, contentWidth - 138);
      const rowH = Math.max(17, wrappedNote.length * 10 + 6);
      ensureSpace(rowH);

      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.slate700);
      doc.text(cleanPdfText(entry.date || dateIso), marginX + 8, y + 10);

      doc.setFont('courier', 'normal');
      doc.setTextColor(...COLORS.sky);
      doc.text(stageLookup.get(entry.stageId) || entry.stageId, marginX + 74, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(...COLORS.slate900);
      doc.text(wrappedNote, marginX + 122, y + 10);

      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.emerald);
      doc.text(`${entry.minutes}m`, pageWidth - marginX - 6, y + 10, { align: 'right' });

      y += rowH;
    });
  }

  // --------------------------------------------------------------------------
  // 8. DOCUMENT FOOTER ON EVERY PAGE
  // --------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.line(marginX, pageHeight - 34, pageWidth - marginX, pageHeight - 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.slate500);
    doc.text(
      'CS Odyssey Open Educational Resource (MIT)  |  Local-First Verified Mastery Report',
      marginX,
      pageHeight - 20
    );
    doc.setFont('courier', 'normal');
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginX, pageHeight - 20, {
      align: 'right',
    });
  }

  return { doc, filename };
}

export function downloadMasteryReportPdf(input: MasteryReportInput): {
  filename: string;
  pageCount: number;
} {
  const { doc, filename } = buildMasteryReportPdfDocument(input);
  const pageCount = doc.getNumberOfPages();
  doc.save(filename);
  return { filename, pageCount };
}
