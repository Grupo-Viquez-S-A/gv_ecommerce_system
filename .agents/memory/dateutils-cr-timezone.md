---
name: Date formatting and Costa Rica timezone
description: Central util for dd/MM/yyyy display and America/Costa_Rica timezone date math
---

All date display (dd/MM/yyyy) and date-only calculations (today, +N days, date-range checks) go through `src/utils/dateUtils.js` (`formatDateCR`, `formatDateTimeCR`, `formatDateShortCR`, `getTodayCRDateString`, `addDaysCRDateString`, `toDateInputValueCR`, `formatRelativeDateTimeCR`), which pin everything to `America/Costa_Rica` via `Intl.DateTimeFormat`.

**Why:** the codebase previously computed "today"/date-only values with `new Date().toISOString().slice(0,10)`, which uses UTC and silently shifts the calendar day near midnight in Costa Rica (UTC-6); date displays also used inconsistent formats/timezones across files.

**How to apply:** never reintroduce `toISOString().slice(0,10)` or bare `toLocaleDateString`/`toLocaleString` for date-only or "today" logic — import the shared helpers instead. Native `<input type="date">` filters that aren't bound to state don't need conversion; only bind/derive values through `toDateInputValueCR`/`getTodayCRDateString` when defaulting or converting stored dates.
