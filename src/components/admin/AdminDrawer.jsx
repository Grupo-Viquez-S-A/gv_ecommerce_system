import { RiEditFill, RiShieldStarFill, RiUserAddFill, RiUserFill } from "react-icons/ri";
import AdminUserForm from "./AdminUserForm.jsx";
import AdminRoleForm from "./AdminRoleForm.jsx";
import AdminPermissionsForm from "./AdminPermissionsForm.jsx";
import AdminProfileDetails from "./AdminProfileDetails.jsx";

export default function AdminDrawer({ drawerOpen, closeDrawer, drawerMode, form, setForm, adminCatalogsLoading, adminCatalogsError, availableRoles, availableDepartments, availableCompanies, toggleCompanyInForm, roleForm, setRoleForm, roleFormError, editRole, rolePermissions, setRolePermissions, togglePermission, savingUser, saveUserError, savingRole, handleSaveDrawer, profileUser, openEditDrawer, PERMISSION_SECTIONS }) {
  return <>
      {drawerOpen && (
        <button
          type="button"
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-default"
          aria-label="Cerrar panel lateral"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full bg-[#141d2e] border-l border-[#2a3550] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${drawerMode === "editRole"
          ? "w-full max-w-lg"
          : "w-full max-w-md"
          } ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#2a3550] px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {drawerMode === "create" && (
                <>
                  <RiUserAddFill
                    size={20}
                    className="text-[#C9A227]"
                  />
                  Nuevo Usuario
                </>
              )}

              {drawerMode === "edit" && (
                <>
                  <RiEditFill size={20} className="text-[#C9A227]" />
                  Editar Usuario
                </>
              )}

              {drawerMode === "role" && (
                <>
                  <RiShieldStarFill
                    size={20}
                    className="text-[#f59e0b]"
                  />
                  Nuevo Rol
                </>
              )}

              {drawerMode === "editRole" && (
                <>
                  <RiEditFill size={20} className="text-[#c084fc]" />
                  Editar Rol - {editRole?.name}
                </>
              )}

              {drawerMode === "profile" && (
                <>
                  <RiUserFill size={20} className="text-[#C9A227]" />
                  Perfil de Usuario
                </>
              )}
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              {drawerMode === "create" &&
                "Completa la información para crear un nuevo usuario."}
              {drawerMode === "edit" &&
                "Modifica la información del usuario seleccionado."}
              {drawerMode === "role" &&
                "Define un nuevo rol de acceso para el sistema."}
              {drawerMode === "editRole" &&
                "Modifica la informacion del rol seleccionado."}
              {drawerMode === "profile" &&
                "Información completa del usuario."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c2538] transition-colors"
            aria-label="Cerrar"
          >
            x
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <AdminUserForm
            drawerMode={drawerMode} form={form} setForm={setForm}
            adminCatalogsLoading={adminCatalogsLoading} adminCatalogsError={adminCatalogsError}
            availableRoles={availableRoles} availableDepartments={availableDepartments}
            availableCompanies={availableCompanies} toggleCompanyInForm={toggleCompanyInForm}
            saveUserError={saveUserError}
          />

          <AdminRoleForm drawerMode={drawerMode} roleForm={roleForm} setRoleForm={setRoleForm} roleFormError={roleFormError} />

          <AdminPermissionsForm
            drawerMode={drawerMode} editRole={editRole}
            PERMISSION_SECTIONS={PERMISSION_SECTIONS}
            rolePermissions={rolePermissions} setRolePermissions={setRolePermissions}
            togglePermission={togglePermission}
          />

          <AdminProfileDetails drawerMode={drawerMode} profileUser={profileUser} />
        </div>

        {drawerMode !== "profile" && (
          <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-[#FF0303] hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveDrawer}
              disabled={savingUser || savingRole}
              className="flex-1 bg-[#C9A227] hover:bg-[#B8921F] text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingUser || savingRole
                ? "Guardando..."
                : drawerMode === "create"
                ? "Guardar Usuario"
                : drawerMode === "edit"
                  ? "Guardar Cambios"
                  : drawerMode === "editRole"
                    ? "Guardar Rol"
                    : "Guardar Rol"}
            </button>
          </div>
        )}

        {drawerMode === "profile" && (
          <div className="flex flex-shrink-0 flex-col-reverse gap-3 border-t border-[#2a3550] px-4 py-4 sm:flex-row sm:px-6">
            <button
              type="button"
              onClick={() => {
                const userToEdit = profileUser;

                closeDrawer();

                window.setTimeout(() => {
                  if (userToEdit) {
                    openEditDrawer(userToEdit);
                  }
                }, 350);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C9A227]/15 text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <RiEditFill size={15} />
              Editar Usuario
            </button>

            <button
              type="button"
              onClick={closeDrawer}
              className="flex-1 bg-[#FF0303] hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
  </>;
}
