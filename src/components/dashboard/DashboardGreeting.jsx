export default function DashboardGreeting({ user, currentCompany }) {
  const userName = user?.fullName || "Usuario";
  const roleName = user?.role?.name || "Usuario";
  const departmentName = user?.department?.name;
  const companyName =
    currentCompany?.name ||
    user?.activeCompany?.name ||
    "Todas las Empresas";

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white mb-1">
        Bienvenido, {userName}
      </h1>

      <p className="text-sm text-gray-400">
        {roleName}
        {departmentName ? ` - ${departmentName}` : ""}
        {" · "}
        Vista: {companyName}
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Resumen general del desempeño comercial del grupo, equipos y
        cumplimiento de metas.
      </p>
    </div>
  );
}

