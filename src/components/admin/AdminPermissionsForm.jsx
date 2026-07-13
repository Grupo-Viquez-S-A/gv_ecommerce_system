import { RiCheckLine } from "react-icons/ri";

export default function AdminPermissionsForm({ drawerMode, editRole, PERMISSION_SECTIONS, rolePermissions, setRolePermissions, togglePermission }) {
  return <>
          {drawerMode === "permissions" && editRole && (
            <div className="space-y-5">
              {PERMISSION_SECTIONS.map((section) => {
                const activePermissions =
                  rolePermissions[editRole.name]?.[section.key] || [];

                const allChecked =
                  activePermissions.length === section.perms.length;

                return (
                  <div
                    key={section.key}
                    className="bg-[#1c2538] border border-[#2a3550] rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3550]">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <span className="text-gray-500">
                          {section.icon}
                        </span>

                        {section.label}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const indices = section.perms.map(
                            (_, index) => index,
                          );

                          setRolePermissions(
                            (previousPermissions) => ({
                              ...previousPermissions,
                              [editRole.name]: {
                                ...previousPermissions[editRole.name],
                                [section.key]: allChecked
                                  ? []
                                  : indices,
                              },
                            }),
                          );
                        }}
                        className={`text-xs font-medium transition-colors cursor-pointer ${allChecked
                          ? "text-[#C9A227] hover:text-gray-400"
                          : "text-gray-500 hover:text-[#C9A227]"
                          }`}
                      >
                        {allChecked
                          ? "Desmarcar todos"
                          : "Seleccionar todos"}
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 gap-2">
                      {section.perms.map(
                        (permission, permissionIndex) => (
                          <button
                            key={permission}
                            type="button"
                            onClick={() =>
                              togglePermission(
                                editRole.name,
                                section.key,
                                permissionIndex,
                              )
                            }
                            className="flex items-center gap-3 text-left cursor-pointer group p-1.5 rounded-lg hover:bg-[#22304a] transition-colors"
                          >
                            <span
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${activePermissions.includes(
                                permissionIndex,
                              )
                                ? "border-[#C9A227] bg-[#C9A227]"
                                : "border-[#2a3448]"
                                }`}
                            >
                              {activePermissions.includes(
                                permissionIndex,
                              ) && (
                                  <RiCheckLine
                                    size={10}
                                    className="text-white"
                                  />
                                )}
                            </span>

                            <span
                              className={`text-sm ${activePermissions.includes(
                                permissionIndex,
                              )
                                ? "text-white"
                                : "text-gray-500"
                                }`}
                            >
                              {permission}
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
  </>;
}

