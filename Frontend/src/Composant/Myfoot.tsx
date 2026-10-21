// @ts-nocheck
const Myfoot = () => {
  return (
    <footer className="border-t border-slate-200 bg-white/70 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[11px] font-medium text-slate-400 sm:flex-row">
        <span>
          &copy; {new Date().getFullYear()} DGRAD &middot; Plateforme de gestion documentaire
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Environnement sécurisé &middot; Version 2.0
        </span>
      </div>
    </footer>
  );
};

export default Myfoot;
