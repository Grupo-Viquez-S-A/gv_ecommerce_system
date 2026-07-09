import ClientProductCard from "./ClientProductCard";

export default function ClientCatalogGrid({
  products = [],
  onOpenProductDetails,
}) {
  const validProducts = Array.isArray(products) ? products : [];

  return (
    <section
      aria-label="Productos del catálogo para clientes"
      className="
        grid grid-cols-1 gap-5
        sm:grid-cols-2
        xl:grid-cols-3
        2xl:grid-cols-4
      "
    >
      {validProducts.map((product, index) => (
        <ClientProductCard
          key={
            product.product_id ||
            product.id ||
            product.sku ||
            `client-catalog-product-${index}`
          }
          product={product}
          onOpenProductDetails={onOpenProductDetails}
        />
      ))}
    </section>
  );
}
