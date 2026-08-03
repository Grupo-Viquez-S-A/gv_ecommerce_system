import { useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiBuilding2Fill,
  RiCloseLine,
  RiDeleteBinLine,
  RiMailLine,
  RiMapPinLine,
  RiPhoneLine,
  RiUserLine,
} from "react-icons/ri";

import { supabase } from "../../services/primarySupabaseClient.js";
import {
  createEmptyBranch,
  createEmptyPhone,
  createEmptyRepresentative,
} from "./clientFormDefaults.js";
import {
  formatLegalId,
  formatPhoneNumber,
} from "../../utils/inputMasks.js";
import BranchLocationMap from "./BranchLocationMap.jsx";

const PHONE_TYPES = [
  "General",
  "Oficina",
  "Móvil",
  "WhatsApp",
  "Otro",
];

const inputClassName =
  "w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A227] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const selectClassName =
  "w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

const labelClassName =
  "block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5";

function normalizePhone(phone = {}, index = 0, prefix = "phone") {
  return {
    ...phone,
    draftId:
      phone.draftId ||
      phone.phone_id ||
      phone.id ||
      `${prefix}-${index}`,
    phone: phone.phone || "",
    type: phone.type || "General",
    isPrimary:
      phone.isPrimary === true ||
      phone.is_primary === true,
  };
}

function normalizeRepresentative(representative = {}, index = 0) {
  return {
    ...representative,
    draftId:
      representative.draftId ||
      representative.representative_id ||
      representative.id ||
      `representative-${index}`,
    name: representative.name || "",
    email: representative.email || "",
    status:
      representative.status ||
      (representative.is_active === false ? "Inactivo" : "Activo"),
  };
}

function normalizeBranch(branch = {}, index = 0) {
  const sourcePhones = Array.isArray(branch.phones)
    ? branch.phones
    : branch.phone
      ? [
          {
            phone: branch.phone,
            type: "Oficina",
            isPrimary: true,
          },
        ]
      : [];

  return {
    ...branch,
    draftId:
      branch.draftId ||
      branch.branch_id ||
      branch.id ||
      `branch-${index}`,
    province: branch.province || "",
    district: branch.district || "",
    address: branch.address || "",
    latitude: branch.latitude ?? "",
    longitude: branch.longitude ?? "",
    locationAccuracy:
      branch.locationAccuracy ?? branch.location_accuracy_meters ?? "",
    status:
      branch.status ||
      (branch.is_active === false ? "Inactivo" : "Activo"),
    phones: sourcePhones.map((phone, phoneIndex) =>
      normalizePhone(
        phone,
        phoneIndex,
        `branch-${branch.branch_id || branch.id || index}-phone`,
      ),
    ),
    representatives: (branch.representatives || []).map(
      (representative, representativeIndex) =>
        normalizeRepresentative(representative, representativeIndex),
    ),
  };
}

function normalizeForm(form = {}) {
  const sourceClientPhones = Array.isArray(form.clientPhones)
    ? form.clientPhones
    : form.phone
      ? [
          {
            phone: form.phone,
            type: "General",
            isPrimary: true,
          },
        ]
      : [];

  return {
    ...form,
    name: form.name || "",
    identificationType:
      form.identificationType === "personal" ? "personal" : "legal",
    legalId: form.legalId || "",
    legalName: form.legalName || "",
    ownerName: form.ownerName || "",
    activityCode: form.activityCode || "",
    companyId: form.companyId || "",
    email: form.email || "",
    status: form.status === "Inactivo" ? "Inactivo" : "Activo",
    clientPhones: sourceClientPhones.map((phone, index) =>
      normalizePhone(phone, index, "client-phone"),
    ),
    branches: (form.branches || []).map((branch, index) =>
      normalizeBranch(branch, index),
    ),
  };
}

