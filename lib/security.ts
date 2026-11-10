import dns from 'dns';
import net from 'net';
import path from 'path';

/**
 * CS Odyssey Security & Trust Boundary Enforcement Module
 * 
 * Implements:
 * 1. SSRF & DNS Rebinding Defenses (strict destination whitelist, IP range validation, DNS pinning)
 * 2. Per-client Token-Bucket Rate Limiting & Concurrency Controls
 * 3. ANSI Escape Sequence & Stream Output Sanitization
 * 4. Virtual Filesystem Path Canonicalization (anti-path-traversal)
 * 5. State & Storage Invariant Validation
 */

// ============================================================================
// 1. SSRF & DESTINATION TRUST BOUNDARY
// ============================================================================

export const ALLOWED_SSH_HOST = 'bandit.labs.overthewire.org';
export const ALLOWED_SSH_PORT = 2220;

/**
 * Parses IPv4 string into a 32-bit unsigned integer.
 * Strictly parses standard decimal dotted-quad notation (rejecting octal/hex obfuscation).
 */
function parseIpv4ToNumber(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let num = 0;
  for (let i = 0; i < 4; i++) {
    const part = parts[i];
    // Reject leading zeroes (octal notation obfuscation like 0177.0.0.1)
    if (part.length > 1 && part.startsWith('0')) return null;
    // Must be purely digits 0-9
    if (!/^\d+$/.test(part)) return null;

    const val = parseInt(part, 10);
    if (isNaN(val) || val < 0 || val > 255) return null;
    num = (num << 8) + val;
  }
  return num >>> 0;
}

function isRestrictedIpv4(ipNum: number): boolean {
  const b0 = (ipNum >>> 24) & 0xff;
  const b1 = (ipNum >>> 16) & 0xff;
  const b2 = (ipNum >>> 8) & 0xff;
  const b3 = ipNum & 0xff;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;
  // 10.0.0.0/8 (RFC-1918 Private)
  if (b0 === 10) return true;
  // 100.64.0.0/10 (Carrier Grade NAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
  // 127.0.0.0/8 (Loopback / Localhost)
  if (b0 === 127) return true;
  // 169.254.0.0/16 (Link-Local & Cloud Metadata 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true;
  // 172.16.0.0/12 (RFC-1918 Private: 172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (b0 === 192 && b1 === 0 && b2 === 0) return true;
  // 192.168.0.0/16 (RFC-1918 Private)
  if (b0 === 192 && b1 === 168) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;
  // 224.0.0.0/4 (Multicast: 224-239)
  if (b0 >= 224 && b0 <= 239) return true;
  // 240.0.0.0/4 (Reserved: 240-255)
  if (b0 >= 240) return true;
  // 255.255.255.255 (Broadcast)
  if (b0 === 255 && b1 === 255 && b2 === 255 && b3 === 255) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls into restricted/private/loopback ranges.
 */
function isRestrictedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.slice(7);
    if (net.isIPv4(v4Part)) {
      const parsed = parseIpv4ToNumber(v4Part);
      return parsed !== null && isRestrictedIpv4(parsed);
    }
    return true; // Malformed or restricted IPv4-mapped
  }
  // Unique local addresses (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local unicast (fe80::/10)
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  // Multicast (ff00::/8)
  if (normalized.startsWith('ff')) return true;

  return false;
}

/**
 * Validates whether an IP address is forbidden.
 */
export function isForbiddenIp(ip: string): boolean {
  if (!ip) return true;

  const clean = ip.trim();
  const v4Family = net.isIPv4(clean);
  if (v4Family) {
    const ipNum = parseIpv4ToNumber(clean);
    if (ipNum === null) return true; // Malformed or obfuscated
    return isRestrictedIpv4(ipNum);
  }

  const v6Family = net.isIPv6(clean);
  if (v6Family) {
    return isRestrictedIpv6(clean);
  }

  // Not a valid standard IP string
  return true;
}

export interface ValidatedDestination {
  resolvedIp: string;
  host: string;
  port: number;
}

/**
 * Performs rigorous SSRF validation and DNS resolution:
 * 1. Checks strict whitelist of hostname and port.
 * 2. Rejects raw IPs, decimal/hex IP representations, localhost, cloud metadata, etc.
 * 3. Resolves DNS asynchronously.
 * 4. Ensures ALL resolved A/AAAA records are non-restricted public IPs (defeating DNS rebinding).
 * 5. Returns a pinned destination IP to connect directly with no DNS race condition.
 */
