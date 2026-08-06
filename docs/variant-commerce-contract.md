# Contrato de variantes del ecommerce

- Gestor reproducible elegido: `npm@10.9.2`, declarado en `package.json`.
- `package-lock.json` es el lockfile activo.
- `pnpm-lock.yaml` se conserva temporalmente para no borrar un artefacto sin
  conocer su origen; no debe actualizarse ni usarse para este release y podrá
  eliminarse en una limpieza separada aprobada.
- Carrito local: `localStorage`, clave `gv-ecommerce:quotation-cart:v2`.
- Identidad: producto + variante + personalizaciones.
- Color de filtros: `{ color_id, color, color_name }`.
- Selección vendible: `variant_id` resuelto desde talla + color.
- `inventory_tracking_enabled = false`: stock informativo/no inicializado.
- `inventory_tracking_enabled = true`: cantidad limitada y revalidada antes de
  cotizar.
- No existe todavía reserva ni descuento atómico de stock.
- Cotizaciones envían snapshots de SKU, GTIN, talla, color, descripción, precio
  e IVA; lecturas históricas prefieren esos snapshots.

La instalación limpia en el worktree puede fallar en Windows si un proceso
mantiene abierto el binario nativo de `lightningcss`. No se deben terminar
procesos del usuario automáticamente; cerrar el servidor Vite y repetir
`npm ci`, `npm run lint`, `npm run build`.
