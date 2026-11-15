import { NextRequest, NextResponse } from 'next/server';
import {
  generateCurriculumCsv,
  generateFullCurriculumMarkdown,
  generateOpenSourceJson,
  generatePrintableHtmlSyllabus,
  generateSingleStageMarkdown,
  type ExportAudienceMode,
} from '@/lib/curriculum-export';
import { apiSecurityHeaders } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secHeaders = apiSecurityHeaders();
  const search = req.nextUrl.searchParams;

  const rawFormat = (search.get('format') || 'json').toLowerCase();
  const rawMode = (search.get('mode') || 'github').toLowerCase();
  const stageParam = search.get('stage') || '';
  const hoursRaw = Number(search.get('hours') || 10);
  const hoursPerWeek = Number.isFinite(hoursRaw) ? Math.max(4, Math.min(40, Math.round(hoursRaw))) : 10;

  const mode: ExportAudienceMode =
    rawMode === 'student' || rawMode === 'teacher' ? rawMode : 'github';

  if (rawFormat === 'csv') {
    const csv = generateCurriculumCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        ...secHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cs-odyssey-curriculum.csv"',
      },
    });
  }

  if (rawFormat === 'markdown' || rawFormat === 'md') {
    if (/^stage-([0-9]|1[0-5])$/.test(stageParam)) {
      const md = generateSingleStageMarkdown(stageParam);
      return new NextResponse(md, {
        status: 200,
        headers: {
          ...secHeaders,
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="cs-odyssey-${stageParam}.md"`,
        },
      });
    }

    const md = generateFullCurriculumMarkdown({
      mode,
      includeStages: true,
      includeHeroModules: true,
      includeSourcesCatalog: true,
      includeProjects: true,
      includeCodeSnippets: true,
      includeRubrics: true,
      hoursPerWeek,
    });
    return new NextResponse(md, {
      status: 200,
      headers: {
        ...secHeaders,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="cs-odyssey-curriculum-${mode}.md"`,
      },
    });
  }

  if (rawFormat === 'html') {
    const html = generatePrintableHtmlSyllabus(hoursPerWeek);
    return new NextResponse(html, {
      status: 200,
      headers: {
        ...secHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';",
      },
    });
  }

  const json = generateOpenSourceJson();
  return new NextResponse(json, {
    status: 200,
    headers: {
      ...secHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cs-odyssey-curriculum.json"',
    },
  });
}
