---
name: production_orders schema mismatch
description: production_orders table columns vs. what client panel code assumed
---

The `production_orders` table (verified via Supabase OpenAPI schema dump with the service role key) has these columns only:
`production_order_id, quotation_id, production_order_code, committed_delivery_date, unexpected_delivery_date, production_order_status, payment_status, next_payment_date, is_active, created_at, updated_at, balance, overdue_days, penalty_amount`.

There is **no `payment_method` column** on this table, even though earlier client-panel read code (`getMyProductionOrders`/`getMyOrderDetail`) selected it directly.

**Why:** Payment method belongs to the quotation (`quotations.method_id` → `payment_methods.method_name`), not the production order. Selecting a nonexistent column either errors or silently returns nothing depending on the PostgREST version/config — don't trust that a `select()` string matches real columns without checking the schema first.

**How to apply:** When reading/writing `production_orders`, join through the related `quotations` row (via `quotation_id`) to get `method_id`/payment method info. Before adding new columns to a `select()` string on any Supabase table, verify the column exists via the OpenAPI schema endpoint (`GET {SUPABASE_URL}/rest/v1/` with `Accept: application/openapi+json`) rather than assuming.
