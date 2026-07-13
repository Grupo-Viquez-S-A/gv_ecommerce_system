import { RiArrowDownSFill, RiCheckboxCircleFill, RiCloseCircleFill, RiDeleteBinFill, RiEditFill, RiEyeFill, RiFilterLine, RiSearchLine, RiShieldUserFill, RiUserFill, RiUserSharedFill } from "react-icons/ri";

export default function AdminUsersTab({ activeTab, usersError, loadUsers, selectedUsers, search, setSearch, statusFilter, setStatusFilter, filtered, users, usersLoading, toggleSelectAll, toggleSelectUser, openProfileDrawer, openEditDrawer, setDeactivateModal, setDeleteModal }) {
  return <>
        {activeTab === "usuarios" && (
          <>
            {usersError && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3">
                <p className="text-sm text-red-300">
                  {usersError}
                </p>

                <button
                  type="button"
                  onClick={loadUsers}
                  className="text-sm font-medium text-red-200 hover:text-white underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mb-4 bg-[#C9A227]/15 border border-[#C9A227]/50 rounded-xl px-5 py-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white">
                  <span className="text-[#C9A227] font-bold">
                    {selectedUsers.length}
                  </span>{" "}
                  usuarios seleccionados
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiCheckboxCircleFill size={13} />
                    Activar
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiCloseCircleFill size={13} />
                    Desactivar
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-[#2a3550] text-gray-300 hover:bg-[#2a3448] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiShieldUserFill size={13} />
                    Cambiar Rol
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RiDeleteBinFill size={13} />
                    Eliminar
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <RiSearchLine
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
                />
              </div>

              <div className="relative">
                <RiFilterLine
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>

                <RiArrowDownSFill
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="hidden md:block bg-[#141d2e] border border-[#2a3550] rounded-xl overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a3550]">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedUsers.length === filtered.length &&
                          filtered.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="accent-[#C9A227] w-4 h-4 rounded cursor-pointer"
                      />
                    </th>

                    {[
                      "USUARIO",
                      "CORREO",
                      "TELEFONO",
                      "ROL",
                      "EMPRESA",
                      "ESTADO",
                      "ULTIMA ACTIVIDAD",
                      "ACCIONES",
                    ].map((column) => (
                      <th
                        key={column}
                        className="text-left text-xs text-gray-500 font-semibold uppercase tracking-wider px-4 py-3"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {usersLoading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-gray-400"
                      >
                        Cargando usuarios autorizados para e-commerce...
                      </td>
                    </tr>
                  )}

                  {!usersLoading &&
                    filtered.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b border-[#2a3550] last:border-0 hover:bg-[#1c2538] transition-colors ${selectedUsers.includes(user.id)
                          ? "bg-[#C9A227]/10"
                          : ""
                          }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleSelectUser(user.id)}
                            className="accent-[#C9A227] w-4 h-4 rounded cursor-pointer"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.initials}
                            </div>

                            <span className="font-medium text-white">
                              {user.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-400">
                          {user.email}
                        </td>

                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {user.phone}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${user.roleColor}`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-gray-300 text-xs">
                          {user.companies?.[0] || user.company}
                        </td>

                        <td className="px-4 py-3">
                          {user.status === "Activo" ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full w-fit">
                              <RiCheckboxCircleFill size={12} />
                              Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full w-fit">
                              <RiCloseCircleFill size={12} />
                              Inactivo
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {user.lastActivity}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openProfileDrawer(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Ver perfil"
                            >
                              <RiEyeFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditDrawer(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <RiEditFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeactivateModal(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                              title="Desactivar"
                            >
                              <RiUserSharedFill size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal(user)}
                              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <RiDeleteBinFill size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {!usersLoading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#2a3550] flex items-center justify-center text-gray-600">
                    <RiUserFill size={28} />
                  </div>

                  <p className="text-sm text-gray-500">
                    No se encontraron usuarios
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("Todos");
                    }}
                    className="text-xs text-[#C9A227] hover:underline cursor-pointer"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}

              <div className="px-5 py-3 border-t border-[#2a3550]">
                <span className="text-xs text-gray-500">
                  Mostrando {filtered.length > 0 ? 1 : 0} a {filtered.length} de{" "}
                  {users.length} usuarios
                </span>
              </div>
            </div>

            <div className="md:hidden space-y-3 mb-5">
              {!usersLoading && filtered.length === 0 && (
                <div className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-8 text-center text-sm text-gray-500">
                  No se encontraron usuarios.
                </div>
              )}

              {!usersLoading && filtered.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#141d2e] border border-[#2a3550] rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.initials}
                      </div>

                      <div>
                        <div className="font-medium text-white text-sm">
                          {user.name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>

                        <div className="text-xs text-gray-600">
                          {user.phone}
                        </div>
                      </div>
                    </div>

                    {user.status === "Activo" ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                        <RiCheckboxCircleFill size={11} />
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                        <RiCloseCircleFill size={11} />
                        Inactivo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.roleColor}`}
                      >
                        {user.role}
                      </span>

                      <span className="text-xs text-gray-500">
                        {user.companies?.[0] || user.company}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openProfileDrawer(user)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <RiEyeFill size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditDrawer(user)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-[#C9A227]/15 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <RiEditFill size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteModal(user)}
                        className="w-7 h-7 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <RiDeleteBinFill size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    {user.lastActivity}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
  </>;
}

