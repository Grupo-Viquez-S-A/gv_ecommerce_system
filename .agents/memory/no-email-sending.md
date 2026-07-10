---
name: No email sending policy
description: Project deliberately has zero Supabase/SMTP email-sending functionality; used when touching auth, invites, or notifications
---

The user explicitly requested removal of ALL Supabase-based email sending from this project (invite emails, password-reset emails, quotation/payment SMTP notifications). Do not reintroduce `supabase.auth.inviteUserByEmail`, `resetPasswordForEmail`, or any Edge Function that sends SMTP/transactional email.

**Why:** User's stated policy — access for representatives/clients must work without email delivery infrastructure.

**How to apply:**
- New-user or pending-user access is granted via `admin.createUser`/`admin.updateUserById` with a generated temp password (`app_metadata.must_change_password: true`, `activation_status: "pending"|"new"`), never via invite/reset email APIs.
- The temp password is returned in the API response and must be shared with the user manually (e.g. shown in the admin UI), not emailed.
- Login flow: user logs in with temp password → `ProtectedRoute`/`mustChangePassword` check redirects to `/restablecer-contrasena`, which operates on the already-authenticated session (no magic-link/email-token handling needed there).
- "Forgot password" UI should direct the user to contact an admin for a new temp password rather than triggering any Supabase email.
