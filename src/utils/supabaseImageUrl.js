const SUPABASE_OBJECT_PUBLIC_SEGMENT = "/storage/v1/object/public/";
const SUPABASE_RENDER_PUBLIC_SEGMENT = "/storage/v1/render/image/public/";

export function getOptimizedSupabaseImageUrl(url, options = {}) {
  if (!url || typeof url !== "string") {
    return url || null;
  }

  if (!url.includes(SUPABASE_OBJECT_PUBLIC_SEGMENT)) {
    return url;
  }

  const [urlWithoutHash, hash = ""] = url.split("#");
  const [path, query = ""] = urlWithoutHash.split("?");
  const params = new URLSearchParams(query);

  if (!params.has("width")) {
    params.set("width", String(options.width || 900));
  }

  if (options.height && !params.has("height")) {
    params.set("height", String(options.height));
  }

  if (!params.has("quality")) {
    params.set("quality", String(options.quality || 82));
  }

  if (!params.has("resize")) {
    params.set("resize", options.resize || "cover");
  }

  const renderPath = path.replace(
    SUPABASE_OBJECT_PUBLIC_SEGMENT,
    SUPABASE_RENDER_PUBLIC_SEGMENT,
  );

  return `${renderPath}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

export function isChromiumLikeBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const brands = navigator.userAgentData?.brands || [];

  if (
    brands.some((brand) =>
      /Chromium|Google Chrome|Microsoft Edge|Brave|Opera/i.test(brand.brand),
    )
  ) {
    return true;
  }

  return /Chrome|Chromium|CriOS|Edg|OPR|SamsungBrowser/i.test(
    navigator.userAgent || "",
  );
}
