/* eslint-disable no-restricted-globals */
// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  FaArrowLeft,
  FaBuilding,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaCircle,
  FaEdit,
  FaEnvelope,
  FaExclamationCircle,
  FaFilter,
  FaIdBadge,
  FaLock,
  FaPhone,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUser,
  FaUserCheck,
  FaUserFriends,
  FaUserLock,
  FaUserTimes,
  FaUsers,
} from 'react-icons/fa';
import { Link, useHistory } from 'react-router-dom';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from '../Composant/Toast';
import ConfirmModal from '../Modals/ConfirmModal';
import LoadingSpinner from '../Loading/LoadingSpinner';

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  statut: 'active',
  id_direction: '',
  id_division: '',
  division_ids: [],
  acces_direction: false,
  matricule: '',
  telephone: '',
  role_ids: [],
};

const UserScreen = () => {
  const token = GetTokenOrRedirect();
  const history = useHistory();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [directions, setDirections] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blocked: 0 });

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    fetchRoles();
    fetchDivisions();
    fetchDirections();
    fetchStats();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      fetchUsers();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentPage, perPage, search, statusFilter, divisionFilter]);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/mon-utilisateurs`, {
        headers,
        params: {
          page: currentPage,
          per_page: perPage,
          search: search.trim() || undefined,
          statut: statusFilter !== 'all' ? statusFilter : undefined,
          id_division: divisionFilter || undefined,
        },
      });

      if (response.data?.success) {
        const apiData = response.data.data;
        setUsers(apiData.data || []);
        setPagination({
          current_page: apiData.current_page || 1,
          last_page: apiData.last_page || 1,
          per_page: apiData.per_page || perPage,
          total: apiData.total || 0,
        });
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      toast.error('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers,
        params: { per_page: 100 },
      });
      if (response.data?.success) {
        setRoles(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/divisions`, {
        headers,
        params: { per_page: 100 },
      });
      const payload = response.data?.data ?? response.data;
      setDivisions(Array.isArray(payload) ? payload : (payload?.data || []));
    } catch (error) {
      console.error('Erreur chargement divisions:', error);
    }
  };

  const fetchDirections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/directions`, { headers });
      setDirections(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error) {
      console.error('Erreur chargement directions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/mon-utilisateurs/stats/general`, { headers });
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingUser(null);
    setErrors({});
  };

  const openCreate = () => {
    history.push('/gestion-utilisateurs/utilisateurs/nouveau');
  };

  const openEdit = (user) => {
    history.push(`/gestion-utilisateurs/utilisateurs/${user.id}/modifier`);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    if (!formData.id_direction) {
      setErrors({ id_direction: ["La direction est obligatoire."] });
      setSubmitting(false);
      return;
    }

    if (!formData.id_division) {
      setErrors({ id_division: ["La division de rattachement est obligatoire."] });
      setSubmitting(false);
      return;
    }

    const payload = {
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      email: formData.email.trim(),
      statut: formData.statut,
      id_division: Number(formData.id_division),
      division_ids: formData.division_ids,
      acces_direction: !!formData.acces_direction,
      matricule: formData.matricule.trim() || null,
      telephone: formData.telephone.trim() || null,
      role_ids: formData.role_ids,
    };

    if (formData.password) payload.password = formData.password;

    try {
      if (editingUser) {
        await axios.put(`${API_BASE_URL}/mon-utilisateurs/${editingUser.id}`, payload, { headers });
        toast.success('Utilisateur mis à jour avec succès');
      } else {
        await axios.post(`${API_BASE_URL}/mon-utilisateurs`, payload, { headers });
        toast.success('Utilisateur créé avec succès');
      }

      setShowModal(false);
      resetForm();
      await Promise.all([fetchUsers(), fetchStats()]);
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

  const toggleAdditionalDivision = (divisionId) => {
    const id = Number(divisionId);
    setFormData((current) => ({
      ...current,
      division_ids: current.division_ids.includes(id)
        ? current.division_ids.filter((value) => value !== id)
        : [...current.division_ids, id],
    }));
  };

  const handleToggleRole = (roleId) => {
    const id = Number(roleId);
    setFormData((current) => ({
      ...current,
      role_ids: current.role_ids.includes(id)
        ? current.role_ids.filter((value) => value !== id)
        : [...current.role_ids, id],
    }));
  };

  const confirmDelete = async () => {
    if (!confirmItem || !token) return;
    setConfirmLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/mon-utilisateurs/${confirmItem.id}`, { headers });
      toast.success('Utilisateur supprimé avec succès');
      setConfirmItem(null);
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setConfirmLoading(false);
    }
  };

  const getStatusLabel = (statut) => {
    if (statut === 'active') return 'Actif';
    if (statut === 'inactive') return 'Inactif';
    return 'Bloqué';
  };

  const getStatusStyle = (statut) => {
    if (statut === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (statut === 'inactive') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-rose-200 bg-rose-50 text-rose-700';
  };

  const getStatusDot = (statut) => {
    if (statut === 'active') return 'bg-emerald-500';
    if (statut === 'inactive') return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const selectedDirection = directions.find(
    (direction) => String(direction.id) === String(formData.id_direction)
  );
  const filteredDivisions = divisions.filter(
    (division) => String(division.id_direction) === String(formData.id_direction)
  );
  const selectedDivision = divisions.find((division) => String(division.id) === String(formData.id_division));

  const renderError = (field) => {
    if (!errors[field]) return null;
    const message = Array.isArray(errors[field]) ? errors[field][0] : errors[field];
    return (
      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
        <FaExclamationCircle size={10} /> {message}
      </p>
    );
  };

  const statCards = [
    { label: 'Total', value: stats.total, icon: <FaUsers />, tone: 'bg-navy-900 text-white' },
    { label: 'Actifs', value: stats.active, icon: <FaUserCheck />, tone: 'bg-emerald-500 text-white' },
    { label: 'Inactifs', value: stats.inactive, icon: <FaUserTimes />, tone: 'bg-amber-500 text-white' },
    { label: 'Bloqués', value: stats.blocked, icon: <FaUserLock />, tone: 'bg-rose-500 text-white' },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-navy-900/15">
              <FaUsers size={19} />
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">
                Gestion des utilisateurs
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Comptes, rôles et rattachement à une division DGRAD
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
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-navy-800 disabled:opacity-60"
            >
              <FaPlus size={12} /> Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card"
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
              {card.icon}
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold leading-none text-navy-900">
                {card.value}
              </p>
              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.8fr_1fr_auto]">
          <div className="relative">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par nom, prénom, email ou matricule..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-100"
            />
          </div>

          <div className="relative">
            <FaFilter className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="bloque">Bloqués</option>
            </select>
          </div>

          <div className="relative">
            <FaBuilding className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
            <select
              value={divisionFilter}
              onChange={(event) => {
                setDivisionFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
            >
              <option value="">Toutes les divisions</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.sigle} — {division.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end">
            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
              <FaUserFriends size={11} /> {pagination.total}
            </span>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        {loading ? (
          <LoadingSpinner
            message="Chargement des utilisateurs..."
            subtitle="Veuillez patienter"
            size="lg"
            variant="table"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Utilisateur</th>
                  <th className="px-5 py-3 text-left">Division</th>
                  <th className="px-5 py-3 text-left">Rôles</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-left">Dernière connexion</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                        <FaUser className="text-2xl text-slate-300" />
                      </div>
                      <p className="mt-4 text-sm font-bold text-slate-800">Aucun utilisateur trouvé</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {search || divisionFilter || statusFilter !== 'all'
                          ? 'Aucun résultat ne correspond à vos filtres.'
                          : 'Commencez par créer votre premier utilisateur.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-semibold text-slate-400">
                        {(pagination.current_page - 1) * pagination.per_page + index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-[10px] font-extrabold text-white">
                            {(user.prenom?.[0] || '')}
                            {(user.nom?.[0] || '')}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {user.prenom} {user.nom}
                            </p>
                            <p className="truncate text-[11px] font-medium text-slate-400">
                              {user.email}
                            </p>
                            {user.matricule && (
                              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                <FaIdBadge size={9} /> {user.matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {user.division ? (
                          <div>
                            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                              <FaBuilding className="text-[10px] text-slate-400" />
                              {user.division.sigle}
                            </p>
                            <p className="mt-0.5 max-w-[210px] truncate text-[10px] font-medium text-slate-400">
                              {user.division.direction?.sigle
                                ? `${user.division.direction.sigle} - ${user.division.nom}`
                                : user.division.nom}
                            </p>
                            {(user.divisions?.length || 0) > 1 && (
                              <p className="mt-1 inline-flex rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold text-sky-700 ring-1 ring-sky-100">
                                +{user.divisions.length - 1} autre(s) division(s)
                              </p>
                            )}
                            {user.acces_direction && (
                              <p className="mt-1 inline-flex rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-100">
                                Toute la direction
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">Non affecté</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-[230px] flex-wrap gap-1">
                          {user.roles?.length ? (
                            user.roles.map((role) => (
                              <span
                                key={role.id}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700"
                              >
                                <FaShieldAlt size={8} /> {role.nom}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] italic text-slate-400">Aucun rôle</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(
                            user.statut
                          )}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${getStatusDot(user.statut)}`} />
                          {getStatusLabel(user.statut)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[11px] font-medium text-slate-500">
                        {user.dernierconnection || user.derniere_connexion
                          ? format(new Date(user.dernierconnection || user.derniere_connexion), 'dd/MM/yyyy HH:mm', {
                              locale: fr,
                            })
                          : 'Jamais'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(user)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-navy-700 transition hover:border-navy-200 hover:bg-navy-50"
                            title="Modifier"
                          >
                            <FaEdit size={11} />
                          </button>
                          <button
                            onClick={() => setConfirmItem(user)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
                            title="Supprimer"
                          >
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.last_page > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row">
            <p className="text-[11px] font-medium text-slate-500">
              Affichage de {(pagination.current_page - 1) * pagination.per_page + 1} à{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur{' '}
              {pagination.total} utilisateurs
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <FaChevronLeft size={10} />
              </button>
              <span className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                onClick={() => setCurrentPage((page) => Math.min(pagination.last_page, page + 1))}
                disabled={currentPage === pagination.last_page}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modale utilisateur */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex shrink-0 items-center justify-between bg-navy-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <FaUser size={13} />
                </span>
                <div>
                  <h2 className="font-display text-base font-extrabold">
                    {editingUser ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
                  </h2>
                  <p className="text-[10px] font-medium text-slate-300">
                    {editingUser ? 'Mettre à jour le compte et son rattachement' : 'Créer un compte agent DGRAD'}
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

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                {/* Identité */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <FaUser className="text-navy-700" size={11} /> Identité
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Nom <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={formData.nom}
                        onChange={(event) => setFormData({ ...formData, nom: event.target.value })}
                        required
                        disabled={submitting}
                        placeholder="Nom"
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                          errors.nom
                            ? 'border-rose-300 focus:ring-rose-100'
                            : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                        }`}
                      />
                      {renderError('nom')}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Prénom <span className="text-rose-500">*</span>
                      </label>
                      <input
                        value={formData.prenom}
                        onChange={(event) => setFormData({ ...formData, prenom: event.target.value })}
                        required
                        disabled={submitting}
                        placeholder="Prénom"
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                          errors.prenom
                            ? 'border-rose-300 focus:ring-rose-100'
                            : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                        }`}
                      />
                      {renderError('prenom')}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Matricule</label>
                      <div className="relative">
                        <FaIdBadge className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                        <input
                          value={formData.matricule}
                          onChange={(event) => setFormData({ ...formData, matricule: event.target.value })}
                          disabled={submitting}
                          placeholder="Ex. DGRAD-001"
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                            errors.matricule
                              ? 'border-rose-300 focus:ring-rose-100'
                              : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                          }`}
                        />
                      </div>
                      {renderError('matricule')}
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <FaEnvelope className="text-navy-700" size={11} /> Contact
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Adresse email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <FaEnvelope className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                          required
                          disabled={submitting}
                          placeholder="prenom.nom@dgrad.cd"
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                            errors.email
                              ? 'border-rose-300 focus:ring-rose-100'
                              : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                          }`}
                        />
                      </div>
                      {renderError('email')}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Téléphone</label>
                      <div className="relative">
                        <FaPhone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                        <input
                          value={formData.telephone}
                          onChange={(event) => setFormData({ ...formData, telephone: event.target.value })}
                          disabled={submitting}
                          placeholder="+243 ..."
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                        />
                      </div>
                      {renderError('telephone')}
                    </div>
                  </div>
                </section>

                {/* Rattachement */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <FaBuilding className="text-navy-700" size={11} /> Rattachement organisationnel
                  </h3>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-600">
                          Direction <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.id_direction}
                          onChange={(event) => setFormData({
                            ...formData,
                            id_direction: event.target.value,
                            id_division: '',
                          })}
                          required
                          disabled={submitting}
                          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                            errors.id_direction
                              ? 'border-rose-300 focus:ring-rose-100'
                              : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                          }`}
                        >
                          <option value="">Veuillez sélectionner une direction</option>
                          {directions.map((direction) => (
                            <option key={direction.id} value={direction.id}>
                              {direction.sigle} — {direction.nom}
                            </option>
                          ))}
                        </select>
                        {renderError('id_direction')}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-slate-600">
                          Division <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.id_division}
                          onChange={(event) => setFormData({ ...formData, id_division: event.target.value })}
                          required
                          disabled={submitting || !formData.id_direction}
                          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                            errors.id_division
                              ? 'border-rose-300 focus:ring-rose-100'
                              : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                          }`}
                        >
                          <option value="">
                            {!formData.id_direction
                              ? "Veuillez d'abord sélectionner une direction"
                              : filteredDivisions.length === 0
                                ? 'Aucune division disponible pour cette direction'
                                : 'Veuillez sélectionner une division'}
                          </option>
                          {filteredDivisions.map((division) => (
                            <option key={division.id} value={division.id}>
                              {division.sigle} — {division.nom}
                            </option>
                          ))}
                        </select>
                        {renderError('id_division')}
                      </div>
                    </div>
                    {selectedDivision && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-navy-100 bg-white px-3 py-2.5">
                        <FaBuilding className="mt-0.5 text-navy-600" size={11} />
                        <div>
                          <p className="text-[11px] font-bold text-navy-900">
                            {selectedDivision.direction?.nom || 'Direction DGRAD'}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                            Code division : {selectedDivision.code} · {selectedDivision.nom}
                          </p>
                        </div>
                      </div>
                    )}

                    {formData.id_division && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                            Accès supplémentaires à d'autres divisions
                          </p>
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700 ring-1 ring-sky-100">
                            {formData.division_ids.length} sélectionnée(s)
                          </span>
                        </div>
                        <p className="mb-2 text-[10px] text-slate-400">
                          Ex. un directeur peut consulter les archives de plusieurs divisions.
                        </p>
                        <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-2">
                          {divisions
                            .filter((division) => String(division.id) !== String(formData.id_division))
                            .map((division) => {
                              const checked = formData.division_ids.includes(Number(division.id));
                              return (
                                <label
                                  key={division.id}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] transition ${
                                    checked ? 'bg-sky-50 text-sky-900 ring-1 ring-sky-100' : 'text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleAdditionalDivision(division.id)}
                                    disabled={submitting}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-navy-900 focus:ring-navy-200"
                                  />
                                  <span className="min-w-0 truncate">
                                    {division.direction?.sigle ? `${division.direction.sigle} / ` : ''}
                                    {division.sigle} — {division.nom}
                                  </span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {formData.id_division && (
                      <label
                        className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                          formData.acces_direction
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!formData.acces_direction}
                          onChange={(event) => setFormData({ ...formData, acces_direction: event.target.checked })}
                          disabled={submitting}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-900 focus:ring-navy-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Accès à toute la direction
                          </p>
                          <p className="mt-0.5 text-[10px] leading-5 text-slate-500">
                            L'utilisateur verra les archives et les titres de toutes les divisions
                            rattachées à sa direction (ex. un directeur).
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </section>

                {/* Sécurité et statut */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <FaLock className="text-navy-700" size={11} /> Sécurité et statut
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">
                        Mot de passe {!editingUser && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <FaLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                          required={!editingUser}
                          disabled={submitting}
                          placeholder={editingUser ? 'Laisser vide pour conserver' : 'Minimum 6 caractères'}
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-3.5 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
                            errors.password
                              ? 'border-rose-300 focus:ring-rose-100'
                              : 'border-slate-200 focus:border-navy-600 focus:ring-navy-100'
                          }`}
                        />
                      </div>
                      {renderError('password')}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-600">Statut du compte</label>
                      <select
                        value={formData.statut}
                        onChange={(event) => setFormData({ ...formData, statut: event.target.value })}
                        disabled={submitting}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="bloque">Bloqué</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Rôles */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    <FaShieldAlt className="text-navy-700" size={11} /> Rôles et permissions
                  </h3>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {roles.map((role) => {
                      const selected = formData.role_ids.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleToggleRole(role.id)}
                          disabled={submitting}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                            selected
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-navy-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">{role.nom}</p>
                            {role.description && (
                              <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                                {role.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              selected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {selected ? <FaCheck size={9} /> : <FaPlus size={8} />}
                          </span>
                        </button>
                      );
                    })}
                    {roles.length === 0 && (
                      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
                        Aucun rôle disponible.
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
                <p className="hidden text-[10px] font-medium text-slate-400 sm:block">
                  Les champs marqués <span className="text-rose-500">*</span> sont obligatoires.
                </p>
                <div className="flex items-center gap-2">
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
                        <FaSpinner className="animate-spin" size={11} />
                        Enregistrement...
                      </>
                    ) : editingUser ? (
                      'Mettre à jour'
                    ) : (
                      'Créer l’utilisateur'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={confirmDelete}
        title="Supprimer l’utilisateur ?"
        message={
          confirmItem
            ? `Voulez-vous vraiment supprimer le compte de ${confirmItem.prenom || ''} ${confirmItem.nom || ''} ?`
            : ''
        }
        confirmText="Oui, supprimer"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
};

export default UserScreen;
