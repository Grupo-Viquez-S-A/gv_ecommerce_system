function getMaterialName(composition) {
  return (
    composition.material_name ||
    composition.material?.material_name ||
    composition.material?.name ||
    composition.materials?.material_name ||
    composition.materials?.name ||
    composition.name ||
    ''
  );
}

function getPercentage(composition) {
  const rawPercentage =
    composition.percentage ??
    composition.composition_percentage ??
    composition.percent ??
    composition.material_percentage ??
    null;

  if (
    rawPercentage === null ||
    rawPercentage === undefined ||
    rawPercentage === ''
  ) {
    return null;
  }

  const numericPercentage = Number(
    String(rawPercentage).replace('%', '').trim()
  );

  if (Number.isNaN(numericPercentage)) {
    return null;
  }

  return numericPercentage;
}

export default function CompositionBadges({
  compositions = [],
  maxVisible = 3,
  showTitle = true,
  className = '',
}) {
  const validCompositions = Array.isArray(compositions)
    ? compositions
        .map((composition) => ({
          ...composition,
          resolvedMaterialName: getMaterialName(composition),
          resolvedPercentage: getPercentage(composition),
        }))
        .filter((composition) => composition.resolvedMaterialName)
    : [];

  if (validCompositions.length === 0) {
    return (
      <div className={className}>
        {showTitle && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
            Composición
          </p>
        )}

        <p className="text-xs text-slate-500">
          Composición no especificada
        </p>
      </div>
    );
  }

  const visibleCompositions = validCompositions.slice(0, maxVisible);
  const remainingCompositions =
    validCompositions.length - visibleCompositions.length;

  return (
    <div className={className}>
      {showTitle && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-[#86A4CE]">
          Composición
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {visibleCompositions.map((composition, index) => {
          const materialName = composition.resolvedMaterialName;
          const percentage = composition.resolvedPercentage;

          const label =
            percentage !== null
              ? `${materialName} ${percentage}%`
              : materialName;

          return (
            <span
              key={
                composition.composition_id ||
                composition.id ||
                `${materialName}-${index}`
              }
              title={label}
              className="
                inline-flex items-center rounded-lg border border-[#35547E]
                bg-[#091A31] px-2.5 py-1 text-xs font-semibold
                text-[#C9D8EC]
              "
            >
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#D7A91D]" />

              {materialName}

              {percentage !== null && (
                <span className="ml-1 font-bold text-[#D7A91D]">
                  {percentage}%
                </span>
              )}
            </span>
          );
        })}

        {remainingCompositions > 0 && (
          <span
            title={`${remainingCompositions} materiales adicionales`}
            className="
              inline-flex items-center rounded-lg border border-[#35547E]
              bg-[#132F58] px-2.5 py-1 text-xs font-bold text-[#D7A91D]
            "
          >
            +{remainingCompositions}
          </span>
        )}
      </div>
    </div>
  );
}
