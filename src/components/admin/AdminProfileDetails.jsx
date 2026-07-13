export default function AdminProfileDetails({ drawerMode, profileUser }) {
  return <>
          {drawerMode === "profile" && profileUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 pb-5 border-b border-[#2a3550]">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: profileUser.color }}
                >
                  {profileUser.initials}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {profileUser.name}
                  </h3>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${profileUser.roleColor}`}
                  >
                    {profileUser.role}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Datos Personales
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "Nombre",
                      value: profileUser.name,
                    },
                    {
                      label: "Correo",
                      value: profileUser.email,
                    },
                    {
                      label: "Teléfono",
                      value: profileUser.phone,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center gap-4 py-2 border-b border-[#2a3550]"
                    >
                      <span className="text-xs text-gray-500">
                        {label}
                      </span>

                      <span className="text-sm text-white text-right">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Información Laboral
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "Rol",
                      value: profileUser.role,
                    },
                    {
                      label: "Empresa",
                      value:
                        profileUser.companies?.[0] ||
                        profileUser.company,
                    },
                    {
                      label: "Departamento",
                      value: profileUser.department,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center gap-4 py-2 border-b border-[#2a3550]"
                    >
                      <span className="text-xs text-gray-500">
                        {label}
                      </span>

                      <span className="text-sm text-white text-right">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Acceso al Sistema
                </p>

                <div className="space-y-3">
                  {[
                    {
                      label: "Fecha de creación",
                      value: profileUser.created,
                    },
                    {
                      label: "ULTIMA ACTIVIDAD",
                      value: profileUser.lastActivity,
                    },
                    {
                      label: "Estado",
                      value: profileUser.status,
                    },
                    {
                      label: "2FA",
                      value: "No disponible",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center gap-4 py-2 border-b border-[#2a3550]"
                    >
                      <span className="text-xs text-gray-500">
                        {label}
                      </span>

                      <span
                        className={`text-sm text-right ${label === "Estado"
                          ? value === "Activo"
                            ? "text-green-400"
                            : "text-red-400"
                          : label === "2FA"
                            ? value === "Activo"
                              ? "text-green-400"
                              : "text-gray-500"
                            : "text-white"
                          }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
  </>;
}

