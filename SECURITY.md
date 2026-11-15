# Security Policy

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `main` branch (v2.x) | Supported |

## Security Architecture & Trust Boundaries

CS Odyssey executes student code, parses local state, and optionally bridges to an educational SSH wargame server. Every trust boundary enforces defense-in-depth:

1. **SSRF & DNS Rebinding Guard (`app/api/ssh`, `lib/security.ts`)**:
   - Outbound SSH is strictly whitelisted to `bandit.labs.overthewire.org:2220`.
   - DNS resolution rejects loopback (`127.0.0.0/8`, `::1`), RFC-1918 private subnets, link-local / cloud metadata (`169.254.169.254`), and obfuscated octal/hex IP notations, then pins the verified socket IP.
2. **Isolated Subprocess Execution (`lib/code-runner.ts`, `app/api/code/run`)**:
   - Executes `python3`/`python` and `gcc`/`clang` directly via argument vectors with `shell: false`.
   - Strips all secret/environment variables (`GEMINI_API_KEY`, tokens, cloud creds) before spawning subprocesses.
   - Enforces a 5-second hard timeout, 1 MB output ceiling, and ephemeral temp-directory cleanup.
3. **Request & State Integrity (`lib/client-security.ts`, `app/api/progress`)**:
   - Rejects prototype-pollution keys (`__proto__`, `constructor`, `prototype`), validates stage IDs (`stage-0`..`stage-15`), bounds study logs and daily targets, and writes disk backups atomically via temporary file + `rename`.
4. **API Key Isolation**:
   - `GEMINI_API_KEY` is strictly server-side (`process.env.GEMINI_API_KEY`) and is never serialized to client bundles or child processes.

## Reporting a Vulnerability

If you discover a security vulnerability (such as SSRF bypass, command injection, prototype pollution, or secret exposure), **please do not open a public GitHub issue with exploit details**.

1. Use GitHub's **Private Vulnerability Reporting** ("Security" tab -> "Report a vulnerability") if enabled on the fork.
2. Otherwise contact the repository maintainer privately with minimal reproduction steps, affected files, and proposed remediation.
3. Add a regression test in `tests/security-regression.test.ts` once patched.
