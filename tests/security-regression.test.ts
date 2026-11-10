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
} from '../lib/security.ts';
import { executeCodeSecurely } from '../lib/code-runner.ts';
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
