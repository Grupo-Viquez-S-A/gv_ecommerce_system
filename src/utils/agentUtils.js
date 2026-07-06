export function filterAgents(agents = [], filters = {}) {
  const {
    search = "",
    statusFilter = "Todos",
    companyFilter = "Todas",
  } = filters;

  const normalizedSearch = search.trim().toLowerCase();

  return agents.filter((agent) => {
    const agentName = agent.name?.toLowerCase() || "";
    const agentEmail = agent.email?.toLowerCase() || "";
    const agentCompany = agent.company?.toLowerCase() || "";

    const matchesSearch =
      !normalizedSearch ||
      agentName.includes(normalizedSearch) ||
      agentEmail.includes(normalizedSearch) ||
      agentCompany.includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "Todos" || agent.status === statusFilter;

    const matchesCompany =
      companyFilter === "Todas" || agent.company === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });
}