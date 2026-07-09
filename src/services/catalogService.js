import { supabase } from "../services/primarySupabaseClient.js";

export const CATALOG_TYPES = {
  FABRICS: "fabrics",
  TEXTILE_PRODUCTS: "textile_products",
};

const TEXTILE_PRODUCT_MEASUREMENTS_TABLE =
  "textile_product_measurements";

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

function getAvailableSizes(product, measurements = []) {
  const uniqueSizes = new Map();

  if (product?.size) {
    String(product.size)
      .split(/[;,/|]/)
      .map((sizeName) => sizeName.trim())
      .filter(Boolean)
      .forEach((sizeName) => {
        const sizeId = `manual-${createCatalogFilterId(sizeName)}`;

        uniqueSizes.set(sizeId, {
          size_id: sizeId,
          size_name: sizeName,
        });
      });
  }

  measurements.forEach((measurement) => {
    if (!measurement?.size_name) {
      return;
    }

    const sizeId =
      measurement.size_id ||
      `manual-${createCatalogFilterId(measurement.size_name)}`;

    if (!uniqueSizes.has(sizeId)) {
      uniqueSizes.set(sizeId, {
        size_id: sizeId,
        size_name: measurement.size_name,
      });
    }
  });

  return Array.from(uniqueSizes.values());
}

function createTextileProductCatalogItem({
  product,
  categoriesById,
  typesById,
  collectionsById,
  filesByProduct,
  measurementsByProduct,
  sizesById,
  dimensionsById,
}) {
  const productFiles = filesByProduct[product.product_id] || [];

  const productMeasurements = (
    measurementsByProduct[product.product_id] || []
  ).map((measurement) => {
    const size = sizesById[measurement.size_id];
    const dimension = dimensionsById[measurement.dimension_id];

    return {
      id: measurement.measurement_id,
      product_id: measurement.product_id,
      size_id: measurement.size_id,
      size_name: size?.size_name || "Talla no definida",
      dimension_id: measurement.dimension_id,
      dimension_name:
        dimension?.dimension_name ||
        dimension?.dimension_code ||
        "Medida",
      measurement_value: measurement.measurement_value ?? null,
      unit: measurement.unit || product.unit || "",
    };
  });

  const category = categoriesById[product.category_id];
  const productType = typesById[product.type_id];
  const collection = collectionsById[product.collection_id];

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

    sku: product.sku || "Sin código",
    product_name: product.product_name || "Producto sin nombre",
    description: product.description || "",
    price: normalizePrice(product.price),

    size: product.size || "",
    length: product.length || "",
    width: product.width || "",
    height: product.height || "",
    unit: product.unit || "",
    iva_amount: normalizePrice(product.iva_amount),
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

    collection: collection
      ? {
          collection_id: collection.collection_id,
          collection_name: collection.collection_name,
        }
      : null,

    available_sizes: getAvailableSizes(
      product,
      productMeasurements,
    ),

    measurements: productMeasurements,
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

  const collectionIds = uniqueValues(
    textileProducts.map((product) => product.collection_id),
  );

  const [
    filesResponse,
    measurementsResponse,
    categoriesResponse,
    typesResponse,
    collectionsResponse,
  ] = await Promise.all([
    supabase
      .from("textile_product_files")
      .select("*")
      .in("product_id", productIds)
      .order("created_at", { ascending: true }),

    supabase
      .from(TEXTILE_PRODUCT_MEASUREMENTS_TABLE)
      .select("*")
      .in("product_id", productIds),

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

    collectionIds.length > 0
      ? supabase
          .from("product_collections")
          .select("*")
          .in("collection_id", collectionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  ensureNoErrors(
    [
      filesResponse,
      measurementsResponse,
      categoriesResponse,
      typesResponse,
      collectionsResponse,
    ],
    "No fue posible cargar los datos relacionados de los productos",
  );

  const measurementRows = measurementsResponse.data || [];

  const sizeIds = uniqueValues(
    measurementRows.map((measurement) => measurement.size_id),
  );

  const dimensionIds = uniqueValues(
    measurementRows.map((measurement) => measurement.dimension_id),
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

  const measurementsByProduct = groupRowsByKey(
    measurementRows,
    "product_id",
  );

  const categoriesById = indexRowsByKey(
    categoriesResponse.data || [],
    "category_id",
  );

  const typesById = indexRowsByKey(
    typesResponse.data || [],
    "type_id",
  );

  const collectionsById = indexRowsByKey(
    collectionsResponse.data || [],
    "collection_id",
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
      collectionsById,
      filesByProduct,
      measurementsByProduct,
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
