---
name: Quotation notification system
description: How representative invite / new-quotation emails are sent and logged
---

The project has two representative-facing email flows, both using a shared raw-SMTP-over-TLS pattern (env vars `SMTP_HOST/PORT/USERNAME/PASSWORD/FROM_EMAIL/FROM_NAME`, port must be 465):
- `create-representative-user` edge function: sends the invite/activation email (only on first-ever quotation for a representative, i.e. when `representative.user_id` is not yet set).
- `notify-new-quotation` edge function: sends a "new quotation" email to representatives who are already activated (`user_id` already set). Never resends the invite or touches `must_change_password`.

Both log to `quotation_notifications` (pending/sent/failed, unique partial index prevents duplicate pending/sent rows per quotation+representative+type) so retries are idempotent.

**Why:** avoids duplicating the SMTP/MIME code a third time and keeps invite vs. re-notify logic cleanly separated so an already-active rep never gets a password-reset link again.

**How to apply:** if adding another transactional email, copy the SMTP helper functions from `notify-payment-success` or `notify-new-quotation` rather than introducing a new provider, and always branch on `representative.user_id` presence to choose invite vs. notify path.
