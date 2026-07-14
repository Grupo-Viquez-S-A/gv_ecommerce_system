import { RiLoader4Line, RiSendPlane2Line } from "react-icons/ri";

import { TICKET_LEVELS } from "../../constants/tickets.constants.js";
import TicketAttachmentsField from "./TicketAttachmentsField.jsx";

const inputClassName = "mt-1.5 w-full rounded-lg border border-[#33405d] bg-[#202c43] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/30";

export default function TicketRequestForm({
  form,
  categories,
  attachments,
  attachmentError,
  error,
  isSubmitting,
  isLoadingCategories,
  onAttachmentsChange,
  onAttachmentError,
  onChange,
  onSubmit,
}) {
  return (
    <section className="rounded-xl border border-[#2a3550] bg-[#141d2e] p-4 sm:p-5">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">Nueva solicitud</h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          Describe el inconveniente con el mayor detalle posible para agilizar la atención.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
          Categoría <span className="text-red-400">*</span>
          <select required disabled={isLoadingCategories || categories.length === 0} value={form.category} onChange={(event) => onChange("category", event.target.value)} className={inputClassName}>
            <option value="">{isLoadingCategories ? "Cargando categorías..." : "Selecciona una categoría"}</option>
            {categories.map((category) => <option key={category.id || category.value} value={category.value}>{category.label}</option>)}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
            Impacto <span className="text-red-400">*</span>
            <select required value={form.impact} onChange={(event) => onChange("impact", event.target.value)} className={inputClassName}>
              {TICKET_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
            Urgencia <span className="text-red-400">*</span>
            <select required value={form.urgency} onChange={(event) => onChange("urgency", event.target.value)} className={inputClassName}>
              {TICKET_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
            </select>
          </label>
        </div>

        <p className="rounded-lg border border-[#33405d] bg-[#0B1120]/60 px-3 py-2.5 text-xs leading-relaxed text-gray-400">
          TI asignará automáticamente la prioridad y los tiempos de atención según la categoría seleccionada.
        </p>

        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
          Asunto <span className="text-red-400">*</span>
          <input required maxLength={180} value={form.title} onChange={(event) => onChange("title", event.target.value)} className={inputClassName} placeholder="Ej. No puedo iniciar sesión en el sistema" />
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
          Descripción <span className="text-red-400">*</span>
          <textarea required minLength={15} maxLength={1500} rows={6} value={form.description} onChange={(event) => onChange("description", event.target.value)} className={`${inputClassName} resize-y`} placeholder="Indica qué ocurrió, desde cuándo y qué mensaje aparece..." />
          <span className="mt-1 block text-right text-[11px] font-normal normal-case tracking-normal text-gray-500">{form.description.length}/1500</span>
        </label>

        <TicketAttachmentsField
          files={attachments}
          error={attachmentError}
          onChange={onAttachmentsChange}
          onError={onAttachmentError}
        />

        {error && <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{error}</p>}

        <button type="submit" disabled={isSubmitting || isLoadingCategories || categories.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#C9A227] px-4 py-3 text-sm font-bold text-[#0B1120] transition-colors hover:bg-[#d8b32f] disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? <RiLoader4Line className="animate-spin" size={18} /> : <RiSendPlane2Line size={18} />}
          {isSubmitting ? "Enviando solicitud..." : "Enviar ticket a TI"}
        </button>
      </form>
    </section>
  );
}
