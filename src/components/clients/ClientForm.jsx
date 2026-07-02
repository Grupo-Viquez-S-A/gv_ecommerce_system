import {
  RiArrowDownSFill,
  RiBuilding2Fill,
  RiMailFill,
  RiMapPinFill,
  RiPhoneFill,
} from "react-icons/ri";
import { FaIdBadge, FaIdCard } from "react-icons/fa";

import FormField from "../ui/FormField";
import BranchEditor from "./BranchEditor";

const DEFAULT_BRANCH = {
  name: "",
  phone: "",
  address: "",
  representatives: [],
};

export default function ClientForm({ form, onChange }) {
  const safeForm = {
    name: "",
    legalId: "",
    legalName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    status: "Activo",
    notes: "",
    branches: [DEFAULT_BRANCH],
    ...form,
  };

  const updateField = (field, value) => {
    onChange({
      ...safeForm,
      [field]: value,
    });
  };

  const updateBranches = (updatedBranches) => {
    onChange({
      ...safeForm,
      branches: updatedBranches,
    });
  };

  return (
    <div className="space-y-5">
      <FormField
        id="client-name"
        label="Nombre del Cliente"
        placeholder="Ej. Hotel Los Laureles"
        value={safeForm.name}
        onChange={(value) => updateField("name", value)}
        icon={<RiBuilding2Fill size={14} />}
        required
      />

      <FormField
        id="client-legal-id"
        label="Cédula Jurídica"
        placeholder="3-101-123456"
        value={safeForm.legalId}
        onChange={(value) =>
          updateField("legalId", value.replace(/[^0-9-]/g, ""))
        }
        icon={<FaIdCard size={14} />}
      />

      <FormField
        id="client-legal-name"
        label="Nombre Legal"
        placeholder="Ej. Hotel Los Laureles S.A."
        value={safeForm.legalName}
        onChange={(value) => updateField("legalName", value)}
        icon={<FaIdBadge size={14} />}
      />

      <FormField
        id="client-email"
        label="Correo Electrónico"
        placeholder="Ej. contacto@empresa.com"
        value={safeForm.email}
        onChange={(value) => updateField("email", value)}
        type="email"
        autoComplete="email"
        icon={<RiMailFill size={14} />}
      />

      <FormField
        id="client-phone"
        label="Teléfono"
        placeholder="Ej. +506 8888 8888"
        value={safeForm.phone}
        onChange={(value) => updateField("phone", value)}
        type="tel"
        autoComplete="tel"
        icon={<RiPhoneFill size={14} />}
      />

      <div>
        <label
          htmlFor="client-company"
          className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
        >
          Empresa Grupo
        </label>

        <div className="relative">
          <select
            id="client-company"
            value={safeForm.company}
            onChange={(event) => updateField("company", event.target.value)}
            className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors appearance-none cursor-pointer"
          >
            <option value="">Seleccionar empresa del grupo</option>
            <option value="Grupo Víquez S.A">Grupo Víquez S.A</option>
            <option value="Textiles de Occidente">
              Textiles de Occidente
            </option>
            <option value="Pacific Pet Food">Pacific Pet Food</option>
            <option value="Constructora Víquez">
              Constructora Víquez
            </option>
            <option value="Occidente Lab">Occidente Lab</option>
            <option value="Agro Occidente Group">
              Agro Occidente Group
            </option>
          </select>

          <RiArrowDownSFill
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="client-address"
          className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
        >
          Dirección
        </label>

        <div className="relative">
          <RiMapPinFill
            size={14}
            className="absolute left-3 top-3 text-gray-500 pointer-events-none"
          />

          <textarea
            id="client-address"
            placeholder="Ej. San Ramón, Alajuela, Costa Rica"
            value={safeForm.address}
            onChange={(event) => updateField("address", event.target.value)}
            rows={2}
            className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
          />
        </div>
      </div>

      <BranchEditor
        branches={
          safeForm.branches?.length > 0
            ? safeForm.branches
            : [DEFAULT_BRANCH]
        }
        onChange={updateBranches}
      />

      <div>
        <p className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
          Estado
        </p>

        <div className="flex gap-5">
          {["Activo", "Inactivo"].map((status) => {
            const isSelected = safeForm.status === status;
            const isActive = status === "Activo";

            return (
              <button
                key={status}
                type="button"
                onClick={() => updateField("status", status)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? isActive
                        ? "border-green-400"
                        : "border-red-400"
                      : "border-gray-600"
                  }`}
                >
                  {isSelected && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isActive ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                  )}
                </span>

                <span
                  className={`text-sm ${
                    isSelected ? "text-white" : "text-gray-400"
                  }`}
                >
                  {status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="client-notes"
          className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
        >
          Notas
        </label>

        <textarea
          id="client-notes"
          placeholder="Notas internas sobre el cliente..."
          value={safeForm.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={3}
          className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
        />
      </div>
    </div>
  );
}