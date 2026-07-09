export default function FormField({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  icon,
  required = false,
  disabled = false,
  autoComplete,
}) {
  const inputId =
    id ||
    label
      .toLowerCase()
      .replace(/[^a-záéíóúüñ0-9]+/gi, "-")
      .replace(/^-|-$/g, "");

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5"
      >
        {label}

        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full bg-[#222e44] border border-[#2a3550] rounded-lg ${
            icon ? "pl-9" : "pl-3"
          } pr-3 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>
    </div>
  );
}
