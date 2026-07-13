import { RiCheckboxCircleFill, RiCloseCircleFill, RiDeleteBinFill, RiEditFill, RiShieldUserFill } from "react-icons/ri";

export default function AdminRolesTab({ activeTab, rolesError, rolesLoading, roleRows, openEditRoleDrawer, handleDeleteRole, savingRole }) {
  return <>
        {activeTab === "roles" && (
          <div className="space-y-4">
            <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2a3550] flex items-center gap-2">
                <RiShieldUserFill
                  size={16}
                  className="text-[#C9A227]"
                />

                <h3 className="text-sm font-semibold text-white">
                  Roles del Sistema
                </h3>
              </div>

              {rolesError && (
                <div className="mx-5 mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {rolesError}
                </div>
              )}

              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a3550]">
                      {[
                        "ROL",
                        "USUARIOS ASIGNADOS",
                        "CODIGO",
                        "ESTADO",
                        "ACCIONES",
                      ].map((column) => (
                        <th
                          key={column}
                          className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-5 py-3"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {rolesLoading && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-sm text-gray-400"
                        >
                          Cargando roles...
                        </td>
                      </tr>
                    )}

                    {!rolesLoading && roleRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-sm text-gray-400"
                        >
                          No se encontraron roles registrados.
                        </td>
                      </tr>
                    )}

                    {!rolesLoading && roleRows.map((role) => (
                      <tr
                        key={role.id}
                        className="border-b border-[#2a3550] last:border-0 hover:bg-[#1c2538] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            <span
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${role.badge}`}
                            >
                              {role.name}
                            </span>

                            {role.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {role.assignedUsers.slice(0, 3).map((user) => (
                                <div
                                  key={user.id}
                                  className="w-6 h-6 rounded-full border-2 border-[#141d2e] flex items-center justify-center text-[9px] font-bold text-white"
                                  style={{
                                    backgroundColor: user.color,
                                  }}
                                >
                                  {user.initials}
                                </div>
                              ))}
                            </div>

                            <span className="text-gray-400 text-sm">
                              {role.users} usuarios
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-gray-400 text-xs font-mono">
                            {role.code || "sin_codigo"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${role.isActive
                              ? "text-green-400 bg-green-400/10"
                              : "text-red-400 bg-red-400/10"
                              }`}
                          >
                            {role.isActive ? (
                              <RiCheckboxCircleFill size={11} />
                            ) : (
                              <RiCloseCircleFill size={11} />
                            )}
                            {role.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditRoleDrawer(role)}
                              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1c2538] hover:bg-[#C9A227]/15 border border-[#2a3550] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <RiEditFill size={12} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role)}
                              disabled={savingRole}
                              className="flex items-center gap-1.5 text-xs text-red-300 hover:text-white bg-[#1c2538] hover:bg-red-500/20 border border-[#2a3550] px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                            >
                              <RiDeleteBinFill size={12} />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-[#2a3550]">
                {rolesLoading && (
                  <div className="p-4 text-sm text-gray-400">
                    Cargando roles...
                  </div>
                )}

                {!rolesLoading && roleRows.length === 0 && (
                  <div className="p-4 text-sm text-gray-400">
                    No se encontraron roles registrados.
                  </div>
                )}

                {!rolesLoading && roleRows.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${role.badge}`}
                      >
                        {role.name}
                      </span>

                      <div className="text-xs text-gray-500 mt-2">
                        {role.users} usuarios - {role.code || "sin_codigo"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditRoleDrawer(role)}
                        className="text-xs text-[#C9A227] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RiEditFill size={12} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role)}
                        disabled={savingRole}
                        className="text-xs text-red-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-60"
                      >
                        <RiDeleteBinFill size={12} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
  </>;
}

