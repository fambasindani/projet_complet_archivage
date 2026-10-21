// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaPlus,
  FaSearch,
  FaSync,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import ModalDirectionScreen from '../Modals/ModalDirectionScreen';
import ConfirmModal from '../Modals/ConfirmModal';
import LoadingSpinner from '../Loading/LoadingSpinner';
import { API_BASE_URL } from '../config';
import { toast } from '../Composant/Toast';

const DirectionScreen = () => {
  const token = GetTokenOrRedirect();
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [directionToEdit, setDirectionToEdit] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchDirections = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/directions`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const payload = Array.isArray(response.data)
        ? response.data
        : response.data?.data?.data || response.data?.data || [];
      setDirections(payload);
    } catch (error) {
      toast.error('Erreur lors du chargement des directions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [search, perPage]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return directions;
    return directions.filter((direction) =>
      [direction.nom, direction.sigle, direction.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [directions, search]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const stats = useMemo(() => ({
    total: directions.length,
    divisions: directions.reduce((sum, direction) => sum + Number(direction.divisions_count || 0), 0),
    recentes: directions.filter((direction) => direction.created_at).length,
  }), [directions]);

  const openCreate = () => {
    setDirectionToEdit(null);
    setShowModal(true);
  };

  const openEdit = (direction) => {
    setDirectionToEdit(direction);
    setShowModal(true);
  };

  const remove = async () => {
    if (!confirmItem) return;
    setConfirmLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/directions/${confirmItem.id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      toast.success('Direction désactivée');
      setConfirmItem(null);
      await fetchDirections();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Suppression impossible');
    } finally {
      setConfirmLoading(false);
    }
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '—';

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
                  <FaBuilding size={19} />
                </div>
                <div>
                  <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">Directions DGRAD</h1>
                  <p className="mt-1 text-sm text-slate-500">Structure organisationnelle et divisions rattachées</p>
                </div>
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
              >
                <FaPlus size={12} /> Nouvelle direction
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Directions', value: stats.total, icon: <FaBuilding size={15} />, tone: 'bg-blue-50 text-blue-700 ring-blue-100' },
              { label: 'Divisions rattachées', value: stats.divisions, icon: <FaUsers size={15} />, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
              { label: 'Directions actives', value: stats.recentes, icon: <FaCheckCircle size={15} />, tone: 'bg-amber-50 text-amber-700 ring-amber-100' },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                    <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{card.value}</p>
                  </div>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${card.tone}`}>{card.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une direction par nom, sigle ou code..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-100"
                />
              </div>
              <select
                value={perPage}
                onChange={(event) => setPerPage(Number(event.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <button
                onClick={fetchDirections}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <FaSync size={10} className={loading ? 'animate-spin' : ''} /> Actualiser
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            {loading ? (
              <LoadingSpinner message="Chargement des directions..." variant="table" size="lg" />
            ) : visible.length === 0 ? (
              <div className="py-16 text-center">
                <FaBuilding className="mx-auto text-2xl text-slate-200" />
                <p className="mt-3 text-sm font-bold text-slate-700">Aucune direction trouvée</p>
                <p className="mt-1 text-xs text-slate-400">
                  {search ? 'Aucun résultat pour cette recherche.' : 'Créez une direction pour commencer.'}
                </p>
                <button onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-navy-800">
                  <FaPlus size={10} /> Nouvelle direction
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-5 py-3 text-left">Code</th>
                      <th className="px-5 py-3 text-left">Sigle</th>
                      <th className="px-5 py-3 text-left">Direction</th>
                      <th className="px-5 py-3 text-left">Divisions</th>
                      <th className="px-5 py-3 text-left">Création</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visible.map((direction) => (
                      <tr key={direction.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-navy-50 px-2 py-1 text-[10px] font-extrabold text-navy-700 ring-1 ring-navy-100">
                            {direction.code || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                            {direction.sigle || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                              <FaBuilding size={12} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{direction.nom}</p>
                              {direction.description && <p className="mt-0.5 truncate text-[10px] text-slate-400">{direction.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                            <FaUsers size={9} /> {direction.divisions_count ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <FaCalendarAlt size={9} className="text-slate-400" /> {formatDate(direction.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => openEdit(direction)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-navy-700 hover:bg-navy-50" title="Modifier">
                              <FaEdit size={11} />
                            </button>
                            <button onClick={() => setConfirmItem(direction)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50" title="Supprimer">
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

          {visible.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Affichage {(currentPage - 1) * perPage + 1} à {Math.min(currentPage * perPage, filtered.length)} sur {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
                  <FaChevronLeft size={9} />
                </button>
                <span className="px-3 text-xs font-bold text-slate-700">Page {currentPage} / {lastPage}</span>
                <button onClick={() => setPage(Math.min(lastPage, currentPage + 1))} disabled={currentPage === lastPage} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
                  <FaChevronRight size={9} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalDirectionScreen
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setDirectionToEdit(null);
        }}
        directionToEdit={directionToEdit}
        onSuccess={fetchDirections}
      />

      <ConfirmModal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={remove}
        title="Désactiver la direction ?"
        message={confirmItem ? `Voulez-vous désactiver « ${confirmItem.nom} » ?` : ''}
        confirmText="Oui, désactiver"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
};

export default DirectionScreen;
