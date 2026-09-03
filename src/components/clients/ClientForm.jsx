import { useEffect, useMemo, useState } from "react";
import { useCallback, useRef } from "react";
import {
  RiAddLine,
  RiBuilding2Fill,
  RiDeleteBinLine,
  RiMailLine,
  RiMapPinLine,
  RiPhoneLine,
} from "react-icons/ri";

import { supabase } from "../../services/primarySupabaseClient.js";
import {
  isValidCostaRicaIdentificationForHacienda,
  lookupCostaRicaTaxpayerByIdentification,
} from "../../services/haciendaTaxpayerService.js";
import {
  createEmptyBranch,
  createEmptyPhone,
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

function isBlankCoordinate(value) {
  return value === "" || value === null || value === undefined;
}

function isValidCoordinate(value, min, max) {
  if (isBlankCoordinate(value)) {
    return true;
  }

  const numericValue = Number(value);

  return (
    Number.isFinite(numericValue) &&
    numericValue >= min &&
    numericValue <= max
  );
}

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
    city: branch.city || "",
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
    taxStatus: form.taxStatus || "",
    companyId: form.companyId || "",
    email: form.email || "",
    status: form.status === "Inactivo" ? "Inactivo" : "Activo",
    clientPhones: sourceClientPhones.map((phone, index) =>
      normalizePhone(phone, index, "client-phone"),
    ),
    branches:
      form.branches?.length > 0
        ? form.branches.map((branch, index) => normalizeBranch(branch, index))
        : [createEmptyBranch()],
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
  disabled = false,
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
                disabled={disabled}
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
                    disabled={disabled}
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
                  disabled={disabled}
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
                disabled={disabled}
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
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-[#C9A227]/50 hover:border-[#C9A227] bg-[#C9A227]/5 hover:bg-[#C9A227]/10 text-[#C9A227] text-xs font-semibold py-2.5 rounded-lg transition-colors"
      >
        <RiAddLine size={15} />
        Agregar teléfono
      </button>
    </div>
  );
}

