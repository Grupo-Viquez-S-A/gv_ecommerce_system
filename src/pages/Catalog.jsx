import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CatalogHeader from "../components/catalog/CatalogHeader";
import CatalogSwitcher from "../components/catalog/CatalogSwitcher";
import CatalogFilters, {
  EMPTY_CATALOG_FILTERS,
} from "../components/catalog/CatalogFilters";
import CatalogGrid from "../components/catalog/CatalogGrid";
import EmptyState from "../components/catalog/EmptyState";
import Pagination from "../components/catalog/Pagination";
import CatalogTechnicalSheetModal from "../components/catalog/CatalogTechnicalSheetModal";
import CatalogProductDetailsModal from "../components/catalog/CatalogProductDetailsModal";
import ProductCategorySwitcher from "../components/catalog/ProductCategorySwitcher";

import {
  RiErrorWarningLine,
  RiLoader4Line,
  RiRefreshLine,
} from "react-icons/ri";
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import {
  CATALOG_TYPES,
  createCatalogFilterId,
  getCatalogProducts,
} from "../services/catalogService.js";

const PAGE_SIZE = 8;

function getCartProductId(product) {
  return (
    product?.product_id ||
    product?.id ||
    product?.sku ||
    product?.product_name
  );
}

function getCartProductName(product) {
  return (
    product?.product_name ||
    product?.fabric_name ||
    product?.name ||
    "Producto sin nombre"
  );
}

function getCartProductSku(product) {
  return (
    product?.sku ||
    product?.fabric_code ||
    "SKU no disponible"
  );
}

function getCartProductType(product) {
  return product?.catalog_type === CATALOG_TYPES.TEXTILE_PRODUCTS
    ? "Producto"
    : "Tela";
}

