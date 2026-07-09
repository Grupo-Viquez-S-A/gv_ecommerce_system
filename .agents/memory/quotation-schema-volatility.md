---
name: Quotation schema volatility
description: The user is actively redesigning the quotations/quote_products/textile_products tables directly in Supabase, moving pricing columns between tables across sessions.
---

The user edits the DB schema by hand (via Supabase UI) faster than the app code catches up, and reports the resulting column-not-found errors with screenshots.

Observed movements so far:
- `sublimation_price` / `embroidery_price` started on `quote_products`, moved to `quotations`, then moved again to `textile_products` (as a per-product configured price), while `quote_products` kept only boolean flags `has_sublimation` / `has_embroidery`.
- `quotations` gained aggregate money columns: `iva_amount`, `subtotal`, `total`, `advance_payment` (advance = 50% of total), plus `early_delivery_price`.

**Why:** Editing `quotationService.js` from memory/assumption instead of the latest schema causes repeated regressions (fixing one column reintroduces another).

**How to apply:** Before touching `quotationService.js` or `clientPanelService.js` quotation code, ask for or read current column screenshots/definitions for `quotations`, `quote_products`, and `textile_products` rather than trusting prior session notes. Mirror any select/insert changes in both `quotationService.js` (admin) and `clientPanelService.js` (client panel) since they duplicate the same query shape.