function SectionTitle({ icon, title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-[#C9A227]/15 text-[#C9A227] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white">{title}</h3>

          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className={labelClassName}>
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function PhoneList({
  phones = [],
  onChange,
  onAdd,
  onRemove,
  emptyMessage,
  primaryRadioName,
}) {
  return (
    <div className="space-y-3">
      {phones.length > 0 ? (
        phones.map((phoneItem, index) => (
          <div
            key={phoneItem.draftId}
            className="rounded-xl border border-[#2a3550] bg-[#1c2538] p-3"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs font-semibold text-gray-300">
                Teléfono {index + 1}
              </span>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="w-7 h-7 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-colors"
                title="Eliminar teléfono"
                aria-label={`Eliminar teléfono ${index + 1}`}
              >
                <RiDeleteBinLine size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_145px] gap-3">
              <div>
                <FieldLabel>Teléfono</FieldLabel>

                <div className="relative">
                  <RiPhoneLine
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    type="tel"
                    value={phoneItem.phone}
                    onChange={(event) =>
                      onChange(index, "phone", event.target.value)
                    }
                    placeholder="Ej. 22222222"
                    className={`${inputClassName} pl-9`}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Tipo</FieldLabel>

                <select
                  value={phoneItem.type}
                  onChange={(event) =>
                    onChange(index, "type", event.target.value)
                  }
                  className={selectClassName}
                >
                  {PHONE_TYPES.map((phoneType) => (
                    <option key={phoneType} value={phoneType}>
                      {phoneType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 mt-3 text-xs text-gray-300 cursor-pointer">
              <input
                type="radio"
                name={primaryRadioName}
                checked={phoneItem.isPrimary === true}
                onChange={() => onChange(index, "isPrimary", true)}
                className="accent-[#C9A227]"
              />
              Teléfono principal
            </label>
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-[#2a3550] bg-[#1c2538]/60 px-4 py-5 text-center text-xs text-gray-500">
          {emptyMessage}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-[#C9A227]/50 hover:border-[#C9A227] bg-[#C9A227]/5 hover:bg-[#C9A227]/10 text-[#C9A227] text-xs font-semibold py-2.5 rounded-lg transition-colors"
      >
        <RiAddLine size={15} />
        Agregar teléfono
      </button>
    </div>
  );
}

export default function ClientForm({ form, onChange }) {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");

  const currentForm = useMemo(() => normalizeForm(form), [form]);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanies() {
      try {
        setCompaniesLoading(true);
        setCompaniesError("");

        const { data, error } = await supabase
          .from("companies")
          .select(`
            company_id,
            company_name,
            commercial_name,
            is_active
          `)
          .order("commercial_name", {
            ascending: true,
            nullsFirst: false,
          });

        if (error) {
          throw error;
        }

        if (isMounted) {
          setCompanies(data || []);
        }
      } catch (error) {
        console.error("Error cargando empresas:", error);

        if (isMounted) {
          setCompanies([]);
          setCompaniesError(
            error.message ||
              "No fue posible cargar las empresas disponibles.",
          );
        }
      } finally {
        if (isMounted) {
          setCompaniesLoading(false);
        }
      }
    }

    loadCompanies();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleCompanies = useMemo(() => {
    return companies.filter(
      (company) =>
        company.is_active === true ||
        company.company_id === currentForm.companyId,
    );
  }, [companies, currentForm.companyId]);

  const updateForm = (updates) => {
    if (typeof onChange !== "function") {
      return;
    }

    onChange({
      ...currentForm,
      ...updates,
    });
  };

  const updateField = (field, value) => {
    updateForm({
      [field]:
        field === "legalId" && currentForm.identificationType === "legal"
          ? formatLegalId(value)
          : value,
    });
  };

  const updateClientPhone = (phoneIndex, field, value) => {
    const nextPhones = currentForm.clientPhones.map((phoneItem, index) => {
      if (field === "isPrimary" && value === true) {
        return {
          ...phoneItem,
          isPrimary: index === phoneIndex,
        };
      }

      if (index !== phoneIndex) {
        return phoneItem;
      }

      return {
        ...phoneItem,
        [field]: field === "phone" ? formatPhoneNumber(value) : value,
      };
    });

    updateForm({
      clientPhones: nextPhones,
    });
  };

  const addClientPhone = () => {
    updateForm({
      clientPhones: [
        ...currentForm.clientPhones,
        createEmptyPhone({
          type: "General",
          isPrimary: currentForm.clientPhones.length === 0,
        }),
      ],
    });
  };

  const removeClientPhone = (phoneIndex) => {
    const nextPhones = currentForm.clientPhones.filter(
      (_, index) => index !== phoneIndex,
    );

    const hasPrimaryPhone = nextPhones.some(
      (phoneItem) => phoneItem.isPrimary,
    );

    updateForm({
      clientPhones: nextPhones.map((phoneItem, index) => ({
        ...phoneItem,
        isPrimary:
          hasPrimaryPhone
            ? phoneItem.isPrimary
            : index === 0,
      })),
    });
  };

  const updateBranch = (branchIndex, field, value) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      return {
        ...branch,
        [field]: value,
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  const addBranch = () => {
    updateForm({
      branches: [...currentForm.branches, createEmptyBranch()],
    });
  };

  const removeBranch = (branchIndex) => {
    updateForm({
      branches: currentForm.branches.filter(
        (_, index) => index !== branchIndex,
      ),
    });
  };

  const updateBranchPhone = (branchIndex, phoneIndex, field, value) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      const nextPhones = branch.phones.map((phoneItem, currentPhoneIndex) => {
        if (field === "isPrimary" && value === true) {
          return {
            ...phoneItem,
            isPrimary: currentPhoneIndex === phoneIndex,
          };
        }

        if (currentPhoneIndex !== phoneIndex) {
          return phoneItem;
        }

        return {
          ...phoneItem,
          [field]: field === "phone" ? formatPhoneNumber(value) : value,
        };
      });

      return {
        ...branch,
        phones: nextPhones,
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  const addBranchPhone = (branchIndex) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      return {
        ...branch,
        phones: [
          ...branch.phones,
          createEmptyPhone({
            type: "Oficina",
            isPrimary: branch.phones.length === 0,
          }),
        ],
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  const removeBranchPhone = (branchIndex, phoneIndex) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      const nextPhones = branch.phones.filter(
        (_, currentPhoneIndex) => currentPhoneIndex !== phoneIndex,
      );

      const hasPrimaryPhone = nextPhones.some(
        (phoneItem) => phoneItem.isPrimary,
      );

      return {
        ...branch,
        phones: nextPhones.map((phoneItem, currentPhoneIndex) => ({
          ...phoneItem,
          isPrimary:
            hasPrimaryPhone
              ? phoneItem.isPrimary
              : currentPhoneIndex === 0,
        })),
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  const updateRepresentative = (
    branchIndex,
    representativeIndex,
    field,
    value,
  ) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      return {
        ...branch,
        representatives: branch.representatives.map(
          (representative, currentRepresentativeIndex) => {
            if (currentRepresentativeIndex !== representativeIndex) {
              return representative;
            }

            return {
              ...representative,
              [field]: value,
            };
          },
        ),
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  const addRepresentative = (branchIndex) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      return {
        ...branch,
        representatives: [
          ...branch.representatives,
          createEmptyRepresentative(),
        ],
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  const removeRepresentative = (branchIndex, representativeIndex) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      return {
        ...branch,
        representatives: branch.representatives.filter(
          (_, currentRepresentativeIndex) =>
            currentRepresentativeIndex !== representativeIndex,
        ),
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  return (
    <div className="space-y-7 pb-2">
      {/* Datos generales */}
      <section>
        <SectionTitle
          icon={<RiBuilding2Fill size={18} />}
          title="Datos generales"
          description="Información principal de la empresa cliente."
        />

        <div className="space-y-4">
          <div>
            <FieldLabel required>Nombre comercial</FieldLabel>

            <input
              type="text"
              value={currentForm.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ej. Hotel Los Laureles"
              className={inputClassName}
            />
          </div>

          <div>
            <FieldLabel required>Empresa del grupo</FieldLabel>

            <select
              value={currentForm.companyId}
              onChange={(event) =>
                updateField("companyId", event.target.value)
              }
              disabled={companiesLoading}
              className={selectClassName}
            >
              <option value="">
                {companiesLoading
                  ? "Cargando empresas..."
                  : "Selecciona una empresa"}
              </option>

              {visibleCompanies.map((company) => {
                const companyLabel =
                  company.commercial_name ||
                  company.company_name ||
                  "Empresa sin nombre";

                return (
                  <option
                    key={company.company_id}
                    value={company.company_id}
                  >
                    {companyLabel}
                    {company.is_active === false ? " (Inactiva)" : ""}
                  </option>
                );
              })}
            </select>

            {companiesError && (
              <p className="mt-1.5 text-xs text-red-400">
                {companiesError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Tipo de identificación</FieldLabel>

              <select
                value={currentForm.identificationType}
                onChange={(event) =>
                  updateField("identificationType", event.target.value)
                }
                required
                className={selectClassName}
              >
                <option value="legal">Cédula jurídica</option>
                <option value="personal">Número de identificación</option>
              </select>
            </div>

            <div>
              <FieldLabel required>Estado</FieldLabel>

              <select
                value={currentForm.status}
                onChange={(event) =>
                  updateField("status", event.target.value)
                }
                required
                className={selectClassName}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {currentForm.identificationType === "legal" ? (
            <>
              <div>
                <FieldLabel required>Cédula jurídica</FieldLabel>

                <input
                  type="text"
                  value={currentForm.legalId}
                  onChange={(event) =>
                    updateField("legalId", event.target.value)
                  }
                  required
                  placeholder="Ej. 3101123456"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel required>Razón social</FieldLabel>

                <input
                  type="text"
                  value={currentForm.legalName}
                  onChange={(event) =>
                    updateField("legalName", event.target.value)
                  }
                  required
                  placeholder="Ej. Hotel Los Laureles Sociedad Anónima"
                  className={inputClassName}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <FieldLabel required>
                  Datos del dueño (nombre y apellidos)
                </FieldLabel>

                <input
                  type="text"
                  value={currentForm.ownerName}
                  onChange={(event) =>
                    updateField("ownerName", event.target.value)
                  }
                  required
                  placeholder="Ej. María Rodríguez Vargas"
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel required>Número de identificación</FieldLabel>

                <input
                  type="text"
                  value={currentForm.legalId}
                  onChange={(event) =>
                    updateField("legalId", event.target.value)
                  }
                  required
                  placeholder="Ej. 1-1234-5678"
                  className={inputClassName}
                />
              </div>
            </>
          )}

          <div>
            <FieldLabel required>Código de actividad</FieldLabel>

            <input
              type="text"
              value={currentForm.activityCode}
              onChange={(event) =>
                updateField("activityCode", event.target.value)
              }
              required
              placeholder="Ej. 551001"
              className={inputClassName}
            />
          </div>

          <div>
            <FieldLabel required>Correo electrónico principal</FieldLabel>

            <div className="relative">
              <RiMailLine
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="email"
                value={currentForm.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                required
                placeholder="contacto@cliente.com"
                className={`${inputClassName} pl-9`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Teléfonos generales */}
      <section className="pt-6 border-t border-[#2a3550]">
        <SectionTitle
          icon={<RiPhoneLine size={18} />}
          title="Teléfonos generales"
          description="Estos teléfonos pertenecen al cliente, no a una sucursal."
        />

        <PhoneList
          phones={currentForm.clientPhones}
          onChange={updateClientPhone}
          onAdd={addClientPhone}
          onRemove={removeClientPhone}
          emptyMessage="No hay teléfonos generales registrados."
          primaryRadioName="client-primary-phone"
        />
      </section>

      {/* Sucursales */}
      <section className="pt-6 border-t border-[#2a3550]">
        <SectionTitle
          icon={<RiMapPinLine size={18} />}
          title="Sucursales"
          description="Cada sucursal se identifica por provincia, cantón y dirección."
          action={
            <button
              type="button"
              onClick={addBranch}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A227] hover:text-[#E0C34A] transition-colors whitespace-nowrap"
            >
              <RiAddLine size={16} />
              Agregar
            </button>
          }
        />

        <div className="space-y-5">
          {currentForm.branches.length > 0 ? (
            currentForm.branches.map((branch, branchIndex) => (
              <article
                key={branch.draftId}
                className="rounded-2xl border border-[#2a3550] bg-[#1c2538] overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#2a3550]">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Sucursal {branchIndex + 1}
                    </h4>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Ubicación, teléfonos y representantes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeBranch(branchIndex)}
                    className="w-8 h-8 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-colors"
                    title="Eliminar sucursal"
                    aria-label={`Eliminar sucursal ${branchIndex + 1}`}
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>

                <div className="p-4 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required>Provincia</FieldLabel>

                      <input
                        type="text"
                        value={branch.province}
                        onChange={(event) =>
                          updateBranch(
                            branchIndex,
                            "province",
                            event.target.value,
                          )
                        }
                        placeholder="Ej. Alajuela"
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Cantón</FieldLabel>

                      <input
                        type="text"
                        value={branch.district}
                        onChange={(event) =>
                          updateBranch(
                            branchIndex,
                            "district",
                            event.target.value,
                          )
                        }
                        placeholder="Ej. Grecia"
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel required>Dirección exacta</FieldLabel>

                    <textarea
                      value={branch.address}
                      onChange={(event) =>
                        updateBranch(
                          branchIndex,
                          "address",
                          event.target.value,
                        )
                      }
                      placeholder="Ej. Frente al parque central, local color blanco."
                      rows={3}
                      className={`${inputClassName} resize-none`}
                    />
                  </div>

                  <BranchLocationMap
                    latitude={branch.latitude}
                    longitude={branch.longitude}
                    accuracy={branch.locationAccuracy}
                  />

                  <div>
                    <FieldLabel>Estado de la sucursal</FieldLabel>

                    <select
                      value={branch.status}
                      onChange={(event) =>
                        updateBranch(
                          branchIndex,
                          "status",
                          event.target.value,
                        )
                      }
                      className={selectClassName}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-[#2a3550]">
                    <div className="mb-3">
                      <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                        Teléfonos de la sucursal
                      </h5>

                      <p className="text-xs text-gray-500 mt-1">
                        Se guardarán en la tabla <code>phones</code> usando el{" "}
                        <code>branch_id</code> de esta sucursal.
                      </p>
                    </div>

                    <PhoneList
                      phones={branch.phones}
                      onChange={(phoneIndex, field, value) =>
                        updateBranchPhone(
                          branchIndex,
                          phoneIndex,
                          field,
                          value,
                        )
                      }
                      onAdd={() => addBranchPhone(branchIndex)}
                      onRemove={(phoneIndex) =>
                        removeBranchPhone(branchIndex, phoneIndex)
                      }
                      emptyMessage="No hay teléfonos registrados para esta sucursal."
                      primaryRadioName={`branch-${branch.draftId}-primary-phone`}
                    />
                  </div>

                  <div className="pt-4 border-t border-[#2a3550]">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                          Representantes
                        </h5>

                        <p className="text-xs text-gray-500 mt-1">
                          Contactos asociados a esta sucursal.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => addRepresentative(branchIndex)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#C9A227] hover:text-[#E0C34A] transition-colors whitespace-nowrap"
                      >
                        <RiAddLine size={15} />
                        Agregar
                      </button>
                    </div>

                    {branch.representatives.length > 0 ? (
                      <div className="space-y-3">
                        {branch.representatives.map(
                          (representative, representativeIndex) => (
                            <div
                              key={representative.draftId}
                              className="rounded-xl border border-[#2a3550] bg-[#222e44] p-3"
                            >
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <span className="text-xs font-semibold text-gray-300">
                                  Representante {representativeIndex + 1}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeRepresentative(
                                      branchIndex,
                                      representativeIndex,
                                    )
                                  }
                                  className="w-7 h-7 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center transition-colors"
                                  title="Eliminar representante"
                                  aria-label={`Eliminar representante ${
                                    representativeIndex + 1
                                  }`}
                                >
                                  <RiCloseLine size={16} />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <FieldLabel required>
                                    Nombre completo
                                  </FieldLabel>

                                  <div className="relative">
                                    <RiUserLine
                                      size={16}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    />

                                    <input
                                      type="text"
                                      value={representative.name}
                                      onChange={(event) =>
                                        updateRepresentative(
                                          branchIndex,
                                          representativeIndex,
                                          "name",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Nombre del representante"
                                      className={`${inputClassName} pl-9`}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <FieldLabel>Correo electrónico</FieldLabel>

                                  <div className="relative">
                                    <RiMailLine
                                      size={16}
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    />

                                    <input
                                      type="email"
                                      value={representative.email}
                                      onChange={(event) =>
                                        updateRepresentative(
                                          branchIndex,
                                          representativeIndex,
                                          "email",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="representante@cliente.com"
                                      className={`${inputClassName} pl-9`}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <FieldLabel>Estado</FieldLabel>

                                  <select
                                    value={representative.status}
                                    onChange={(event) =>
                                      updateRepresentative(
                                        branchIndex,
                                        representativeIndex,
                                        "status",
                                        event.target.value,
                                      )
                                    }
                                    className={selectClassName}
                                  >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">
                                      Inactivo
                                    </option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#2a3550] bg-[#222e44]/50 px-4 py-5 text-center text-xs text-gray-500">
                        Esta sucursal todavía no tiene representantes.
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-[#2a3550] bg-[#1c2538]/60 px-4 py-8 text-center">
              <p className="text-sm text-gray-400">
                Este cliente no tiene sucursales registradas.
              </p>

              <button
                type="button"
                onClick={addBranch}
                className="mt-3 text-xs font-semibold text-[#C9A227] hover:text-[#E0C34A] transition-colors"
              >
                Agregar la primera sucursal
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