export async function resolveAndValidateSshTarget(
  host?: string,
  port?: number
): Promise<ValidatedDestination> {
  const reqHost = (host || ALLOWED_SSH_HOST).trim().toLowerCase();
  const reqPort = Number(port) || ALLOWED_SSH_PORT;

  // Strict hostname whitelist enforcement
  if (reqHost !== ALLOWED_SSH_HOST) {
    throw new Error(
      `SSRF Protection: Outbound SSH connections are strictly restricted to '${ALLOWED_SSH_HOST}'. Destination '${reqHost}' is forbidden.`
    );
  }

  // Strict port whitelist enforcement
  if (reqPort !== ALLOWED_SSH_PORT) {
    throw new Error(
      `SSRF Protection: Outbound SSH connections are restricted to port ${ALLOWED_SSH_PORT}. Port ${reqPort} is forbidden.`
    );
  }

  // Resolve DNS to verify all IP records
  let addresses: dns.LookupAddress[] = [];
  try {
    addresses = await dns.promises.lookup(reqHost, { all: true });
  } catch (err: any) {
    throw new Error(`DNS resolution failed for '${reqHost}': ${err.message}`);
  }

  if (!addresses || addresses.length === 0) {
    throw new Error(`DNS resolution returned no addresses for '${reqHost}'.`);
  }

  for (const entry of addresses) {
    if (isForbiddenIp(entry.address)) {
      throw new Error(
        `SSRF Protection: Host '${reqHost}' resolved to restricted IP ${entry.address}. Connection blocked.`
      );
    }
  }

  // Pin first resolved IP for connection
  const pinnedIp = addresses[0].address;

  return {
    host: reqHost,
    port: reqPort,
    resolvedIp: pinnedIp,
  };
}

// ============================================================================
// 2. TOKEN-BUCKET RATE LIMITER & CONCURRENCY CONTROLLER
// ============================================================================

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

class TokenBucketRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private maxTokens: number;
  private refillRatePerSec: number;
  private cleanupIntervalMs: number;
  private lastCleanup: number;

  constructor(maxTokens = 30, refillRatePerSec = 0.5) {
    this.maxTokens = maxTokens;
    this.refillRatePerSec = refillRatePerSec;
    this.cleanupIntervalMs = 60000;
    this.lastCleanup = Date.now();
  }

  public tryConsume(clientId: string, cost = 1): { allowed: boolean; remaining: number } {
    const now = Date.now();
    this.maybeCleanup(now);

    let bucket = this.buckets.get(clientId);
    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(clientId, bucket);
    } else {
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      const refilled = elapsedSec * this.refillRatePerSec;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + refilled);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return { allowed: true, remaining: Math.floor(bucket.tokens) };
    }

    return { allowed: false, remaining: 0 };
  }

  private maybeCleanup(now: number) {
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.lastCleanup = now;
      for (const [key, bucket] of this.buckets.entries()) {
        if (now - bucket.lastRefill > 300000) {
          this.buckets.delete(key);
        }
      }
    }
  }
}

class ConcurrencyLimiter {
  private activeCounts = new Map<string, number>();
  private maxConcurrency: number;

  constructor(maxConcurrency = 2) {
    this.maxConcurrency = maxConcurrency;
  }

  public tryAcquire(clientId: string): boolean {
    const count = this.activeCounts.get(clientId) || 0;
    if (count >= this.maxConcurrency) {
      return false;
    }
    this.activeCounts.set(clientId, count + 1);
    return true;
  }

  public release(clientId: string): void {
    const count = this.activeCounts.get(clientId) || 0;
    if (count <= 1) {
      this.activeCounts.delete(clientId);
    } else {
      this.activeCounts.set(clientId, count - 1);
    }
  }

  public getActiveCount(clientId: string): number {
    return this.activeCounts.get(clientId) || 0;
  }
}

export const sshRateLimiter = new TokenBucketRateLimiter(30, 0.5); // 30 bursts, 1 every 2s
export const sshConcurrencyLimiter = new ConcurrencyLimiter(2); // max 2 concurrent SSH sessions/queries per IP

export const codeExecRateLimiter = new TokenBucketRateLimiter(20, 0.4); // 20 bursts, 1 every 2.5s
export const codeExecConcurrencyLimiter = new ConcurrencyLimiter(2); // max 2 concurrent executions per IP

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

export * from './client-security.ts';
