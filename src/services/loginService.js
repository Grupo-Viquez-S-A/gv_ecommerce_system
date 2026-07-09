import { supabase } from "./primarySupabaseClient";

const ECOMMERCE_APPLICATION_ID = "64c10718-fce7-42c6-a25f-d81c6b5cd51c";

function isActiveByDates(record) {
  if (!record || record.is_active === false) {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);
  const hasStarted = !record.start_date || record.start_date <= today;
  const hasNotExpired = !record.end_date || record.end_date >= today;

  return hasStarted && hasNotExpired;
}

function createAccessError(message) {
  const error = new Error(message);
  error.code = "ECOMMERCE_ACCESS_DENIED";

  return error;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    return { data, error };
  }

  const corporateUser = await getCorporateUserData(
    data.user.id,
    data.user.email,
  );

  if (corporateUser.error) {
    await supabase.auth.signOut();

    return {
      data: null,
      error: corporateUser.error,
    };
  }

  return { data, error: null };
}

export async function signInWithOAuth(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  return { data, error };
}

export async function getActiveSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  return { session, error };
}

export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return subscription;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  return { error };
}


export async function updatePasswordForCurrentUser(password) {
  const { data, error } = await supabase.auth.updateUser({ password });

  return { data, error };
}
export async function getCorporateUserData(userId, authEmail) {
  const { data: userApplication, error: applicationError } = await supabase
    .from("user_applications")
    .select("user_application_id, is_active, start_date, end_date")
    .eq("user_id", userId)
    .eq("application_id", ECOMMERCE_APPLICATION_ID)
    .maybeSingle();

  if (applicationError) {
    return { data: null, error: applicationError };
  }

  if (!isActiveByDates(userApplication)) {
    return {
      data: null,
      error: createAccessError(
        "Tu usuario no tiene acceso activo al e-commerce de Grupo Viquez.",
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, name, surname, identification, phone, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return { data: null, error: profileError };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("user_memberships")
    .select(
      "membership_id, company_id, department_id, role_id, is_active, start_date, end_date, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (membershipError) {
    return { data: null, error: membershipError };
  }

  const activeMemberships = (memberships || []).filter(isActiveByDates);
  const primaryMembership = activeMemberships[0] || memberships?.[0] || null;

  if (!primaryMembership) {
    return {
      data: null,
      error: createAccessError(
        "Tu usuario tiene acceso al e-commerce, pero no tiene rol ni departamento asignado.",
      ),
    };
  }

  const [roleResponse, departmentResponse, companiesResponse] =
    await Promise.all([
      primaryMembership.role_id
        ? supabase
            .from("roles")
            .select("role_id, role_name, role_code, description")
            .eq("role_id", primaryMembership.role_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      primaryMembership.department_id
        ? supabase
            .from("departments")
            .select("department_id, name, email")
            .eq("department_id", primaryMembership.department_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      memberships?.length
        ? supabase
            .from("companies")
            .select("company_id, company_name, commercial_name, email, address")
            .in(
              "company_id",
              memberships.map((membership) => membership.company_id).filter(Boolean),
            )
        : Promise.resolve({ data: [], error: null }),
    ]);

  const firstError = [
    roleResponse.error,
    departmentResponse.error,
    companiesResponse.error,
  ].find(Boolean);

  if (firstError) {
    return { data: null, error: firstError };
  }

  const roleData = roleResponse.data;
  const departmentData = departmentResponse.data;
  const companies = (companiesResponse.data || []).map((company) => ({
    id: company.company_id,
    name: company.commercial_name || company.company_name,
    companyName: company.company_name,
    email: company.email,
    address: company.address,
  }));

  const fullName =
    profile?.name && profile?.surname
      ? `${profile.name} ${profile.surname}`
      : profile?.name || authEmail || "Usuario";

  return {
    data: {
      id: userId,
      email: profile?.email || authEmail,
      fullName,
      identification: profile?.identification || null,
      phone: profile?.phone || null,
      role: roleData
        ? {
            id: roleData.role_id,
            name: roleData.role_name,
            code: roleData.role_code,
            description: roleData.description,
          }
        : {
            id: null,
            name: "Sin rol",
            code: null,
            description: null,
          },
      department: departmentData
        ? {
            id: departmentData.department_id,
            name: departmentData.name,
            email: departmentData.email,
          }
        : {
            id: null,
            name: "Sin departamento",
            email: null,
          },
      companies,
      activeCompany: companies[0] || null,
      avatarUrl: null,
      isActive: profile?.is_active ?? true,
      eCommerceAccess: userApplication,
      membership: primaryMembership,
    },
    error: null,
  };
}

