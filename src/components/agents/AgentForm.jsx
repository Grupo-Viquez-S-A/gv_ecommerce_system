import {
  RiArrowDownSFill,
  RiBriefcaseFill,
  RiMailFill,
  RiPhoneFill,
  RiStarFill,
  RiUserFill,
} from "react-icons/ri";

import {
  AGENT_COMPANIES,
  AGENT_STATUSES,
} from "../../constants/agents.constants.js";

function FormField({
  icon,
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-3 text-gray-500">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full bg-[#222e44] border border-[#2a3550] rounded-lg ${
            icon ? "pl-9" : "pl-3"
          } pr-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors`}
        />
      </div>
    </div>
  );
}

export default function AgentForm({
  form,
  onChange,
}) {
  const updateField = (field, value) => {
    onChange({
      ...form,
      [field]: value,
    });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <FormField
        icon={<RiUserFill size={14} />}
        label="Nombre completo"
        placeholder="Ej. Juan Pérez"
        value={form.name}
        onChange={(event) => updateField("name", event.target.value)}
      />

      <FormField
        icon={<RiMailFill size={14} />}
        label="Correo electrónico"
        placeholder="agente@empresa.com"
        type="email"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
      />

      <FormField
        icon={<RiPhoneFill size={14} />}
        label="Teléfono"
        placeholder="+506 0000 0000"
        value={form.phone}
        onChange={(event) => updateField("phone", event.target.value)}
      />

      <div>
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
          Empresa
        </label>

        <div className="relative">
          <RiBriefcaseFill
            size={14}
            className="absolute left-3 top-3 text-gray-500"
          />

          <select
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            className="appearance-none w-full bg-[#222e44] border border-[#2a3550] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A227] transition-colors cursor-pointer"
          >
            <option value="">Seleccionar empresa</option>

            {AGENT_COMPANIES.slice(1).map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>

          <RiArrowDownSFill
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>
      </div>

      <FormField
        icon={<RiStarFill size={14} />}
        label="Comisión"
        placeholder="Ej. 2.5%"
        value={form.commission}
        onChange={(event) => updateField("commission", event.target.value)}
      />

      <div>
        <p className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
          Estado
        </p>

        <div className="flex gap-5">
          {AGENT_STATUSES.map((status) => {
            const isSelected = form.status === status;
            const isActive = status === "Activo";

            return (
              <label
                key={status}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="agent-status"
                  value={status}
                  checked={isSelected}
                  onChange={() => updateField("status", status)}
                  className="sr-only"
                />

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
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
          Notas
        </label>

        <textarea
          rows={3}
          value={form.notes}
          placeholder="Notas internas sobre el agente..."
          onChange={(event) => updateField("notes", event.target.value)}
          className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors resize-none"
        />
      </div>
    </form>
  );
}

