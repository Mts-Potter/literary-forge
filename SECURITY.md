# Security Policy

## Environment Variables

**Never commit secrets to Git!** All sensitive credentials must be stored in environment variables.

### Local Development

1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your actual credentials in `.env.local` (this file is gitignored)

3. **Never** hardcode credentials in source code

### Required Environment Variables

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public/publishable key (safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` - **SECRET** - Admin key with full database access

#### AWS Bedrock
- `AWS_ACCESS_KEY_ID` - **SECRET** - IAM access key
- `AWS_SECRET_ACCESS_KEY` - **SECRET** - IAM secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `BEDROCK_MODEL_ID` - Model identifier

## Pre-Commit Hook

A pre-commit hook is installed at `.git/hooks/pre-commit` that automatically scans for:
- AWS access keys
- Supabase JWT tokens
- API keys
- Private keys

If secrets are detected, the commit will be blocked.

**To bypass** (only if false positive):
```bash
git commit --no-verify
```

## Key Rotation

If credentials are leaked:

1. **Immediately rotate** the compromised keys:
   - Supabase: Dashboard → Settings → API → Generate new keys
   - AWS: IAM Console → Users → Security credentials → Deactivate old key → Create new key

2. **Update** environment variables:
   - Local: `.env.local`
   - Production: Vercel Dashboard → Settings → Environment Variables

3. **Clean Git history** if keys were committed:
   ```bash
   # Use git-filter-branch or BFG Repo-Cleaner
   # Contact the team lead for assistance
   ```

4. **Force push** cleaned history to GitHub

## Vercel Deployment

Environment variables are managed separately in Vercel:

- **Public keys** (`NEXT_PUBLIC_*`): Available in all environments
- **Secret keys**: Only in Production and Preview (not Development)

Development uses local `.env.local` file.

## Reporting a Security Issue

If you discover a security vulnerability, please email: [your-email@example.com]

**Do NOT** create a public GitHub issue.

---

Last updated: 2026-01-24
