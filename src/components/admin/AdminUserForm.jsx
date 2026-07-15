import { RiArrowDownSFill, RiCheckLine } from "react-icons/ri";
import { formatPhoneNumber } from "../../utils/inputMasks.js";
import { AdminFormField as FormField } from "./AdminViewHelpers.jsx";

export default function AdminUserForm({ drawerMode, form, setForm, adminCatalogsLoading, adminCatalogsError, availableRoles, availableDepartments, availableCompanies, toggleCompanyInForm, saveUserError }) {
  return <>
          {(drawerMode === "create" || drawerMode === "edit") && (
            <div className="space-y-5">
              <FormField
                label="Nombre Completo"
                placeholder="Ej. Juan Pérez Gómez"
                value={form.name}
                onChange={(value) =>
                  setForm({
                    ...form,
                    name: value,
                  })
                }
                icon="U"
              />

              <FormField
                label="Correo Electrónico"
                placeholder="Ej. juan.perez@empresa.com"
                value={form.email}
                onChange={(value) =>
                  setForm({
                    ...form,
                    email: value,
                  })
                }
                type="email"
                icon="@"
              />

              <FormField
                label="Teléfono"
                placeholder="Ej. 88888888"
                value={form.phone}
                onChange={(value) =>
                  setForm({
                    ...form,
                    phone: formatPhoneNumber(value),
                  })
                }
                type="tel"
                icon="T"
              />

              {drawerMode === "create" && (
                <FormField
                  label="Contraseña Temporal"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      password: value,
                    })
                  }
                  type="text"
                  icon="*"
                />
              )}

              {adminCatalogsError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {adminCatalogsError}
                </div>
              )}

              {saveUserError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {saveUserError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Empresas Asignadas
                </label>

                <div className="space-y-2">
                  {availableCompanies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => toggleCompanyInForm(company.id)}
                      className="w-full flex items-center gap-3 text-left cursor-pointer group p-2 rounded-lg hover:bg-[#1c2538] transition-colors"
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form.companies.includes(company.id)
                          ? "border-[#C9A227] bg-[#C9A227]"
                          : "border-[#2a3448]"
                          }`}
                      >
                        {form.companies.includes(company.id) && (
                          <RiCheckLine
                            size={10}
                            className="text-white"
                          />
                        )}
                      </span>

                      <span
                        className={`text-sm ${form.companies.includes(company.id)
                          ? "text-white"
                          : "text-gray-400"
                          }`}
                      >
                        {company.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Departamento
                </label>

                <div className="relative">
                  <select
                    value={form.departmentId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        departmentId: event.target.value,
                      })
                    }
                    disabled={adminCatalogsLoading}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer disabled:opacity-60"
                  >
                    <option value="">
                      {adminCatalogsLoading
                        ? "Cargando departamentos..."
                        : "Seleccionar departamento"}
                    </option>

                    {availableDepartments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.label}
                      </option>
                    ))}
                  </select>

                  <RiArrowDownSFill
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Rol
                </label>

                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        role: event.target.value,
                      })
                    }
                    disabled={adminCatalogsLoading}
                    className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer disabled:opacity-60"
                  >
                    <option value="">
                      {adminCatalogsLoading ? "Cargando roles..." : "Seleccionar rol"}
                    </option>

                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>

                  <RiArrowDownSFill
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Estado
                </label>

                <div className="flex gap-5">
                  {["Activo", "Inactivo"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          status,
                        })
                      }
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${form.status === status
                          ? status === "Activo"
                            ? "border-green-400"
                            : "border-red-400"
                          : "border-gray-600"
                          }`}
                      >
                        {form.status === status && (
                          <span
                            className={`w-2 h-2 rounded-full ${status === "Activo"
                              ? "bg-green-400"
                              : "bg-red-400"
                              }`}
                          />
                        )}
                      </span>

                      <span
                        className={`text-sm ${form.status === status
                          ? "text-white"
                          : "text-gray-400"
                          }`}
                      >
                        {status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
  </>;
}
