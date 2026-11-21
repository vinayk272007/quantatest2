# Project memory

## Product intent & audience

- App uses Firebase for auth/backend, UPI-based payment requests, and transactional email via Resend.
- Audience/feature scope not yet detailed beyond payments and email flows.

## Brand personality & voice

- Not yet specified beyond prompt-level defaults; no inferred brand direction yet.

## Visual design & UX direction

- Stack dictates Tailwind CSS, Lucide React icons, React hooks, `@/` path alias for `src/`.
- Aesthetic details not yet inferred; rely on prompt-level production-quality expectation.

## Decisions, constraints & rationale

- Firebase credentials are hardcoded in-app (no Firebase env vars) — same as prior approach.
- Only server-side env var required: `RESEND_API_KEY` (set on Vercel and Cloudflare).
- Supabase fully removed; no edge functions, migrations, config, or env helper retained.
- Email sending routed through serverless `/api/send-email`; both Vercel (`api/send-email.ts`) and Cloudflare Pages (`functions/api/send-email.ts`) versions exist.
- Email templates built client-side; serverless function only forwards to Resend.
- Email logs stored in Firestore collection `emailLogs` (recipient, type, subject, timestamp, uid) — not Supabase.
- `uid` included in log docs to satisfy Firestore rules.
- UPI payment request settings exist in app (details sparse).
- Firestore rules must be deployed manually via `firebase deploy --only firestore:rules`.
- Emails silently skipped if `RESEND_API_KEY` missing; app still works.

## Open questions & assumptions

- Exact UPI payment request implementation and providers not detailed — needs clarification.
- Whether Firebase hardcoded creds are acceptable for production long-term is assumed yes per user.
- Cloudflare Pages vs Vercel as primary deploy target not confirmed; both supported.
- Firestore rules content for `emailLogs` and other collections not fully captured here.