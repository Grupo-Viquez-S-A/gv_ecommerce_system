const CRC_FORMATTER = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Convierte un precio a colones costarricenses.
 *
 * Ejemplos:
 * formatCurrency(5500)      => "₡5.500"
 * formatCurrency("12500")   => "₡12.500"
 * formatCurrency(null)      => "Consultar precio"
 */
export function formatCurrency(value, fallback = 'Consultar precio') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const numericValue =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/[^\d.-]/g, ''));

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return CRC_FORMATTER.format(numericValue);
}

export default formatCurrency;