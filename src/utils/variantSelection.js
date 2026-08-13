export function resolveSelectedVariant(variants = [], selection = {}) {
  const activeVariants = variants.filter((variant) => variant?.is_active !== false);
  if (selection?.variant_id) {
    return activeVariants.find((variant) => variant.variant_id === selection.variant_id) || null;
  }

  if (!selection?.size_id) return null;
  return activeVariants.find((variant) => variant.size_id === selection.size_id) || null;
}
