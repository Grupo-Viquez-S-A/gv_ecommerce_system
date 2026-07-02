import { supabase } from "../services/primarySupabaseClient.js";

export function createCatalogFilterId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function groupRowsByFabric(rows = []) {
  return rows.reduce((groupedRows, row) => {
    const fabricId = row?.fabric_id;

    if (!fabricId) {
      return groupedRows;
    }

    if (!groupedRows[fabricId]) {
      groupedRows[fabricId] = [];
    }

    groupedRows[fabricId].push(row);

    return groupedRows;
  }, {});
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

  if (fileText.includes("image") || fileText.includes("imagen")) {
    priority += 20;
  }

  return priority;
}

function getCoverImageUrl(fabric, files = []) {
  const directImageUrl = fabric?.image_url || null;

  /*
    Si fabrics.image_url apunta a una ficha técnica,
    no se utiliza como portada.
  */
  if (directImageUrl && !isTechnicalSheetUrl(directImageUrl)) {
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

  /*
    En caso de que la ficha técnica sea PDF u otro documento,
    se conserva para abrirla en otra pestaña desde el modal.
  */
  return (
    files.find((file) => isTechnicalSheetFile(file)) ||
    null
  );
}

function normalizePrice(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isNaN(numericValue) ? null : numericValue;
}

function mapFabricToCatalogProduct({
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
  const technicalSheetUrl = getFileUrl(technicalSheetFile);

  return {
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

    technical_sheet_url: technicalSheetUrl,
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

    files: fabricFiles.map((file) => ({
      ...file,
      public_url: getFileUrl(file),
    })),

    raw_fabric: fabric,
  };
}

export async function getCatalogProducts() {
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

  const relatedErrors = [
    colorsResponse.error,
    materialsResponse.error,
    featuresResponse.error,
    managementsResponse.error,
    filesResponse.error,
  ].filter(Boolean);

  if (relatedErrors.length > 0) {
    throw new Error(
      `No fue posible cargar los archivos y datos relacionados: ${relatedErrors[0].message}`,
    );
  }

  const colorsByFabric = groupRowsByFabric(colorsResponse.data || []);
  const materialsByFabric = groupRowsByFabric(materialsResponse.data || []);
  const featuresByFabric = groupRowsByFabric(featuresResponse.data || []);
  const managementsByFabric = groupRowsByFabric(
    managementsResponse.data || [],
  );
  const filesByFabric = groupRowsByFabric(filesResponse.data || []);

  return fabrics.map((fabric) =>
    mapFabricToCatalogProduct({
      fabric,
      colorsByFabric,
      materialsByFabric,
      featuresByFabric,
      managementsByFabric,
      filesByFabric,
    }),
  );
}