const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-[#35547E] bg-[#102441] px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#D7A91D]";

function FieldLabel({ children }) {
  return (
    <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#9BB3D3]">
      {children}
    </span>
  );
}

export default function QuotationClientIdentityFields({
  form,
  lookupLoading,
  lookupMessage,
  onChange,
  onLookup,
}) {
  const isPersonal = form.identificationType === "personal";

  return (
    <>
      <label>
        <FieldLabel>Tipo de identificación *</FieldLabel>
        <select
          value={form.identificationType}
          onChange={(event) => onChange("identificationType", event.target.value)}
          required
          className={inputClassName}
        >
          <option value="legal">Cédula jurídica</option>
          <option value="personal">Número de identificación</option>
        </select>
      </label>

      <label>
        <FieldLabel>
          {isPersonal ? "Número de identificación *" : "Cédula jurídica *"}
        </FieldLabel>
        <input
          value={form.legalId}
          onChange={(event) => onChange("legalId", event.target.value)}
          onBlur={onLookup}
          required
          className={inputClassName}
          placeholder={isPersonal ? "Ej. 1-1234-5678" : "Ej. 3-101-000000"}
        />
        {(lookupLoading || lookupMessage) && (
          <span className="mt-2 block text-xs text-[#9BB3D3]">
            {lookupLoading
              ? `Verificando ${isPersonal ? "identificación" : "cédula jurídica"}...`
              : lookupMessage}
          </span>
        )}
      </label>

      {isPersonal ? (
        <label>
          <FieldLabel>Datos del dueño (nombre y apellidos) *</FieldLabel>
          <input
            value={form.ownerName}
            onChange={(event) => onChange("ownerName", event.target.value)}
            required
            className={inputClassName}
            placeholder="Ej. María Rodríguez Vargas"
          />
        </label>
      ) : (
        <label>
          <FieldLabel>Razón social *</FieldLabel>
          <input
            value={form.legalName}
            onChange={(event) => onChange("legalName", event.target.value)}
            required
            className={inputClassName}
            placeholder="Ej. Cliente S.A."
          />
        </label>
      )}

      <label>
        <FieldLabel>Código de actividad *</FieldLabel>
        <input
          value={form.activityCode}
          onChange={(event) => onChange("activityCode", event.target.value)}
          required
          className={inputClassName}
          placeholder="Ej. 551001"
        />
      </label>

      <label>
        <FieldLabel>Nombre comercial *</FieldLabel>
        <input
          value={form.businessName}
          onChange={(event) => onChange("businessName", event.target.value)}
          required
          className={inputClassName}
          placeholder="Ej. Tienda Central"
        />
      </label>

      <label>
        <FieldLabel>Correo del cliente *</FieldLabel>
        <input
          type="email"
          value={form.businessEmail}
          onChange={(event) => onChange("businessEmail", event.target.value)}
          required
          className={inputClassName}
          placeholder="facturacion@cliente.com"
        />
      </label>

      <label>
        <FieldLabel>Teléfono del cliente</FieldLabel>
        <input
          value={form.businessPhone}
          onChange={(event) => onChange("businessPhone", event.target.value)}
          className={inputClassName}
          placeholder="Ej. 2222-2222"
        />
      </label>
    </>
  );
}
