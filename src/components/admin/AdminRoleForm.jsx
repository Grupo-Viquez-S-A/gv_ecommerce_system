import { AdminFormField as FormField } from "./AdminViewHelpers.jsx";

export default function AdminRoleForm({ drawerMode, roleForm, setRoleForm, roleFormError }) {
  return <>
          {(drawerMode === "role" || drawerMode === "editRole") && (
            <div className="space-y-5">
              {roleFormError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {roleFormError}
                </div>
              )}

              <FormField
                label="Nombre del Rol"
                placeholder="Ej. Gerente de Ventas"
                value={roleForm.name}
                onChange={(value) =>
                  setRoleForm({
                    ...roleForm,
                    name: value,
                  })
                }
                icon="#"
              />

              <FormField
                label="Codigo del Rol"
                placeholder="Ej. sales_manager"
                value={roleForm.code}
                onChange={(value) =>
                  setRoleForm({
                    ...roleForm,
                    code: value,
                  })
                }
              />

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Descripción
                </label>

                <textarea
                  placeholder="Ej. Acceso completo al módulo de ventas y reportes."
                  value={roleForm.description}
                  onChange={(event) =>
                    setRoleForm({
                      ...roleForm,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Estado
                </label>

                <div className="flex gap-5">
                  {[
                    { value: true, label: "Activo", color: "border-green-400", dot: "bg-green-400" },
                    { value: false, label: "Inactivo", color: "border-red-400", dot: "bg-red-400" },
                  ].map((status) => (
                    <button
                      key={status.label}
                      type="button"
                      onClick={() =>
                        setRoleForm({
                          ...roleForm,
                          isActive: status.value,
                        })
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${roleForm.isActive === status.value
                          ? status.color
                          : "border-gray-600"
                          }`}
                      >
                        {roleForm.isActive === status.value && (
                          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                        )}
                      </span>

                      <span
                        className={`text-sm ${roleForm.isActive === status.value
                          ? "text-white"
                          : "text-gray-400"
                          }`}
                      >
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Color del Badge
                </label>

                <div className="flex gap-3 flex-wrap">
                  {[
                    {
                      value: "azul",
                      label: "Azul",
                      dot: "bg-[#60a5fa]",
                    },
                    {
                      value: "morado",
                      label: "Morado",
                      dot: "bg-[#c084fc]",
                    },
                    {
                      value: "verde",
                      label: "Verde",
                      dot: "bg-[#4ade80]",
                    },
                    {
                      value: "amarillo",
                      label: "Amarillo",
                      dot: "bg-[#fbbf24]",
                    },
                    {
                      value: "rojo",
                      label: "Rojo",
                      dot: "bg-[#f87171]",
                    },
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setRoleForm({
                          ...roleForm,
                          color: color.value,
                        })
                      }
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${roleForm.color === color.value
                        ? "border-white/40 text-white"
                        : "border-[#2a3550] text-gray-500 hover:text-gray-300"
                        } cursor-pointer`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${color.dot}`}
                      />
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
  </>;
}

