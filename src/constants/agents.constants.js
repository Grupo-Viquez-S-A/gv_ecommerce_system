export const AGENT_COMPANIES = [
  "Todas",
  "Grupo Víquez",
  "Textiles de Occidente",
  "Constructora Víquez",
  "Pacific Pet Food",
  "Occidente Lab",
  "Agro Occidente Group",
];

export const AGENT_STATUSES = ["Activo", "Inactivo"];

export const AGENT_DRAWER_MODES = {
  CREATE: "create",
  EDIT: "edit",
  VIEW: "view",
};

export const createEmptyAgentForm = () => ({
  name: "",
  email: "",
  phone: "",
  company: "",
  territory: "",
  commission: "",
  status: "Activo",
  notes: "",
});