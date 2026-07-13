import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import CatalogHeader from "../components/catalog/CatalogHeader";
import CatalogSwitcher from "../components/catalog/CatalogSwitcher";
import CatalogFilters from "../components/catalog/CatalogFilters";
import { EMPTY_CATALOG_FILTERS } from "../components/catalog/catalogFilterDefaults.js";
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
  X,
} from "lucide-react";

import {
  CATALOG_TYPES,
  createCatalogFilterId,
  getCatalogProducts,
} from "../services/catalogService.js";
import {
  createBusinessQuotation,
  getPaymentMethods,
  getQuotationClientByLegalId,
  getQuotationCompanies,
} from "../services/quotationService.js";
import { useAuth } from "../context/AuthContext.js";
import { hasCatalogPurchaseAccess } from "../utils/roles.js";

const PAGE_SIZE = 8;

const EMPTY_QUOTATION_CLIENT_FORM = {
  businessId: "",
  branchId: "",
  representativeId: "",
  companyId: "",
  legalId: "",
  legalName: "",
  businessName: "",
  activityCode: "",
  businessEmail: "",
  businessPhone: "",
  branchProvince: "",
  branchDistrict: "",
  branchAddress: "",
  branchPhone: "",
  representativeName: "",
  representativeEmail: "",
  representativeUserId: null,
  notes: "",
  earlyDelivery: false,
  methodId: "",
};

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

function getCartProductPrice(product) {
  const price = Number(product?.price);

  return Number.isFinite(price) ? price : 0;
}

function getCartProductIva(product) {
  const ivaAmount = Number(product?.iva_amount);

  return Number.isFinite(ivaAmount) ? ivaAmount : 0;
}

function getCartProductType(product) {
  return product?.catalog_type === CATALOG_TYPES.TEXTILE_PRODUCTS
    ? "Producto"
    : "Tela";
}

