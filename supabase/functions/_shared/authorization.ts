const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";

export const ACCOUNT_MANAGEMENT_ROLE_CODES = new Set([
  "admin", "administrador", "super_admin", "gerente", "manager",
  "encargado", "presidente", "president",
]);

export const COMMERCIAL_OPERATION_ROLE_CODES = new Set([
  ...ACCOUNT_MANAGEMENT_ROLE_CODES,
  "sales_agent",
]);

type AuthorizationResult =
  | { authorized: true; roleCode: string }
  | { authorized: false; status: 403 | 500; message: string; details?: unknown };

function normalizeRoleCode(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isActiveRecord(record: any, today: string) {
  return Boolean(record && record.is_active !== false &&
    (!record.start_date || record.start_date <= today) &&
    (!record.end_date || record.end_date >= today));
}

export async function authorizeCompanyAction({
  supabaseAdmin, userId, companyId, allowedRoleCodes,
  allowAnyActiveCompany = false,
}: {
  supabaseAdmin: any;
  userId: string;
  companyId: string;
  allowedRoleCodes: Set<string>;
  allowAnyActiveCompany?: boolean;
}): Promise<AuthorizationResult> {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { data: applications, error: applicationError } = await supabaseAdmin
    .from("user_applications")
    .select("is_active, start_date, end_date")
    .eq("user_id", userId)
    .eq("application_id", ECOMMERCE_APPLICATION_ID);

  if (applicationError) return { authorized: false, status: 500, message: "No fue posible validar el acceso a la aplicacion.", details: applicationError };
  if (!(applications || []).some((record: any) => isActiveRecord(record, today))) {
    return { authorized: false, status: 403, message: "Tu usuario no tiene acceso activo a esta aplicacion." };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles").select("is_active").eq("user_id", userId).maybeSingle();
  if (profileError) return { authorized: false, status: 500, message: "No fue posible validar el perfil del usuario.", details: profileError };
  if (!profile || profile.is_active === false) return { authorized: false, status: 403, message: "Tu perfil de usuario no esta activo." };

  let membershipsQuery = supabaseAdmin
    .from("user_memberships")
    .select("company_id, role_id, is_active, start_date, end_date")
    .eq("user_id", userId);

  if (!allowAnyActiveCompany) {
    membershipsQuery = membershipsQuery.eq("company_id", companyId);
  }

  const { data: memberships, error: membershipError } = await membershipsQuery;

  if (membershipError) return { authorized: false, status: 500, message: "No fue posible validar la membresia del usuario.", details: membershipError };
  const roleIds = [...new Set((memberships || [])
    .filter((record: any) => isActiveRecord(record, today))
    .map((record: any) => record.role_id)
    .filter(Boolean))];

  if (roleIds.length === 0) {
    return {
      authorized: false,
      status: 403,
      message: allowAnyActiveCompany
        ? "No tienes una membresia empresarial activa."
        : "No tienes una membresia activa para la empresa solicitada.",
    };
  }

  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("roles").select("role_code, role_name").in("role_id", roleIds);
  if (rolesError) return { authorized: false, status: 500, message: "No fue posible validar el rol del usuario.", details: rolesError };

  const authorizedRole = (roles || []).find((role: any) =>
    allowedRoleCodes.has(normalizeRoleCode(role.role_code)) ||
    allowedRoleCodes.has(normalizeRoleCode(role.role_name)));
  if (!authorizedRole) return { authorized: false, status: 403, message: "Tu rol no permite realizar esta operacion." };

  return { authorized: true, roleCode: normalizeRoleCode(authorizedRole.role_code) || normalizeRoleCode(authorizedRole.role_name) };
}
