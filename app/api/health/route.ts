import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { detectToolchainCapabilities } from '@/lib/code-runner';
import { getMentorRuntimeStatus } from '@/lib/gemini';
import {
  ALLOWED_SSH_HOST,
  ALLOWED_SSH_PORT,
  apiSecurityHeaders,
} from '@/lib/security';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { CURATED_CS_SOURCES } from '@/lib/sources-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getProgressDataDir(): string {
  const configured = process.env.CS_ODYSSEY_DATA_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.resolve(process.cwd(), '.data');
}

async function checkDiskPersistenceWritable(): Promise<boolean> {
  const dir = getProgressDataDir();
  try {
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
    const probeFile = path.join(dir, `.probe-${process.pid}`);
    await fs.writeFile(probeFile, 'ok', { encoding: 'utf-8', mode: 0o600 });
    await fs.rm(probeFile, { force: true });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const headers = apiSecurityHeaders();
  const [toolchain, diskPersistenceWritable] = await Promise.all([
    detectToolchainCapabilities(),
    checkDiskPersistenceWritable(),
  ]);

  return NextResponse.json(
    {
      status: 'ok',
      service: 'cs-odyssey',
      timestamp: new Date().toISOString(),
      runtime: {
        node: process.version,
        platform: toolchain.platform,
        arch: toolchain.arch,
        uptimeSeconds: Math.round(process.uptime()),
      },
      capabilities: {
        python: toolchain.python,
        gcc: toolchain.gcc,
        aiMentor: {
          ...getMentorRuntimeStatus(),
          searchGroundingReady: true,
          localSynthesisReady: true,
        },
        sshGateway: {
          allowedHost: ALLOWED_SSH_HOST,
          allowedPort: ALLOWED_SSH_PORT,
          ssrfProtected: true,
        },
        diskPersistence: {
          writable: diskPersistenceWritable,
        },
        curriculum: {
          stages: STAGES_DATA.length,
          sources: CURATED_CS_SOURCES.length,
        },
      },
    },
    { headers }
  );
}
