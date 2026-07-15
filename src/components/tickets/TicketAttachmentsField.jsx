import { useRef } from "react";
import { RiDeleteBinLine, RiFileLine, RiImageLine, RiUploadCloud2Line } from "react-icons/ri";

import {
  TICKET_ACCEPTED_FILE_TYPES,
  TICKET_MAX_FILES,
  TICKET_MAX_FILE_SIZE,
} from "../../constants/tickets.constants.js";

const ALLOWED_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".doc", ".docx",
  ".xls", ".xlsx", ".csv", ".txt",
];

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file) {
  const normalizedName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension));
}

export default function TicketAttachmentsField({ files, error, onChange, onError }) {
  const inputRef = useRef(null);

  const handleSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    const oversizedFile = selectedFiles.find((file) => file.size > TICKET_MAX_FILE_SIZE);
    if (oversizedFile) {
      onError(`El archivo ${oversizedFile.name} supera el límite de 50 MB.`);
      return;
    }

    const invalidFile = selectedFiles.find((file) => !isAllowedFile(file));
    if (invalidFile) {
      onError(`El tipo de archivo de ${invalidFile.name} no está permitido.`);
      return;
    }

    const uniqueFiles = [...files];
    selectedFiles.forEach((file) => {
      const alreadySelected = uniqueFiles.some(
        (currentFile) => currentFile.name === file.name && currentFile.size === file.size,
      );
      if (!alreadySelected) uniqueFiles.push(file);
    });

    if (uniqueFiles.length > TICKET_MAX_FILES) {
      onError(`Puedes adjuntar un máximo de ${TICKET_MAX_FILES} archivos.`);
      return;
    }

    onError("");
    onChange(uniqueFiles);
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-300">
        Evidencia o archivos <span className="font-normal normal-case tracking-normal text-gray-500">(opcional)</span>
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-1.5 flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#465574] bg-[#0B1120]/55 px-4 py-5 text-center transition-colors hover:border-[#C9A227]/70 hover:bg-[#C9A227]/5"
      >
        <RiUploadCloud2Line size={24} className="text-[#C9A227]" />
        <span className="mt-2 text-sm font-semibold text-gray-200">Seleccionar imágenes o documentos</span>
        <span className="mt-1 text-[11px] text-gray-500">PNG, JPG, WEBP, PDF, Word, Excel, CSV o TXT · máximo 50 MB por archivo</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={TICKET_ACCEPTED_FILE_TYPES}
        onChange={handleSelection}
        className="hidden"
      />

      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Archivos seleccionados">
          {files.map((file, index) => {
            const FileIcon = file.type.startsWith("image/") ? RiImageLine : RiFileLine;
            return (
              <li key={`${file.name}-${file.size}`} className="flex items-center gap-3 rounded-lg border border-[#33405d] bg-[#202c43] px-3 py-2.5">
                <FileIcon className="shrink-0 text-[#C9A227]" size={18} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-200">{file.name}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-300" aria-label={`Eliminar ${file.name}`}>
                  <RiDeleteBinLine size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
