/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FaArrowLeft,
  FaBuilding,
  FaCheck,
  FaEdit,
  FaExclamationCircle,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from '../Composant/Toast';
import ConfirmModal from '../Modals/ConfirmModal';
import LoadingSpinner from '../Loading/LoadingSpinner';

const EMPTY_FORM = {
  id_direction: '',
  code: '',
  sigle: '',
  nom: '',
  description: '',
  statut: '1',
};

const DivisionScreen = () => {
  const token = GetTokenOrRedirect();

  const [divisions, setDivisions] = useState([]);
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersDivision, setMembersDivision] = useState(null);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    fetchDirections();
    fetchDivisions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(fetchDivisions, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, directionFilter]);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/divisions`, {
        headers,
        params: {
          per_page: 100,
          search: search.trim() || undefined,
          id_direction: directionFilter || undefined,
        },
      });
      const payload = response.data?.data ?? response.data;
      setDivisions(Array.isArray(payload) ? payload : (payload?.data || []));
    } catch (error) {
      console.error('Erreur divisions:', error);
      toast.error('Impossible de charger les divisions');
    } finally {
      setLoading(false);
    }
  };

  const fetchDirections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/directions`, { headers });
      setDirections(response.data || []);
    } catch (error) {
      console.error('Erreur directions:', error);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (division) => {
    setEditing(division);
    setFormData({
      id_direction: String(division.id_direction || division.direction?.id || ''),
      code: division.code || '',
      sigle: division.sigle || '',
      nom: division.nom || '',
      description: division.description || '',
      statut: division.statut === false || division.statut === 0 ? '0' : '1',
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    const payload = {
      id_direction: Number(formData.id_direction),
      code: formData.code.trim() || undefined,
      sigle: formData.sigle.trim().toUpperCase(),
      nom: formData.nom.trim(),
      description: formData.description.trim() || null,
      statut: formData.statut === '1',
    };

    try {
      if (editing) {
        await axios.put(`${API_BASE_URL}/divisions/${editing.id}`, payload, { headers });
        toast.success('Division mise à jour avec succès');
      } else {
        await axios.post(`${API_BASE_URL}/divisions`, payload, { headers });
        toast.success('Division créée avec succès');
      }

      setShowModal(false);
      setEditing(null);
      setFormData(EMPTY_FORM);
      await fetchDivisions();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error('Veuillez corriger les erreurs du formulaire');
      } else {
        toast.error(error.response?.data?.message || 'Une erreur est survenue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmItem) return;
    setConfirmLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/divisions/${confirmItem.id}`, { headers });
      toast.success('Division supprimée avec succès');
      setConfirmItem(null);
      await fetchDivisions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Impossible de supprimer cette division');
    } finally {
      setConfirmLoading(false);
    }
  };

  const openMembers = async (division) => {
    setMembersDivision(division);
    setMembersOpen(true);
    await fetchMembers(division.id);
  };

  const fetchMembers = async (divisionId) => {
    setMembersLoading(true);
    try {
      const [detailRes, availableRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/divisions/${divisionId}`, { headers }),
        axios.get(`${API_BASE_URL}/divisions/${divisionId}/available-users`, { headers }),
      ]);
      const detail = detailRes.data?.data || detailRes.data;
      setMembers(detail.users || detail.MonUtilisateurs || []);
      const available = availableRes.data?.data?.utilisateurs_disponibles || [];
      setAvailableUsers(available);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
      toast.error('Impossible de charger les utilisateurs de la division');
    } finally {
      setMembersLoading(false);
    }
  };

  const assignUserToDivision = async (userId) => {
    if (!membersDivision) return;
    setAssigningId(userId);
    try {
      await axios.post(
        `${API_BASE_URL}/divisions/${membersDivision.id}/assign-user/${userId}`,
        {},
        { headers }
      );
      toast.success('Accès à la division ajouté');
      await Promise.all([fetchMembers(membersDivision.id), fetchDivisions()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible d'affecter cet utilisateur");
    } finally {
      setAssigningId(null);
    }
  };

  const removeUserAccess = async (userId) => {
    if (!membersDivision) return;
    setRemovingId(userId);
    try {
      await axios.post(
        `${API_BASE_URL}/divisions/${membersDivision.id}/remove-user/${userId}`,
        {},
        { headers }
      );
      toast.success('Accès à la division retiré');
      await Promise.all([fetchMembers(membersDivision.id), fetchDivisions()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Impossible de retirer cet accès");
    } finally {
      setRemovingId(null);
    }
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    const message = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    return (
      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
        <FaExclamationCircle size={10} /> {message}
      </p>
    );
  };

  const activeDivisions = divisions.filter(
    (division) => division.statut === true || division.statut === 1
  ).length;
  const totalUsers = divisions.reduce((total, division) => total + (division.users_count || 0), 0);
  const selectedDirection = directions.find(
    (direction) => String(direction.id) === String(formData.id_direction)
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-navy-900/15">
              <FaBuilding size={19} />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">
                Gestion des divisions
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Divisions internes rattachées aux directions DGRAD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/gestion-utilisateurs/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FaArrowLeft size={12} /> Retour
            </Link>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-navy-800"
            >
              <FaPlus size={12} /> Nouvelle division
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Divisions', value: divisions.length, icon: <FaBuilding />, tone: 'bg-navy-900' },
          { label: 'Divisions actives', value: activeDivisions, icon: <FaCheck />, tone: 'bg-emerald-500' },
          { label: 'Utilisateurs rattachés', value: totalUsers, icon: <FaUsers />, tone: 'bg-amber-500' },
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${card.tone}`}>
              {card.icon}
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold leading-none text-navy-900">{card.value}</p>
              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une division par sigle, code ou nom..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-100"
            />
          </div>
          <select
            value={directionFilter}
            onChange={(event) => setDirectionFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
          >
            <option value="">Toutes les directions</option>
            {directions.map((direction) => (
              <option key={direction.id} value={direction.id}>
                {direction.sigle} — {direction.nom}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
            <FaBuilding size={10} /> {divisions.length} division(s)
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        {loading ? (
          <LoadingSpinner message="Chargement des divisions..." variant="table" size="lg" />
        ) : divisions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
              <FaBuilding className="text-2xl text-slate-300" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-800">Aucune division trouvée</p>
            <p className="mt-1 text-xs text-slate-500">
              Créez une division et rattachez-la à une direction DGRAD.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Division</th>
                  <th className="px-5 py-3 text-left">Direction parente</th>
                  <th className="px-5 py-3 text-left">Utilisateurs</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {divisions.map((division, index) => (
                  <tr key={division.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-xs font-semibold text-slate-400">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                          <span className="rounded-md bg-navy-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-navy-700 ring-1 ring-navy-100">
                            {division.sigle}
                          </span>
                          {division.nom}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          Code : {division.code || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-700">
                        {division.direction?.sigle || '—'}
                      </p>
                      <p className="max-w-[260px] truncate text-[10px] font-medium text-slate-400">
                        {division.direction?.nom || 'Direction non renseignée'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                        <FaUsers size={9} /> {division.users_count || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          division.statut === false || division.statut === 0
                            ? 'border-slate-200 bg-slate-50 text-slate-500'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            division.statut === false || division.statut === 0
                              ? 'bg-slate-400'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {division.statut === false || division.statut === 0 ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openMembers(division)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50"
                          title="Gérer les utilisateurs"
                        >
                          <FaUsers size={11} />
                        </button>
                        <button
                          onClick={() => openEdit(division)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy-700 transition hover:border-navy-200 hover:bg-navy-50"
                          title="Modifier"
                        >
                          <FaEdit size={11} />
                        </button>
                        <button
                          onClick={() => setConfirmItem(division)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between bg-navy-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <FaBuilding size={13} />
                </span>
                <div>
                  <h2 className="font-display text-base font-extrabold">
                    {editing ? 'Modifier la division' : 'Nouvelle division'}
                  </h2>
                  <p className="text-[10px] font-medium text-slate-300">
                    Rattachement à une direction DGRAD
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition hover:bg-white/15 disabled:opacity-50"
              >
                <FaTimes size={12} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[calc(92vh-64px)] overflow-y-auto">
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Direction parente <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.id_direction}
                    onChange={(event) => setFormData({ ...formData, id_direction: event.target.value })}
                    required
                    disabled={submitting}
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                      errors.id_direction
                        ? 'border-rose-300 focus:ring-rose-100'
                        : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                    }`}
                  >
                    <option value="">Sélectionner une direction...</option>
                    {directions.map((direction) => (
                      <option key={direction.id} value={direction.id}>
                        {direction.sigle} — {direction.nom}
                      </option>
                    ))}
                  </select>
                  {renderError('id_direction')}
                  {selectedDirection && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-1.5 text-[10px] font-semibold text-navy-700 ring-1 ring-navy-100">
                      <FaBuilding size={9} /> {selectedDirection.nom}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      Sigle <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={formData.sigle}
                      onChange={(event) =>
                        setFormData({ ...formData, sigle: event.target.value.toUpperCase() })
                      }
                      required
                      maxLength={20}
                      disabled={submitting}
                      placeholder="Ex. ARC"
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none transition focus:ring-4 ${
                        errors.sigle
                          ? 'border-rose-300 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                      }`}
                    />
                    {renderError('sigle')}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">
                      Nom de la division <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={formData.nom}
                      onChange={(event) => setFormData({ ...formData, nom: event.target.value })}
                      required
                      disabled={submitting}
                      placeholder="Ex. Division des Archives"
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                        errors.nom
                          ? 'border-rose-300 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                      }`}
                    />
                    {renderError('nom')}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">Code</label>
                    <input
                      value={formData.code}
                      onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                      disabled={submitting}
                      placeholder="Généré automatiquement si vide"
                      className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                        errors.code
                          ? 'border-rose-300 focus:ring-rose-100'
                          : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                      }`}
                    />
                    {renderError('code')}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">Statut</label>
                    <select
                      value={formData.statut}
                      onChange={(event) => setFormData({ ...formData, statut: event.target.value })}
                      disabled={submitting}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    disabled={submitting}
                    rows={3}
                    placeholder="Description optionnelle de la division..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" size={11} /> Enregistrement...
                    </>
                  ) : editing ? (
                    'Mettre à jour'
                  ) : (
                    'Créer la division'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {membersOpen && membersDivision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm" onClick={() => setMembersOpen(false)} />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between bg-navy-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                  <FaUsers size={13} />
                </span>
                <div>
                  <h3 className="font-display text-sm font-extrabold">Utilisateurs de la division</h3>
                  <p className="text-[10px] text-slate-300">
                    {membersDivision.sigle} — {membersDivision.nom}
                  </p>
                </div>
              </div>
              <button onClick={() => setMembersOpen(false)} className="rounded-lg bg-white/10 p-2 text-slate-200 hover:bg-white/15">
                <FaTimes size={12} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {membersLoading ? (
                <div className="py-10 text-center">
                  <FaSpinner className="mx-auto animate-spin text-navy-600" size={22} />
                  <p className="mt-2 text-xs text-slate-500">Chargement...</p>
                </div>
              ) : (
                <>
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                        Membres actuels
                      </h4>
                      <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-bold text-navy-700 ring-1 ring-navy-100">
                        {members.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-[10px] font-extrabold text-white">
                            {member.prenom?.[0]}
                            {member.nom?.[0]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {member.prenom} {member.nom}
                            </p>
                            <p className="truncate text-[10px] text-slate-400">{member.email}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {Number(member.id_division) === Number(membersDivision.id) ? (
                              <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[9px] font-bold text-navy-700 ring-1 ring-navy-100">
                                Division principale
                              </span>
                            ) : (
                              <button
                                onClick={() => removeUserAccess(member.id)}
                                disabled={removingId === member.id}
                                className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[9px] font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                              >
                                {removingId === member.id ? 'Retrait...' : 'Retirer'}
                              </button>
                            )}
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                              {member.statut}
                            </span>
                          </div>
                        </div>
                      ))}
                      {members.length === 0 && (
                        <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                          Aucun utilisateur rattaché.
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                      Affecter un utilisateur
                    </h4>
                    <p className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-[10px] font-medium text-sky-700 ring-1 ring-sky-100">
                      Un utilisateur conserve sa division principale et peut recevoir l'accès à plusieurs
                      divisions (ex. un directeur). L'affectation ajoute un accès sans le déplacer.
                    </p>
                    <div className="space-y-2">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {user.prenom} {user.nom}
                            </p>
                            <p className="truncate text-[10px] text-slate-400">
                              {user.email} · Division principale : {user.division?.sigle || user.division?.nom || `#${user.id_division}`}
                            </p>
                          </div>
                          <button
                            onClick={() => assignUserToDivision(user.id)}
                            disabled={assigningId === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-navy-800 disabled:opacity-50"
                          >
                            {assigningId === user.id ? (
                              <FaSpinner className="animate-spin" size={9} />
                            ) : (
                              <FaPlus size={8} />
                            )}
                            Affecter
                          </button>
                        </div>
                      ))}
                      {availableUsers.length === 0 && (
                        <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                          Aucun utilisateur disponible à affecter.
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={confirmDelete}
        title="Supprimer la division ?"
        message={
          confirmItem
            ? `Voulez-vous supprimer la division « ${confirmItem.nom} » ? Elle ne doit contenir aucun utilisateur.`
            : ''
        }
        confirmText="Oui, supprimer"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
};

export default DivisionScreen;
