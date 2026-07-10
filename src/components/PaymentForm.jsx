import { useState } from "react";

import {
  RiArrowDownSFill,
  RiCalendarLine,
  RiMoneyDollarCircleFill,
  RiUploadCloud2Line,
} from "react-icons/ri";

import { getTodayCRDateString } from "../utils/dateUtils.js";

export default function PaymentForm({
  quotation,
  paymentMethods,
  loading,
  error,
  success,
  onBack,
  onSubmit,
}) {
  const [methodId, setMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayCRDateString());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setReceiptFile(null);
      setPreviewUrl(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo debe pesar menos de 10 MB.");
      event.target.value = "";
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!methodId) {
      alert("Selecciona un metodo de pago.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert("Ingresa un monto valido mayor a 0.");
      return;
    }
    if (!paymentDate) {
      alert("Selecciona la fecha de pago.");
      return;
    }
    onSubmit({
      quotationId: quotation.quotationId,
      methodId,
      amount,
      paymentDate,
      referenceNumber,
      notes,
      receiptFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[10px] text-gray-500 uppercase tracking-wider">
            Metodo de pago
          </label>
          <div className="relative">
            <select
              value={methodId}
              onChange={(e) => setMethodId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#2a3550] bg-[#222e44] py-2 pl-3 pr-8 text-sm text-white focus:border-[#C9A227] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">Seleccionar...</option>
              {paymentMethods.map((m) => (
                <option key={m.method_id} value={m.method_id}>
                  {m.method_name}
                </option>
              ))}
            </select>
            <RiArrowDownSFill
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-gray-500 uppercase tracking-wider">
            Monto reportado
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              &#8353;
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] py-2 pl-7 pr-3 text-sm text-white placeholder-gray-400 focus:border-[#C9A227] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-gray-500 uppercase tracking-wider">
            Fecha de pago
          </label>
          <div className="relative">
            <RiCalendarLine
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] py-2 pl-9 pr-3 text-sm text-white focus:border-[#C9A227] focus:outline-none transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-gray-500 uppercase tracking-wider">
            Numero de referencia
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Ej. 123456789"
            className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] py-2 px-3 text-sm text-white placeholder-gray-400 focus:border-[#C9A227] focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] text-gray-500 uppercase tracking-wider">
          Notas
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Observaciones opcionales..."
          className="w-full rounded-lg border border-[#2a3550] bg-[#222e44] py-2 px-3 text-sm text-white placeholder-gray-400 focus:border-[#C9A227] focus:outline-none transition-colors resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-[10px] text-gray-500 uppercase tracking-wider">
          Comprobante de pago
        </label>
        <div className="rounded-lg border border-dashed border-[#2a3550] bg-[#091A31] p-4">
          {!receiptFile ? (
            <label className="flex cursor-pointer flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <RiUploadCloud2Line size={24} />
              <span className="text-xs">
                Haz clic para cargar una imagen o arrastrala aqui
              </span>
              <span className="text-[10px] text-gray-600">
                JPG, PNG, PDF — max 10 MB
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#222e44]">
                  <RiUploadCloud2Line size={20} className="text-gray-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{receiptFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(receiptFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReceiptFile(null);
                  setPreviewUrl(null);
                }}
                className="rounded-lg px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                Quitar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="rounded-lg border border-[#2a3550] bg-[#1c2538] px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={loading || !!success}
          className="flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#B8921F] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <RiMoneyDollarCircleFill size={16} />
          )}
          {loading ? "Enviando..." : "Reportar pago"}
        </button>
      </div>
    </form>
  );
}
