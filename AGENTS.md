# Project Guidelines & Architecture Decisions

## Security & Secrets Management (Decision Record: ADR-0001)

### 🚨 Critical Decision: Zero Hardcoded Credentials & Safe Environment Fallbacks
- **Zero Credentials in Git**: Never commit or hardcode credentials, connection strings with auth, API keys, passwords, or secret keys into any git-tracked file.
- **No Insecure Fallbacks**: If environment variables are missing or `.env` fails to load:
  - **NEVER** fall back to hardcoded secrets or remote database URLs that could be harmful to the system or leak data.
  - Defaults for sensitive credentials in Zod schemas or configs must always be empty strings (`""`) or optional.
  - Missing core credentials (`MONGODB_URI`, `JWT_SECRET`) must throw clear descriptive errors or halt production boot (`process.exit(1)`).
  - Optional third-party services (Razorpay, Resend, S3) must be lazily instantiated or gracefully disabled when credentials are not configured.
- **Git Ignore**: Real credentials belong strictly in local `.env` files, which must remain ignored by git at all times.
- **Reference**: See `.agents/rules/security-credentials.md` and `docs/decisions/ADR-0001-no-hardcoded-credentials.md`.