export default function ClientForm({
  form,
  onChange,
  mode = "create",
  allowLocationOnlyEdit = false,
}) {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");
  const [customerLocationLoading, setCustomerLocationLoading] = useState(false);
  const [customerLocationError, setCustomerLocationError] = useState("");
  const [taxpayerLookupLoading, setTaxpayerLookupLoading] = useState(false);
  const [taxpayerLookupMessage, setTaxpayerLookupMessage] = useState("");
  const lastTaxpayerLookupKeyRef = useRef("");

  const currentForm = useMemo(() => normalizeForm(form), [form]);
  const isLocationOnlyEdit =
    mode === "edit" && allowLocationOnlyEdit;
  const fieldsDisabled = isLocationOnlyEdit;
  const canEditBranchLocation = mode !== "view";
  const customerLocation = currentForm.branches[0] || createEmptyBranch();
  const hasCoordinateInput =
    !isBlankCoordinate(customerLocation.latitude) ||
    !isBlankCoordinate(customerLocation.longitude);
  const hasInvalidLatitude = !isValidCoordinate(
    customerLocation.latitude,
    -90,
    90,
  );
  const hasInvalidLongitude = !isValidCoordinate(
    customerLocation.longitude,
    -180,
    180,
  );
  const hasIncompleteCoordinates =
    hasCoordinateInput &&
    (isBlankCoordinate(customerLocation.latitude) ||
      isBlankCoordinate(customerLocation.longitude));

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

  const updateForm = useCallback((updates) => {
    if (typeof onChange !== "function") {
      return;
    }

    onChange({
      ...currentForm,
      ...updates,
    });
  }, [currentForm, onChange]);

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

  const updateBranchLocation = (branchIndex, nextLocation = {}) => {
    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== branchIndex) {
        return branch;
      }

      return {
        ...branch,
        latitude: nextLocation.latitude ?? "",
        longitude: nextLocation.longitude ?? "",
        locationAccuracy: nextLocation.locationAccuracy ?? "",
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  const updateCustomerLocationField = (field, value) => {
    updateBranch(0, field, value);
  };

  const updateCustomerCoordinateField = (field, value) => {
    const normalizedValue = value.replace(",", ".").trim();

    const nextBranches = currentForm.branches.map((branch, index) => {
      if (index !== 0) {
        return branch;
      }

      return {
        ...branch,
        [field]: normalizedValue,
        locationAccuracy: "",
      };
    });

    updateForm({
      branches: nextBranches,
    });
  };

  useEffect(() => {
    if (mode === "view" || fieldsDisabled) {
      return undefined;
    }

    const lookupKey = `${currentForm.identificationType}:${currentForm.legalId || ""}`;

    if (!isValidCostaRicaIdentificationForHacienda(currentForm.legalId)) {
      lastTaxpayerLookupKeyRef.current = "";
      Promise.resolve().then(() => {
        setTaxpayerLookupLoading(false);
        setTaxpayerLookupMessage("");
      });
      return undefined;
    }

    if (lastTaxpayerLookupKeyRef.current === lookupKey) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setTaxpayerLookupLoading(true);
        setTaxpayerLookupMessage("");

        const taxpayer = await lookupCostaRicaTaxpayerByIdentification(
          currentForm.legalId,
        );

        lastTaxpayerLookupKeyRef.current = lookupKey;

        if (!taxpayer) {
          setTaxpayerLookupMessage(
            "No se encontraron datos en Hacienda para esta identificación.",
          );
          return;
        }

        updateForm({
          legalName:
            currentForm.identificationType === "legal"
              ? taxpayer.legalName || currentForm.legalName
              : "",
          ownerName:
            currentForm.identificationType === "personal"
              ? taxpayer.ownerName || currentForm.ownerName
              : "",
          activityCode: taxpayer.activityCode || currentForm.activityCode,
          taxStatus: taxpayer.taxStatus || currentForm.taxStatus,
          name: currentForm.name || taxpayer.name || "",
        });

        setTaxpayerLookupMessage(
          "Datos tributarios cargados desde Hacienda.",
        );
      } catch (error) {
        console.error("Taxpayer lookup error:", error);
        setTaxpayerLookupMessage(
          error?.message || "No fue posible consultar Hacienda.",
        );
      } finally {
        setTaxpayerLookupLoading(false);
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentForm.activityCode,
    currentForm.identificationType,
    currentForm.legalId,
    currentForm.legalName,
    currentForm.name,
    currentForm.ownerName,
    currentForm.taxStatus,
    fieldsDisabled,
    mode,
    updateForm,
  ]);

  const handleUseCurrentCustomerLocation = () => {
    if (!navigator.geolocation) {
      setCustomerLocationError(
        "Este dispositivo o navegador no permite obtener la ubicación.",
      );
      return;
    }

    setCustomerLocationLoading(true);
    setCustomerLocationError("");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateBranchLocation(0, {
          latitude: coords.latitude.toFixed(7),
          longitude: coords.longitude.toFixed(7),
          locationAccuracy: Number.isFinite(coords.accuracy)
            ? coords.accuracy.toFixed(1)
            : "",
        });
        setCustomerLocationLoading(false);
      },
      (error) => {
        const errorMessages = {
          1: "Permite el acceso a tu ubicación para registrar el cliente.",
          2: "No fue posible determinar la ubicación actual.",
          3: "La solicitud de ubicación tardó demasiado. Inténtalo nuevamente.",
        };

        setCustomerLocationError(
          errorMessages[error.code] ||
            "No fue posible obtener la ubicación actual.",
        );
        setCustomerLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      },
    );
  };

  return (
    <div className="space-y-7 pb-2">
      {isLocationOnlyEdit && (
        <div className="rounded-xl border border-[#C9A227]/25 bg-[#C9A227]/10 px-4 py-3 text-sm text-[#F4E5A8]">
          Como Agente de ventas, solo puedes actualizar la ubicación exacta del cliente desde el mapa.
        </div>
      )}

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
              disabled={fieldsDisabled}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ej. Hotel Los Laureles"
              className={inputClassName}
            />
          </div>

          <div>
            <FieldLabel required>Empresa del grupo</FieldLabel>

            <select
              value={currentForm.companyId}
              disabled={companiesLoading || fieldsDisabled}
              onChange={(event) =>
                updateField("companyId", event.target.value)
              }
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
                disabled={fieldsDisabled}
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
                disabled={fieldsDisabled}
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
                  disabled={fieldsDisabled}
                  onChange={(event) =>
                    updateField("legalId", event.target.value)
                  }
                  required
                  placeholder="Ej. 3101123456"
                  className={inputClassName}
                />
                {(taxpayerLookupLoading || taxpayerLookupMessage) && (
                  <p className="mt-2 text-xs text-gray-400">
                    {taxpayerLookupLoading
                      ? "Consultando Hacienda..."
                      : taxpayerLookupMessage}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel required>Razón social</FieldLabel>

                <input
                  type="text"
                  value={currentForm.legalName}
                  disabled={fieldsDisabled}
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
                  disabled={fieldsDisabled}
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
                  disabled={fieldsDisabled}
                  onChange={(event) =>
                    updateField("legalId", event.target.value)
                  }
                  required
                  placeholder="Ej. 1-1234-5678"
                  className={inputClassName}
                />
                {(taxpayerLookupLoading || taxpayerLookupMessage) && (
                  <p className="mt-2 text-xs text-gray-400">
                    {taxpayerLookupLoading
                      ? "Consultando Hacienda..."
                      : taxpayerLookupMessage}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Código de actividad</FieldLabel>

              <input
                type="text"
                value={currentForm.activityCode}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateField("activityCode", event.target.value)
                }
                required
                placeholder="Ej. 551001"
                className={inputClassName}
              />
            </div>

            <div>
              <FieldLabel>Estado tributario</FieldLabel>

              <input
                type="text"
                value={currentForm.taxStatus}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateField("taxStatus", event.target.value)
                }
                placeholder="Ej. Contribuyente activo"
                className={inputClassName}
              />
            </div>
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
                disabled={fieldsDisabled}
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
          description="Estos teléfonos pertenecen directamente al cliente."
        />

        <PhoneList
          phones={currentForm.clientPhones}
          onChange={updateClientPhone}
          onAdd={addClientPhone}
          onRemove={removeClientPhone}
          emptyMessage="No hay teléfonos generales registrados."
          primaryRadioName="client-primary-phone"
          disabled={fieldsDisabled}
        />
      </section>

      {/* Ubicación del cliente */}
      <section className="pt-6 border-t border-[#2a3550]">
        <SectionTitle
          icon={<RiMapPinLine size={18} />}
          title="Ubicación del cliente"
          description="Registra la dirección y coordenadas directamente en el cliente."
        />

        <div className="space-y-5 rounded-2xl border border-[#2a3550] bg-[#1c2538] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Provincia</FieldLabel>

              <input
                type="text"
                value={customerLocation.province}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateCustomerLocationField("province", event.target.value)
                }
                placeholder="Ej. Alajuela"
                className={inputClassName}
              />
            </div>

            <div>
              <FieldLabel required>Cantón</FieldLabel>

              <input
                type="text"
                value={customerLocation.city}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateCustomerLocationField("city", event.target.value)
                }
                placeholder="Ej. Grecia"
                className={inputClassName}
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel required>Distrito</FieldLabel>

              <input
                type="text"
                value={customerLocation.district}
                disabled={fieldsDisabled}
                onChange={(event) =>
                  updateCustomerLocationField("district", event.target.value)
                }
                placeholder="Ej. San Roque"
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <FieldLabel required>Dirección exacta</FieldLabel>

            <textarea
              value={customerLocation.address}
              disabled={fieldsDisabled}
              onChange={(event) =>
                updateCustomerLocationField("address", event.target.value)
              }
              placeholder="Ej. Frente al parque central, local color blanco."
              rows={3}
              className={`${inputClassName} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Latitud</FieldLabel>

              <input
                type="number"
                inputMode="decimal"
                min="-90"
                max="90"
                step="0.0000001"
                value={customerLocation.latitude}
                disabled={!canEditBranchLocation}
                onChange={(event) =>
                  updateCustomerCoordinateField(
                    "latitude",
                    event.target.value,
                  )
                }
                placeholder="Ej. 10.087073"
                className={`${inputClassName} font-mono ${
                  hasInvalidLatitude ? "border-red-400" : ""
                }`}
              />
            </div>

            <div>
              <FieldLabel>Longitud</FieldLabel>

              <input
                type="number"
                inputMode="decimal"
                min="-180"
                max="180"
                step="0.0000001"
                value={customerLocation.longitude}
                disabled={!canEditBranchLocation}
                onChange={(event) =>
                  updateCustomerCoordinateField(
                    "longitude",
                    event.target.value,
                  )
                }
                placeholder="Ej. -84.371793"
                className={`${inputClassName} font-mono ${
                  hasInvalidLongitude ? "border-red-400" : ""
                }`}
              />
            </div>
          </div>

          {(hasInvalidLatitude ||
            hasInvalidLongitude ||
            hasIncompleteCoordinates) && (
            <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Ingresa latitud entre -90 y 90 y longitud entre -180 y 180 para actualizar el pin.
            </p>
          )}

          {canEditBranchLocation && (
            <button
              type="button"
              onClick={handleUseCurrentCustomerLocation}
              disabled={customerLocationLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9A227]/50 bg-[#C9A227]/10 px-4 py-2.5 text-sm font-semibold text-[#C9A227] transition-colors hover:border-[#C9A227] hover:bg-[#C9A227]/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RiMapPinLine size={16} />
              {customerLocationLoading
                ? "Obteniendo ubicación..."
                : "Obtener mi ubicación actual"}
            </button>
          )}

          {customerLocationError && (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {customerLocationError}
            </p>
          )}

          <BranchLocationMap
            latitude={customerLocation.latitude}
            longitude={customerLocation.longitude}
            accuracy={customerLocation.locationAccuracy}
            editable={canEditBranchLocation}
            onChange={(nextLocation) =>
              updateBranchLocation(0, nextLocation)
            }
          />
        </div>
      </section>
    </div>
  );
}
