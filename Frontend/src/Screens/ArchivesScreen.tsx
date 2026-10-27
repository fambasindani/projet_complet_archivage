// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  FaArchive,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaEye,
  FaFileAlt,
  FaFilter,
  FaPlus,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import { toast } from '../Composant/Toast';
import ConfirmModal from '../Modals/ConfirmModal';
import FichiersDocumentsModal from '../Modals/FichiersDocumentsModal';
import ModalHeader from '../Composant/ModalHeader';
import LoadingSpinner from '../Loading/LoadingSpinner';
import archiveService from '../services/archive.service';
import typeDocumentService from '../services/typeDocument.service';
import divisionService from '../services/division.service';

const STATUTS = ['brouillon', 'actif', 'archive', 'inactif'];

const statutTone = {
  actif: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  brouillon: 'border-amber-200 bg-amber-50 text-amber-700',
  archive: 'border-blue-200 bg-blue-50 text-blue-700',
  inactif: 'border-slate-200 bg-slate-50 text-slate-500',
};

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const ArchivesScreen = () => {
  const history = useHistory();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
  const [filters, setFilters] = useState({ search: '', statut: '', id_division: '', id_type_document: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [filesFor, setFilesFor] = useState(null);
  const [options, setOptions] = useState({ types: [], divisions: [] });

  useEffect(() => {
    const loadOptions = async () => {
      const results = await Promise.allSettled([
        typeDocumentService.list({ per_page: 200 }),
        divisionService.list({ per_page: 200 }),
      ]);
      setOptions({
        types: results[0]?.status === 'fulfilled' ? asList(results[0].value) : [],
        divisions: results[1]?.status === 'fulfilled' ? asList(results[1].value) : [],
      });
    };
    loadOptions();
  }, []);

  const load = async (page = pagination.current_page) => {
    setLoading(true);
    try {
      const response = await archiveService.list({
        page,
        per_page: pagination.per_page,
        search: filters.search.trim() || undefined,
        statut: filters.statut || undefined,
        id_division: filters.id_division || undefined,
        id_type_document: filters.id_type_document || undefined,
      });
      setRows(response?.data || []);
      setPagination({
        current_page: response?.current_page || 1,
        last_page: response?.last_page || 1,
        total: response?.total || 0,
        per_page: response?.per_page || 20,
      });
    } catch {
      toast.error('Impossible de charger les archives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(1), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.statut, filters.id_division, filters.id_type_document]);

  const stats = useMemo(() => ({
    actifs: rows.filter((r) => r.statut === 'actif').length,
    archives: rows.filter((r) => r.statut === 'archive').length,
    inactifs: rows.filter((r) => r.statut === 'inactif').length,
  }), [rows]);

  const remove = async () => {
    if (!confirmItem) return;
    setConfirmLoading(true);
    try {
      await archiveService.remove(confirmItem.id);
      toast.success('Archive supprimée');
      setConfirmItem(null);
      await load();
    } catch {
      toast.error('Suppression impossible');
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
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-navy-900/15">
                  <FaArchive size={19} />
                </div>
                <div>
                  <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">Archives ordinaires</h1>
                  <p className="mt-1 text-sm text-slate-500">Documents, classement, fichiers et recherche OCR</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/recherche-ocr"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FaSearch size={11} /> Recherche OCR
                </Link>
                <Link
                  to="/archives/nouvelle"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
                >
                  <FaPlus size={12} /> Nouvelle archive
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total', value: pagination.total, tone: 'text-navy-900' },
              { label: 'Actifs', value: stats.actifs, tone: 'text-emerald-600' },
              { label: 'Archives', value: stats.archives, tone: 'text-blue-600' },
              { label: 'Inactifs', value: stats.inactifs, tone: 'text-amber-600' },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">{card.label}</p>
                <p className={`mt-1 font-display text-2xl font-extrabold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  value={filters.search}
                  onChange={(event) => setFilters({ ...filters, search: event.target.value })}
                  placeholder="Rechercher une référence, un titre, un objet, un dossier ou un texte OCR..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-100"
                />
              </div>
              <button
                onClick={() => setShowFilters((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FaFilter size={10} /> Filtres
              </button>
              <button
                onClick={() => {
                  setFilters({ search: '', statut: '', id_division: '', id_type_document: '' });
                  load(1);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FaSync size={10} /> Actualiser
              </button>
            </div>
            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                <select value={filters.statut} onChange={(e) => setFilters({ ...filters, statut: e.target.value })} className={inputClass}>
                  <option value="">Tous les statuts</option>
                  {STATUTS.map((statut) => <option key={statut} value={statut}>{statut}</option>)}
                </select>
                <select value={filters.id_division} onChange={(e) => setFilters({ ...filters, id_division: e.target.value })} className={inputClass}>
                  <option value="">Toutes les divisions</option>
                  {options.divisions.map((division) => <option key={division.id} value={division.id}>{division.sigle} — {division.nom}</option>)}
                </select>
                <select value={filters.id_type_document} onChange={(e) => setFilters({ ...filters, id_type_document: e.target.value })} className={inputClass}>
                  <option value="">Tous les types de documents</option>
                  {options.types.map((type) => <option key={type.id} value={type.id}>{type.libelle}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            {loading ? (
              <LoadingSpinner message="Chargement des archives..." variant="table" size="lg" />
            ) : rows.length === 0 ? (
              <div className="py-16 text-center">
                <FaArchive className="mx-auto text-2xl text-slate-200" />
                <p className="mt-3 text-sm font-bold text-slate-700">Aucune archive trouvée</p>
                <p className="mt-1 text-xs text-slate-400">Créez une archive pour commencer.</p>
                <Link to="/archives/nouvelle" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-navy-800">
                  <FaPlus size={10} /> Nouvelle archive
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
                      <th className="px-5 py-3 text-left">Référence</th>
                      <th className="px-5 py-3 text-left">Titre</th>
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-5 py-3 text-left">Division</th>
                      <th className="px-5 py-3 text-left">Date</th>
                      <th className="px-5 py-3 text-left">Statut</th>
                      <th className="px-5 py-3 text-center">Fichiers</th>
                      <th className="px-5 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                      <tr key={row.id} className="transition hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-navy-50 px-2 py-1 text-[10px] font-extrabold text-navy-700 ring-1 ring-navy-100">{row.reference}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-[260px] truncate font-bold text-slate-900">{row.titre}</p>
                          {row.numero_dossier && <p className="mt-0.5 text-[10px] text-slate-400">Dossier {row.numero_dossier}</p>}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">{row.type_document?.libelle || '—'}</td>
                        <td className="px-5 py-4 text-xs text-slate-600">{row.division ? `${row.division.sigle} — ${row.division.nom}` : '—'}</td>
                        <td className="px-5 py-4 text-xs text-slate-600">{row.date_document ? String(row.date_document).slice(0, 10) : '—'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statutTone[row.statut] || statutTone.inactif}`}>{row.statut}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button onClick={() => setFilesFor(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50">
                            <FaFileAlt size={9} /> {row.fichiers_count ?? 0}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setDetail(row)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sky-600 hover:bg-sky-50" title="Détails">
                              <FaEye size={11} />
                            </button>
                            <button onClick={() => history.push(`/archives/${row.id}/modifier`)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-navy-700 hover:bg-navy-50" title="Modifier">
                              <FaEdit size={11} />
                            </button>
                            <button onClick={() => setConfirmItem(row)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50" title="Supprimer">
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

          {rows.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Affichage {(pagination.current_page - 1) * pagination.per_page + 1} à{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} sur {pagination.total}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => load(Math.max(1, pagination.current_page - 1))} disabled={pagination.current_page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
                  <FaChevronLeft size={9} />
                </button>
                <span className="px-3 text-xs font-bold text-slate-700">Page {pagination.current_page} / {pagination.last_page}</span>
                <button onClick={() => load(Math.min(pagination.last_page, pagination.current_page + 1))} disabled={pagination.current_page === pagination.last_page} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
                  <FaChevronRight size={9} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <ModalHeader
              title={detail.titre || 'Archive'}
              subtitle={`Archive · ${detail.reference || '—'}`}
              eyebrow="DGRAD · Archivage ordinaire"
              icon={<FaArchive size={15} />}
              onClose={() => setDetail(null)}
            />
            <div className="overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Statut', detail.statut],
                ['Type', detail.type_document?.libelle],
                ['Division', detail.division ? `${detail.division.sigle} — ${detail.division.nom}` : null],
                ['Classeur', detail.classeur?.nom_classeur],
                ['Emplacement', detail.emplacement?.nom_emplacement],
                ['Dossier', detail.numero_dossier],
                ['Date document', detail.date_document ? String(detail.date_document).slice(0, 10) : null],
                ['Date enregistrement', detail.date_enregistrement ? String(detail.date_enregistrement).slice(0, 10) : null],
                ['Créateur', detail.createur?.full_name],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-800">{value || '—'}</p>
                </div>
              ))}
            </div>
            {detail.objet && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Objet</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-700">{detail.objet}</p>
              </div>
            )}
            {(detail.mots_cles || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {detail.mots_cles.map((mot) => <span key={mot.id} className="rounded-md bg-navy-50 px-2 py-1 text-[10px] font-bold text-navy-700">{mot.libelle}</span>)}
              </div>
            )}
            <button onClick={() => setFilesFor(detail)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white hover:bg-navy-800">
              <FaFileAlt size={10} /> Gérer les fichiers ({detail.fichiers_count ?? 0})
            </button>
            </div>
          </div>
        </div>
      )}

      <FichiersDocumentsModal
        isOpen={!!filesFor}
        onClose={() => setFilesFor(null)}
        entiteType="archive"
        entiteId={filesFor?.id}
        onChanged={() => load()}
      />

      <ConfirmModal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        onConfirm={remove}
        title="Supprimer l'archive ?"
        message={confirmItem ? `Voulez-vous supprimer « ${confirmItem.titre} » ?` : ''}
        confirmText="Oui, supprimer"
        variant="danger"
        loading={confirmLoading}
      />
    </div>
  );
};

export default ArchivesScreen;
