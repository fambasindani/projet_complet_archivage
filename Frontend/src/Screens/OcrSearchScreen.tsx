// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArchive,
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaEye,
  FaFileAlt,
  FaFileInvoiceDollar,
  FaLock,
  FaSearch,
  FaSpinner,
  FaSync,
  FaTimes,
} from 'react-icons/fa';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import LoadingSpinner from '../Loading/LoadingSpinner';
import FichiersDocumentsModal from '../Modals/FichiersDocumentsModal';
import fichierService from '../services/fichier.service';
import ocrService from '../services/ocr.service';
import { toast } from '../Composant/Toast';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlight = (text, query) => {
  if (!query) return text;
  const parts = String(text || '').split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="rounded bg-gold-200 px-0.5 text-navy-900">{part}</mark>
    ) : (
      part
    )
  );
};

const statusTone = {
  termine: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  en_cours: 'border-blue-200 bg-blue-50 text-blue-700',
  en_attente: 'border-amber-200 bg-amber-50 text-amber-700',
  erreur: 'border-rose-200 bg-rose-50 text-rose-700',
};

const OcrSearchScreen = () => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 });
  const [filesFor, setFilesFor] = useState(null);
  const [fullText, setFullText] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [denied, setDenied] = useState(false);

  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const canViewOcr = permissions.includes('ocr.view');

  const search = async (page = 1) => {
    if (!canViewOcr) return;
    setLoading(true);
    try {
      const response = await ocrService.search({
        q: query.trim() || undefined,
        entite_type: type || undefined,
        page,
        per_page: pagination.per_page,
      });
      setRows(response?.data || []);
      setPagination({
        current_page: response?.current_page || 1,
        last_page: response?.last_page || 1,
        total: response?.total || 0,
        per_page: response?.per_page || 15,
      });
    } catch (error) {
      if (error.response?.status === 403) {
        setDenied(true);
      }
      toast.error(error.response?.data?.message || 'Impossible de lancer la recherche OCR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canViewOcr) return;
    const timer = setTimeout(() => search(1), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, type, canViewOcr]);

  const stats = useMemo(() => {
    const archives = rows.filter((row) => row.entite_type === 'archive').length;
    const titres = rows.filter((row) => row.entite_type === 'titre_perception').length;
    return { archives, titres };
  }, [rows]);

  const openFullText = async (row) => {
    if (!row.fichier_id) return;
    setFullText({ ...row, texte: '' });
    setLoadingText(true);
    try {
      const response = await fichierService.getById(row.fichier_id);
      const file = response?.data || response;
      const ocr = file.traitements_ocr?.[0];
      setFullText({ ...row, texte: ocr?.texte_extrait || '' });
    } catch {
      toast.error('Impossible de charger le texte complet');
    } finally {
      setLoadingText(false);
    }
  };

  const reset = () => {
    setQuery('');
    setType('');
    setPagination((prev) => ({ ...prev, current_page: 1 }));
  };

  if (!canViewOcr || denied) {
    return (
      <div className="min-h-screen bg-[#f4f6fb]">
        <Menus />
        <Head />
        <div className="lg:pl-64">
          <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="flex h-1">
                <span className="w-24 bg-navy-900" />
                <span className="w-10 bg-gold-400" />
                <span className="flex-1 bg-slate-200" />
              </div>
              <div className="px-8 py-12 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                  <FaLock size={24} />
                </span>
                <p className="mt-4 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-gold-600">
                  DGRAD · Contrôle d'accès
                </p>
                <h1 className="mt-2 font-serif text-2xl font-semibold text-navy-900">
                  Accès non autorisé
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Vous n'avez pas la permission de consulter la recherche OCR. Contactez
                  l'administrateur pour obtenir le droit <span className="font-semibold text-slate-700">ocr.view</span>.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-navy-800"
                >
                  Retour au tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fcfbf7] shadow-card">
            <div className="flex h-1">
              <span className="w-24 bg-navy-900" />
              <span className="w-10 bg-gold-400" />
              <span className="flex-1 bg-slate-200" />
            </div>
            <div className="p-6 sm:p-7">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-gold-600">
                DGRAD · Recherche documentaire
              </p>
              <h1 className="mt-2 font-serif text-[30px] font-semibold leading-tight tracking-tight text-navy-900 sm:text-[34px]">
                Recherche dans le texte OCR
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Retrouvez une archive ou un titre à partir d’un mot, d’une date ou d’une référence
                présent dans le texte extrait des pièces numérisées.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && search(1)}
                    placeholder="Ex. montant, numéro de dossier, nom de l’assujetti..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-navy-700 focus:ring-4 focus:ring-navy-100"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100">
                      <FaTimes size={10} />
                    </button>
                  )}
                </div>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-navy-700 focus:ring-4 focus:ring-navy-100 sm:w-52"
                >
                  <option value="">Tous les documents</option>
                  <option value="archive">Archives ordinaires</option>
                  <option value="titre_perception">Titres de perception</option>
                </select>
                <button
                  onClick={() => search(1)}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800 disabled:opacity-50"
                >
                  {loading ? <FaSpinner className="animate-spin" size={11} /> : <FaSearch size={11} />}
                  Rechercher
                </button>
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FaSync size={10} /> Réinitialiser
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-semibold text-slate-400">
                <span>{pagination.total} résultat(s)</span>
                <span>{stats.archives} archive(s) sur cette page</span>
                <span>{stats.titres} titre(s) sur cette page</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-navy-600" /> Périmètre : vos divisions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Index OCR actif
                </span>
              </div>
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            {loading ? (
              <LoadingSpinner message="Recherche dans les textes OCR..." variant="table" size="lg" />
            ) : rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FaSearch className="mx-auto text-2xl text-slate-200" />
                <p className="mt-3 text-sm font-bold text-slate-700">Aucun résultat OCR</p>
                <p className="mt-1 text-xs text-slate-400">
                  {query
                    ? 'Essayez un autre mot-clé ou vérifiez que le document a bien été traité par l’OCR.'
                    : 'Les derniers textes OCR traités apparaîtront ici.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const isArchive = row.entite_type === 'archive';
                  return (
                    <article key={row.id} className="p-5 transition hover:bg-slate-50/60">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${isArchive ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'}`}>
                            {isArchive ? <FaArchive size={14} /> : <FaFileInvoiceDollar size={14} />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-extrabold text-slate-900">
                                {row.reference || 'Référence inconnue'}
                              </p>
                              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${isArchive ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                                {isArchive ? 'Archive' : 'Titre'}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusTone[row.statut] || 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                                OCR {row.statut}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                              {row.titre || 'Sans intitulé'}
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                              <span className="inline-flex items-center gap-1"><FaFileAlt size={8} /> {row.nom_original || 'Fichier'}</span>
                              <span>·</span>
                              <span>{Number(row.taille_octets || 0) ? `${(Number(row.taille_octets) / 1024 / 1024).toFixed(2)} Mo` : 'Taille inconnue'}</span>
                              {row.moteur && <><span>·</span><span>{row.moteur}</span></>}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Link
                            to={isArchive ? `/archives/${row.entite_id}/modifier` : `/titres/${row.entite_id}/modifier`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-navy-700 hover:bg-navy-50"
                          >
                            <FaEye size={9} /> Ouvrir la fiche
                          </Link>
                          <button
                            onClick={() => setFilesFor(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                          >
                            <FaFileAlt size={9} /> Fichier
                          </button>
                          <button
                            onClick={() => openFullText(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                          >
                            <FaSearch size={9} /> Texte complet
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                        <p className="text-[11px] leading-6 text-slate-600">
                          {highlight(row.extrait || 'Aucun extrait disponible.', query.trim())}
                        </p>
                      </div>
                    </article>
                  );
                })}
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
                <button onClick={() => search(Math.max(1, pagination.current_page - 1))} disabled={pagination.current_page === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
                  <FaChevronLeft size={9} />
                </button>
                <span className="px-3 text-xs font-bold text-slate-700">Page {pagination.current_page} / {pagination.last_page}</span>
                <button onClick={() => search(Math.min(pagination.last_page, pagination.current_page + 1))} disabled={pagination.current_page === pagination.last_page} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
                  <FaChevronRight size={9} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <FichiersDocumentsModal
        isOpen={!!filesFor}
        onClose={() => setFilesFor(null)}
        entiteType={filesFor?.entite_type}
        entiteId={filesFor?.entite_id}
        onChanged={() => search(pagination.current_page)}
      />

      {fullText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setFullText(null)} />
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex h-1 shrink-0">
              <span className="w-20 bg-navy-900" />
              <span className="w-8 bg-gold-400" />
              <span className="flex-1 bg-slate-200" />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-[#fcfbf7] px-6 py-4">
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-extrabold uppercase tracking-[0.18em] text-gold-600">DGRAD · Texte OCR complet</p>
                <h3 className="mt-1 truncate font-serif text-lg font-semibold text-navy-900">{fullText.reference}</h3>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">{fullText.nom_original}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(fullText.texte || '');
                      toast.success('Texte copié');
                    } catch {
                      toast.error('Copie impossible');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  <FaCopy size={9} /> Copier
                </button>
                <button onClick={() => setFullText(null)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                  <FaTimes size={13} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingText ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <FaSpinner className="animate-spin" size={18} />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50/70 p-5 font-mono text-[12px] leading-6 text-slate-700">
                  {fullText.texte || 'Aucun texte OCR disponible.'}
                </pre>
              )}
            </div>
            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button onClick={() => setFullText(null)} className="rounded-xl bg-navy-900 px-5 py-2.5 text-[11px] font-bold text-white hover:bg-navy-800">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OcrSearchScreen;
