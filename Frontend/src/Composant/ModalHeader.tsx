// @ts-nocheck
import { FaFileAlt, FaTimes } from 'react-icons/fa';

const ModalHeader = ({
  title,
  subtitle,
  eyebrow = 'DGRAD · Gestion documentaire',
  icon,
  onClose,
  closeDisabled = false,
  right = null,
}) => (
  <header className="shrink-0 border-b border-slate-200 bg-[#fcfbf7]">
    <div className="flex h-1">
      <span className="w-24 bg-navy-900" />
      <span className="w-10 bg-gold-400" />
      <span className="flex-1 bg-slate-200" />
    </div>

    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white shadow-sm">
          {icon || <FaFileAlt size={15} />}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gold-600">
            {eyebrow}
          </p>
          <h3 className="mt-0.5 truncate font-serif text-xl font-semibold text-navy-900">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {right}
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
          aria-label="Fermer"
        >
          <FaTimes size={13} />
        </button>
      </div>
    </div>
  </header>
);

export default ModalHeader;
