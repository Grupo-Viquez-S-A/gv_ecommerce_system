import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext.js";
import DashSideBar from "../components/dashSideBar.jsx";
import CatalogHeader from "../components/catalog/CatalogHeader";
import CatalogFilters, {
  EMPTY_CATALOG_FILTERS,
} from "../components/catalog/CatalogFilters";
import CatalogGrid from "../components/catalog/CatalogGrid";
import EmptyState from "../components/catalog/EmptyState";
import Pagination from "../components/catalog/Pagination";
import CatalogTechnicalSheetModal from "../components/catalog/CatalogTechnicalSheetModal";

import {
  RiArrowDownSFill,
  RiErrorWarningLine,
  RiLoader4Line,
  RiLogoutBoxLine,
  RiMenuFill,
  RiNotification3Fill,
  RiRefreshLine,
  RiSettings4Fill,
} from "react-icons/ri";

import {
  createCatalogFilterId,
  getCatalogProducts,
} from "../services/catalogService.js";

const PAGE_SIZE = 8;

const DEFAULT_COMPANY = {
  id: "grupo-viquez",
  name: "Grupo Víquez S.A",
  color: "#C9A227",
};

const COMPANY_COLORS = [
  "#C9A227",
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
];

const FALLBACK_COMPANIES = [
  DEFAULT_COMPANY,
  {
    id: "textiles",
    name: "Textiles de Occidente",
    color: "#6366f1",
  },
  {
    id: "constructora",
    name: "Constructora Víquez",
    color: "#C9A227",
  },
  {
    id: "occidente-lab",
    name: "Occidente Lab",
    color: "#22c55e",
  },
  {
    id: "agro",
    name: "Agro Occidente Group",
    color: "#f59e0b",
  },
  {
    id: "pacific-pet-food",
    name: "Pacific Pet Food",
    color: "#ec4899",
  },
];

function normalizeCompany(company, index = 0) {
  return {
    ...DEFAULT_COMPANY,
    ...(company || {}),
    name: company?.name || DEFAULT_COMPANY.name,
    color:
      company?.color ||
      COMPANY_COLORS[index % COMPANY_COLORS.length] ||
      DEFAULT_COMPANY.color,
  };
}

