---
name: Edge Function invite/reset redirect URL
description: How to build redirectTo for Supabase auth emails (invite/reset) and deployment constraints for Edge Functions in this environment
---

Build `redirectTo` for `inviteUserByEmail` / `resetPasswordForEmail` from a single required secret `APP_URL` (origin only, e.g. `https://domain.replit.app`), never from ambiguous fallbacks like `SITE_URL`/`ECOMMERCE_CLIENT_REDIRECT_URL`. If `APP_URL` is missing, the function must fail loudly (500), not silently send `redirectTo: undefined`.

**Why:** an earlier version used multiple env var fallbacks and sometimes emailed users a link with no valid redirect, breaking the password-activation flow silently in production.

**How to apply:** `const redirectTo = new URL("/restablecer-contrasena", appUrl.endsWith("/") ? appUrl : appUrl + "/").toString();`

Also: this sandbox has no Supabase CLI. Agent can only edit `supabase/functions/*/index.ts` source; the user must deploy manually (dashboard or their own CLI) and set the `APP_URL` secret on the Edge Function themselves. Always give exact deploy/secret instructions instead of assuming deployment happened.
