# ADR-0001: Zero Hardcoded Credentials & Safe Environment Fallbacks

## Status
**Accepted & Enforced**

## Context
Sensitive secrets and credentials were previously included as fallback defaults in `backend/src/config/env.ts` and related source files (such as MongoDB Atlas connection URIs with embedded user passwords, Razorpay API secret keys, Resend API keys, SMTP passwords, and JWT master keys).

This introduced severe security and operational risks:
1. Hardcoded live or test credentials exposed in the git commit history and version control.
2. If `.env` was missing, misconfigured, or failed to load, the system would silently connect to external live databases or third-party services using committed credentials.
3. Hardcoded JWT fallback keys allowed token forgery and compromised encryption operations.

## Decision
1. **Remove All Credentials From Git**:
   - Every sensitive credential, database URI with credentials, API token, secret key, and password is removed from all tracked source files.
2. **Safe Defaults Only**:
   - If `.env` is absent or a secret variable is unset, configuration schemas must default sensitive fields to empty strings (`""`) or undefined.
   - Under no circumstances should code fall back to hardcoded secrets or remote production resources.
3. **Fail-Safe Operation**:
   - In production (`NODE_ENV === "production"`), the application halts immediately if critical secrets (`MONGODB_URI`, `JWT_SECRET`) are missing or insufficiently secure.
   - Core runtime modules (e.g. `connectDB`, `crypto`) explicitly validate that required secrets are present before executing, throwing clear configuration errors rather than falling back to dummy keys.
   - Integration clients (e.g., Razorpay, AWS S3, Resend) are lazily initialized or gracefully deactivated when credentials are not configured, preventing startup crashes while avoiding insecure defaults.
4. **Permanent Enforcement**:
   - Documented in workspace rules (`.agents/rules/security-credentials.md`) and project guidelines (`AGENTS.md`) so all future contributions and AI assistants adhere to this decision.

## Consequences
- **Positive**:
  - Zero sensitive credentials are exposed in Git.
  - No accidental modification of remote databases or unexpected API calls when running in an unconfigured environment.
  - Fail-fast clarity: developers immediately know when required configuration is missing from `.env`.
- **Negative / Considerations**:
  - Developers and operators must configure their local `.env` (using `.env.example` as a template) before connecting to databases or testing third-party services.
