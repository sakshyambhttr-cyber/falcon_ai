Deploying to Vercel — checklist and automated commands
===============================================

This file explains how to securely upload environment variables to Vercel and trigger a deployment.

1) Prepare `.env.local` for local development

- Copy `.env.example` to `.env.local` and fill in real values. Never commit `.env.local`.

2) Install Vercel CLI (optional, recommended for scripting)

```bash
npm i -g vercel
vercel login
```

3) Add environment variables to Vercel (interactive)

- You can add variables using the Vercel dashboard (Project → Settings → Environment Variables) or with the CLI.

CLI example (run from `frontend/`):

```bash
# for each variable in your .env.local run:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

# server secrets (mark them as production, and do NOT prefix with NEXT_PUBLIC_):
vercel env add MURF_API_KEY production
vercel env add GEMINI_API_KEY production
```

4) Optional: script to bulk-add env vars (use with caution)

- The script below reads `.env.local` and calls `vercel env add` for each key. It will prompt for values if not provided. Run only on your machine — it will expose values to your shell history if misused.

```bash
# scripts/add-vercel-env.sh
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
if [ ! -f .env.local ]; then
  echo ".env.local not found; create it from .env.example first" >&2
  exit 1
fi
export $(cat .env.local | sed 's/#.*//g' | xargs)
for key in NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN NEXT_PUBLIC_FIREBASE_PROJECT_ID NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID NEXT_PUBLIC_FIREBASE_APP_ID MURF_API_KEY GEMINI_API_KEY NEXT_PUBLIC_SITE_URL; do
  val=$(printenv "$key")
  if [ -z "$val" ]; then
    echo "Skipping $key — no value in .env.local"
    continue
  fi
  echo "Adding $key to Vercel (production)..."
  vercel env add "$key" production <<< "$val"
done
```

5) Redeploy

- Push your branch to the repository used by Vercel or trigger a redeploy from the Vercel dashboard. Vercel will set `VERCEL_URL` during build which the app uses to include the host in the CSP.

6) Post-deploy checks

- Open the deployed site and test "Continue with Google".
- If it fails, open DevTools → Console and Network and copy the error. If CSP blocks remain, check Response headers for `Content-Security-Policy` and ensure the deployed header includes `accounts.google.com` and `apis.google.com`.

Security notes
- Do not commit `.env.local` or real keys to the repo.
- Use Vercel's Environment Variables (dashboard) for secrets and mark them for Production only as appropriate.
