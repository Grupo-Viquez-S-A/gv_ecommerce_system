export default function RepresentativeEditor({
  representative,
  index,
  onChange,
  onRemove,
}) {
  const handleFieldChange = (field, value) => {
    onChange({
      ...representative,
      [field]: value,
    });
  };

  const handleStatusChange = (status) => {
    handleFieldChange("status", status);
  };

  return (
    <div className="bg-[#1c2538] border border-[#2a3550] rounded-lg p-2 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-600">
          Representante {index + 1}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          Eliminar
        </button>
      </div>

      <input
        type="text"
        placeholder="Nombre completo"
        value={representative.name ?? ""}
        onChange={(event) =>
          handleFieldChange("name", event.target.value)
        }
        className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
      />

      <input
        type="email"
        placeholder="Correo electrónico"
        value={representative.email ?? ""}
        onChange={(event) =>
          handleFieldChange("email", event.target.value)
        }
        className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
      />

      <div className="flex gap-3">
        {["Activo", "Inactivo"].map((status) => {
          const isSelected = representative.status === status;
          const isActive = status === "Activo";

          return (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <span
                className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? isActive
                      ? "border-green-400"
                      : "border-red-400"
                    : "border-gray-600"
                }`}
              >
                {isSelected && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-green-400" : "bg-red-400"
                    }`}
                  />
                )}
              </span>

              <span
                className={`text-xs ${
                  isSelected ? "text-white" : "text-gray-500"
                }`}
              >
                {status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}