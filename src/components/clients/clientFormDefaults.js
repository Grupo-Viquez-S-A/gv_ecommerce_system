function createDraftId(prefix = "item") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyPhone(overrides = {}) {
  return { draftId: createDraftId("phone"), phone: "", type: "General", isPrimary: false, ...overrides };
}

export function createEmptyRepresentative(overrides = {}) {
  return { draftId: createDraftId("representative"), name: "", email: "", status: "Activo", ...overrides };
}

export function createEmptyBranch(overrides = {}) {
  return {
    draftId: createDraftId("branch"),
    province: "",
    city: "",
    district: "",
    address: "",
    latitude: "",
    longitude: "",
    locationAccuracy: "",
    status: "Activo",
    phones: [createEmptyPhone({ type: "Oficina", isPrimary: true })],
    representatives: [],
    ...overrides,
  };
}

export function createEmptyClientForm() {
  return {
    name: "",
    identificationType: "legal",
    legalId: "",
    legalName: "",
    ownerName: "",
    activityCode: "",
    taxStatus: "",
    companyId: "",
    email: "",
    status: "Activo",
    clientPhones: [createEmptyPhone({ type: "General", isPrimary: true })],
    branches: [createEmptyBranch()],
  };
}
