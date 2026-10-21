// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import axios from "axios";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import { API_BASE_URL } from "../config";
import {
  FaArchive,
  FaArrowRight,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaFileInvoiceDollar,
  FaFolderOpen,
  FaHistory,
  FaPlus,
  FaShieldAlt,
  FaSync,
  FaUserFriends,
  FaUsers,
} from "react-icons/fa";

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />
);

const EMPTY_STATS = {
  archives: {
    total_documents: 0,
    documents_actifs: 0,
    documents_archives: 0,
    documents_aujourdhui: 0,
    documents_mois: 0,
    top_classificateurs: [],
  },
  titres: {
    total_notes: 0,
    notes_actives: 0,
    notes_archivees: 0,
    notes_aujourdhui: 0,
    notes_mois: 0,
    total_centres: 0,
    top_centres: [],
  },
  users: { total: 0, active: 0, inactive: 0, blocked: 0 },
  journal: { total: 0, today: 0, by_action: {} },
};

const UnifiedDashboard = () => {
  const token = GetTokenOrRedirect();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [activities, setActivities] = useState([]);

  const utilisateur = JSON.parse(localStorage.getItem("utilisateur") || "null") || {};
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
  const roles = JSON.parse(localStorage.getItem("role") || "[]");
  const departements = JSON.parse(localStorage.getItem("divisions") || "[]");
  const departement = departements[0] || null;

  const has = (permission) => permissions.includes(permission);
  const canArchive = has("archiv_doc") || has("acceder_au__document") || has("archives.view");
  const canTitres = has("note_perception") || has("acceder_au_note_perception") || has("titres.view");
  const canUsers = has("utilisateur") || has("users.view");
  const canAudit = has("audit.view") || has("utilisateur");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, Accept: "application/json" }),
    [token]
  );

  const fetchData = async (silent = false) => {
    if (!token) return;
    silent ? setRefreshing(true) : setLoading(true);

    const requests = [
      axios.get(`${API_BASE_URL}/dashboard/statistics`, { headers }),
      axios.get(`${API_BASE_URL}/dashboards/notes/statistics`, { headers }),
      axios.get(`${API_BASE_URL}/dashboard/statistique`, { headers }),
      axios.get(`${API_BASE_URL}/journal/stats`, { headers }),
      axios.get(`${API_BASE_URL}/dashboard/recent`, { headers }),
      axios.get(`${API_BASE_URL}/dashboards/notes/recent`, { headers }),
    ];

    const results = await Promise.allSettled(requests);

    const value = (index) =>
      results[index]?.status === "fulfilled" ? results[index].value?.data : null;

    const archivesPayload = value(0);
    const titresPayload = value(1);
    const usersPayload = value(2);
    const journalPayload = value(3);
    const archivesRecent = value(4);
    const titresRecent = value(5);

    setStats({
      archives: {
        ...EMPTY_STATS.archives,
        ...(archivesPayload?.success ? archivesPayload.data : {}),
      },
      titres: {
        ...EMPTY_STATS.titres,
        ...(titresPayload?.success ? titresPayload.data : {}),
      },
      users: {
        ...EMPTY_STATS.users,
        ...(usersPayload?.success ? usersPayload.data?.users || {} : {}),
      },
      journal: {
        ...EMPTY_STATS.journal,
        ...(journalPayload?.success ? journalPayload.data : {}),
      },
    });

    const archiveActivities = (archivesRecent?.success ? archivesRecent.data : []).map((item) => ({
      key: `archive-${item.id}`,
      type: "archive",
      title: item.document || item.reference || "Document",
      subtitle: [item.classeur, item.direction].filter(Boolean).join(" - "),
      author: item.utilisateur,
      date: item.created_at,
      link: "/archives",
    }));

    const titreActivities = (titresRecent?.success ? titresRecent.data : []).map((item) => ({
      key: `titre-${item.id}`,
      type: "titre",
      title: item.numero_serie ? `Titre ${item.numero_serie}` : "Titre de perception",
      subtitle: [item.centre, item.assujetti].filter(Boolean).join(" - "),
      author: null,
      date: item.created_at,
      link: "/titres",
    }));

    setActivities(
      [...archiveActivities, ...titreActivities]
        .filter((item) => item.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8)
    );

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullName = `${utilisateur.prenom || ""} ${utilisateur.nom || ""}`.trim() || "Utilisateur";
  const roleName = roles?.[0]?.nom || "Agent DGRAD";
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formatNumber = (value) => Number(value || 0).toLocaleString("fr-FR");

  const formatActivityDate = (date) => {
    if (!date) return "-";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
    } catch {
      return "-";
    }
  };

  const activeActivities = (stats.archives.documents_aujourdhui || 0) + (stats.titres.notes_aujourdhui || 0);

  const kpis = [
    {
      label: "Archives ordinaires",
      value: formatNumber(stats.archives.total_documents),
      detail: `${formatNumber(stats.archives.documents_actifs)} actifs`,
      icon: <FaArchive size={17} />,
      tone: "bg-blue-50 text-blue-700 ring-blue-100",
      bar: "bg-blue-600",
      progress: Math.min(100, Math.max(8, stats.archives.documents_actifs ? (stats.archives.documents_actifs / Math.max(stats.archives.total_documents, 1)) * 100 : 8)),
    },
    {
      label: "Titres de perception",
      value: formatNumber(stats.titres.total_notes),
      detail: `${formatNumber(stats.titres.notes_actives)} actifs`,
      icon: <FaFileInvoiceDollar size={17} />,
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      bar: "bg-emerald-600",
      progress: Math.min(100, Math.max(8, stats.titres.notes_actives ? (stats.titres.notes_actives / Math.max(stats.titres.total_notes, 1)) * 100 : 8)),
    },
    {
      label: "Utilisateurs",
      value: formatNumber(stats.users.total),
      detail: `${formatNumber(stats.users.active)} comptes actifs`,
      icon: <FaUserFriends size={17} />,
      tone: "bg-violet-50 text-violet-700 ring-violet-100",
      bar: "bg-violet-600",
      progress: Math.min(100, Math.max(8, stats.users.total ? (stats.users.active / stats.users.total) * 100 : 8)),
    },
    {
      label: "Activité du jour",
      value: formatNumber(activeActivities),
      detail: `${formatNumber(stats.journal.today)} opérations journalisées`,
      icon: <FaChartLine size={17} />,
      tone: "bg-amber-50 text-amber-700 ring-amber-100",
      bar: "bg-amber-500",
      progress: Math.min(100, Math.max(8, activeActivities ? 62 : 8)),
    },
  ];

  const quickActions = [
    canArchive && {
      to: "/archives",
      label: "Nouvelle archive",
      description: "Enregistrer une archive",
      icon: <FaPlus size={12} />,
    },
    canTitres && {
      to: "/titres",
      label: "Nouveau titre",
      description: "Créer un titre de perception",
      icon: <FaPlus size={12} />,
    },
    canUsers && {
      to: "/gestion-utilisateurs/utilisateurs",
      label: "Utilisateurs",
      description: "Gérer les comptes et rôles",
      icon: <FaUsers size={12} />,
    },
    canAudit && {
      to: "/gestion-utilisateurs/journal",
      label: "Journal d'audit",
      description: "Consulter les opérations",
      icon: <FaHistory size={12} />,
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Bandeau de situation */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#fcfbf7] shadow-card">
            <div className="flex h-1">
              <span className="w-24 bg-navy-900" />
              <span className="w-10 bg-gold-400" />
              <span className="flex-1 bg-slate-200" />
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
              <div className="p-6 sm:p-7">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-gold-600">
                  République Démocratique du Congo · DGRAD
                </p>
                <h2 className="mt-2 font-serif text-[30px] font-semibold leading-tight tracking-tight text-navy-900 sm:text-[34px]">
                  Tableau de bord documentaire
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Situation consolidée des fonds d’archives et des titres de perception.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-medium text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <FaCalendarAlt className="text-gold-600" size={10} />
                    <span className="capitalize">{today}</span>
                  </span>
                  {departement && (
                    <span className="inline-flex items-center gap-2">
                      <FaBuilding size={10} className="text-slate-400" />
                      {departement.sigle} · {departement.nom}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <FaShieldAlt size={10} className="text-slate-400" />
                    {roleName}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Système opérationnel
                  </span>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <FaSync className={refreshing ? 'animate-spin' : ''} size={10} /> Actualiser
                  </button>
                  {canArchive && (
                    <Link
                      to="/archives"
                      className="inline-flex items-center gap-2 border border-navy-900 bg-navy-900 px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-navy-800"
                    >
                      <FaPlus size={10} /> Nouvelle archive
                    </Link>
                  )}
                  {canTitres && (
                    <Link
                      to="/titres"
                      className="inline-flex items-center gap-2 border border-navy-900/20 bg-white px-4 py-2.5 text-[11px] font-bold text-navy-800 transition hover:border-navy-900/40 hover:bg-navy-50"
                    >
                      <FaPlus size={10} /> Nouveau titre
                    </Link>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white/60 p-6 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                    Repères du jour
                  </p>
                  {loading ? (
                    <Skeleton className="h-3 w-8" />
                  ) : (
                    <span className="font-mono text-[9px] text-slate-400">{formatNumber(stats.journal.today)}</span>
                  )}
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  {[
                    ['Archives', formatNumber(stats.archives.total_documents)],
                    ['Titres de perception', formatNumber(stats.titres.total_notes)],
                    ['Activité du jour', formatNumber(activeActivities)],
                    ['Agents actifs', formatNumber(stats.users.active)],
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

                <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                  Connecté : <span className="font-semibold text-slate-600">{fullName}</span>
                </p>
              </div>
            </div>
          </section>

          {/* KPI */}
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, index) => (
              <div
                key={kpi.label}
                className="animate-fade-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      {kpi.label}
                    </p>
                    {loading ? (
                      <Skeleton className="mt-2 h-8 w-24" />
                    ) : (
                      <p className="mt-2 font-display text-[28px] font-extrabold leading-none tracking-tight text-navy-900">
                        {kpi.value}
                      </p>
                    )}
                  </div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${kpi.tone}`}>
                    {kpi.icon}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${loading ? 'animate-pulse bg-slate-200' : kpi.bar} transition-all duration-700`}
                      style={{ width: `${loading ? 38 : kpi.progress}%` }}
                    />
                  </div>
                  {loading ? (
                    <Skeleton className="h-2.5 w-16" />
                  ) : (
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">{kpi.detail}</span>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Modules + quick actions */}
          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-extrabold tracking-tight text-navy-900">
                    Modules disponibles
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Accès selon les droits attribués a votre profil
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {canArchive && (
                  <Link
                    to="/dashboard/archivage"
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-sky-400" />
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <FaArchive size={19} />
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700 ring-1 ring-blue-100">
                        AD
                      </span>
                    </div>
                    <h4 className="mt-4 font-display text-[17px] font-extrabold text-navy-900">
                      Archivage ordinaire
                    </h4>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      Documents administratifs, classeurs, emplacements et recherche OCR.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total</p>
                        {loading ? (
                          <Skeleton className="mt-1 h-4 w-12" />
                        ) : (
                          <p className="mt-1 text-sm font-extrabold text-navy-900">
                            {formatNumber(stats.archives.total_documents)}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Ce mois</p>
                        {loading ? (
                          <Skeleton className="mt-1 h-4 w-12" />
                        ) : (
                          <p className="mt-1 text-sm font-extrabold text-navy-900">
                            {formatNumber(stats.archives.documents_mois)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-700">
                      Ouvrir le module
                      <FaArrowRight size={9} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                )}

                {canTitres && (
                  <Link
                    to="/dashboard/titres"
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-400" />
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <FaFileInvoiceDollar size={19} />
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                        TP
                      </span>
                    </div>
                    <h4 className="mt-4 font-display text-[17px] font-extrabold text-navy-900">
                      Titres de perception
                    </h4>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      Titres, centres d'ordonnancement, assujettis et articles budgétaires.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total</p>
                        {loading ? (
                          <Skeleton className="mt-1 h-4 w-12" />
                        ) : (
                          <p className="mt-1 text-sm font-extrabold text-navy-900">
                            {formatNumber(stats.titres.total_notes)}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Centres</p>
                        {loading ? (
                          <Skeleton className="mt-1 h-4 w-12" />
                        ) : (
                          <p className="mt-1 text-sm font-extrabold text-navy-900">
                            {formatNumber(stats.titres.total_centres)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
                      Ouvrir le module
                      <FaArrowRight size={9} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                )}

                {!canArchive && !canTitres && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                    <FaShieldAlt className="mx-auto text-2xl text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-700">Aucun module métier attribue</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Contactez l'administrateur pour obtenir les droits d'accès.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold tracking-tight text-navy-900">
                    Accès rapides
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Raccourcis
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.to}
                      to={action.to}
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:border-slate-200 hover:bg-white"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 transition group-hover:text-navy-800">
                        {action.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-800">{action.label}</span>
                        <span className="block text-[10px] font-medium text-slate-400">
                          {action.description}
                        </span>
                      </span>
                      <FaArrowRight size={9} className="text-slate-300 transition group-hover:text-navy-700" />
                    </Link>
                  ))}
                  {quickActions.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">Aucun raccourci disponible.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <FaCheckCircle size={13} />
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold text-navy-900">État de la plateforme</h3>
                    <p className="text-[10px] font-medium text-slate-400">Services et données</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Base de données</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connectée
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Opérations journalisées</span>
                    <span className="font-bold text-slate-700">{formatNumber(stats.journal.total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dernière activité</span>
                    <span className="font-bold text-slate-700">
                      {activities[0] ? formatActivityDate(activities[0].date) : "Aucune"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent activity */}
          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-display text-sm font-extrabold tracking-tight text-navy-900">
                    Activité récente
                  </h3>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    Derniers documents et titres enregistrés
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                  <FaClock size={9} /> {activities.length}
                </span>
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
                ) : activities.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <FaFolderOpen className="mx-auto text-2xl text-slate-200" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">Aucune activité récente</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Les nouveaux documents et titres apparaîtront ici.
                    </p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <Link
                      key={activity.key}
                      to={activity.link}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50/70"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                          activity.type === "archive"
                            ? "bg-blue-50 text-blue-600 ring-blue-100"
                            : "bg-emerald-50 text-emerald-600 ring-emerald-100"
                        }`}
                      >
                        {activity.type === "archive" ? <FaArchive size={12} /> : <FaFileInvoiceDollar size={12} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800">{activity.title}</p>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                          {activity.subtitle || (activity.type === "archive" ? "Archivage ordinaire" : "Titres de perception")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                            activity.type === "archive"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {activity.type === "archive" ? "Archive" : "Titre"}
                        </span>
                        <p className="mt-1 text-[9px] font-medium text-slate-400">
                          {formatActivityDate(activity.date)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <h3 className="font-display text-sm font-extrabold tracking-tight text-navy-900">
                  Répartition des archives
                </h3>
                <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                  Top classeurs par volume
                </p>
                <div className="mt-4 space-y-3">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={`skeleton-classeur-${index}`}>
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
                      </div>
                    ))
                  ) : (
                    <>
                      {(stats.archives.top_classificateurs || []).slice(0, 5).map((item, index) => {
                        const max = Math.max(
                          ...(stats.archives.top_classificateurs || []).map((entry) => entry.total || 0),
                          1
                        );
                        return (
                          <div key={`${item.id}-${index}`}>
                            <div className="flex items-center justify-between gap-3 text-[11px]">
                              <span className="truncate font-semibold text-slate-600">{item.nom}</span>
                              <span className="shrink-0 font-extrabold text-navy-900">{item.total}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                                style={{ width: `${Math.max(6, ((item.total || 0) / max) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {(!stats.archives.top_classificateurs || stats.archives.top_classificateurs.length === 0) && (
                        <p className="py-4 text-center text-xs text-slate-400">Aucune donnée disponible.</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-navy-900 to-navy-800 p-5 text-white shadow-card">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/[0.15] text-gold-300 ring-1 ring-gold-400/20">
                    <FaHistory size={12} />
                  </span>
                  <h3 className="text-xs font-extrabold">Traçabilité</h3>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-blue-100/70">
                  Toutes les opérations sensibles sont horodatées et rattachées a l'agent et a sa
                  division.
                </p>
                <Link
                  to={canAudit ? "/gestion-utilisateurs/journal" : "/profil"}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px] font-bold text-white ring-1 ring-white/10 transition hover:bg-white/20"
                >
                  {canAudit ? "Consulter le journal" : "Voir mon profil"}
                  <FaArrowRight size={9} />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
