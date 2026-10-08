# Security Rule: Zero Hardcoded Credentials & Safe Environment Fallbacks

## Context & Critical Mandate
Under NO circumstances must sensitive credentials, secrets, tokens, API keys, connection strings, or passwords ever be committed to Git or hardcoded in any tracked source file in this repository.

## Rules to Follow at All Times

1. **Zero Credentials in Git-Tracked Files**:
   - Never place real, testing, or placeholder secrets directly into source code (`.ts`, `.js`, `.tsx`, `.jsx`, `.json`, `.yml`, `.html`, etc.).
   - This includes:
     - MongoDB connection strings containing passwords / usernames (`mongodb+srv://...`)
     - JWT secrets and encryption master keys
     - Payment gateway credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`, etc.)
     - Transactional email / SMTP credentials (`RESEND_API_KEY`, `SMTP_PASS`)
     - Cloud storage secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
     - Seed administrator default passwords

2. **No Harmful Hardcoded Fallbacks**:
   - If an environment variable is not defined or the `.env` file is missing, **DO NOT** provide a hardcoded fallback secret that could compromise system security or connect to external resources (e.g. remote databases, payment gateways).
   - Sensitive values must default to empty strings (`""`) or undefined/optional in schemas and configuration objects.
   - Core operations requiring credentials must fail safely and explicitly (fail-fast with clear configuration error messages) rather than silently operating with an insecure or shared dummy credential.

3. **Production Validation**:
   - In production (`NODE_ENV === "production"`), the application must refuse to start and halt immediately (`process.exit(1)`) if critical secrets like `MONGODB_URI` or `JWT_SECRET` (minimum 32 characters) are missing.
   - Optional integrations (such as Razorpay, Resend, S3) must be lazily instantiated or gracefully deactivated when their credentials are not present.

4. **Environment Variable Storage**:
   - Local secrets must reside exclusively in uncommitted local environment files (e.g., `backend/.env`, `frontend/.env`), which are strictly included in `.gitignore`.
   - Sample or template environment files (e.g., `.env.example`) must contain only generic, non-functional placeholders (e.g., `re_xxxxxxxxxxxx`, `<username>:<password>`).
