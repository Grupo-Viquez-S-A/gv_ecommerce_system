function normalizeHexColor(value) {
  if (!value || typeof value !== 'string') {
    return '#64748B';
  }

  const cleanValue = value.trim();

  // Acepta valores como: FFFFFF, #FFFFFF, FFF o #FFF.
  const hexValue = cleanValue.startsWith('#')
    ? cleanValue
    : `#${cleanValue}`;

  const isValidHex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(
    hexValue
  );

  return isValidHex ? hexValue : '#64748B';
}

export default function ColorDots({
  colors = [],
  maxVisible = 10,
  showLabels = true,
  className = '',
}) {
  const validColors = Array.isArray(colors) ? colors : [];

  if (validColors.length === 0) {
    return (
      <p className={`text-xs text-slate-500 ${className}`}>
        Sin colores registrados
      </p>
    );
  }

  const visibleColors = validColors.slice(0, maxVisible);
  const remainingColors = validColors.length - visibleColors.length;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      {visibleColors.map((color, index) => {
        const colorName =
          color.color ||
          color.color_name ||
          color.name ||
          'Color disponible';

        const hexColor = normalizeHexColor(
          color.hex_color || color.hex || color.hexCode
        );

        const quantity =
          color.quantity !== null &&
          color.quantity !== undefined &&
          color.quantity !== ''
            ? Number(color.quantity)
            : null;

        return (
          <div
            key={color.id || `${colorName}-${index}`}
            className="flex items-center gap-1.5"
            title={
              quantity !== null
                ? `${colorName} · ${quantity} disponibles`
                : colorName
            }
          >
            <span
              className="
                h-3.5 w-3.5 shrink-0 rounded-full border border-white/35
                shadow-[0_1px_3px_rgba(0,0,0,0.35)]
              "
              style={{ backgroundColor: hexColor }}
              aria-hidden="true"
            />

            {showLabels && (
              <span className="text-xs text-[#B8C6DD]">{colorName}</span>
            )}
          </div>
        );
      })}

      {remainingColors > 0 && (
        <span
          className="
            inline-flex h-6 min-w-6 items-center justify-center rounded-lg
            border border-[#375784] bg-[#091A31] px-1.5 text-[10px]
            font-bold text-[#D7A91D]
          "
          title={`${remainingColors} colores adicionales`}
        >
          +{remainingColors}
        </span>
      )}
    </div>
  );
}
