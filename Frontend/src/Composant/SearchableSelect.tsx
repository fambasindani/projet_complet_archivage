// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaSearch, FaTimes } from 'react-icons/fa';

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Veuillez sélectionner...',
  searchPlaceholder = 'Rechercher...',
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  const selected = options.find((option) => String(option.value) === String(value));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => String(option.label).toLowerCase().includes(needle));
  }, [options, query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
  };

  const selectOption = (option) => {
    onChange?.(option.value);
    setOpen(false);
    setQuery('');
  };

  const clearValue = (event) => {
    event.stopPropagation();
    onChange?.('');
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        onClick={openDropdown}
        className={`flex min-h-[46px] w-full items-center gap-2 rounded-xl border bg-white px-3.5 text-sm transition ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            : 'cursor-text border-slate-200 text-slate-800 hover:border-slate-300 focus-within:border-navy-600 focus-within:ring-4 focus-within:ring-navy-100'
        }`}
      >
        <FaSearch size={11} className="shrink-0 text-slate-400" />
        <input
          value={open ? query : selected?.label || ''}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={openDropdown}
          disabled={disabled}
          placeholder={open ? searchPlaceholder : selected?.label || placeholder}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        {!!value && !disabled && (
          <button
            type="button"
            onClick={clearValue}
            className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Effacer"
          >
            <FaTimes size={9} />
          </button>
        )}
        <FaChevronDown
          size={9}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">Aucun résultat.</p>
          ) : (
            filtered.map((option) => {
              const active = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition ${
                    active
                      ? 'bg-navy-50 font-bold text-navy-800'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint && <span className="shrink-0 text-[9px] text-slate-400">{option.hint}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
