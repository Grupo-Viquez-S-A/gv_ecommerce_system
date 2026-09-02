// Supabase Edge Function: admin-settings
// Deploy with: supabase functions deploy admin-settings
//
// This function centralizes admin operations (users, departments, roles,
// module access) that require the service role key (e.g. creating auth
// users). It must never be called with the anon key from the client without
// going through supabase.functions.invoke, and it must only be reachable by
// authenticated users who are allowed to manage the system (see the
// isCallerAuthorized check below).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.16";

const ACCOUNT_MANAGEMENT_ROLE_CODES = new Set([
  "admin",
  "administrador",
  "super_admin",
  "gerente",
  "manager",
  "encargado",
  "presidente",
  "president",
]);

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRequiredEmailSecret(name: string) {
  const value = String(Deno.env.get(name) || "").trim();
  if (!value) {
    throw new Error(`Falta configurar el secret ${name}.`);
  }
  return value;
}

async function sendWelcomeEmail({
  email,
  name,
  applicationIds,
}: {
  email: string;
  name: string;
  applicationIds: string[];
}) {
  const smtpHost = getRequiredEmailSecret("SMTP_HOST");
  const smtpPort = Number(getRequiredEmailSecret("SMTP_PORT"));
  const smtpUsername = getRequiredEmailSecret("SMTP_USERNAME");
  const smtpPassword = getRequiredEmailSecret("SMTP_PASSWORD");
  const fromEmail =
    String(Deno.env.get("SMTP_FROM_EMAIL") || "").trim() || smtpUsername;
  const fromName =
    String(Deno.env.get("SMTP_FROM_NAME") || "").trim() || "Grupo Víquez";

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw new Error("El secret SMTP_PORT no contiene un puerto válido.");
  }

  const { data: applications, error: applicationsError } = await adminClient
    .from("applications")
    .select("application_id, application_code")
    .in("application_id", applicationIds)
    .eq("is_active", true);

  if (applicationsError) throw applicationsError;

  const hasSaasAccess = (applications ?? []).some(
    (application) => application.application_code === "enterprise_saas",
  );
  const siteUrl = String(Deno.env.get("SITE_URL") || "").trim();
  const ecommerceUrl = String(
    Deno.env.get("ECOMMERCE_CLIENT_REDIRECT_URL") || "",
  ).trim();
  const loginUrl = hasSaasAccess ? siteUrl : ecommerceUrl || siteUrl;
  const safeName = escapeHtml(name || "nuevo usuario");
  const safeEmail = escapeHtml(email);
  const safeLoginUrl = escapeHtml(loginUrl);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });

  try {
    await transporter.sendMail({
      from: {
        name: fromName,
        address: fromEmail,
      },
      to: email,
      subject: "Bienvenido a Grupo Víquez | Tu cuenta fue creada",
      text: [
        `Hola ${name || "nuevo usuario"},`,
        "",
        "Tu cuenta para los sistemas de Grupo Víquez fue creada correctamente.",
        "",
        `Usuario: ${email}`,
        "",
        loginUrl ? `Ingresar al sistema: ${loginUrl}` : "",
        "",
        "Soporte Técnico - Grupo Víquez",
      ]
        .filter(Boolean)
        .join("\n"),
      html: `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#020b18;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#020b18;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#071b39;border:1px solid #29466d;border-radius:18px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:30px 32px 22px;background:#031329;border-bottom:1px solid #29466d;">
                <div style="font-size:13px;letter-spacing:4px;color:#d8e5f7;">GRUPO</div>
                <div style="margin-top:4px;font-size:24px;font-weight:700;letter-spacing:3px;color:#e6ac21;">VÍQUEZ</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#e6ac21;text-transform:uppercase;">Cuenta creada</div>
                <h1 style="margin:10px 0 12px;font-size:28px;line-height:1.2;color:#ffffff;">¡Bienvenido al sistema!</h1>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#a9c1e3;">
                  Hola <strong style="color:#ffffff;">${safeName}</strong>. Tu cuenta fue creada correctamente y ya puedes acceder a las aplicaciones asignadas.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#031329;border:1px solid #29466d;border-radius:12px;">
                  <tr>
                    <td style="padding:22px;">
                      <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#7596c4;text-transform:uppercase;">Usuario</div>
                      <div style="font-size:16px;color:#ffffff;word-break:break-all;">${safeEmail}</div>
                    </td>
                  </tr>
                </table>
                ${
                  loginUrl
                    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;"><tr><td style="border-radius:10px;background:#e6ac21;"><a href="${safeLoginUrl}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;color:#031329;text-decoration:none;">Ingresar al sistema</a></td></tr></table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#031329;border-top:1px solid #29466d;font-size:12px;line-height:1.6;color:#7596c4;">
                Soporte Técnico · Grupo Víquez<br>
                Este es un mensaje automático enviado desde soporte@grupoviquez.com.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    });
  } finally {
    transporter.close();
  }
}

function normalizeOrigin(value: string | undefined) {
  const candidate = String(value || "").trim().replace(/\/+$/, "");
  if (!candidate) return "";

  try {
    return new URL(candidate).origin;
  } catch {
    return "";
  }
}

const DEFAULT_ALLOWED_ORIGINS = [
  "https://grupoviquez.com",
  "https://www.grupoviquez.com",
  "https://erp.grupoviquez.com",
  "https://rpv.grupoviquez.com",
  "http://192.168.100.6:5000",
  "http://192.168.100.6:5001",
];

function getAllowedOrigins() {
  const configuredOrigins = [
    ...(Deno.env.get("CORS_ALLOWED_ORIGINS") || "").split(","),
    Deno.env.get("CORS_ALLOWED_ORIGIN"),
    Deno.env.get("SITE_URL"),
    Deno.env.get("APP_URL"),
    ...DEFAULT_ALLOWED_ORIGINS,
  ]
    .map((origin) => normalizeOrigin(origin || undefined))
    .filter(Boolean);

  return new Set(configuredOrigins);
}

function getCorsHeaders(request: Request) {
  const requestOrigin = normalizeOrigin(
    request.headers.get("Origin") || undefined,
  );
  const allowedOrigin =
    requestOrigin && getAllowedOrigins().has(requestOrigin)
      ? requestOrigin
      : "";

  return {
    ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
}

function isOriginAllowed(request: Request) {
  const requestOrigin = normalizeOrigin(request.headers.get("Origin") || undefined);
  if (!requestOrigin) return true;

  return getAllowedOrigins().has(requestOrigin);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function jsonResponse(
  request: Request,
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(request), "Content-Type": "application/json" },
  });
}

function getErrorDetails(error: unknown) {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object") {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }

  return String(error);
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message && error.message !== "{}") {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      error_description?: unknown;
      error?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      status?: unknown;
    };

    const message = [
      maybeError.message,
      maybeError.error_description,
      maybeError.error,
      maybeError.details,
      maybeError.hint,
      maybeError.code,
      maybeError.status ? `Status ${maybeError.status}` : null,
    ].find((value) => typeof value === "string" && value.trim() && value.trim() !== "{}");

    if (message) return String(message);
  }

  return fallbackMessage;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Service-role client: bypasses RLS, used for all privileged reads/writes.
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Module codes that are allowed to manage the settings panel.
// Adjust this if you rename the settings module.
const SETTINGS_MODULE_CODE = "settings";

async function isCallerAuthorized(authHeader: string | null) {
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) return false;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.is_active === false) return false;

  // Public/global modules (is_public = true) are visible to everyone, so we
  // explicitly check that the caller has been granted the settings module
  // either directly (profile_modules) or through their department
  // (department_modules).
  const { data: memberships } = await adminClient
    .from("user_memberships")
    .select("department_id, start_date, end_date, roles (role_code, role_name, is_active)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const today = new Date().toISOString().slice(0, 10);
  const membership = (memberships || []).find((record: any) => {
    const role = Array.isArray(record.roles) ? record.roles[0] : record.roles;
    const roleCode = String(role?.role_code || role?.role_name || "").trim().toLowerCase();
    return role?.is_active !== false &&
      (!record.start_date || record.start_date <= today) &&
      (!record.end_date || record.end_date >= today) &&
      ACCOUNT_MANAGEMENT_ROLE_CODES.has(roleCode);
  });
  if (!membership) return false;

  const { data: settingsModule } = await adminClient
    .from("modules")
    .select("module_id, is_public")
    .eq("module_code", SETTINGS_MODULE_CODE)
    .maybeSingle();

  if (!settingsModule) return false;

  const { data: directAccess } = await adminClient
    .from("profile_modules")
    .select("module_id")
    .eq("profile_id", user.id)
    .eq("module_id", settingsModule.module_id)
    .eq("can_view", true)
    .maybeSingle();

  if (directAccess) return true;

  if (membership?.department_id) {
    const { data: departmentAccess } = await adminClient
      .from("department_modules")
      .select("module_id")
      .eq("department_id", membership.department_id)
      .eq("module_id", settingsModule.module_id)
      .eq("can_view", true)
      .maybeSingle();

    if (departmentAccess) return true;
  }

  return false;
}

function validateAdminPayload(action: unknown, payload: any) {
  const allowedActions = new Set([
    "list", "create-user", "update-user", "set-user-status",
    "save-department", "set-department-status", "save-role", "set-role-status",
  ]);
  if (typeof action !== "string" || !allowedActions.has(action)) {
    return "Acción administrativa inválida.";
  }

  if (["create-user", "update-user"].includes(String(action))) {
    const email = String(payload?.email || "").trim().toLowerCase();
    const password = payload?.password;
    const profile = payload?.profile || {};
    const membership = payload?.membership || {};
    const applicationIds = payload?.applicationIds;
    const moduleIds = payload?.moduleIds;

    if (!String(profile.name || "").trim() || !String(profile.surname || "").trim()) {
      return "El nombre y los apellidos son obligatorios.";
    }
    if (!isValidEmail(email)) return "El correo no es válido.";
    if (
      action === "create-user" &&
      (typeof password !== "string" || password.length < 12 || password.length > 128)
    ) {
      return "La contraseña temporal debe tener entre 12 y 128 caracteres.";
    }
    if (
      action === "update-user" &&
      password !== undefined &&
      (typeof password !== "string" || password.length < 12 || password.length > 128)
    ) {
      return "La nueva contraseña debe tener entre 12 y 128 caracteres.";
    }
    if (![membership.company_id, membership.department_id, membership.role_id].every((id) => isUuid(String(id || "")))) {
      return "La empresa, el departamento o el rol no son válidos.";
    }
    if (
      membership.membership_id &&
      !isUuid(String(membership.membership_id))
    ) {
      return "La membresía del usuario no es válida.";
    }
    if (
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0 ||
      !applicationIds.every((applicationId) =>
        isUuid(String(applicationId || ""))
      )
    ) {
      return "Selecciona al menos una aplicación válida.";
    }
    if (
      !Array.isArray(moduleIds) ||
      !moduleIds.every((moduleId) => isUuid(String(moduleId || "")))
    ) {
      return "La selección de módulos no es válida.";
    }
  }

  if (["update-user", "set-user-status"].includes(action) && !isUuid(String(payload?.userId || ""))) {
    return "El usuario no es válido.";
  }
  if (action === "set-department-status" && !isUuid(String(payload?.departmentId || ""))) {
    return "El departamento no es válido.";
  }
  if (action === "set-role-status" && !isUuid(String(payload?.roleId || ""))) {
    return "El rol no es válido.";
  }
  return null;
}

async function handleList() {
  const [
    usersResponse,
    departmentsResponse,
    rolesResponse,
    companiesResponse,
    applicationsResponse,
    modulesResponse,
    departmentModulesResponse,
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select(
        `
        user_id, name, surname, email, identification, phone, is_active, created_at,
        user_memberships (
          membership_id, company_id, department_id, role_id, is_active, start_date, end_date,
          companies ( company_id, company_name, commercial_name ),
          departments ( department_id, name ),
          roles ( role_id, role_name, role_code )
        ),
        user_applications (
          user_application_id, application_id, is_active, start_date, end_date
        ),
        profile_modules ( module_id, can_view, can_create, can_edit, can_delete )
      `,
      )
      .order("created_at", { ascending: false }),
    adminClient.from("departments").select("*").order("name"),
    adminClient.from("roles").select("*").order("role_name"),
    adminClient.from("companies").select("*").order("company_name"),
    adminClient
      .from("applications")
      .select(
        "application_id, application_code, name, description, is_active",
      )
      .eq("is_active", true)
      .order("name"),
    adminClient.from("modules").select("*").order("display_order"),
    adminClient.from("department_modules").select("*"),
  ]);

  for (const response of [
    usersResponse,
    departmentsResponse,
    rolesResponse,
    companiesResponse,
    applicationsResponse,
    modulesResponse,
    departmentModulesResponse,
  ]) {
    if (response.error) throw response.error;
  }

  return {
    users: usersResponse.data ?? [],
    departments: departmentsResponse.data ?? [],
    roles: rolesResponse.data ?? [],
    companies: companiesResponse.data ?? [],
    applications: applicationsResponse.data ?? [],
    modules: modulesResponse.data ?? [],
    departmentModules: departmentModulesResponse.data ?? [],
  };
}

async function replaceProfileModules(
  userId: string,
  moduleIds: string[] = [],
) {
  const { error: deleteError } = await adminClient
    .from("profile_modules")
    .delete()
    .eq("profile_id", userId);

  if (deleteError) throw deleteError;

  if (!moduleIds.length) return;

  const rows = [...new Set(moduleIds)].map((moduleId) => ({
    profile_id: userId,
    module_id: moduleId,
    can_view: true,
    can_create: false,
    can_edit: true,
    can_delete: false,
  }));

  const { error: insertError } = await adminClient
    .from("profile_modules")
    .insert(rows);

  if (insertError) throw insertError;
}

function getTodayCRDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function validateActiveApplicationIds(applicationIds: string[] = []) {
  const uniqueApplicationIds = [...new Set(applicationIds)];
  const { data, error } = await adminClient
    .from("applications")
    .select("application_id")
    .in("application_id", uniqueApplicationIds)
    .eq("is_active", true);

  if (error) throw error;
  if ((data ?? []).length !== uniqueApplicationIds.length) {
    throw new Error(
      "Una o más aplicaciones seleccionadas no existen o están inactivas.",
    );
  }

  return uniqueApplicationIds;
}

async function replaceUserApplications(
  userId: string,
  applicationIds: string[],
) {
  const today = getTodayCRDateString();
  const { data: existingAssignments, error: existingError } =
    await adminClient
      .from("user_applications")
      .select("application_id, start_date")
      .eq("user_id", userId);

  if (existingError) throw existingError;

  const selectedApplicationIds = new Set(applicationIds);
  const assignmentsByApplicationId = new Map(
    (existingAssignments ?? []).map((assignment) => [
      assignment.application_id,
      assignment,
    ]),
  );
  const applicationIdsToDisable = (existingAssignments ?? [])
    .map((assignment) => assignment.application_id)
    .filter(
      (applicationId) => !selectedApplicationIds.has(applicationId),
    );

  if (applicationIdsToDisable.length > 0) {
    const { error: disableError } = await adminClient
      .from("user_applications")
      .update({
        is_active: false,
        end_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .in("application_id", applicationIdsToDisable);

    if (disableError) throw disableError;
  }

  const rows = applicationIds.map((applicationId) => ({
    user_id: userId,
    application_id: applicationId,
    is_active: true,
    start_date:
      assignmentsByApplicationId.get(applicationId)?.start_date || today,
    end_date: null,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await adminClient
    .from("user_applications")
    .upsert(rows, { onConflict: "user_id,application_id" });

  if (upsertError) throw upsertError;
}

async function handleCreateUser(payload: any) {
  const {
    email,
    password,
    profile = {},
    membership = {},
    applicationIds = [],
    moduleIds = [],
  } = payload;
  const normalizedEmail = String(email).trim().toLowerCase();
  const validApplicationIds =
    await validateActiveApplicationIds(applicationIds);

  if (!email || !password) {
    throw new Error("El correo y la contraseña temporal son obligatorios.");
  }

  if (!membership.company_id || !membership.department_id || !membership.role_id) {
    throw new Error("Selecciona empresa, departamento y rol para el usuario.");
  }

  const { data: createdUser, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        created_from: "ecommerce_admin",
      },
    });

  if (createUserError) throw createUserError;

  const userId = createdUser.user?.id;
  if (!userId) throw new Error("No fue posible crear el usuario en Auth.");

  try {
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          name: profile.name || "",
          surname: profile.surname || "",
          email: normalizedEmail,
          identification: profile.identification || null,
          phone: profile.phone || null,
          is_active: true,
        },
        { onConflict: "user_id" },
      );

    if (profileError) throw profileError;

    const { error: membershipError } = await adminClient
      .from("user_memberships")
      .insert({
        user_id: userId,
        company_id: membership.company_id,
        department_id: membership.department_id,
        role_id: membership.role_id,
        is_active: true,
      });

    if (membershipError) throw membershipError;

    await replaceUserApplications(userId, validApplicationIds);
    await replaceProfileModules(userId, moduleIds);
  } catch (error) {
    // Roll back the auth user if any downstream insert fails, so we don't
    // leave an orphaned auth account with no profile.
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    throw error;
  }

  try {
    await sendWelcomeEmail({
      email: normalizedEmail,
      name: [profile.name, profile.surname].filter(Boolean).join(" "),
      applicationIds: validApplicationIds,
    });

    return { userId, emailSent: true };
  } catch (emailError) {
    console.error(
      "Welcome email delivery failed:",
      getErrorMessage(emailError, "Error SMTP no identificado."),
    );

    return {
      userId,
      emailSent: false,
      emailWarning:
        "El usuario fue creado, pero no fue posible enviar el correo de bienvenida.",
    };
  }
}

async function handleUpdateUser(payload: any) {
  const {
    userId,
    email,
    password,
    profile = {},
    membership = {},
    applicationIds = [],
    moduleIds = [],
  } = payload;

  if (!userId) throw new Error("Falta el identificador del usuario.");
  const normalizedEmail = String(email).trim().toLowerCase();
  const validApplicationIds =
    await validateActiveApplicationIds(applicationIds);

  const authUpdate: Record<string, unknown> = {};
  if (normalizedEmail) authUpdate.email = normalizedEmail;
  if (password) authUpdate.password = password;

  if (Object.keys(authUpdate).length > 0) {
    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
      userId,
      authUpdate,
    );
    if (authUpdateError) throw authUpdateError;
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      name: profile.name || "",
      surname: profile.surname || "",
      email: normalizedEmail,
      identification: profile.identification || null,
      phone: profile.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (profileError) throw profileError;

  if (membership.company_id || membership.department_id || membership.role_id) {
    if (membership.membership_id) {
      const { error: membershipError } = await adminClient
        .from("user_memberships")
        .update({
          company_id: membership.company_id,
          department_id: membership.department_id,
          role_id: membership.role_id,
          updated_at: new Date().toISOString(),
        })
        .eq("membership_id", membership.membership_id);

      if (membershipError) throw membershipError;
    } else {
      const { error: membershipError } = await adminClient
        .from("user_memberships")
        .insert({
          user_id: userId,
          company_id: membership.company_id,
          department_id: membership.department_id,
          role_id: membership.role_id,
          is_active: true,
        });

      if (membershipError) throw membershipError;
    }
  }

  await replaceProfileModules(userId, moduleIds);
  await replaceUserApplications(userId, validApplicationIds);

  return { userId };
}

async function handleSetUserStatus(payload: any) {
  const { userId, isActive } = payload;
  if (!userId) throw new Error("Falta el identificador del usuario.");

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (profileError) throw profileError;

  // Also block/unblock sign-in at the Auth level.
  const { error: authError } = await adminClient.auth.admin.updateUserById(
    userId,
    { ban_duration: isActive ? "none" : "876000h" },
  );

  if (authError) throw authError;

  return { userId };
}

async function handleSaveDepartment(payload: any) {
  const { department } = payload;
  if (!department?.name) throw new Error("El nombre del departamento es obligatorio.");

  const row = {
    name: department.name,
    email: department.email || null,
    is_active: department.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (department.department_id) {
    const { error } = await adminClient
      .from("departments")
      .update(row)
      .eq("department_id", department.department_id);
    if (error) throw error;
    return { departmentId: department.department_id };
  }

  const { data, error } = await adminClient
    .from("departments")
    .insert(row)
    .select("department_id")
    .single();

  if (error) throw error;
  return { departmentId: data.department_id };
}

async function handleSetDepartmentStatus(payload: any) {
  const { departmentId, isActive } = payload;
  if (!departmentId) throw new Error("Falta el identificador del departamento.");

  const { error } = await adminClient
    .from("departments")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("department_id", departmentId);

  if (error) throw error;
  return { departmentId };
}

async function handleSaveRole(payload: any) {
  const { role } = payload;
  if (!role?.role_name || !role?.role_code) {
    throw new Error("El nombre y código del rol son obligatorios.");
  }

  const row = {
    role_name: role.role_name,
    role_code: role.role_code,
    description: role.description || null,
    is_active: role.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  if (role.role_id) {
    const { error } = await adminClient
      .from("roles")
      .update(row)
      .eq("role_id", role.role_id);
    if (error) throw error;
    return { roleId: role.role_id };
  }

  const { data, error } = await adminClient
    .from("roles")
    .insert(row)
    .select("role_id")
    .single();

  if (error) throw error;
  return { roleId: data.role_id };
}

async function handleSetRoleStatus(payload: any) {
  const { roleId, isActive } = payload;
  if (!roleId) throw new Error("Falta el identificador del rol.");

  const { error } = await adminClient
    .from("roles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("role_id", roleId);

  if (error) throw error;
  return { roleId };
}

Deno.serve(async (request: Request) => {
  if (!isOriginAllowed(request)) {
    return jsonResponse(
      request,
      { ok: false, error: "Origen no permitido." },
      403,
    );
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(request) });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      request,
      { ok: false, error: "Método no permitido." },
      405,
    );
  }

  try {
    const authHeader = request.headers.get("Authorization");
    const authorized = await isCallerAuthorized(authHeader);

    if (!authorized) {
      return jsonResponse(
        request,
        { ok: false, error: "No tienes permisos para administrar el sistema." },
        403,
      );
    }

    const body = await request.json();
    const { action, ...payload } = body ?? {};
    const validationError = validateAdminPayload(action, payload);
    if (validationError) {
      return jsonResponse(
        request,
        { ok: false, error: validationError },
        400,
      );
    }

    let data: Record<string, unknown> = {};

    switch (action) {
      case "list":
        data = await handleList();
        break;
      case "create-user":
        data = await handleCreateUser(payload);
        break;
      case "update-user":
        data = await handleUpdateUser(payload);
        break;
      case "set-user-status":
        data = await handleSetUserStatus(payload);
        break;
      case "save-department":
        data = await handleSaveDepartment(payload);
        break;
      case "set-department-status":
        data = await handleSetDepartmentStatus(payload);
        break;
      case "save-role":
        data = await handleSaveRole(payload);
        break;
      case "set-role-status":
        data = await handleSetRoleStatus(payload);
        break;
      default:
        return jsonResponse(
          request,
          { ok: false, error: `Acción desconocida: ${action}` },
          400,
        );
    }

    return jsonResponse(request, { ok: true, ...data });
  } catch (error) {
    console.error("admin-settings error:", getErrorDetails(error));
    const message = getErrorMessage(
      error,
      "No fue posible completar la operacion administrativa.",
    );
    return jsonResponse(
      request,
      { ok: false, error: message, message },
      500,
    );
  }
});
