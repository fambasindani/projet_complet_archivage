// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { FaEdit, FaPlus, FaSearch, FaSpinner, FaTimes, FaTrash } from 'react-icons/fa';
import Head from './Head';
import Menus from './Menus';
import ConfirmModal from '../Modals/ConfirmModal';
import LoadingSpinner from '../Loading/LoadingSpinner';
import { toast } from './Toast';

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const ReferentielCrud = ({
  title,
  subtitle,
  icon,
  service,
  fields,
  columns,
  searchPlaceholder = 'Rechercher...',
  emptyLabel = 'Aucun element trouve',
  labelSingular = 'element',
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const emptyForm = useMemo(() => {
    const result = {};
    fields.forEach((field) => {
      result[field.name] = field.defaultValue ?? (field.type === 'select' ? '' : '');
    });
    return result;
  }, [fields]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await service.list({ per_page: 200 });
      setRows(asList(response));
    } catch {
      toast.error(`Impossible de charger les ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter((row) => {
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return columns.some((column) => {
      const value = column.searchValue ? column.searchValue(row) : row[column.key];
      return String(value ?? '').toLowerCase().includes(needle);
    });
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const next = { ...emptyForm };
    fields.forEach((field) => {
      const value = row[field.name];
      next[field.name] =
        field.type === 'checkbox' ? !!(value === true || value === 1) : value ?? '';
    });
    setForm(next);
    setErrors({});
    setShowModal(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      if (editing) {
        await service.update(editing.id, form);
        toast.success('Modification enregistree');
      } else {
        await service.create(form);
        toast.success('Creation effectuee');
      }
      setShowModal(false);
      await load();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error('Veuillez corriger les erreurs');
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!confirmItem) return;
    setConfirmLoading(true);
    try {
      await service.remove(confirmItem.id);
      toast.success('Suppression effectuee');
      setConfirmItem(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Suppression impossible');
    } finally {
      setConfirmLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100';

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-navy-900/15">
                  {icon}
                </div>
                <div>
                  <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">{title}</h1>
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
              </div>
              <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-navy-800">
                <FaPlus size={12} /> Ajouter
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="relative max-w-xl">
              <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            {loading ? (
              <LoadingSpinner message="Chargement..." variant="table" size="lg" />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">{icon}</div>
                <p className="mt-3 text-sm font-bold text-slate-700">{emptyLabel}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                      {columns.map((column) => (
                        <th key={column.key} className={`px-5 py-3 ${column.align || 'text-left'}`}>{column.label}</th>
                      ))}
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((row) => (
                      <tr key={row.id} className="transition hover:bg-slate-50/70">
                        {columns.map((column) => (
                          <td key={column.key} className={`px-5 py-4 text-xs text-slate-600 ${column.align || 'text-left'}`}>
                            {column.render ? column.render(row) : row[column.key] ?? '—'}
                          </td>
                        ))}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openEdit(row)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-navy-700 hover:bg-navy-50" title="Modifier"><FaEdit size={11} /></button>
                            <button onClick={() => setConfirmItem(row)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50" title="Supprimer"><FaTrash size={11} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between bg-navy-900 px-6 py-4 text-white">
              <h3 className="font-display text-sm font-extrabold">{editing ? `Modifier le ${labelSingular}` : `Nouveau ${labelSingular}`}</h3>
              <button onClick={() => !submitting && setShowModal(false)} className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/15"><FaTimes size={12} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4 p-6">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={form[field.name] ?? ''}
                      onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                      rows={3}
                      className={inputClass}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={form[field.name] ?? ''}
                      onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                      className={inputClass}
                    >
                      <option value="">Veuillez sélectionner...</option>
                      {(field.options || []).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!form[field.name]}
                        onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })}
                      />
                      {field.label}
                    </label>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={form[field.name] ?? ''}
                      onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                      required={field.required}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}
                  {errors[field.name] && (
                    <p className="mt-1 text-[10px] font-semibold text-rose-600">
                      {Array.isArray(errors[field.name]) ? errors[field.name][0] : errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50">
                  {submitting ? <FaSpinner className="animate-spin" size={11} /> : <FaPlus size={11} />}
                  {editing ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={remove}
        title="Confirmer la suppression ?"
        message={`Cette action supprimera definitivement cet ${labelSingular}.`}
        confirmText="Oui, supprimer"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
};

export default ReferentielCrud;