export default function Catalog() {
  const { user } = useAuth();
  const canPurchase = hasCatalogPurchaseAccess(user);
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
  const [cartOpen, setCartOpen] = useState(false);
  const [quotationCompanies, setQuotationCompanies] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [quotationClientForm, setQuotationClientForm] = useState(
    EMPTY_QUOTATION_CLIENT_FORM,
  );
  const [quotationError, setQuotationError] = useState("");
  const [quotationSuccess, setQuotationSuccess] = useState("");
  const [quotationSubmitting, setQuotationSubmitting] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [clientLookupLoading, setClientLookupLoading] = useState(false);
  const [clientLookupMessage, setClientLookupMessage] = useState("");
  const [clientBranches, setClientBranches] = useState([]);
  const [showNewBranchForm, setShowNewBranchForm] = useState(false);

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
    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        loadCatalog({ showFullLoader: true });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadCatalog]);

  useEffect(() => {
    let isMounted = true;

    getQuotationCompanies()
      .then((companies) => {
        if (isMounted) {
          setQuotationCompanies(companies || []);
        }
      })
      .catch((error) => {
        console.error("Quotation companies loading error:", error);
      });

    getPaymentMethods()
      .then((methods) => {
        if (isMounted) {
          setPaymentMethods(methods || []);
        }
      })
      .catch((error) => {
        console.error("Payment methods loading error:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPaymentMethodDescription = useMemo(() => {
    const selectedMethod = paymentMethods.find(
      (method) => method.method_id === quotationClientForm.methodId,
    );

    return selectedMethod?.description || "";
  }, [paymentMethods, quotationClientForm.methodId]);

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
      Promise.resolve().then(() => {
        setCurrentPage(totalPages);
      });
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

  const handleAddToCart = (product, quantity = 1, size = null, options = {}) => {
    const productId = getCartProductId(product);

    if (!productId) {
      return;
    }

    const safeQuantity = Math.max(1, Number(quantity) || 1);
    const sizeId = size?.size_id ?? null;
    const sizeName = size?.size_name ?? null;
    const optionKey = [
      options.hasSublimation ? "sublimation" : "",
      options.hasEmbroidery ? "embroidery" : "",
    ]
      .filter(Boolean)
      .join("_");
    const cartItemId = [
      productId,
      sizeId || "no-size",
      optionKey || "standard",
    ].join("_");
    const baseName = getCartProductName(product);
    const isUnica =
      sizeName && sizeName.toLowerCase() === "única";
    const itemName =
      sizeName && !isUnica ? `${baseName} - ${sizeName}` : baseName;

    const hasSublimation = Boolean(options.hasSublimation);
    const hasEmbroidery = Boolean(options.hasEmbroidery);
    const sublimationPrice = hasSublimation
      ? Number(product?.sublimation_price) || 0
      : 0;
    const embroideryPrice = hasEmbroidery
      ? Number(product?.embroidery_price) || 0
      : 0;
    const basePrice = getCartProductPrice(product);
    const baseIva = getCartProductIva(product);
    const basePercentage =
      basePrice > 0 && Number.isFinite(basePrice) ? baseIva / basePrice : 0;
    const unitPrice = basePrice + sublimationPrice + embroideryPrice;
    const ivaAmount =
      baseIva +
      sublimationPrice * basePercentage +
      embroideryPrice * basePercentage;

    setCartItems((currentItems) => {
      const itemExists = currentItems.some(
        (item) => item.id === cartItemId,
      );

      if (itemExists) {
        return currentItems.map((item) =>
          item.id === cartItemId
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
          id: cartItemId,
          name: itemName,
          sizeName: isUnica ? null : sizeName,
          sizeId: isUnica ? null : sizeId,
          sku: getCartProductSku(product),
          catalogType: getCartProductType(product),
          quantity: safeQuantity,
          productId,
          unitPrice,
          ivaAmount,
          hasSublimation,
          hasEmbroidery,
          sublimationPrice,
          embroideryPrice,
        },
      ];
    });
  };

  const handleOpenCart = () => {
    setQuotationError("");
    setQuotationSuccess("");
    setCartOpen(true);
  };

  const handleCloseCart = () => {
    setCartOpen(false);
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

  const handleQuotationClientFormChange = (fieldName, value) => {
    setQuotationClientForm((currentForm) => ({
      ...currentForm,
      ...(fieldName === "legalId"
        ? {
            businessId: "",
            branchId: "",
            representativeId: "",
          }
        : {}),
      [fieldName]: value,
    }));

    if (fieldName === "legalId") {
      setClientLookupMessage("");
      setClientBranches([]);
      setShowNewBranchForm(false);
    }
  };

  const handleLookupClientByLegalId = async () => {
    const legalId = quotationClientForm.legalId.trim();

    if (!legalId) {
      setClientLookupMessage("");
      return;
    }

    try {
      setClientLookupLoading(true);
      setClientLookupMessage("");

      const existingClient = await getQuotationClientByLegalId(legalId);

      if (!existingClient) {
        setClientLookupMessage(
          "No se encontro un cliente registrado con esta cedula juridica.",
        );
        return;
      }

      const { allBranches: branches = [], ...clientFields } = existingClient;

      setQuotationClientForm((currentForm) => ({
        ...currentForm,
        ...clientFields,
        notes: currentForm.notes,
        earlyDelivery: currentForm.earlyDelivery,
      }));

      setClientBranches(branches);

      if (branches.length > 0) {
        setShowNewBranchForm(false);
      }

      setClientLookupMessage(
        "Cliente existente importado al formulario de cotizacion.",
      );
    } catch (lookupError) {
      console.error("Client lookup error:", lookupError);
      setClientLookupMessage(
        lookupError?.message ||
          "No fue posible verificar la cedula juridica.",
      );
    } finally {
      setClientLookupLoading(false);
    }
  };

  const handleSelectBranch = (branch) => {
    setShowNewBranchForm(false);
    setQuotationClientForm((currentForm) => ({
      ...currentForm,
      branchId: branch.branch_id,
      branchProvince: branch.province,
      branchDistrict: branch.district,
      branchAddress: branch.address,
      branchPhone: branch.branchPhone || "",
      representativeId: branch.representative?.representative_id || "",
      representativeName: branch.representative?.name || "",
      representativeEmail: branch.representative?.email || "",
      representativeUserId: branch.representative?.user_id || null,
    }));
  };

  const handleSelectNewBranch = () => {
    setShowNewBranchForm(true);
    setQuotationClientForm((currentForm) => ({
      ...currentForm,
      branchId: "",
      branchProvince: "",
      branchDistrict: "",
      branchAddress: "",
      branchPhone: "",
      representativeId: "",
      representativeName: "",
      representativeEmail: "",
      representativeUserId: null,
    }));
  };

  const handleSaveCartQuotation = async (status) => {
    try {
      setQuotationSubmitting(true);
      setQuotationError("");
      setQuotationSuccess("");
      setAccessError("");

      let clientForm = quotationClientForm;

      if (clientForm.legalId.trim() && !clientForm.businessId) {
        const existingClient = await getQuotationClientByLegalId(
          clientForm.legalId,
        );

        if (existingClient) {
          clientForm = {
            ...clientForm,
            ...existingClient,
            notes: clientForm.notes,
            earlyDelivery: clientForm.earlyDelivery,
          };
          setQuotationClientForm(clientForm);
          setClientLookupMessage(
            "Cliente existente importado al formulario de cotizacion.",
          );
        }
      }

      const quotation = await createBusinessQuotation({
        client: clientForm,
        items: cartItems,
        status,
      });

      const baseSuccessMessage = quotation.earlyDelivery
        ? `Cotizacion guardada: ${quotation.quotationNumber}. Entrega anticipada registrada el ${quotation.earlyDeliveryDate}.`
        : `Cotizacion guardada: ${quotation.quotationNumber}`;

      setQuotationSuccess(
        quotation.representativeAccessMessage
          ? `${baseSuccessMessage} ${quotation.representativeAccessMessage}`
          : baseSuccessMessage,
      );

      if (quotation.accessError) {
        setAccessError(quotation.accessError);
      }

      setCartItems([]);
      setQuotationClientForm(EMPTY_QUOTATION_CLIENT_FORM);
      setClientLookupMessage("");
      setClientBranches([]);
      setShowNewBranchForm(false);
    } catch (error) {
      console.error("Cart quotation error:", error);
      setQuotationError(
        error?.message ||
          "No fue posible guardar la cotizacion del carrito.",
      );
    } finally {
      setQuotationSubmitting(false);
    }
  };

  const handleQuoteCart = () => {
    handleSaveCartQuotation("pending");
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
                  Catálogo actualizado desde Supabase.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {lastUpdated
                    ? `Última actualización: ${lastUpdated.toLocaleTimeString(
                        "es-CR",
                        {
                          timeZone: "America/Costa_Rica",
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

            <section className="hidden">
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

                          {item.sizeName && (
                            <span className="rounded-lg border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              {item.sizeName}
                            </span>
                          )}
                        </div>

                          {item.hasSublimation && (
                            <span className="rounded-lg border border-[#D7A91D]/25 bg-[#D7A91D]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D7A91D]">
                              Sublimación
                            </span>
                          )}

                          {item.hasEmbroidery && (
                            <span className="rounded-lg border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Bordado
                            </span>
                          )}

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

                  <div className="rounded-xl border border-[#35547E] bg-[#091A31] p-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#D7A91D]">
                        Datos del cliente
                      </h3>
                      <p className="text-sm text-slate-400">
                        Registra la empresa cliente, su sucursal y el representante para guardar la cotizacion.
                      </p>
                    </div>

                    {quotationError && (
                      <div className="mt-4 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                        {quotationError}
                      </div>
                    )}

                    {quotationSuccess && (
                      <div className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        {quotationSuccess}
                      </div>
                    )}

                    {accessError && (
                      <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {accessError}
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Empresa del grupo
                        </span>
                        <select
                          value={quotationClientForm.companyId}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "companyId",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition focus:border-[#D7A91D]"
                        >
                          <option value="">Seleccionar empresa</option>
                          {quotationCompanies.map((company) => (
                            <option
                              key={company.company_id}
                              value={company.company_id}
                            >
                              {company.commercial_name ||
                                company.company_name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Cedula juridica
                        </span>
                        <input
                          value={quotationClientForm.legalId}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "legalId",
                              event.target.value,
                            )
                          }
                          onBlur={handleLookupClientByLegalId}
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. 3-101-000000"
                        />
                        {(clientLookupLoading || clientLookupMessage) && (
                          <span className="mt-2 block text-xs text-[#9BB3D3]">
                            {clientLookupLoading
                              ? "Verificando cedula juridica..."
                              : clientLookupMessage}
                          </span>
                        )}
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Codigo actividad
                        </span>
                        <input
                          value={quotationClientForm.activityCode}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "activityCode",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Opcional"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Razon social
                        </span>
                        <input
                          value={quotationClientForm.legalName}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "legalName",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. Cliente S.A."
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Nombre comercial
                        </span>
                        <input
                          value={quotationClientForm.businessName}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "businessName",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. Tienda Central"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Correo empresa
                        </span>
                        <input
                          type="email"
                          value={quotationClientForm.businessEmail}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "businessEmail",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="facturacion@cliente.com"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Telefono empresa
                        </span>
                        <input
                          value={quotationClientForm.businessPhone}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "businessPhone",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. 2222-2222"
                        />
                      </label>

                      <div className="md:col-span-2 mt-2 border-t border-[#29466F] pt-4">
                        <p className="text-sm font-extrabold text-white">Sucursal</p>
                        {clientBranches.length > 0 && (
                          <p className="mt-1 text-xs text-slate-400">
                            Selecciona una sucursal registrada o agrega una nueva.
                          </p>
                        )}
                      </div>

                      {clientBranches.length > 0 && (
                        <div className="md:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {clientBranches.map((branch) => {
                            const isSelected =
                              quotationClientForm.branchId === branch.branch_id;
                            return (
                              <label
                                key={branch.branch_id}
                                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                                  isSelected
                                    ? "border-[#D7A91D] bg-[#D7A91D]/10"
                                    : "border-[#35547E] bg-[#102441] hover:border-[#5a8abf]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="branch-select-panel"
                                  value={branch.branch_id}
                                  checked={isSelected}
                                  onChange={() => handleSelectBranch(branch)}
                                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#D7A91D]"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    {[branch.province, branch.district]
                                      .filter(Boolean)
                                      .join(", ") || "Sucursal"}
                                  </p>
                                  {branch.address && (
                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                      {branch.address}
                                    </p>
                                  )}
                                  {branch.branchPhone && (
                                    <p className="mt-0.5 text-xs text-[#9BB3D3]">
                                      {branch.branchPhone}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                          <label
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 transition ${
                              showNewBranchForm
                                ? "border-[#D7A91D] bg-[#D7A91D]/10"
                                : "border-[#35547E] hover:border-[#5a8abf]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="branch-select-panel"
                              value="new"
                              checked={showNewBranchForm}
                              onChange={handleSelectNewBranch}
                              className="sr-only"
                            />
                            <Plus className="h-5 w-5 text-[#D7A91D]" />
                            <span className="text-sm font-semibold text-[#9BB3D3]">
                              Nueva sucursal
                            </span>
                          </label>
                        </div>
                      )}

                      {(clientBranches.length === 0 || showNewBranchForm) && (
                        <>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Provincia
                            </span>
                            <input
                              value={quotationClientForm.branchProvince}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchProvince",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Ej. San Jose"
                            />
                          </label>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Distrito
                            </span>
                            <input
                              value={quotationClientForm.branchDistrict}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchDistrict",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Ej. Catedral"
                            />
                          </label>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Telefono sucursal
                            </span>
                            <input
                              value={quotationClientForm.branchPhone}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchPhone",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Ej. 2222-3333"
                            />
                          </label>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Direccion
                            </span>
                            <input
                              value={quotationClientForm.branchAddress}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchAddress",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Direccion exacta"
                            />
                          </label>
                        </>
                      )}

                      <div className="md:col-span-2 mt-2 border-t border-[#29466F] pt-4">
                        <p className="text-sm font-extrabold text-white">
                          Representante
                        </p>
                      </div>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Nombre
                        </span>
                        <input
                          value={quotationClientForm.representativeName}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "representativeName",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Nombre del contacto"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Correo representante
                        </span>
                        <input
                          type="email"
                          value={quotationClientForm.representativeEmail}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "representativeEmail",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="contacto@cliente.com"
                        />
                      </label>

                      <label className="md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Notas
                        </span>
                        <textarea
                          value={quotationClientForm.notes}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "notes",
                              event.target.value,
                            )
                          }
                          rows={3}
                          className="mt-2 w-full resize-none rounded-xl border border-[#35547E] bg-[#102441] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Observaciones para la cotizacion"
                        />
                      </label>

                      <label className="md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Metodo de pago
                        </span>
                        <select
                          value={quotationClientForm.methodId}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "methodId",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition focus:border-[#D7A91D]"
                        >
                          <option value="">Seleccionar metodo de pago</option>
                          {paymentMethods.map((method) => (
                            <option
                              key={method.method_id}
                              value={method.method_id}
                            >
                              {method.method_name}
                            </option>
                          ))}
                        </select>
                        {selectedPaymentMethodDescription ? (
                          <p className="mt-2 rounded-xl border border-[#35547E] bg-[#091A31]/60 px-3 py-2 text-xs leading-5 text-slate-400">
                            {selectedPaymentMethodDescription}
                          </p>
                        ) : null}
                      </label>

                      <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-[#35547E] bg-[#102441]/70 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={quotationClientForm.earlyDelivery}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "earlyDelivery",
                              event.target.checked,
                            )
                          }
                          className="mt-1 h-4 w-4 rounded border-[#35547E] bg-[#091A31] accent-[#D7A91D]"
                        />

                        <span>
                          <span className="block text-sm font-bold text-white">
                            Entrega anticipada
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-400">
                            Si se marca, la cotizacion guardara como fecha de entrega anticipada la fecha de creacion.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-[#35547E] bg-[#091A31]/60 px-4 py-3 text-sm text-slate-500">
                  Selecciona cantidades en las tarjetas del catálogo para preparar el pedido.
                </p>
              )}
            </section>

            {currentProducts.length > 0 ? (
              <>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

                  <div className="flex flex-wrap items-center gap-3">
                    {hasActiveFilters && (
                      <p className="text-xs font-medium text-[#86A4CE]">
                        Resultados filtrados
                      </p>
                    )}

                    {isTextileProductsCatalog && canPurchase && (
                      <button
                        type="button"
                        onClick={handleOpenCart}
                        className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#45648D] bg-[#132F58] px-4 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]"
                        aria-label="Abrir carrito de compra"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Carrito
                        {cartItemsCount > 0 && (
                          <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#D7A91D] px-1.5 text-xs font-extrabold text-[#071426]">
                            {cartItemsCount}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <CatalogGrid
                  products={currentProducts}
                  onOpenProductDetails={
                    handleOpenProductDetails
                  }
                  onAddToCart={handleAddToCart}
                  canPurchase={canPurchase}
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

      {cartOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#020817]/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Carrito de compra"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseCart();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#35547E] bg-[#102441] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#29466F] px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#35547E] bg-[#091A31] text-[#D7A91D]">
                  <ShoppingCart className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-white">
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

              <button
                type="button"
                onClick={handleCloseCart}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#45648D] bg-[#132F58] text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] hover:text-[#E9BC2D]"
                aria-label="Cerrar carrito de compra"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {cartItems.length > 0 ? (
                <div className="space-y-3">
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

                          {item.sizeName && (
                            <span className="rounded-lg border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              {item.sizeName}
                            </span>
                          )}
                        </div>

                          {item.hasSublimation && (
                            <span className="rounded-lg border border-[#D7A91D]/25 bg-[#D7A91D]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#D7A91D]">
                              Sublimación
                            </span>
                          )}

                          {item.hasEmbroidery && (
                            <span className="rounded-lg border border-[#5a8abf]/30 bg-[#132F58] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Bordado
                            </span>
                          )}

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

                  <div className="rounded-xl border border-[#35547E] bg-[#091A31] p-4">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#D7A91D]">
                        Datos del cliente
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Empresa cliente, sucursal y representante para guardar la cotizacion.
                      </p>
                    </div>

                    {quotationError && (
                      <div className="mt-4 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                        {quotationError}
                      </div>
                    )}

                    {quotationSuccess && (
                      <div className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        {quotationSuccess}
                      </div>
                    )}

                    {accessError && (
                      <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        {accessError}
                      </div>
                    )}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Empresa del grupo
                        </span>
                        <select
                          value={quotationClientForm.companyId}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "companyId",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition focus:border-[#D7A91D]"
                        >
                          <option value="">Seleccionar empresa</option>
                          {quotationCompanies.map((company) => (
                            <option
                              key={company.company_id}
                              value={company.company_id}
                            >
                              {company.commercial_name ||
                                company.company_name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Cedula juridica
                        </span>
                        <input
                          value={quotationClientForm.legalId}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "legalId",
                              event.target.value,
                            )
                          }
                          onBlur={handleLookupClientByLegalId}
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. 3-101-000000"
                        />
                        {(clientLookupLoading || clientLookupMessage) && (
                          <span className="mt-2 block text-xs text-[#9BB3D3]">
                            {clientLookupLoading
                              ? "Verificando cedula juridica..."
                              : clientLookupMessage}
                          </span>
                        )}
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Codigo actividad
                        </span>
                        <input
                          value={quotationClientForm.activityCode}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "activityCode",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Opcional"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Razon social
                        </span>
                        <input
                          value={quotationClientForm.legalName}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "legalName",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. Cliente S.A."
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Nombre comercial
                        </span>
                        <input
                          value={quotationClientForm.businessName}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "businessName",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. Tienda Central"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Correo empresa
                        </span>
                        <input
                          type="email"
                          value={quotationClientForm.businessEmail}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "businessEmail",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="facturacion@cliente.com"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Telefono empresa
                        </span>
                        <input
                          value={quotationClientForm.businessPhone}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "businessPhone",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Ej. 2222-2222"
                        />
                      </label>

                      <div className="md:col-span-2 border-t border-[#29466F] pt-4">
                        <p className="text-sm font-extrabold text-white">Sucursal</p>
                        {clientBranches.length > 0 && (
                          <p className="mt-1 text-xs text-slate-400">
                            Selecciona una sucursal registrada o agrega una nueva.
                          </p>
                        )}
                      </div>

                      {clientBranches.length > 0 && (
                        <div className="md:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {clientBranches.map((branch) => {
                            const isSelected =
                              quotationClientForm.branchId === branch.branch_id;
                            return (
                              <label
                                key={branch.branch_id}
                                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                                  isSelected
                                    ? "border-[#D7A91D] bg-[#D7A91D]/10"
                                    : "border-[#35547E] bg-[#102441] hover:border-[#5a8abf]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="branch-select-modal"
                                  value={branch.branch_id}
                                  checked={isSelected}
                                  onChange={() => handleSelectBranch(branch)}
                                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#D7A91D]"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    {[branch.province, branch.district]
                                      .filter(Boolean)
                                      .join(", ") || "Sucursal"}
                                  </p>
                                  {branch.address && (
                                    <p className="mt-0.5 truncate text-xs text-slate-400">
                                      {branch.address}
                                    </p>
                                  )}
                                  {branch.branchPhone && (
                                    <p className="mt-0.5 text-xs text-[#9BB3D3]">
                                      {branch.branchPhone}
                                    </p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                          <label
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 transition ${
                              showNewBranchForm
                                ? "border-[#D7A91D] bg-[#D7A91D]/10"
                                : "border-[#35547E] hover:border-[#5a8abf]"
                            }`}
                          >
                            <input
                              type="radio"
                              name="branch-select-modal"
                              value="new"
                              checked={showNewBranchForm}
                              onChange={handleSelectNewBranch}
                              className="sr-only"
                            />
                            <Plus className="h-5 w-5 text-[#D7A91D]" />
                            <span className="text-sm font-semibold text-[#9BB3D3]">
                              Nueva sucursal
                            </span>
                          </label>
                        </div>
                      )}

                      {(clientBranches.length === 0 || showNewBranchForm) && (
                        <>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Provincia
                            </span>
                            <input
                              value={quotationClientForm.branchProvince}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchProvince",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Ej. San Jose"
                            />
                          </label>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Distrito
                            </span>
                            <input
                              value={quotationClientForm.branchDistrict}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchDistrict",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Ej. Catedral"
                            />
                          </label>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Direccion
                            </span>
                            <input
                              value={quotationClientForm.branchAddress}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchAddress",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Direccion exacta"
                            />
                          </label>
                          <label>
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                              Telefono sucursal
                            </span>
                            <input
                              value={quotationClientForm.branchPhone}
                              onChange={(event) =>
                                handleQuotationClientFormChange(
                                  "branchPhone",
                                  event.target.value,
                                )
                              }
                              className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                              placeholder="Ej. 2222-3333"
                            />
                          </label>
                        </>
                      )}

                      <div className="md:col-span-2 border-t border-[#29466F] pt-4 text-sm font-extrabold text-white">
                        Representante
                      </div>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Nombre
                        </span>
                        <input
                          value={quotationClientForm.representativeName}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "representativeName",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Nombre del contacto"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Correo representante
                        </span>
                        <input
                          type="email"
                          value={quotationClientForm.representativeEmail}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "representativeEmail",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="contacto@cliente.com"
                        />
                      </label>

                      <label className="md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Notas
                        </span>
                        <textarea
                          value={quotationClientForm.notes}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "notes",
                              event.target.value,
                            )
                          }
                          rows={3}
                          className="mt-2 w-full resize-none rounded-xl border border-[#35547E] bg-[#102441] px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]"
                          placeholder="Observaciones para la cotizacion"
                        />
                      </label>

                      <label className="md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
                          Metodo de pago
                        </span>
                        <select
                          value={quotationClientForm.methodId}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "methodId",
                              event.target.value,
                            )
                          }
                          className="mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition focus:border-[#D7A91D]"
                        >
                          <option value="">Seleccionar metodo de pago</option>
                          {paymentMethods.map((method) => (
                            <option
                              key={method.method_id}
                              value={method.method_id}
                            >
                              {method.method_name}
                            </option>
                          ))}
                        </select>
                        {selectedPaymentMethodDescription ? (
                          <p className="mt-2 rounded-xl border border-[#35547E] bg-[#091A31]/60 px-3 py-2 text-xs leading-5 text-slate-400">
                            {selectedPaymentMethodDescription}
                          </p>
                        ) : null}
                      </label>

                      <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-[#35547E] bg-[#102441]/70 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={quotationClientForm.earlyDelivery}
                          onChange={(event) =>
                            handleQuotationClientFormChange(
                              "earlyDelivery",
                              event.target.checked,
                            )
                          }
                          className="mt-1 h-4 w-4 rounded border-[#35547E] bg-[#091A31] accent-[#D7A91D]"
                        />

                        <span>
                          <span className="block text-sm font-bold text-white">
                            Entrega anticipada
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-400">
                            Si se marca, la cotizacion guardara como fecha de entrega anticipada la fecha de creacion.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#35547E] bg-[#091A31]/60 px-6 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#35547E] bg-[#102441] text-[#D7A91D]">
                    <ShoppingCart className="h-6 w-6" />
                  </div>

                  <p className="mt-4 text-sm font-bold text-white">
                    El carrito está vacío
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Selecciona cantidades en las tarjetas del catálogo para preparar una cotización o pedido.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#29466F] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleClearCart}
                disabled={cartItems.length === 0 || quotationSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/30 px-4 py-2.5 text-sm font-bold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Vaciar carrito
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleQuoteCart}
                  disabled={cartItems.length === 0 || quotationSubmitting}
                  className="rounded-xl border border-[#45648D] bg-[#132F58] px-5 py-2.5 text-sm font-bold text-white transition hover:border-[#D7A91D] hover:bg-[#1B3E6B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {quotationSubmitting ? "Guardando..." : "Cotizar"}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

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
