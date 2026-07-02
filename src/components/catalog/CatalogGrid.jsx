import ProductCard from './ProductCard';

export default function CatalogGrid({
  products = [],
  onViewDetail,
}) {
  const validProducts = Array.isArray(products) ? products : [];

  return (
    <section
      aria-label="Productos del catálogo"
      className="
        grid grid-cols-1 gap-5
        sm:grid-cols-2
        xl:grid-cols-3
        2xl:grid-cols-4
      "
    >
      {validProducts.map((product, index) => (
        <ProductCard
          key={
            product.product_id ||
            product.id ||
            product.sku ||
            `catalog-product-${index}`
          }
          product={product}
          onViewDetail={onViewDetail}
        />
      ))}
    </section>
  );
}