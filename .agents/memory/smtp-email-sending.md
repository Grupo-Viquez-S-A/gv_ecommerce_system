---
name: SMTP email sending via Edge Functions
description: Email is sent with a hand-rolled raw-SMTP client inside Supabase Edge Functions, not Supabase's built-in email APIs
---

The project sends transactional email (representative access/temp password, new-quotation notice, payment-success confirmation) using a custom SMTP client written in Deno (`supabase/functions/_shared/mailer.ts`), not `supabase.auth.inviteUserByEmail`/`resetPasswordForEmail`.

**Why:** the client's mailbox provider (Titan) is used directly with a hand-rolled SMTP-over-TLS implementation (`Deno.connectTls` on port 465, manual AUTH LOGIN + MIME), reused across `create-representative-user`, `notify-new-quotation`, and `notify-payment-success`.

**How to apply:**
- Any edge function that needs to send mail should import `getSmtpConfig`/`isSmtpConfigured`/`sendSmtpMail` from `_shared/mailer.ts` rather than duplicating the SMTP protocol code.
- Required env vars (`SMTP_HOST`, `SMTP_PORT`=465, `SMTP_USERNAME`, `SMTP_PASSWORD`, optionally `SMTP_FROM_EMAIL`/`SMTP_FROM_NAME`, `SITE_URL`/`APP_URL` for login links) must be set as **Supabase project secrets** (dashboard or `supabase secrets set`), since Edge Functions run on Supabase's infrastructure and cannot read Replit's env/secrets store.
- Since the agent has no Supabase CLI/dashboard access, the user must configure these secrets themselves; the agent cannot verify they were set correctly, only that the code reads them and fails gracefully (returns `ok:false` with a clear message) when missing.
