---
name: quote_products generated columns
description: subtotal and total on quote_products (and similar money-math columns elsewhere in this schema) are DB-computed, not app-inserted
---

`quote_products.subtotal` and `quote_products.total` are Postgres `GENERATED ALWAYS AS (...) STORED` columns:

- `subtotal = round((quantity * unit_price), 2)`
- `total = round(((quantity * unit_price) + iva_amount), 2)`

**Why:** Postgres rejects any INSERT/UPDATE that supplies a value for a generated column (error: `cannot insert a non-DEFAULT value into column "..."`). The app only needs to write `quantity`, `unit_price`, and `iva_amount` — the DB derives the rest.

**How to apply:** When inserting/updating rows in `quote_products` (or any table in this schema), never include `subtotal`/`total` in the payload. If a similar error appears for another column, check `information_schema.columns.generation_expression` for that table before assuming it's a bug in app logic — it may be a generated column by design.
