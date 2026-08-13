import { supabase } from "../services/primarySupabaseClient.js";

export const CATALOG_TYPES = {
  FABRICS: "fabrics",
  TEXTILE_PRODUCTS: "textile_products",
};

export function createCatalogFilterId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function groupRowsByKey(rows = [], keyName) {
  return rows.reduce((groupedRows, row) => {
    const key = row?.[keyName];

    if (!key) {
      return groupedRows;
    }

    if (!groupedRows[key]) {
      groupedRows[key] = [];
    }

    groupedRows[key].push(row);

    return groupedRows;
  }, {});
}

function indexRowsByKey(rows = [], keyName) {
  return rows.reduce((indexedRows, row) => {
    const key = row?.[keyName];

    if (key) {
      indexedRows[key] = row;
    }

    return indexedRows;
  }, {});
}

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function getFileUrl(file) {
  return (
    file?.public_url ||
    file?.url ||
    file?.file_url ||
    null
  );
}

function normalizeText(value) {
  const rawValue = String(value || "");

  try {
    return decodeURIComponent(rawValue).toLowerCase();
  } catch {
    return rawValue.toLowerCase();
  }
}

function getFileSearchText(file) {
  return normalizeText(
    [
      file?.file_type,
      file?.type,
      file?.file_name,
      file?.file_path,
      file?.public_url,
      file?.url,
      file?.file_url,
      file?.mime_type,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function isImageFile(file) {
  const mimeType = normalizeText(file?.mime_type);
  const fileName = normalizeText(file?.file_name);
  const filePath = normalizeText(file?.file_path);
  const fileUrl = normalizeText(getFileUrl(file));

  return (
    mimeType.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(fileName) ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(filePath) ||
    /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/.test(fileUrl)
  );
}

function isTechnicalSheetFile(file) {
  const fileText = getFileSearchText(file);

  return (
    fileText.includes("ficha") ||
    fileText.includes("technical") ||
    fileText.includes("datasheet") ||
    fileText.includes("especificacion") ||
    fileText.includes("specification") ||
    /(^|[/_\-\s])fichas?([/_\-\s]|$)/i.test(fileText)
  );
}

function isTechnicalSheetUrl(url) {
  const normalizedUrl = normalizeText(url);

  return (
    normalizedUrl.includes("ficha") ||
    normalizedUrl.includes("technical") ||
    normalizedUrl.includes("datasheet") ||
    normalizedUrl.includes("especificacion") ||
    normalizedUrl.includes("specification")
  );
}

function getCatalogImagePriority(file) {
  const fileText = getFileSearchText(file);

  let priority = 0;

  if (fileText.includes("catalogos")) {
    priority += 100;
  }

  if (fileText.includes("catalogo")) {
    priority += 80;
  }

  if (fileText.includes("cover")) {
    priority += 60;
  }

  if (fileText.includes("principal")) {
    priority += 50;
  }

  if (fileText.includes("main")) {
    priority += 50;
  }

  if (fileText.includes("product")) {
    priority += 30;
  }

  if (
    fileText.includes("image") ||
    fileText.includes("imagen")
  ) {
    priority += 20;
  }

  return priority;
}

function getCoverImageUrl(item, files = []) {
  const directImageUrl =
    item?.image_url ||
    item?.main_image_url ||
    item?.cover_image_url ||
    null;

  if (
    directImageUrl &&
    !isTechnicalSheetUrl(directImageUrl)
  ) {
    return directImageUrl;
  }

  const catalogImages = files
    .filter((file) => {
      return isImageFile(file) && !isTechnicalSheetFile(file);
    })
    .sort((firstFile, secondFile) => {
      return (
        getCatalogImagePriority(secondFile) -
        getCatalogImagePriority(firstFile)
      );
    });

  return getFileUrl(catalogImages[0]) || null;
}

function getTechnicalSheetFile(files = []) {
  const technicalSheetImages = files.filter((file) => {
    return isTechnicalSheetFile(file) && isImageFile(file);
  });

  if (technicalSheetImages.length > 0) {
    return technicalSheetImages[0];
  }

  return files.find((file) => isTechnicalSheetFile(file)) || null;
}

function normalizePrice(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? null : numericValue;
}

function normalizeFiles(files = []) {
  return files.map((file) => ({
    ...file,
    public_url: getFileUrl(file),
  }));
}

function createFabricCatalogProduct({
  fabric,
  colorsByFabric,
  materialsByFabric,
  featuresByFabric,
  managementsByFabric,
  filesByFabric,
}) {
  const fabricId = fabric.id;

  const fabricColors = colorsByFabric[fabricId] || [];
  const fabricMaterials = materialsByFabric[fabricId] || [];
  const fabricFeatures = featuresByFabric[fabricId] || [];
  const fabricManagements = managementsByFabric[fabricId] || [];
  const fabricFiles = filesByFabric[fabricId] || [];

  const categoryName = String(fabric.type || "").trim();
  const productTypeName = String(fabric.weave_type || "").trim();

  const mainImageUrl = getCoverImageUrl(fabric, fabricFiles);
  const technicalSheetFile = getTechnicalSheetFile(fabricFiles);

  return {
    catalog_type: CATALOG_TYPES.FABRICS,

    product_id: fabric.id,
    id: fabric.id,

    sku: fabric.fabric_code || "Sin código",
    product_name: fabric.fabric_name || "Tela sin nombre",
    description: fabric.description || "",
    price: normalizePrice(fabric.price),

    weight: fabric.weight || "",
    width: fabric.width || "",
    provider: fabric.provider || "",
    created_at: fabric.created_at || null,

    image_url: mainImageUrl,
    main_image_url: mainImageUrl,
    cover_image_url: mainImageUrl,

    technical_sheet_url: getFileUrl(technicalSheetFile),
    technical_sheet_file: technicalSheetFile,

    category: categoryName
      ? {
          category_id: createCatalogFilterId(categoryName),
          category_name: categoryName,
        }
      : null,

    product_type: productTypeName
      ? {
          type_id: createCatalogFilterId(productTypeName),
          product_type: productTypeName,
        }
      : null,

    collection: null,
    available_sizes: [],
    measurements: [],

    colors: fabricColors.map((color) => ({
      id: color.id,
      fabric_id: color.fabric_id,
      color: color.color || "Color disponible",
      hex_color: color.hex_color || "",
      quantity: color.quantity ?? null,
    })),

    compositions: fabricMaterials.map((material) => ({
      id: material.id,
      fabric_id: material.fabric_id,
      material_name: material.material || "",
      percentage: material.percentage ?? null,
    })),

    features: fabricFeatures.map((feature) => ({
      id: feature.id,
      fabric_id: feature.fabric_id,
      feature: feature.feature || "",
    })),

    managements: fabricManagements.map((management) => ({
      id: management.id,
      fabric_id: management.fabric_id,
      management: management.management || "",
    })),

    files: normalizeFiles(fabricFiles),
    raw_fabric: fabric,
  };
}

function createTextileProductCatalogItem({
  product,
  categoriesById,
  typesById,
  filesByProduct,
  variantsByProduct,
  sizesById,
  dimensionsById,
}) {
  const productFiles = filesByProduct[product.product_id] || [];
  const productVariants = (variantsByProduct[product.product_id] || []).filter(
    (variant) => variant.is_active,
  );
  const primaryVariant = productVariants.find((variant) => variant.is_default) ||
    productVariants.find((variant) => variant.size_id) ||
    productVariants[0];
  const variants = productVariants.map((variant) => {
    const dimension = dimensionsById[variant.dimension_id] || null;
    const measurements = dimension ? [
      { id: `${variant.variant_id}-height`, variant_id: variant.variant_id, size_id: variant.size_id, size_name: sizesById[variant.size_id]?.size_name || "Talla no definida", dimension_name: "Alto", measurement_value: dimension.heigth, unit: "cm" },
      { id: `${variant.variant_id}-width`, variant_id: variant.variant_id, size_id: variant.size_id, size_name: sizesById[variant.size_id]?.size_name || "Talla no definida", dimension_name: "Ancho", measurement_value: dimension.width, unit: "cm" },
      { id: `${variant.variant_id}-length`, variant_id: variant.variant_id, size_id: variant.size_id, size_name: sizesById[variant.size_id]?.size_name || "Talla no definida", dimension_name: "Largo", measurement_value: dimension.lenght, unit: "cm" },
    ] : [];
    return {
      ...variant,
      tax_rate: variant.iva,
      stock: variant.stock_quantity,
      available_quantity: Number(variant.stock_quantity || 0) - Number(variant.reserved_quantity || 0),
      inventory_tracking_enabled: true,
      size: sizesById[variant.size_id] || null,
      dimension,
      measurements,
      files: [],
    };
  });
  const primaryCatalogVariant = variants.find((variant) => variant.variant_id === primaryVariant?.variant_id) || null;
  const productMeasurements = variants.flatMap((variant) => variant.measurements);

  const category = categoriesById[product.category_id];
  const productType = typesById[product.type_id];

  const mainImageUrl = getCoverImageUrl(product, productFiles);
  const technicalSheetFile = getTechnicalSheetFile(productFiles);

  const features = [
    product.embroidery
      ? {
          id: `${product.product_id}-embroidery`,
          feature: "Apto para bordado",
        }
      : null,
    product.sublimation
      ? {
          id: `${product.product_id}-sublimation`,
          feature: "Apto para sublimación",
        }
      : null,
  ].filter(Boolean);

  return {
    catalog_type: CATALOG_TYPES.TEXTILE_PRODUCTS,

    product_id: product.product_id,
    id: product.product_id,

    sku: primaryVariant?.sku || "Sin código",
    product_name: product.product_name || "Producto sin nombre",
    description: product.description || "",
    price: normalizePrice(primaryVariant?.price),
    is_available: Boolean(primaryVariant),
    variant_id: primaryVariant?.variant_id || null,
    gtin: primaryVariant?.gtin || null,
    stock: primaryVariant?.stock ?? 0,
    minimum_stock: primaryVariant?.minimum_stock ?? 0,
    inventory_tracking_enabled: true,
    has_incomplete_legacy_variant: productVariants.some((variant) => !variant.size_id),

    size: primaryCatalogVariant?.size?.size_name || "",
    length: primaryCatalogVariant?.dimension?.lenght || "",
    width: primaryCatalogVariant?.dimension?.width || "",
    height: primaryCatalogVariant?.dimension?.heigth || "",
    unit: "cm",
    iva_percentage: normalizePrice(primaryVariant?.tax_rate ?? product.iva),
    iva_amount:
      (normalizePrice(primaryVariant?.price) *
        normalizePrice(primaryVariant?.tax_rate ?? product.iva)) / 100,
    sublimation_price: normalizePrice(product.sublimation_price),
    embroidery_price: normalizePrice(product.embroidery_price),
    embroidery: Boolean(product.embroidery),
    sublimation: Boolean(product.sublimation),
    is_active: Boolean(product.is_active),
    created_at: product.created_at || null,

    image_url: mainImageUrl,
    main_image_url: mainImageUrl,
    cover_image_url: mainImageUrl,

    technical_sheet_url: getFileUrl(technicalSheetFile),
    technical_sheet_file: technicalSheetFile,

    category: category
      ? {
          category_id: category.category_id,
          category_name: category.category_name,
        }
      : null,

    product_type: productType
      ? {
          type_id: productType.type_id,
          product_type: productType.product_type,
        }
      : null,

    collection: null,

    available_sizes: variants
      .filter((variant) => variant.is_active && variant.size)
      .map((variant) => ({
        ...variant.size,
        variant_id: variant.variant_id,
        sku: variant.sku,
        gtin: variant.gtin,
        price: normalizePrice(variant.price),
        tax_rate: normalizePrice(variant.tax_rate),
        stock: variant.stock,
        minimum_stock: variant.minimum_stock,
        inventory_tracking_enabled: true,
      })),

    measurements: productMeasurements,
    variants,
    colors: [],
    compositions: [],
    features,
    managements: [],
    files: normalizeFiles(productFiles),

    raw_product: product,
  };
}

function ensureNoErrors(responses = [], message) {
  const errorResponse = responses.find(
    (response) => response?.error,
  );

  if (errorResponse?.error) {
    throw new Error(
      `${message}: ${errorResponse.error.message}`,
    );
  }
}

export async function getFabricCatalogProducts() {
  const { data: fabrics, error: fabricsError } = await supabase
    .from("fabrics")
    .select("*")
    .order("created_at", { ascending: false });

  if (fabricsError) {
    throw new Error(
      `No fue posible cargar las telas: ${fabricsError.message}`,
    );
  }

  if (!fabrics || fabrics.length === 0) {
    return [];
  }

  const fabricIds = fabrics.map((fabric) => fabric.id);

  const [
    colorsResponse,
    materialsResponse,
    featuresResponse,
    managementsResponse,
    filesResponse,
  ] = await Promise.all([
    supabase
      .from("color_variants")
      .select("*")
      .in("fabric_id", fabricIds),

    supabase
      .from("materials")
      .select("*")
      .in("fabric_id", fabricIds),

    supabase
      .from("features")
      .select("*")
      .in("fabric_id", fabricIds),

    supabase
      .from("managements")
      .select("*")
      .in("fabric_id", fabricIds),

    supabase
      .from("fabric_files")
      .select("*")
      .in("fabric_id", fabricIds)
      .order("created_at", { ascending: true }),
  ]);

  ensureNoErrors(
    [
      colorsResponse,
      materialsResponse,
      featuresResponse,
      managementsResponse,
      filesResponse,
    ],
    "No fue posible cargar los datos relacionados de las telas",
  );

  const colorsByFabric = groupRowsByKey(
    colorsResponse.data || [],
    "fabric_id",
  );

  const materialsByFabric = groupRowsByKey(
    materialsResponse.data || [],
    "fabric_id",
  );

  const featuresByFabric = groupRowsByKey(
    featuresResponse.data || [],
    "fabric_id",
  );

  const managementsByFabric = groupRowsByKey(
    managementsResponse.data || [],
    "fabric_id",
  );

  const filesByFabric = groupRowsByKey(
    filesResponse.data || [],
    "fabric_id",
  );

  return fabrics.map((fabric) =>
    createFabricCatalogProduct({
      fabric,
      colorsByFabric,
      materialsByFabric,
      featuresByFabric,
      managementsByFabric,
      filesByFabric,
    }),
  );
}

export async function getVariantAvailability(variantIds = []) {
  const ids = [...new Set(variantIds.filter(Boolean))];
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("textiles_inventory")
    .select("variant_id, sku, stock:stock_quantity, reserved_quantity, is_active")
    .in("variant_id", ids);
  if (error) throw new Error(`No fue posible revalidar inventario: ${error.message}`);
  return data || [];
}

export async function getTextileProductCatalogProducts() {
  const {
    data: textileProducts,
    error: textileProductsError,
  } = await supabase
    .from("textile_products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (textileProductsError) {
    throw new Error(
      `No fue posible cargar los productos textiles: ${textileProductsError.message}`,
    );
  }

  if (!textileProducts || textileProducts.length === 0) {
    return [];
  }

  const productIds = textileProducts.map(
    (product) => product.product_id,
  );

  const categoryIds = uniqueValues(
    textileProducts.map((product) => product.category_id),
  );

  const typeIds = uniqueValues(
    textileProducts.map((product) => product.type_id),
  );

  const variantsResponse = await supabase
    .from("textiles_inventory")
    .select("*")
    .in("product_id", productIds)
    .order("created_at", { ascending: true });

  ensureNoErrors([variantsResponse], "No fue posible cargar las variantes");

  const variantRows = variantsResponse.data || [];

  const [
    filesResponse,
    categoriesResponse,
    typesResponse,
  ] = await Promise.all([
    supabase
      .from("textile_product_files")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: true }),

    categoryIds.length > 0
      ? supabase
          .from("categories")
          .select("*")
          .in("category_id", categoryIds)
      : Promise.resolve({ data: [], error: null }),

    typeIds.length > 0
      ? supabase
          .from("product_types")
          .select("*")
          .in("type_id", typeIds)
      : Promise.resolve({ data: [], error: null }),

  ]);

  ensureNoErrors(
    [
      filesResponse,
      categoriesResponse,
      typesResponse,
    ],
    "No fue posible cargar los datos relacionados de los productos",
  );

  const sizeIds = uniqueValues(
    variantRows.map((variant) => variant.size_id),
  );

  const dimensionIds = uniqueValues(
    variantRows.map((variant) => variant.dimension_id),
  );

  const [sizesResponse, dimensionsResponse] = await Promise.all([
    sizeIds.length > 0
      ? supabase
          .from("sizes")
          .select("*")
          .in("size_id", sizeIds)
          .order("display_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),

    dimensionIds.length > 0
      ? supabase
          .from("dimensions")
          .select("*")
          .in("dimension_id", dimensionIds)
          .order("display_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  ensureNoErrors(
    [sizesResponse, dimensionsResponse],
    "No fue posible cargar las tallas y medidas de los productos",
  );

  const filesByProduct = groupRowsByKey(
    filesResponse.data || [],
    "product_id",
  );

  const variantsByProduct = groupRowsByKey(variantRows, "product_id");
  const categoriesById = indexRowsByKey(
    categoriesResponse.data || [],
    "category_id",
  );

  const typesById = indexRowsByKey(
    typesResponse.data || [],
    "type_id",
  );

  const sizesById = indexRowsByKey(
    sizesResponse.data || [],
    "size_id",
  );

  const dimensionsById = indexRowsByKey(
    dimensionsResponse.data || [],
    "dimension_id",
  );

  return textileProducts.map((product) =>
    createTextileProductCatalogItem({
      product,
      categoriesById,
      typesById,
      filesByProduct,
      variantsByProduct,
      sizesById,
      dimensionsById,
    }),
  );
}

export async function getCatalogProducts(
  catalogType = CATALOG_TYPES.FABRICS,
) {
  if (catalogType === CATALOG_TYPES.TEXTILE_PRODUCTS) {
    return getTextileProductCatalogProducts();
  }

  return getFabricCatalogProducts();
}
