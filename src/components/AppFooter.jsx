export default function AppFooter() {
  return (
    <footer className="shrink-0 border-t border-[#2a3550] bg-[#141D2E] px-4 py-3 text-center text-xs leading-5 text-slate-400 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-x-3 gap-y-1 sm:flex-row sm:flex-wrap">
        <p>
          Sistema desarrollado por{" "}
          <span className="font-semibold text-[#C9A227]">Grupo Víquez S.A.</span>
        </p>
        <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
