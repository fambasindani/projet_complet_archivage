// @ts-nocheck
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const DossierHeader = ({
  registry,
  title,
  reference,
  status,
  backTo,
  backLabel = 'Retour',
  meta = [],
}) => (
  <header className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fcfbf7] shadow-card">
    <div className="flex h-1">
      <span className="w-24 bg-navy-900" />
      <span className="w-10 bg-gold-400" />
      <span className="flex-1 bg-slate-200" />
    </div>

    <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-4 sm:gap-6">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-gold-600">
              {registry}
            </p>
            <h1 className="mt-2 font-serif text-[26px] font-semibold leading-tight tracking-tight text-navy-900 sm:text-[30px]">
              {title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
              {meta.filter((item) => item && item.value).map((item) => (
                <div key={item.label}>
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between border-t border-slate-200 bg-white/70 p-5 lg:border-l lg:border-t-0">
        <div>
          <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
            Référence dossier
          </p>
          <p className="mt-1 break-all font-mono text-sm font-bold text-navy-900">
            {reference || 'Générée à l’enregistrement'}
          </p>

          <div className="mt-4">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
              Statut
            </p>
            <span className="mt-1 inline-flex border border-navy-900/20 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-navy-800">
              {status || 'Brouillon'}
            </span>
          </div>
        </div>

        {backTo && (
          <Link
            to={backTo}
            className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold text-navy-700 transition hover:text-navy-900"
          >
            <FaArrowLeft size={9} /> {backLabel}
          </Link>
        )}
      </div>
    </div>
  </header>
);

export default DossierHeader;
