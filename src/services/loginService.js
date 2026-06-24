import { supabase } from "./primarySupabaseClient";

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
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

export async function signUpWithEmail(email, password, options = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options,
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCorporateUserData(userId, authEmail) {
  // Perfil base
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, name, surname, identification, phone, avatar_url, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("[getCorporateUserData] userId:", userId, "profile:", profile, "profileError:", profileError);

  if (profileError && !profileError.message.includes("does not exist")) {
    return { data: null, error: profileError };
  }

  const userEmail = profile?.email || authEmail;
  const fullName =
    (profile?.name && profile?.surname)
      ? `${profile.name} ${profile.surname}`
      : profile?.name || "Usuario";
  const avatarUrl = profile?.avatar_url || null;
  const isActive = profile?.is_active ?? true;

  // Membresías (roles + empresas + departamento)
  const { data: memberships, error: memError } = await supabase
    .from("user_memberships")
    .select("company_id, department_id, role_id")
    .eq("user_id", userId);

  if (memError && !memError.message.includes("does not exist")) {
    return { data: null, error: memError };
  }

  let role = null;
  let companies = [];
  let department = null;

  // Obtener roles
  if (memberships && memberships.length > 0) {
    const roleId = memberships[0].role_id;
    if (roleId) {
      const { data: roleData } = await supabase
        .from("roles")
        .select("role_id, role_name, role_code, description")
        .eq("role_id", roleId)
        .maybeSingle();
      if (roleData) {
        role = {
          id: roleData.role_id,
          name: roleData.role_name,
          code: roleData.role_code,
          description: roleData.description,
        };
      }
    }
  }

  // Obtener departamento
  if (memberships && memberships.length > 0) {
    const deptId = memberships[0].department_id;
    if (deptId) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("department_id, name, email")
        .eq("department_id", deptId)
        .maybeSingle();
      if (deptData) {
        department = {
          id: deptData.department_id,
          name: deptData.name,
          email: deptData.email,
        };
      }
    }
  }

  // Obtener empresas
  const companyIds =
    memberships?.map((m) => m.company_id).filter(Boolean) || [];
  if (companyIds.length > 0) {
    const { data: companyData } = await supabase
      .from("companies")
      .select("company_id, company_name, commercial_name, email, address")
      .in("company_id", companyIds);
    if (companyData) {
      companies = companyData.map((c) => ({
        id: c.company_id,
        name: c.company_name,
        commercialName: c.commercial_name,
        email: c.email,
        address: c.address,
      }));
    }
  }

  // Fallback para visual design
  const defaultCompanies = [
    { id: "grupo-viquez", name: "Grupo Víquez" },
    { id: "constructora", name: "Constructora Víquez" },
    { id: "occidente-lab", name: "Occidente Lab" },
    { id: "textiles", name: "Textiles de Occidente" },
    { id: "agro", name: "Agro Occidente Group" },
    { id: "pet-food", name: "Pacific Pet Food" },
  ];

  const effectiveCompanies =
    companies.length > 0 ? companies : defaultCompanies;
  const activeCompany = effectiveCompanies[0];

  return {
    data: {
      id: userId,
      email: userEmail,
      fullName,
      identification: profile?.identification || null,
      phone: profile?.phone || null,
      role: role || {
        id: "director-comercial",
        name: "Director Comercial",
        code: null,
        description: null,
      },
      department: department || {
        id: "comercial",
        name: "Comercial",
        email: null,
      },
      companies: effectiveCompanies,
      activeCompany,
      avatarUrl,
      isActive,
    },
    error: null,
  };
}