export default function Catalog() {

  const { user, signOut } = useAuth();
  const mainContentRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [filters, setFilters] = useState(EMPTY_CATALOG_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);

  const [currentCompany, setCurrentCompany] = useState(() =>
    normalizeCompany(
      user?.activeCompany || user?.companies?.[0] || DEFAULT_COMPANY,
    ),
  );

  const availableCompanies = useMemo(() => {
    const companiesFromUser =
      Array.isArray(user?.companies) && user.companies.length > 0
        ? user.companies
        : FALLBACK_COMPANIES;

    return companiesFromUser.map((company, index) =>
      normalizeCompany(company, index),
    );
  }, [user]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setCatalogError("");

    try {
      const catalogProducts = await getCatalogProducts();

      setProducts(catalogProducts);
      setCurrentPage(1);
    } catch (error) {
      console.error("Catalog loading error:", error);

      setProducts([]);
      setCatalogError(
        error?.message ||
          "No fue posible cargar el catálogo desde Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    const preferredCompany =
      user?.activeCompany || user?.companies?.[0];

    if (preferredCompany) {
      setCurrentCompany(normalizeCompany(preferredCompany));
    }
  }, [user]);

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

    return Array.from(uniqueCategories.values()).sort((first, second) =>
      first.category_name.localeCompare(second.category_name),
    );
  }, [products]);

  const productTypes = useMemo(() => {
    const uniqueTypes = new Map();

    products
      .filter((product) => {
        if (!filters.categoryId) {
          return true;
        }

        return product.category?.category_id === filters.categoryId;
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

    return Array.from(uniqueTypes.values()).sort((first, second) =>
      first.product_type.localeCompare(second.product_type),
    );
  }, [products, filters.categoryId]);

  const materials = useMemo(() => {
    const uniqueMaterials = new Map();

    products.forEach((product) => {
      (product.compositions || []).forEach((composition) => {
        const materialName = composition.material_name || "";

        if (!materialName) {
          return;
        }

        const materialId = createCatalogFilterId(materialName);

        if (!uniqueMaterials.has(materialId)) {
          uniqueMaterials.set(materialId, {
            material_id: materialId,
            material_name: materialName,
          });
        }
      });
    });

    return Array.from(uniqueMaterials.values()).sort((first, second) =>
      first.material_name.localeCompare(second.material_name),
    );
  }, [products]);

  const colors = useMemo(() => {
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

    return Array.from(uniqueColors.values()).sort((first, second) =>
      first.label.localeCompare(second.label),
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return products.filter((product) => {
      const searchableContent = [
        product.product_name,
        product.sku,
        product.description,
        product.category?.category_name,
        product.product_type?.product_type,
        ...(product.compositions || []).map(
          (composition) => composition.material_name,
        ),
        ...(product.colors || []).map((color) => color.color),
        ...(product.features || []).map((feature) => feature.feature),
        ...(product.managements || []).map(
          (management) => management.management,
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
        product.category?.category_id === filters.categoryId;

      const matchesType =
        !filters.typeId ||
        product.product_type?.type_id === filters.typeId;

      const matchesMaterial =
        !filters.materialId ||
        (product.compositions || []).some((composition) => {
          return (
            createCatalogFilterId(composition.material_name) ===
            filters.materialId
          );
        });

      const matchesColor =
        !filters.color ||
        (product.colors || []).some((color) => {
          return (
            createCatalogFilterId(color.color) === filters.color
          );
        });

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesMaterial &&
        matchesColor
      );
    });
  }, [products, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

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
      filters.color,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleSidebar = () => {
    setSidebarOpen((previousValue) => !previousValue);
  };

  const toggleCollapse = () => {
    setSidebarCollapsed((previousValue) => !previousValue);
  };

  const handleFiltersChange = (nextFilters) => {
    const categoryChanged =
      nextFilters.categoryId !== filters.categoryId;

    let normalizedFilters = {
      ...nextFilters,
    };

    if (categoryChanged && nextFilters.typeId) {
      const selectedTypeStillExists = products.some((product) => {
        const categoryMatches =
          !nextFilters.categoryId ||
          product.category?.category_id === nextFilters.categoryId;

        const typeMatches =
          product.product_type?.type_id === nextFilters.typeId;

        return categoryMatches && typeMatches;
      });

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

    mainContentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

 const handleViewDetail = (product) => {
  if (!product) {
    return;
  }

  setSelectedProduct(product);
};

  return (
    <div className="w-full h-screen bg-[#0B1120] text-white flex overflow-hidden">
      <DashSideBar
        sidebarCollapsed={sidebarCollapsed}
        sidebarOpen={sidebarOpen}
        currentCompany={currentCompany}
        toggleCollapse={toggleCollapse}
        toggleSidebar={toggleSidebar}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-[#1c2538] border-b border-[#2a3550] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              aria-label="Abrir menú lateral"
            >
              <RiMenuFill size={22} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setCompanyDropdown((previousValue) => !previousValue)
                }
                className="flex items-center gap-2 text-sm font-medium text-white hover:bg-[#222e44] px-3 py-1.5 rounded-lg transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      currentCompany?.color || DEFAULT_COMPANY.color,
                  }}
                />

                <span className="max-w-[180px] truncate">
                  {currentCompany?.name || DEFAULT_COMPANY.name}
                </span>

                <RiArrowDownSFill
                  size={16}
                  className="text-gray-400 flex-shrink-0"
                />
              </button>

              {companyDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#1c2538] border border-[#2a3550] rounded-lg shadow-xl z-50 py-1">
                  {availableCompanies.map((company, index) => (
                    <button
                      key={company.id || `${company.name}-${index}`}
                      type="button"
                      onClick={() => {
                        setCurrentCompany(company);
                        setCompanyDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#C9A227]/15 transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            company.color ||
                            COMPANY_COLORS[
                              index % COMPANY_COLORS.length
                            ],
                        }}
                      />

                      <span className="truncate">
                        {company.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors"
              aria-label="Notificaciones"
            >
              <RiNotification3Fill size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors"
              aria-label="Configuración"
            >
              <RiSettings4Fill size={16} />
            </button>

            <button
              type="button"
              onClick={signOut}
              className="w-9 h-9 rounded-lg bg-[#1c2538] border border-[#2a3550] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#C9A227]/15 transition-colors"
              aria-label="Cerrar sesión"
            >
              <RiLogoutBoxLine size={16} />
            </button>
          </div>
        </header>

        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          <CatalogHeader
            totalProducts={loading ? 0 : filteredProducts.length}
          />

          {loading ? (
            <section className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#35547E] bg-[#102441]/60 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#35547E] bg-[#091A31]">
                <RiLoader4Line className="h-8 w-8 animate-spin text-[#D7A91D]" />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-white">
                Cargando catálogo
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Estamos consultando los productos registrados en Supabase.
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
                onClick={loadCatalog}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#45648D] bg-[#132F58] px-4 py-2.5 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]"
              >
                <RiRefreshLine size={16} />
                Reintentar
              </button>
            </section>
          ) : (
            <>
              <CatalogFilters
                filters={filters}
                categories={categories}
                productTypes={productTypes}
                materials={materials}
                colors={colors}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />

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
                      productos
                    </p>

                    {hasActiveFilters && (
                      <p className="text-xs font-medium text-[#86A4CE]">
                        Resultados filtrados
                      </p>
                    )}
                  </div>

                  <CatalogGrid
                    products={currentProducts}
                    onViewDetail={handleViewDetail}
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
        </main>
         <CatalogTechnicalSheetModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </div>
    </div>
  );
}