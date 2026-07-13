declare const Deno: {
  env: { get(key: string): string | undefined };
};

function normalizeOrigin(value: string | undefined) {
  const candidate = String(value || "").trim().replace(/\/+$/, "");
  if (!candidate) return "";

  try {
    return new URL(candidate).origin;
  } catch {
    return "";
  }
}

export function getCorsHeaders(request: Request) {
  const configuredOrigin = normalizeOrigin(
    Deno.env.get("CORS_ALLOWED_ORIGIN") ||
      Deno.env.get("SITE_URL") ||
      Deno.env.get("APP_URL"),
  );
  const requestOrigin = normalizeOrigin(request.headers.get("Origin") || undefined);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };

  if (configuredOrigin && (!requestOrigin || requestOrigin === configuredOrigin)) {
    headers["Access-Control-Allow-Origin"] = configuredOrigin;
  }

  return headers;
}

export function getConfiguredCorsHeaders() {
  const configuredOrigin = normalizeOrigin(
    Deno.env.get("CORS_ALLOWED_ORIGIN") ||
      Deno.env.get("SITE_URL") ||
      Deno.env.get("APP_URL"),
  );

  return {
    ...(configuredOrigin ? { "Access-Control-Allow-Origin": configuredOrigin } : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
}

export function isOriginAllowed(request: Request) {
  const requestOrigin = normalizeOrigin(request.headers.get("Origin") || undefined);
  if (!requestOrigin) return true;

  const configuredOrigin = normalizeOrigin(
    Deno.env.get("CORS_ALLOWED_ORIGIN") ||
      Deno.env.get("SITE_URL") ||
      Deno.env.get("APP_URL"),
  );

  return Boolean(configuredOrigin && requestOrigin === configuredOrigin);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
