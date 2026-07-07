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

function getRelationValue(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function normalizeAccessValue(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function isUserAdministrationMembership(membership) {
  const role = getRelationValue(membership?.roles);
  const department = getRelationValue(membership?.departments);

  const departmentName = normalizeAccessValue(department?.name);
  const roleName = normalizeAccessValue(role?.role_name);
  const roleCode = normalizeAccessValue(role?.role_code);

  return (
    departmentName === "INFORMATICA" &&
    (roleName === "ENCARGADO" || roleCode === "ENCARGADO")
  );
}

export async function getCorporateUserData(userId, authEmail) {
  // Perfil base
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email, name, surname, identification, phone, is_active")
    .eq("user_id", userId)
    .maybeSingle();

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
    .select(`
      company_id,
      department_id,
      role_id,
      roles (
        role_id,
        role_name,
        role_code,
        description
      ),
      departments (
        department_id,
        name,
        email
      )
    `)
    .eq("user_id", userId);

  if (memError && !memError.message.includes("does not exist")) {
    return { data: null, error: memError };
  }

  let role = null;
  let companies = [];
  let department = null;
  const primaryMembership =
    memberships?.find(isUserAdministrationMembership) ||
    memberships?.[0] ||
    null;

  // Obtener roles
  if (primaryMembership) {
    const membershipRole = getRelationValue(primaryMembership.roles);

    if (membershipRole) {
      role = {
        id: membershipRole.role_id,
        name: membershipRole.role_name,
        code: membershipRole.role_code,
        description: membershipRole.description,
      };
    }

    const roleId = primaryMembership.role_id;
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
  if (primaryMembership) {
    const membershipDepartment = getRelationValue(
      primaryMembership.departments,
    );

    if (membershipDepartment) {
      department = {
        id: membershipDepartment.department_id,
        name: membershipDepartment.name,
        email: membershipDepartment.email,
      };
    }

    const deptId = primaryMembership.department_id;
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
        name: c.commercial_name,
        companyName: c.company_name,
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
