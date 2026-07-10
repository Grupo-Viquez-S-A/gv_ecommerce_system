---
name: production_orders schema mismatch
description: production_orders table columns vs. what client panel code assumed
---

The `production_orders` table (verified via Supabase OpenAPI schema dump with the service role key) has these columns only:
`production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, next_payment_date, is_active, created_at, updated_at, balance, overdue_days, penalty_amount`.

There is **no `payment_method` column** on this table, even though earlier client-panel read code (`getMyProductionOrders`/`getMyOrderDetail`) selected it directly.

**Why:** Payment method belongs to the quotation (`quotations.method_id` → `payment_methods.method_name`), not the production order. Selecting a nonexistent column either errors or silently returns nothing depending on the PostgREST version/config — don't trust that a `select()` string matches real columns without checking the schema first.

**How to apply:** When reading/writing `production_orders`, join through the related `quotations` row (via `quotation_id`) to get `method_id`/payment method info. Before adding new columns to a `select()` string on any Supabase table, verify the column exists via the OpenAPI schema endpoint (`GET {SUPABASE_URL}/rest/v1/` with `Accept: application/openapi+json`) rather than assuming.

**Check-constraint enums (verified by insert-probing with the service role key, since no `.sql` migrations exist in the repo):**
- `payment_status` only accepts: `pendiente`, `parcial`, `pagado`, `vencido`. (`adelantado`, `completado` are rejected.) UI mapping used: pendiente="Pendiente de pago", parcial="Pago adelantado", pagado="Pagado", vencido="Vencido".
- `production_order_status` only accepts: `pendiente`, `en_proceso`. All other guesses (enviado, entregado, cancelado, completado, terminado, listo, en_produccion, etc.) are rejected by the DB check constraint.
- To probe unknown check-constraint values safely: insert a test row with the service role key, inspect the 400 error's constraint name, then immediately delete any row that returns 201. Always verify no `TEST*`-coded rows remain afterward.

**Late-payment penalty system (added later):** `production_orders` also has `penalty_percentage` (numeric, reused, don't recreate) and a new `paid_at` (timestamptz) column added via `supabase/migrations/20260710_production_order_penalties.sql`. Calculation lives entirely in Postgres (BEFORE INSERT/UPDATE trigger `compute_production_order_penalty()`), not in React, so it can't drift from the DB and recalculates automatically whenever `balance` changes (e.g. from `importOrderPayments` in paymentService.js). A daily pg_cron job (`recalculate-production-order-penalties-daily`) just touches `updated_at` on overdue orders to re-trigger the same function (so today's date is always re-evaluated even if no columns changed). When `balance` reaches 0, `overdue_days`/`penalty_amount` freeze (don't reset) and `paid_at` is stamped once; if `balance` goes positive again, `paid_at` clears and calculation resumes — this is idempotent by design, safe to rerun.

**Agent cannot run DDL directly against Supabase** — there's no psql/connection-string access, only the REST API via anon/service-role keys (which can't execute arbitrary SQL/DDL, only table CRUD). Any new migration must be written to `supabase/migrations/*.sql` and the user must run it manually in the Supabase SQL Editor.
