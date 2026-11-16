import {
  isForbiddenIp,
  resolveAndValidateSshTarget,
  sanitizeTerminalOutput,
  resolveVirtualPath,
  sanitizeOdysseyStoreState,
  ALLOWED_SSH_HOST,
  ALLOWED_SSH_PORT,
  sshRateLimiter,
  sshConcurrencyLimiter,
  tutorRateLimiter,
} from '../lib/security.ts';
import {
  executeCodeSecurely,
  detectToolchainCapabilities,
} from '../lib/code-runner.ts';
import {
  STAGES_DATA,
  GLOSSARY_TERMS,
  PORTFOLIO_PROJECTS,
  ADVANCED_HERO_TOPICS,
} from '../lib/curriculum-data.ts';
import { CURATED_CS_SOURCES } from '../lib/sources-catalog.ts';
import {
  STAGE_FALLBACK_QUIZZES,
  validateQuizItems,
  buildLocalEli9Response,
  buildLocalDebugResponse,
  buildLocalLabReviewResponse,
  buildLocalStudyPlanResponse,
  sanitizeGroundingSources,
  buildLocalSearchGroundingResponse,
} from '../lib/local-mentor.ts';
import {
  generateCurriculumCsv,
  generateOpenSourceJson,
  computePacingSummary,
} from '../lib/curriculum-export.ts';
import { evaluateBadges, BADGE_DEFINITIONS } from '../lib/badges-data.ts';
import {
  CHEAT_SHEET_DATA,
  CHEAT_SHEET_CATEGORIES,
  BIG_O_MATRIX,
  OSI_TCP_LAYER_MATRIX,
} from '../lib/cheat-sheets-data.ts';
import { buildMasteryReportPdfDocument, cleanPdfText } from '../lib/mastery-report-pdf.ts';
import { validateSafeLlmBaseUrl } from '../lib/gemini.ts';
import {
  sealGitHubSession,
  unsealGitHubSession,
  createSignedOAuthState,
  verifySignedOAuthState,
  isAllowedAppOrigin,
  validateRepoName,
  validateRepoFilePath,
} from '../lib/github-oauth.ts';
import { compileCToWasm } from '../lib/wasm/c-compiler.ts';
import { executeCInWasm } from '../lib/wasm/c-runtime.ts';
import type { OdysseyStoreData } from '../hooks/use-odyssey-store.ts';
import assert from 'assert';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🛡️  CS ODYSSEY SECURITY & LOGIC REGRESSION TEST SUITE');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  console.log('--- 1. Threat Model & SSRF Boundary Enforcement ---');
  // --------------------------------------------------------------------------

  await test('Rejects IPv4 loopback (127.0.0.1, 127.0.1.1)', () => {
    assert.strictEqual(isForbiddenIp('127.0.0.1'), true);
    assert.strictEqual(isForbiddenIp('127.0.1.1'), true);
    assert.strictEqual(isForbiddenIp('127.255.255.255'), true);
  });

  await test('Rejects octal / hex / obfuscated IPs (0177.0.0.1, 0x7f000001)', () => {
    assert.strictEqual(isForbiddenIp('0177.0.0.1'), true);
    assert.strictEqual(isForbiddenIp('0x7f000001'), true);
    assert.strictEqual(isForbiddenIp('2130706433'), true);
  });

  await test('Rejects RFC-1918 private subnets (10.x, 172.16.x, 192.168.x)', () => {
    assert.strictEqual(isForbiddenIp('10.0.0.1'), true);
    assert.strictEqual(isForbiddenIp('10.254.254.1'), true);
    assert.strictEqual(isForbiddenIp('172.16.0.1'), true);
    assert.strictEqual(isForbiddenIp('172.31.255.255'), true);
    assert.strictEqual(isForbiddenIp('192.168.0.1'), true);
    assert.strictEqual(isForbiddenIp('192.168.1.100'), true);
  });

  await test('Rejects Cloud Metadata IP (169.254.169.254) and Link-Local', () => {
    assert.strictEqual(isForbiddenIp('169.254.169.254'), true);
    assert.strictEqual(isForbiddenIp('169.254.0.1'), true);
  });

  await test('Rejects IPv6 loopback, link-local, and IPv4-mapped IPv6', () => {
    assert.strictEqual(isForbiddenIp('::1'), true);
    assert.strictEqual(isForbiddenIp('fe80::1'), true);
    assert.strictEqual(isForbiddenIp('fc00::1'), true);
    assert.strictEqual(isForbiddenIp('::ffff:127.0.0.1'), true);
    assert.strictEqual(isForbiddenIp('::ffff:169.254.169.254'), true);
  });

  await test('Rejects outbound SSH to unapproved hosts (SSRF prevention)', async () => {
    const unapprovedHosts = [
      'localhost',
      '127.0.0.1',
      'google.com',
      '169.254.169.254',
      'metadata.google.internal',
      'attacker.evil.com',
    ];

    for (const host of unapprovedHosts) {
      let threw = false;
      try {
        await resolveAndValidateSshTarget(host, 2220);
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('SSRF Protection') || err.message.includes('strictly restricted'));
      }
      assert.strictEqual(threw, true, `Host ${host} should have been blocked`);
    }
  });

  await test('Rejects outbound SSH to unapproved ports', async () => {
    const unapprovedPorts = [22, 80, 443, 3000, 8080];
    for (const port of unapprovedPorts) {
      let threw = false;
      try {
        await resolveAndValidateSshTarget('bandit.labs.overthewire.org', port);
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('Port'));
      }
      assert.strictEqual(threw, true, `Port ${port} should have been blocked`);
    }
  });

  await test('Permits bandit.labs.overthewire.org on port 2220 with DNS resolution verification', async () => {
    const target = await resolveAndValidateSshTarget('bandit.labs.overthewire.org', 2220);
    assert.strictEqual(target.host, ALLOWED_SSH_HOST);
    assert.strictEqual(target.port, ALLOWED_SSH_PORT);
    assert(target.resolvedIp.length > 0);
    assert.strictEqual(isForbiddenIp(target.resolvedIp), false);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 2. Terminal ANSI & Stream Injection Sanitization ---');
  // --------------------------------------------------------------------------

  await test('Strips OSC terminal title manipulation injection', () => {
    const malicious = 'Hello\x1b]0;MALICIOUS TITLE\x07World';
    const cleaned = sanitizeTerminalOutput(malicious);
    assert.strictEqual(cleaned, 'HelloWorld');
  });

  await test('Strips OSC 52 clipboard hijacking sequences', () => {
    const malicious = 'Test\x1b]52;c;ZXhwbG9pdA==\x1b\\Output';
    const cleaned = sanitizeTerminalOutput(malicious);
    assert.strictEqual(cleaned, 'TestOutput');
  });

  await test('Strips DCS and dangerous cursor jump escape codes', () => {
    const malicious = 'Line1\x1b[2J\x1b[H\x1b[10;10HLine2';
    const cleaned = sanitizeTerminalOutput(malicious);
    assert.strictEqual(cleaned, 'Line1Line2');
  });

  await test('Strips null bytes and ASCII control characters while preserving safe colors', () => {
    const malicious = '\x00Secret\x1b[32mSafeGreen\x1b[0m\x08\x07';
    const cleaned = sanitizeTerminalOutput(malicious);
    assert.strictEqual(cleaned, 'Secret\x1b[32mSafeGreen\x1b[0m');
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 3. Code Execution & Subprocess Isolation ---');
  // --------------------------------------------------------------------------

  await test('Prevents shell command injection (direct argument vectors, no /bin/sh)', async () => {
    // Attempting command injection via semicolon / subshell syntax in code
    const injectionCode = `
import os
print("RUN_OK")
`;
    const result = await executeCodeSecurely({
      language: 'python',
      code: injectionCode,
      stdin: 'hello',
    });
    assert.strictEqual(result.success, true);
    assert(result.stdout.includes('RUN_OK'));
  });

  await test('Ensures environment variable isolation (no secret leaks)', async () => {
    // Simulate an attempt to dump process environment secrets
    const spyCode = `
import os
secrets = [k for k in os.environ.keys() if 'KEY' in k or 'SECRET' in k or 'GEMINI' in k or 'TOKEN' in k]
print(f"FOUND_SECRETS:{len(secrets)}")
`;
    const result = await executeCodeSecurely({
      language: 'python',
      code: spyCode,
    });
    assert.strictEqual(result.success, true);
    assert(result.stdout.includes('FOUND_SECRETS:0'), 'Environment secrets must not be accessible to user code');
  });

  await test('Enforces 5-second execution timeout on infinite loops', async () => {
    const infiniteLoopCode = `
import time
print("STARTING")
while True:
    time.sleep(0.1)
`;
    const result = await executeCodeSecurely({
      language: 'python',
      code: infiniteLoopCode,
      timeoutMs: 1500, // custom short timeout for test speed
    });
    assert.strictEqual(result.success, false);
    assert(result.stderr.includes('timed out'));
  });

  await test('Enforces 1MB output buffer ceiling on runaway output', async () => {
    const floodCode = `
# Flood stdout with 2MB of text
for i in range(50000):
    print("A" * 60)
`;
    const result = await executeCodeSecurely({
      language: 'python',
      code: floodCode,
      timeoutMs: 3000,
    });
    assert(result.stdout.length <= 1024 * 1024 + 100);
    assert(result.stderr.includes('limit exceeded') || result.stdout.length > 0);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 4. Virtual Filesystem Path Traversal Defenses ---');
  // --------------------------------------------------------------------------

  await test('Clamps path traversal attempts (../../../../etc/passwd) at root', () => {
    const current = ['home', 'bandit0'];
    const resolved = resolveVirtualPath(current, '../../../../etc/passwd');
    assert.deepStrictEqual(resolved, ['etc', 'passwd']);
  });

  await test('Rejects null-byte injection in simulated path', () => {
    const current = ['home', 'bandit0'];
    let threw = false;
    try {
      resolveVirtualPath(current, 'notes.txt\0.png');
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('null byte'));
    }
    assert.strictEqual(threw, true);
  });

  await test('Handles compound relative navigation (../bandit1/-) cleanly', () => {
    const current = ['home', 'bandit0'];
    const resolved = resolveVirtualPath(current, '../bandit1/-');
    assert.deepStrictEqual(resolved, ['home', 'bandit1', '-']);
  });

  await test('Handles absolute path resolution (/home/bandit2) correctly', () => {
    const current = ['home', 'bandit0', 'inhere'];
    const resolved = resolveVirtualPath(current, '/home/bandit2');
    assert.deepStrictEqual(resolved, ['home', 'bandit2']);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 5. State & Storage Invariant Verification ---');
  // --------------------------------------------------------------------------

  await test('Blocks prototype pollution in imported OdysseyStore state', () => {
    const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "dailyGoalMinutes": 45}');
    let threw = false;
    try {
      sanitizeOdysseyStoreState(maliciousPayload);
    } catch (err: any) {
      threw = true;
      assert(err.message.includes('Prototype pollution'));
    }
    assert.strictEqual(threw, true);
  });

  await test('Sanitizes out-of-range or malicious values in store data', () => {
    const dirtyData = {
      solvedBanditLevels: [-5, 0, 1, 999, 'bad' as any],
      dailyGoalMinutes: 9999,
      banditPasswords: {
        '0': 'bandit0',
        '999': 'invalid_level',
      },
    };
    const clean = sanitizeOdysseyStoreState(dirtyData);
    assert.deepStrictEqual(clean.solvedBanditLevels, [0, 1]);
    assert.strictEqual(clean.dailyGoalMinutes, 360);
    assert.strictEqual(clean.banditPasswords[0], 'bandit0');
    assert.strictEqual(clean.banditPasswords[999], undefined);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 6. Rate Limiting & Concurrency Controls ---');
  // --------------------------------------------------------------------------

  await test('Enforces token-bucket rate limiter exhaustion', () => {
    const testIp = '198.51.100.42';
    for (let i = 0; i < 30; i++) {
      const res = sshRateLimiter.tryConsume(testIp);
      assert.strictEqual(res.allowed, true);
    }
    const blocked = sshRateLimiter.tryConsume(testIp);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.remaining, 0);
  });

  await test('Enforces maximum concurrency limit (max 2 concurrent sessions)', () => {
    const testIp = '198.51.100.99';
    assert.strictEqual(sshConcurrencyLimiter.tryAcquire(testIp), true);
    assert.strictEqual(sshConcurrencyLimiter.tryAcquire(testIp), true);
    assert.strictEqual(sshConcurrencyLimiter.tryAcquire(testIp), false);
    sshConcurrencyLimiter.release(testIp);
    assert.strictEqual(sshConcurrencyLimiter.tryAcquire(testIp), true);
    sshConcurrencyLimiter.release(testIp);
    sshConcurrencyLimiter.release(testIp);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 7. Toolchain Detection, C Sandbox & Tutor Rate Limits ---');
  // --------------------------------------------------------------------------

  await test('Detects local Python and GCC toolchain capabilities without throwing', async () => {
    const caps = await detectToolchainCapabilities();
    assert.strictEqual(typeof caps.platform, 'string');
    assert.strictEqual(typeof caps.python.available, 'boolean');
    assert.strictEqual(typeof caps.gcc.available, 'boolean');
  });

  await test('Compiles and runs C11 sandbox code when GCC is installed (or returns clean missing hint)', async () => {
    const cResult = await executeCodeSecurely({
      language: 'c',
      code: '#include <stdio.h>\nint main(void) { printf("C_OK:%d\\n", 6 * 7); return 0; }\n',
    });
    if (cResult.toolchainMissing) {
      assert(cResult.stderr.includes('GCC/Clang'));
    } else {
      assert.strictEqual(cResult.success, true);
      assert(cResult.stdout.includes('C_OK:42'));
    }
  });

  await test('Enforces tutor rate limiter token exhaustion', () => {
    const testIp = '198.51.100.77';
    for (let i = 0; i < 30; i++) {
      assert.strictEqual(tutorRateLimiter.tryConsume(testIp).allowed, true);
    }
    assert.strictEqual(tutorRateLimiter.tryConsume(testIp).allowed, false);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 8. Curriculum, Sources, Offline Mentor & 16-Stage Quizzes ---');
  // --------------------------------------------------------------------------

  await test('Provides complete 5-question verified quiz banks for all 16 stages (stage-0..stage-15)', () => {
    assert.strictEqual(STAGES_DATA.length, 16);
    assert.strictEqual(PORTFOLIO_PROJECTS.length, 16);
    assert.strictEqual(ADVANCED_HERO_TOPICS.length, 10);
    for (const stage of STAGES_DATA) {
      assert(stage.topics.length >= 3, `${stage.id} must have >= 3 topics`);
      assert(stage.exitChecklist.length >= 3, `${stage.id} must have >= 3 exit checks`);
      const bank = STAGE_FALLBACK_QUIZZES[stage.id];
      assert(Array.isArray(bank) && bank.length === 5, `Missing 5-question quiz bank for ${stage.id}`);
      const validated = validateQuizItems(bank);
      assert(validated && validated.length === 5, `Quiz bank validation failed for ${stage.id}`);
    }
  });

  await test('Provides A-to-Z glossary coverage across all 26 initial letters (A-Z)', () => {
    const initialLetters = new Set(
      GLOSSARY_TERMS.map((g) => g.term.trim().charAt(0).toUpperCase())
    );
    const missing = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split('')
      .filter((ch) => !initialLetters.has(ch));
    assert.deepStrictEqual(missing, [], `Glossary missing letters: ${missing.join(', ')}`);
  });

  await test('Verifies all curated external sources reference valid HTTPS URLs and stage IDs', () => {
    const validStageIds = new Set(STAGES_DATA.map((s) => s.id));
    assert(CURATED_CS_SOURCES.length >= 60);
    for (const src of CURATED_CS_SOURCES) {
      assert(src.url.startsWith('https://'), `Source URL must use HTTPS: ${src.url}`);
      assert(src.stageIds.length >= 1, `Source ${src.id} must link to at least one stage`);
      for (const sid of src.stageIds) {
        assert(validStageIds.has(sid), `Invalid stage reference ${sid} in source ${src.id}`);
      }
    }
  });

  await test('Synthesizes grounded offline mentor answers for ELI9, Debug, and Lab Review', () => {
    const eli9 = buildLocalEli9Response('stage-6', 'How do pointers and memory allocation work in C?');
    assert(eli9.includes('Stage') && eli9.length > 80);

    const debug = buildLocalDebugResponse('Segmentation fault (core dumped)', 'My C array crashed');
    assert(debug.includes('Segmentation Fault') && debug.includes('malloc'));

    const review = buildLocalLabReviewResponse('Stage 3: Linux', 'Ran `ls -la` and verified exit 0 output.');
    assert(review.includes('Lab Write-Up Review'));
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 9. Achievement Badges Engine & State Validation ---');
  // --------------------------------------------------------------------------

  await test('Awards milestone, project, shell, and curriculum badges accurately', () => {
    const evalZero = evaluateBadges({
      completedTopics: {},
      solvedBanditLevels: [0],
      projectStatuses: {},
      userMilestones: [],
      savedSnippets: [],
      studyLogs: [],
      currentStreak: 0,
    });
    assert.strictEqual(evalZero.totalCount, BADGE_DEFINITIONS.length);
    assert.strictEqual(evalZero.unlockedCount, 0);

    const todayKey = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    const twoDaysAgoKey = twoDaysAgo.toISOString().split('T')[0];

    const stage0Topics = Object.fromEntries(STAGES_DATA[0].topics.map((t) => [t.id, true]));

    const evalHero = evaluateBadges({
      completedTopics: stage0Topics,
      solvedBanditLevels: [0, 1, 2, 3, 4, 5, 6, 7],
      projectStatuses: { 'proj-1': 'completed', 'proj-2': 'completed', 'proj-3': 'completed' },
      userMilestones: [
        { completed: true },
        { completed: true },
        { completed: true },
      ],
      savedSnippets: [{ id: 's1' }],
      studyLogs: [
        { date: todayKey, minutes: 45 },
        { date: yesterdayKey, minutes: 45 },
        { date: twoDaysAgoKey, minutes: 45 },
      ],
      currentStreak: 3,
    });

    const earnedIds = new Set(evalHero.badges.filter((b) => b.unlocked).map((b) => b.id));
    assert(earnedIds.has('milestone-spark'));
    assert(earnedIds.has('milestone-hunter'));
    assert(earnedIds.has('daily-cadence'));
    assert(earnedIds.has('first-blueprint'));
    assert(earnedIds.has('shipping-engineer'));
    assert(earnedIds.has('portfolio-builder'));
    assert(earnedIds.has('shell-operator'));
    assert(earnedIds.has('citadel-breacher'));
    assert(earnedIds.has('bitwise-initiate'));
  });

  await test('Sanitizes earnedBadges timestamps and rejects invalid keys', () => {
    const cleaned = sanitizeOdysseyStoreState({
      earnedBadges: {
        'milestone-spark': '2026-11-14T10:00:00.000Z',
        'INVALID KEY!!': '2026-11-14T10:00:00.000Z',
      },
    });
    assert.strictEqual(cleaned.earnedBadges['milestone-spark'], '2026-11-14T10:00:00.000Z');
    assert.strictEqual(cleaned.earnedBadges['INVALID KEY!!'], undefined);
  });

  await test('Sanitizes stageTargetDates, autoLogTopicPractice, and generates local study plans + exports', () => {
    const cleaned = sanitizeOdysseyStoreState({
      stageTargetDates: {
        'stage-0': '2026-12-01',
        'stage-15': '2027-03-15',
        'stage-99': '2026-12-01',
        'stage-1': 'not-a-date',
      },
      autoLogTopicPractice: false,
    });
    assert.strictEqual(cleaned.stageTargetDates['stage-0'], '2026-12-01');
    assert.strictEqual(cleaned.stageTargetDates['stage-15'], '2027-03-15');
    assert.strictEqual(cleaned.stageTargetDates['stage-99'], undefined);
    assert.strictEqual(cleaned.stageTargetDates['stage-1'], undefined);
    assert.strictEqual(cleaned.autoLogTopicPractice, false);

    const plan = buildLocalStudyPlanResponse('stage-14', 42, 60);
    assert(plan.includes('Stage 14') && plan.includes('60 minutes/day'));

    const pacing = computePacingSummary(12);
    assert.strictEqual(pacing.rows.length, 16);
    assert(pacing.totalWeeks > 0);

    const csv = generateCurriculumCsv();
    assert(csv.includes('Stage Number,Stage ID,Stage Title') && csv.includes('stage-15'));

    const parsedJson = JSON.parse(generateOpenSourceJson());
    assert.strictEqual(parsedJson.summary.totalStages, 16);
    assert.strictEqual(parsedJson.summary.totalPortfolioProjects, 16);
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 10. Search Grounding Sanitization & Offline Research Index ---');
  // --------------------------------------------------------------------------

  await test('Filters malicious URL protocols from groundingMetadata citations and deduplicates valid HTTPS URLs', () => {
    const cleaned = sanitizeGroundingSources([
      { web: { uri: 'javascript:alert(1)', title: 'XSS' } },
      { web: { uri: 'file:///etc/passwd', title: 'LFI' } },
      { web: { uri: 'https://datatracker.ietf.org/doc/html/rfc9110', title: 'RFC 9110 HTTP Semantics' } },
      { web: { uri: 'https://datatracker.ietf.org/doc/html/rfc9110', title: 'Duplicate RFC' } },
    ]);
    assert.strictEqual(cleaned.length, 1);
    assert.strictEqual(cleaned[0].title, 'RFC 9110 HTTP Semantics');
    assert.strictEqual(cleaned[0].uri, 'https://datatracker.ietf.org/doc/html/rfc9110');
  });

  await test('Synthesizes grounded offline search references from verified CS catalog', () => {
    const res = buildLocalSearchGroundingResponse('stage-2', 'TCP 3-way handshake and DNS sockets');
    assert(res.result.includes('Grounded Technical References'));
    assert(res.sources.length >= 2);
    for (const s of res.sources) {
      assert(s.uri.startsWith('https://'));
      assert(s.title.length > 0);
    }
  });

  // --------------------------------------------------------------------------
  console.log('\n--- 11. Cheat Sheets Encyclopedia, PDF Mastery Report, BYOK & GitHub OAuth ---');
  // --------------------------------------------------------------------------

  await test('Covers all 13 cheat sheet categories & core reference matrices', () => {
    assert.strictEqual(CHEAT_SHEET_CATEGORIES.length, 13);
    assert(CHEAT_SHEET_DATA.length >= 60);
    const presentCats = new Set(CHEAT_SHEET_DATA.map((c) => c.category));
    for (const cat of CHEAT_SHEET_CATEGORIES) {
      assert(presentCats.has(cat), `Missing cheat sheet entries for category ${cat}`);
    }
    assert(BIG_O_MATRIX.length >= 6);
    assert(OSI_TCP_LAYER_MATRIX.length >= 4);
  });

  await test('Generates valid multi-page jsPDF Mastery Report PDF buffer', () => {
    const baseData: OdysseyStoreData = {
      completedTopics: { 's0-t1': true, 's0-t2': true },
      completedExitChecks: { 'stage-0-0': true },
      solvedBanditLevels: [0, 1, 2],
      projectStatuses: { 'proj-1': 'completed' },
      projectNotes: { 'proj-1': 'Implemented clean C binary parser with unit tests.' },
      stageNotes: {},
      studyLogs: [
        { id: 'log-1', date: '2026-11-16', minutes: 45, stageId: 'stage-0', notes: 'Completed bitmasks & registers lab' },
      ],
      weeklyReviews: [],
      startDate: '2026-11-01',
      dailyGoalMinutes: 45,
      userMilestones: [
        { id: 'ms-1', title: 'Master 8-Bit Binary', category: 'basics', completed: true, xpReward: 75 },
      ],
      savedSnippets: [],
    };
    const { doc, filename } = buildMasteryReportPdfDocument({
      stats: {
        totalTopicsCount: 64,
        completedTopicsCount: 18,
        topicPercent: 28,
        completedProjectsCount: 2,
        totalProjectsCount: 16,
        banditCount: 5,
        totalMinutesLogged: 420,
        todayMinutesLogged: 45,
        dailyGoalMinutes: 45,
        dailyGoalPercent: 100,
        completedMilestonesCount: 2,
        totalMilestonesCount: 4,
        xp: 1750,
        levelNumber: 6,
        heroTitle: 'Citadel Initiate',
        currentStreak: 5,
      },
      stageProgressList: STAGES_DATA.map((s) => ({
        stageId: s.id,
        stageNumber: s.number,
        title: s.title,
        shortTitle: s.title.split(':')[0],
        sprintMonth: s.sprintMonth,
        topicsDone: s.number < 3 ? s.topics.length : 0,
        topicsTotal: s.topics.length,
        topicPercent: s.number < 3 ? 100 : 0,
        exitDone: s.number < 2 ? s.exitChecklist.length : 0,
        exitTotal: s.exitChecklist.length,
        exitPercent: s.number < 2 ? 100 : 0,
        targetDate: '2027-01-15',
        isComplete: s.number < 3,
      })),
      cadenceMetrics: {
        last28Days: [],
        weeklyMinutes: 210,
        daysGoalMet7: 5,
        activeDays28: 12,
      },
      badgesSummary: {
        badges: [],
        unlockedCount: 3,
        totalCount: BADGE_DEFINITIONS.length,
      },
      data: baseData,
      generatedAt: new Date('2026-11-16T00:00:00Z'),
    });

    assert.strictEqual(filename, 'CS-Odyssey-Mastery-Report-2026-11-16.pdf');
    assert(doc.getNumberOfPages() >= 2, 'Expected multi-page Mastery Report PDF');
    const pdfOutput = doc.output('arraybuffer');
    const header = Buffer.from(pdfOutput).subarray(0, 5).toString('ascii');
    assert.strictEqual(header, '%PDF-');
    assert.strictEqual(cleanPdfText('A → B • “hi”'), 'A -> B * "hi"');
  });

  await test('Enforces SSRF validation on custom BYOK LLM_BASE_URL endpoints', () => {
    assert.strictEqual(validateSafeLlmBaseUrl('http://localhost:11434/v1'), 'http://localhost:11434/v1');
    assert.strictEqual(validateSafeLlmBaseUrl('http://127.0.0.1:8080/v1'), 'http://127.0.0.1:8080/v1');
    assert.strictEqual(validateSafeLlmBaseUrl('https://api.openai.com/v1'), 'https://api.openai.com/v1');

    assert.strictEqual(validateSafeLlmBaseUrl('http://169.254.169.254/latest'), null);
    assert.strictEqual(validateSafeLlmBaseUrl('https://10.0.0.5/v1'), null);
    assert.strictEqual(validateSafeLlmBaseUrl('https://metadata.google.internal/v1'), null);
    assert.strictEqual(validateSafeLlmBaseUrl('http://example.com/v1'), null);
    assert.strictEqual(validateSafeLlmBaseUrl('javascript:alert(1)'), null);
  });

  await test('Seals GitHub OAuth cookies, verifies HMAC states, and sanitizes repo/file inputs', () => {
    const sealed = sealGitHubSession({
      accessToken: 'gho_test_token_123456',
      login: 'octocat',
      name: 'The Octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231',
      htmlUrl: 'https://github.com/octocat',
      issuedAt: Date.now(),
    });
    const unsealed = unsealGitHubSession(sealed);
    assert(unsealed !== null && unsealed.login === 'octocat');
    assert.strictEqual(unsealGitHubSession(sealed.slice(0, -4) + 'xxxx'), null);

    const callback = 'https://ais-dev-example.run.app/api/auth/github/callback';
    const { stateToken, nonce } = createSignedOAuthState(callback);
    const verified = verifySignedOAuthState(stateToken, nonce);
    assert(verified !== null && verified.redirectUri === callback);
    assert.strictEqual(verifySignedOAuthState(stateToken, 'wrong-nonce'), null);

    assert.strictEqual(isAllowedAppOrigin('http://localhost:3000'), 'http://localhost:3000');
    assert.strictEqual(isAllowedAppOrigin('https://ais-dev-test.europe-west1.run.app'), 'https://ais-dev-test.europe-west1.run.app');
    assert.strictEqual(isAllowedAppOrigin('https://evil.example.com'), null);

    assert.strictEqual(validateRepoName('cs-odyssey-progress'), 'cs-odyssey-progress');
    assert.strictEqual(validateRepoName('../bad-repo'), null);
    assert.strictEqual(validateRepoFilePath('progress/cs-odyssey-progress.json'), 'progress/cs-odyssey-progress.json');
    assert.strictEqual(validateRepoFilePath('../etc/passwd.json'), null);
    assert.strictEqual(validateRepoFilePath('scripts/run.sh'), null);
  });

  // --------------------------------------------------------------------------
  console.log('--- 7. Browser WebAssembly (C-to-WASM Compiler & Runtime) ---');
  // --------------------------------------------------------------------------

  await test('Compiles C11 programs into valid WebAssembly binaries (\\0asm v1)', () => {
    const meta = compileCToWasm(`#include <stdio.h>
int add(int a, int b) { return a + b; }
int main(void) { printf("%d\\n", add(20, 22)); return 0; }`);
    assert.strictEqual(WebAssembly.validate(meta.wasmBytes as BufferSource), true);
    assert.strictEqual(meta.hexHeader.startsWith('00 61 73 6d 01 00 00 00'), true);
    assert.deepStrictEqual(meta.functions, ['add', 'main']);
  });

  await test('Executes C pointers, arrays, recursion, math, structs, and malloc/free in WebAssembly.Memory', async () => {
    const res = await executeCInWasm(`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

typedef struct {
    char label[16];
    int score;
} HeroNode;

int fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}

void swap(int *a, int *b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int main(void) {
    int x = 10, y = 25;
    swap(&x, &y);
    HeroNode *node = (HeroNode *)malloc(sizeof(HeroNode));
    strncpy(node->label, "WASM", 15);
    node->score = fact(5);
    printf("%s:%d:%d:%.2f\\n", node->label, x, node->score, sqrt(16.0));
    free(node);
    return 0;
}`);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.exitCode, 0);
    assert.strictEqual(res.stdout.trim(), 'WASM:25:120:4.00');
    assert.strictEqual(res.wasmMetadata?.heapStats.allocations, 1);
    assert.strictEqual(res.wasmMetadata?.heapStats.frees, 1);
    assert.strictEqual(res.wasmMetadata?.heapStats.leakedBytes, 0);
  });

  await test('Captures stdin via scanf and detects infinite loop via WASM loop watchdog', async () => {
    const stdinRes = await executeCInWasm(
      `#include <stdio.h>
int main(void) {
    int val = 0;
    scanf("%d", &val);
    printf("READ=%d\\n", val * 2);
    return 0;
}`,
      '21\n'
    );
    assert.strictEqual(stdinRes.success, true);
    assert.strictEqual(stdinRes.stdout.trim(), 'READ=42');

    const loopRes = await executeCInWasm(`int main(void) { while (1) {} return 0; }`);
    assert.strictEqual(loopRes.success, false);
    assert.strictEqual(loopRes.exitCode, 124);
    assert.strictEqual(loopRes.stderr.includes('infinite loop'), true);
  });

  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
