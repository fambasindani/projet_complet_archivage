/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from '../Composant/Toast';
import ConfirmModal from '../Modals/ConfirmModal';
import LoadingSpinner from '../Loading/LoadingSpinner';
import {
  FaEdit,
  FaExclamationCircle,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTags,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';

const EMPTY = {
  code: '',
  libelle: '',
  description: '',
  champs_obligatoires: '',
  regle_numerotation: 'TP-{YYYY}-{SEQ}',
  statut: '1',
};

const CategorieTitreScreen = () => {
  const token = GetTokenOrRedirect();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(fetchCategories, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search]);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/categories-titres`, {
        headers,
        params: { per_page: 100, search: search.trim() || undefined },
      });
      const payload = response.data?.data ?? response.data;
      setCategories(Array.isArray(payload) ? payload : payload?.data || []);
    } catch (error) {
      console.error('Erreur categories titres:', error);
      toast.error('Impossible de charger les catégories de titres');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (categorie) => {
    setEditing(categorie);
    setForm({
      code: categorie.code || '',
      libelle: categorie.libelle || '',
      description: categorie.description || '',
      champs_obligatoires: Array.isArray(categorie.champs_obligatoires)
        ? categorie.champs_obligatoires.join(', ')
        : categorie.champs_obligatoires || '',
      regle_numerotation: categorie.regle_numerotation || '',
      statut: categorie.statut === false || categorie.statut === 0 ? '0' : '1',
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setErrors({});
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = {
      code: form.code.trim().toUpperCase(),
      libelle: form.libelle.trim(),
      description: form.description.trim() || null,
      champs_obligatoires: form.champs_obligatoires
        .split(',')
        .map((champ) => champ.trim())
        .filter(Boolean),
      regle_numerotation: form.regle_numerotation.trim() || null,
      statut: form.statut === '1',
    };

    try {
      if (editing) {
        await axios.put(`${API_BASE_URL}/categories-titres/${editing.id}`, payload, { headers });
        toast.success('Catégorie mise à jour');
      } else {
        await axios.post(`${API_BASE_URL}/categories-titres`, payload, { headers });
        toast.success('Catégorie créée');
      }
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY);
      await fetchCategories();
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

  const confirmDelete = async () => {
    if (!confirmItem) return;
    setConfirmLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/categories-titres/${confirmItem.id}`, { headers });
      toast.success('Catégorie supprimée');
      setConfirmItem(null);
      await fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de supprimer cette catégorie');
    } finally {
      setConfirmLoading(false);
    }
  };

  const renderError = (field) =>
    errors[field] ? (
      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
        <FaExclamationCircle size={10} />
        {Array.isArray(errors[field]) ? errors[field][0] : errors[field]}
      </p>
    ) : null;

  const activeCount = categories.filter(
    (categorie) => categorie.statut === true || categorie.statut === 1
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-navy-900/15">
                  <FaTags size={19} />
                </div>
                <div>
                  <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">
                    Catégories de titres
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Référentiel utilisé pour classer et numéroter les titres de perception
                  </p>
                </div>
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-navy-800"
              >
                <FaPlus size={12} /> Nouvelle catégorie
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Catégories</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{categories.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Actives</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-emerald-600">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Inactives</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-amber-600">{categories.length - activeCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="relative max-w-xl">
              <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par code ou libellé..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-100"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            {loading ? (
              <LoadingSpinner message="Chargement des catégories..." variant="table" size="lg" />
            ) : categories.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                  <FaTags className="text-2xl text-slate-300" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-800">Aucune catégorie trouvée</p>
                <p className="mt-1 text-xs text-slate-500">Créez une catégorie de titre pour commencer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-5 py-3 text-left">Code</th>
                      <th className="px-5 py-3 text-left">Libellé</th>
                      <th className="px-5 py-3 text-left">Règle de numérotation</th>
                      <th className="px-5 py-3 text-left">Champs obligatoires</th>
                      <th className="px-5 py-3 text-left">Statut</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((categorie) => (
                      <tr key={categorie.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-navy-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-navy-700 ring-1 ring-navy-100">
                            {categorie.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{categorie.libelle}</p>
                          {categorie.description && (
                            <p className="mt-0.5 max-w-[280px] truncate text-[10px] text-slate-400">
                              {categorie.description}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px] text-slate-600">
                          {categorie.regle_numerotation || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex max-w-[260px] flex-wrap gap-1">
                            {(categorie.champs_obligatoires || []).map((champ) => (
                              <span key={champ} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                                {champ}
                              </span>
                            ))}
                            {(!categorie.champs_obligatoires || categorie.champs_obligatoires.length === 0) && (
                              <span className="text-[10px] text-slate-400">Aucun</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                              categorie.statut === false || categorie.statut === 0
                                ? 'border-slate-200 bg-slate-50 text-slate-500'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                categorie.statut === false || categorie.statut === 0 ? 'bg-slate-400' : 'bg-emerald-500'
                              }`}
                            />
                            {categorie.statut === false || categorie.statut === 0 ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEdit(categorie)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy-700 transition hover:border-navy-200 hover:bg-navy-50"
                              title="Modifier"
                            >
                              <FaEdit size={11} />
                            </button>
                            <button
                              onClick={() => setConfirmItem(categorie)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
                              title="Supprimer"
                            >
                              <FaTrash size={11} />
                            </button>
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
          <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between bg-navy-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <FaTags size={13} />
                </span>
                <div>
                  <h3 className="font-display text-sm font-extrabold">
                    {editing ? 'Modifier la catégorie' : 'Nouvelle catégorie de titre'}
                  </h3>
                  <p className="text-[10px] text-slate-300">Référentiel titres_perception</p>
                </div>
              </div>
              <button onClick={closeModal} disabled={submitting} className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/15">
                <FaTimes size={12} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                    required
                    disabled={submitting}
                    placeholder="Ex. NOTE_PERCEPTION"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                  {renderError('code')}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Libellé <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={form.libelle}
                    onChange={(event) => setForm({ ...form, libelle: event.target.value })}
                    required
                    disabled={submitting}
                    placeholder="Ex. Note de perception"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                  {renderError('libelle')}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={2}
                  disabled={submitting}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Règle de numérotation</label>
                  <input
                    value={form.regle_numerotation}
                    onChange={(event) => setForm({ ...form, regle_numerotation: event.target.value })}
                    disabled={submitting}
                    placeholder="TP-{YYYY}-{SEQ}"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                  {renderError('regle_numerotation')}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Statut</label>
                  <select
                    value={form.statut}
                    onChange={(event) => setForm({ ...form, statut: event.target.value })}
                    disabled={submitting}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Champs obligatoires
                  <span className="ml-1 font-medium normal-case text-slate-400">
                    (séparés par des virgules)
                  </span>
                </label>
                <input
                  value={form.champs_obligatoires}
                  onChange={(event) => setForm({ ...form, champs_obligatoires: event.target.value })}
                  disabled={submitting}
                  placeholder="id_assujetti, montant, date_titre"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={closeModal} disabled={submitting} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50">
                  {submitting ? <FaSpinner className="animate-spin" size={11} /> : editing ? <FaEdit size={11} /> : <FaPlus size={11} />}
                  {editing ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={confirmDelete}
        title="Supprimer la catégorie ?"
        message={
          confirmItem
            ? `Voulez-vous supprimer la catégorie « ${confirmItem.libelle} » ? Elle ne doit être utilisée par aucun titre.`
            : ''
        }
        confirmText="Oui, supprimer"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
};

export default CategorieTitreScreen;
