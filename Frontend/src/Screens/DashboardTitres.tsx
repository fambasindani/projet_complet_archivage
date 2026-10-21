// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBook,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaFileInvoiceDollar,
  FaPlus,
  FaSync,
  FaTags,
  FaUserTie,
  FaWarehouse,
} from 'react-icons/fa';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import { api } from '../services/api';
import { toast } from '../Composant/Toast';

const EMPTY = {
  total_notes: 0,
  total_centres: 0,
  total_articles: 0,
  total_assujettis: 0,
  notes_actives: 0,
  notes_archivees: 0,
  notes_brouillons: 0,
  notes_aujourdhui: 0,
  notes_semaine: 0,
  notes_mois: 0,
  notes_annee: 0,
  montant_total: 0,
  montant_mois: 0,
  top_centres: [],
  top_articles: [],
  top_assujettis: [],
  par_classeur: [],
};

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />
);

const formatNumber = (value) => Number(value || 0).toLocaleString('fr-FR');

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const DashboardTitres = () => {
  const [stats, setStats] = useState(EMPTY);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    const results = await Promise.allSettled([
      api.get('/dashboards/notes/statistics'),
      api.get('/dashboards/notes/recent'),
    ]);
    const statPayload = results[0]?.status === 'fulfilled' ? results[0].value.data : null;
    const recentPayload = results[1]?.status === 'fulfilled' ? results[1].value.data : null;

    setStats({ ...EMPTY, ...(statPayload?.success ? statPayload.data : {}) });
    setRecent(recentPayload?.success ? recentPayload.data || [] : []);

    if (results.some((result) => result.status === 'rejected')) {
      toast.error('Certaines données du tableau de bord sont indisponibles');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const utilisateur = JSON.parse(localStorage.getItem('utilisateur') || 'null') || {};
  const divisions = JSON.parse(localStorage.getItem('divisions') || '[]');
  const departement = divisions[0] || null;
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const ratioActifs = useMemo(
    () => (stats.total_notes ? Math.round((stats.notes_actives / stats.total_notes) * 100) : 0),
    [stats]
  );

  const maxCentre = Math.max(...(stats.top_centres || []).map((item) => Number(item.total || 0)), 1);
  const maxArticle = Math.max(...(stats.top_articles || []).map((item) => Number(item.total || 0)), 1);
  const maxAssujetti = Math.max(...(stats.top_assujettis || []).map((item) => Number(item.total || 0)), 1);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fcfbf7] shadow-card">
            <div className="flex h-1">
              <span className="w-24 bg-navy-900" />
              <span className="w-10 bg-gold-400" />
              <span className="flex-1 bg-slate-200" />
            </div>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="p-6 sm:p-7">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-gold-600">
                  DGRAD · Titres de perception
                </p>
                <h1 className="mt-2 font-serif text-[30px] font-semibold leading-tight tracking-tight text-navy-900 sm:text-[34px]">
                  Tableau de bord des titres
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Suivi de l’émission, de la validation et du classement des titres de perception.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <FaCalendarAlt size={10} className="text-gold-600" />
                    <span className="capitalize">{today}</span>
                  </span>
                  {departement && (
                    <span className="inline-flex items-center gap-2">
                      <FaBuilding size={10} className="text-slate-400" />
                      {departement.sigle} · {departement.nom}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <FaUserTie size={10} className="text-slate-400" />
                    {`${utilisateur.prenom || ''} ${utilisateur.nom || ''}`.trim() || 'Agent DGRAD'}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => load(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <FaSync size={10} className={refreshing ? 'animate-spin' : ''} /> Actualiser
                  </button>
                  <Link
                    to="/titres/nouvelle"
                    className="inline-flex items-center gap-2 border border-navy-900 bg-navy-900 px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-navy-800"
                  >
                    <FaPlus size={10} /> Nouveau titre
                  </Link>
                  <Link
                    to="/titres"
                    className="inline-flex items-center gap-2 border border-navy-900/20 bg-white px-4 py-2.5 text-[11px] font-bold text-navy-800 transition hover:border-navy-900/40 hover:bg-navy-50"
                  >
                    <FaFileInvoiceDollar size={10} /> Registre des titres
                  </Link>
                  <Link
                    to="/recherche-ocr"
                    className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Recherche OCR
                  </Link>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white/60 p-6 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                    Repères
                  </p>
                  {loading ? (
                    <Skeleton className="h-3 w-8" />
                  ) : (
                    <span className="font-mono text-[9px] text-slate-400">{formatNumber(stats.notes_aujourdhui)}</span>
                  )}
                </div>
                <div className="mt-4 divide-y divide-slate-100">
                  {[
                    ['Titres émis', formatNumber(stats.total_notes)],
                    ['Titres actifs', formatNumber(stats.notes_actives)],
                    ['Émis ce mois', formatNumber(stats.notes_mois)],
                    ['Centres actifs', formatNumber(stats.total_centres)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 py-2.5">
                      <span className="text-[11px] font-medium text-slate-500">{label}</span>
                      {loading ? (
                        <Skeleton className="h-3.5 w-12" />
                      ) : (
                        <span className="font-mono text-sm font-bold text-navy-900">{value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: 'Total titres',
                value: formatNumber(stats.total_notes),
                detail: `${formatNumber(stats.total_centres)} centres`,
                icon: <FaFileInvoiceDollar size={16} />,
                tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
              },
              {
                label: 'Titres actifs',
                value: formatNumber(stats.notes_actives),
                detail: `${ratioActifs}% du registre`,
                icon: <FaCheckCircle size={16} />,
                tone: 'bg-blue-50 text-blue-700 ring-blue-100',
              },
              {
                label: 'Brouillons',
                value: formatNumber(stats.notes_brouillons),
                detail: 'En attente de validation',
                icon: <FaClock size={16} />,
                tone: 'bg-amber-50 text-amber-700 ring-amber-100',
              },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
                    {loading ? (
                      <Skeleton className={`mt-2 ${card.compact ? 'h-6 w-28' : 'h-8 w-24'}`} />
                    ) : (
                      <p className={`mt-2 font-serif font-semibold text-navy-900 ${card.compact ? 'text-xl' : 'text-3xl'}`}>
                        {card.value}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] font-medium text-slate-400">{card.detail}</p>
                  </div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${card.tone}`}>
                    {card.icon}
                  </span>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-display text-sm font-extrabold text-navy-900">Derniers titres</h2>
                  <p className="mt-0.5 text-[10px] text-slate-400">Émissions récentes par centre</p>
                </div>
                <Link to="/titres" className="text-[10px] font-bold text-navy-700 hover:text-navy-900">
                  Tout voir
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-2 w-1/2 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  ))
                ) : recent.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <FaFileInvoiceDollar className="mx-auto text-2xl text-slate-200" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">Aucun titre récent</p>
                  </div>
                ) : (
                  recent.slice(0, 7).map((item) => (
                    <Link
                      key={item.id}
                      to={`/titres/${item.id}/modifier`}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/70"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <FaFileInvoiceDollar size={12} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800">
                          {item.numero_serie ? `Titre ${item.numero_serie}` : 'Titre de perception'}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {[item.centre, item.assujetti].filter(Boolean).join(' · ') || 'Sans centre'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold text-slate-500">
                          {item.created_at_humain || formatDate(item.created_at)}
                        </p>
                        {item.article && <p className="mt-0.5 max-w-[130px] truncate text-[9px] text-slate-400">{item.article}</p>}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-extrabold text-navy-900">Top centres</h2>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Volume</span>
                </div>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={`skeleton-centre-${index}`}>
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                      </div>
                    ))
                  ) : (
                    <>
                      {(stats.top_centres || []).slice(0, 5).map((item) => (
                        <div key={`${item.id}-${item.nom}`}>
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="truncate font-semibold text-slate-600">{item.nom}</span>
                            <span className="shrink-0 font-mono font-bold text-navy-900">{formatNumber(item.total)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-teal-400"
                              style={{ width: `${Math.max(5, (Number(item.total || 0) / maxCentre) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {(!stats.top_centres || stats.top_centres.length === 0) && (
                        <p className="py-4 text-center text-xs text-slate-400">Aucune donnée disponible.</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-extrabold text-navy-900">Top articles</h2>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Imputation</span>
                </div>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={`skeleton-article-${index}`}>
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                      </div>
                    ))
                  ) : (
                    <>
                      {(stats.top_articles || []).slice(0, 5).map((item) => (
                        <div key={`${item.id}-${item.code}`}>
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="truncate font-semibold text-slate-600">
                              {item.code ? `${item.code} · ` : ''}{item.nom}
                            </span>
                            <span className="shrink-0 font-mono font-bold text-navy-900">{formatNumber(item.total)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-700 to-sky-400"
                              style={{ width: `${Math.max(5, (Number(item.total || 0) / maxArticle) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {(!stats.top_articles || stats.top_articles.length === 0) && (
                        <p className="py-4 text-center text-xs text-slate-400">Aucune donnée disponible.</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-extrabold text-navy-900">Top assujettis</h2>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Redevables</span>
                </div>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={`skeleton-assujetti-${index}`}>
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                      </div>
                    ))
                  ) : (
                    <>
                      {(stats.top_assujettis || []).slice(0, 5).map((item) => (
                        <div key={`${item.id}-${item.nom}`}>
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <span className="truncate font-semibold text-slate-600">{item.nom}</span>
                            <span className="shrink-0 font-mono font-bold text-navy-900">{formatNumber(item.total)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-700 to-gold-400"
                              style={{ width: `${Math.max(5, (Number(item.total || 0) / maxAssujetti) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {(!stats.top_assujettis || stats.top_assujettis.length === 0) && (
                        <p className="py-4 text-center text-xs text-slate-400">Aucune donnée disponible.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link to="/titres" className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <FaFileInvoiceDollar size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-900">Registre des titres</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Consulter et valider les titres</p>
              </div>
              <FaArrowRight size={10} className="text-slate-300 transition group-hover:text-navy-700" />
            </Link>
            <Link to="/categories-titres" className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <FaTags size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-900">Catégories de titres</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Règles et champs obligatoires</p>
              </div>
              <FaArrowRight size={10} className="text-slate-300 transition group-hover:text-navy-700" />
            </Link>
            <Link to="/centre-ordonnancement" className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <FaWarehouse size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-900">Centres d’ordonnancement</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Centres émetteurs des titres</p>
              </div>
              <FaArrowRight size={10} className="text-slate-300 transition group-hover:text-navy-700" />
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DashboardTitres;