export default function Catalog() {
  const mainContentRef = useRef(null);
  const catalogRequestRef = useRef(0);

  const [activeCatalog, setActiveCatalog] = useState(
    CATALOG_TYPES.FABRICS,
  );

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedProductDetails, setSelectedProductDetails] =
    useState(null);

  const [
    selectedTechnicalSheetProduct,
    setSelectedTechnicalSheetProduct,
  ] = useState(null);

  const [filters, setFilters] = useState(
    EMPTY_CATALOG_FILTERS,
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [cartItems, setCartItems] = useState([]);

  const isTextileProductsCatalog =
    activeCatalog === CATALOG_TYPES.TEXTILE_PRODUCTS;

  const activeCatalogLabel = isTextileProductsCatalog
    ? "productos"
    : "telas";

  const scrollCatalogToTop = () => {
    const layoutScrollContainer =
      mainContentRef.current?.parentElement;

    layoutScrollContainer?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const loadCatalog = useCallback(
    async ({ showFullLoader = false } = {}) => {
      const requestId = catalogRequestRef.current + 1;

      catalogRequestRef.current = requestId;

      if (showFullLoader) {
        setLoading(true);
        setCatalogError("");
      } else {
        setIsRefreshing(true);
        setRefreshError("");
      }

      try {
        const catalogProducts = await getCatalogProducts(
          activeCatalog,
        );

        if (requestId !== catalogRequestRef.current) {
          return;
        }

        setProducts(catalogProducts);
        setLastUpdated(new Date());
      } catch (error) {
        if (requestId !== catalogRequestRef.current) {
          return;
        }

        console.error("Catalog loading error:", error);

        const errorMessage =
          error?.message ||
          "No fue posible actualizar el catálogo desde Supabase.";

        if (showFullLoader) {
          setProducts([]);
          setCatalogError(errorMessage);
        } else {
          setRefreshError(errorMessage);
        }
      } finally {
        if (requestId === catalogRequestRef.current) {
          if (showFullLoader) {
            setLoading(false);
          } else {
            setIsRefreshing(false);
          }
        }
      }
    },
    [activeCatalog],
  );

  useEffect(() => {
    loadCatalog({ showFullLoader: true });
  }, [loadCatalog]);

  const categories = useMemo(() => {
    const uniqueCategories = new Map();

    products.forEach((product) => {
      const category = product.category;

      if (
        category?.category_id &&
        !uniqueCategories.has(category.category_id)
      ) {
        uniqueCategories.set(category.category_id, category);
      }
    });

    return Array.from(uniqueCategories.values()).sort(
      (first, second) =>
        first.category_name.localeCompare(
          second.category_name,
        ),
    );
  }, [products]);

  const productCategories = useMemo(() => {
    if (!isTextileProductsCatalog) {
      return [];
    }

    const productCounts = new Map();

    products.forEach((product) => {
      const categoryId = product.category?.category_id;

      if (!categoryId) {
        return;
      }

      const currentCount = productCounts.get(categoryId) || 0;

      productCounts.set(categoryId, currentCount + 1);
    });

    return categories.map((category) => ({
      ...category,
      product_count:
        productCounts.get(category.category_id) || 0,
    }));
  }, [
    categories,
    products,
    isTextileProductsCatalog,
  ]);

  const productTypes = useMemo(() => {
    const uniqueTypes = new Map();

    products
      .filter((product) => {
        if (!filters.categoryId) {
          return true;
        }

        return (
          product.category?.category_id ===
          filters.categoryId
        );
      })
      .forEach((product) => {
        const productType = product.product_type;

        if (
          productType?.type_id &&
          !uniqueTypes.has(productType.type_id)
        ) {
          uniqueTypes.set(productType.type_id, productType);
        }
      });

    return Array.from(uniqueTypes.values()).sort(
      (first, second) =>
        first.product_type.localeCompare(
          second.product_type,
        ),
    );
  }, [products, filters.categoryId]);

  const materials = useMemo(() => {
    if (isTextileProductsCatalog) {
      return [];
    }

    const uniqueMaterials = new Map();

    products.forEach((product) => {
      (product.compositions || []).forEach((composition) => {
        const materialName =
          composition.material_name || "";

        if (!materialName) {
          return;
        }

        const materialId =
          createCatalogFilterId(materialName);

        if (!uniqueMaterials.has(materialId)) {
          uniqueMaterials.set(materialId, {
            material_id: materialId,
            material_name: materialName,
          });
        }
      });
    });

    return Array.from(uniqueMaterials.values()).sort(
      (first, second) =>
        first.material_name.localeCompare(
          second.material_name,
        ),
    );
  }, [products, isTextileProductsCatalog]);

  const colors = useMemo(() => {
    if (isTextileProductsCatalog) {
      return [];
    }

    const uniqueColors = new Map();

    products.forEach((product) => {
      (product.colors || []).forEach((color) => {
        const colorName = color.color || "";

        if (!colorName) {
          return;
        }

        const colorId = createCatalogFilterId(colorName);

        if (!uniqueColors.has(colorId)) {
          uniqueColors.set(colorId, {
            value: colorId,
            label: colorName,
          });
        }
      });
    });

    return Array.from(uniqueColors.values()).sort(
      (first, second) =>
        first.label.localeCompare(second.label),
    );
  }, [products, isTextileProductsCatalog]);

  const collections = useMemo(() => {
    if (!isTextileProductsCatalog) {
      return [];
    }

    const uniqueCollections = new Map();

    products.forEach((product) => {
      const collection = product.collection;

      if (
        collection?.collection_id &&
        !uniqueCollections.has(collection.collection_id)
      ) {
        uniqueCollections.set(
          collection.collection_id,
          collection,
        );
      }
    });

    return Array.from(uniqueCollections.values()).sort(
      (first, second) =>
        first.collection_name.localeCompare(
          second.collection_name,
        ),
    );
  }, [products, isTextileProductsCatalog]);

  const sizes = useMemo(() => {
    if (!isTextileProductsCatalog) {
      return [];
    }

    const uniqueSizes = new Map();

    products.forEach((product) => {
      (product.available_sizes || []).forEach((size) => {
        if (
          size?.size_id &&
          !uniqueSizes.has(size.size_id)
        ) {
          uniqueSizes.set(size.size_id, size);
        }
      });
    });

    return Array.from(uniqueSizes.values()).sort(
      (first, second) =>
        first.size_name.localeCompare(second.size_name),
    );
  }, [products, isTextileProductsCatalog]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = filters.search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const searchableContent = [
        product.product_name,
        product.sku,
        product.description,
        product.category?.category_name,
        product.product_type?.product_type,
        product.collection?.collection_name,
        product.size,
        product.length,
        product.width,
        product.height,
        ...(product.compositions || []).map(
          (composition) => composition.material_name,
        ),
        ...(product.colors || []).map(
          (color) => color.color,
        ),
        ...(product.features || []).map(
          (feature) => feature.feature,
        ),
        ...(product.managements || []).map(
          (management) => management.management,
        ),
        ...(product.available_sizes || []).map(
          (size) => size.size_name,
        ),
        ...(product.measurements || []).map(
          (measurement) =>
            `${measurement.size_name} ${measurement.dimension_name}`,
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableContent.includes(normalizedSearch);

      const matchesCategory =
        !filters.categoryId ||
        product.category?.category_id ===
          filters.categoryId;

      const matchesType =
        !filters.typeId ||
        product.product_type?.type_id === filters.typeId;

      const matchesMaterial =
        isTextileProductsCatalog ||
        !filters.materialId ||
        (product.compositions || []).some(
          (composition) =>
            createCatalogFilterId(
              composition.material_name,
            ) === filters.materialId,
        );

      const matchesColor =
        isTextileProductsCatalog ||
        !filters.color ||
        (product.colors || []).some(
          (color) =>
            createCatalogFilterId(color.color) ===
            filters.color,
        );

      const matchesCollection =
        !isTextileProductsCatalog ||
        !filters.collectionId ||
        product.collection?.collection_id ===
          filters.collectionId;

      const matchesSize =
        !isTextileProductsCatalog ||
        !filters.sizeId ||
        (product.available_sizes || []).some(
          (size) => size.size_id === filters.sizeId,
        );

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesMaterial &&
        matchesColor &&
        matchesCollection &&
        matchesSize
      );
    });
  }, [
    products,
    filters,
    isTextileProductsCatalog,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const currentProducts = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * PAGE_SIZE;

    return filteredProducts.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [filteredProducts, safeCurrentPage]);

  const hasActiveFilters = Boolean(
    filters.search.trim() ||
      filters.categoryId ||
      filters.typeId ||
      filters.materialId ||
      filters.color ||
      filters.collectionId ||
      filters.sizeId,
  );

  const cartItemsCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCatalogChange = (nextCatalog) => {
    if (
      !nextCatalog ||
      nextCatalog === activeCatalog
    ) {
      return;
    }

    setActiveCatalog(nextCatalog);
    setFilters(EMPTY_CATALOG_FILTERS);
    setCurrentPage(1);
    setSelectedProductDetails(null);
    setSelectedTechnicalSheetProduct(null);

    scrollCatalogToTop();
  };

  const handleProductCategoryChange = (categoryId) => {
    const nextCategoryId = categoryId || "";

    if (
      !isTextileProductsCatalog ||
      nextCategoryId === filters.categoryId
    ) {
      return;
    }

    setFilters({
      ...EMPTY_CATALOG_FILTERS,
      categoryId: nextCategoryId,
    });

    setCurrentPage(1);
    setSelectedProductDetails(null);
    setSelectedTechnicalSheetProduct(null);

    scrollCatalogToTop();
  };

  const handleFiltersChange = (nextFilters) => {
    const categoryChanged =
      nextFilters.categoryId !== filters.categoryId;

    let normalizedFilters = {
      ...nextFilters,
    };

    if (categoryChanged && nextFilters.typeId) {
      const selectedTypeStillExists = products.some(
        (product) => {
          const categoryMatches =
            !nextFilters.categoryId ||
            product.category?.category_id ===
              nextFilters.categoryId;

          const typeMatches =
            product.product_type?.type_id ===
            nextFilters.typeId;

          return categoryMatches && typeMatches;
        },
      );

      if (!selectedTypeStillExists) {
        normalizedFilters.typeId = "";
      }
    }

    setFilters(normalizedFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_CATALOG_FILTERS);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    scrollCatalogToTop();
  };

  const handleOpenProductDetails = (product) => {
    if (!product) {
      return;
    }

    setSelectedProductDetails(product);
  };

  const handleAddToCart = (product, quantity = 1) => {
    const productId = getCartProductId(product);

    if (!productId) {
      return;
    }

    const safeQuantity = Math.max(1, Number(quantity) || 1);

    setCartItems((currentItems) => {
      const itemExists = currentItems.some(
        (item) => item.id === productId,
      );

      if (itemExists) {
        return currentItems.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity + safeQuantity,
              }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          id: productId,
          name: getCartProductName(product),
          sku: getCartProductSku(product),
          catalogType: getCartProductType(product),
          quantity: safeQuantity,
        },
      ];
    });
  };

  const handleUpdateCartItemQuantity = (itemId, nextQuantity) => {
    const safeQuantity = Math.max(1, Number(nextQuantity) || 1);

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: safeQuantity,
            }
          : item,
      ),
    );
  };

  const handleRemoveCartItem = (itemId) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOpenTechnicalSheet = (product) => {
    if (!product) {
      return;
    }

    setSelectedProductDetails(null);
    setSelectedTechnicalSheetProduct(product);
  };

  const handleRefreshCatalog = () => {
    loadCatalog();
  };

  return (
    <>
      <div
        ref={mainContentRef}
        className="p-4 lg:p-6"
      >
        <CatalogHeader
          totalProducts={
            loading ? 0 : filteredProducts.length
          }
        />

        <CatalogSwitcher
          activeCatalog={activeCatalog}
          onChange={handleCatalogChange}
        />

        {loading ? (
          <section className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#35547E] bg-[#102441]/60 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#35547E] bg-[#091A31]">
              <RiLoader4Line className="h-8 w-8 animate-spin text-[#D7A91D]" />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-white">
              Cargando catálogo de {activeCatalogLabel}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              Estamos consultando los registros disponibles en
              Supabase.
            </p>
          </section>
        ) : catalogError ? (
          <section className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-400/40 bg-red-500/5 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10">
              <RiErrorWarningLine className="h-8 w-8 text-red-400" />
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-white">
              No fue posible cargar el catálogo
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {catalogError}
            </p>

            <button
              type="button"
              onClick={() =>
                loadCatalog({ showFullLoader: true })
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#45648D] bg-[#132F58] px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]"
            >
              <RiRefreshLine size={16} />
              Reintentar
            </button>
          </section>
        ) : (
          <>
            {isTextileProductsCatalog && (
              <ProductCategorySwitcher
                categories={productCategories}
                totalProducts={products.length}
                activeCategoryId={filters.categoryId}
                onChange={handleProductCategoryChange}
              />
            )}

            <CatalogFilters
              catalogType={activeCatalog}
              showCategoryFilter={!isTextileProductsCatalog}
              filters={filters}
              categories={categories}
              productTypes={productTypes}
              materials={materials}
              colors={colors}
              collections={collections}
              sizes={sizes}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#29466F] bg-[#102441]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Catálogo actualizado desde Supabase
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {lastUpdated
                    ? `Última actualización: ${lastUpdated.toLocaleTimeString(
                        "es-CR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        },
                      )}`
                    : "Aún no se ha actualizado manualmente."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshCatalog}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#45648D] bg-[#132F58] px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RiRefreshLine
                  size={17}
                  className={
                    isRefreshing ? "animate-spin" : ""
                  }
                />

                {isRefreshing
                  ? "Actualizando catálogo..."
                  : "Actualizar catálogo"}
              </button>
            </div>

            {refreshError && (
              <div
                role="alert"
                className="mb-4 flex flex-col gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-red-200">
                  No se pudieron actualizar los datos. Se conserva
                  la información que ya estaba visible.
                </p>

                <button
                  type="button"
                  onClick={handleRefreshCatalog}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RiRefreshLine
                    size={14}
                    className={
                      isRefreshing ? "animate-spin" : ""
                    }
                  />
                  Reintentar
                </button>
              </div>
            )}

            <section className="mb-5 rounded-2xl border border-[#29466F] bg-[#102441]/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#35547E] bg-[#091A31] text-[#D7A91D]">
                    <ShoppingCart className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      Carrito de compra
                    </h2>

                    <p className="text-sm text-slate-400">
                      {cartItemsCount}{" "}
                      {cartItemsCount === 1
                        ? "unidad seleccionada"
                        : "unidades seleccionadas"}
                    </p>
                  </div>
                </div>

                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/30 px-3.5 py-2 text-sm font-bold text-red-100 transition hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Vaciar carrito
                  </button>
                )}
              </div>

              {cartItems.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#35547E] bg-[#091A31] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg border border-[#D7A91D]/25 bg-[#D7A91D]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D7A91D]">
                            {item.catalogType}
                          </span>

                          <span className="truncate text-xs text-[#86A4CE]">
                            {item.sku}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm font-bold text-white">
                          {item.name}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="flex items-center overflow-hidden rounded-xl border border-[#35547E] bg-[#102441]">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCartItemQuantity(
                                item.id,
                                item.quantity - 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center text-[#C9D8EC] transition hover:bg-[#132F58] hover:text-[#E9BC2D]"
                            aria-label={`Restar ${item.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <span className="min-w-10 border-x border-[#35547E] px-3 text-center text-sm font-bold text-white">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCartItemQuantity(
                                item.id,
                                item.quantity + 1,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center text-[#C9D8EC] transition hover:bg-[#132F58] hover:text-[#E9BC2D]"
                            aria-label={`Sumar ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-300/25 text-red-100 transition hover:bg-red-500/10"
                          aria-label={`Quitar ${item.name} del carrito`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[#35547E] bg-[#091A31]/60 px-4 py-3 text-sm text-slate-500">
                  Selecciona cantidades en las tarjetas del catálogo para preparar el pedido.
                </p>
              )}
            </section>

            {currentProducts.length > 0 ? (
              <>
                <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">
                    Mostrando{" "}
                    <span className="font-bold text-white">
                      {currentProducts.length}
                    </span>{" "}
                    de{" "}
                    <span className="font-bold text-white">
                      {filteredProducts.length}
                    </span>{" "}
                    {isTextileProductsCatalog
                      ? "productos"
                      : "telas"}
                  </p>

                  {hasActiveFilters && (
                    <p className="text-xs font-medium text-[#86A4CE]">
                      Resultados filtrados
                    </p>
                  )}
                </div>

                <CatalogGrid
                  products={currentProducts}
                  onOpenProductDetails={
                    handleOpenProductDetails
                  }
                  onAddToCart={handleAddToCart}
                />

                <Pagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
              />
            )}
          </>
        )}
      </div>

      <CatalogProductDetailsModal
        product={selectedProductDetails}
        onClose={() => setSelectedProductDetails(null)}
        onViewTechnicalSheet={handleOpenTechnicalSheet}
      />

      <CatalogTechnicalSheetModal
        product={selectedTechnicalSheetProduct}
        onClose={() =>
          setSelectedTechnicalSheetProduct(null)
        }
      />
    </>
  );
}
