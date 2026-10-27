// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { API_BASE_URL } from "../config";
import {
  FaArchive,
  FaBell,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaHistory,
  FaSignOutAlt,
  FaSpinner,
  FaUser,
} from "react-icons/fa";

const pageMetadata = [
  { path: "/recherche-ocr", title: "Recherche OCR", subtitle: "Recherche plein texte dans les documents numérisés" },
  { path: "/dashboard/archivage", title: "Tableau de bord — Archivage", subtitle: "Situation des fonds documentaires et du classement" },
  { path: "/dashboard/titres", title: "Tableau de bord — Titres", subtitle: "Suivi de l'émission et de la validation des titres" },
  { path: "/dashboard", title: "Tableau de bord", subtitle: "Vue d'ensemble de l'activité documentaire" },
  { path: "/tableaudebordnote", title: "Pilotage des titres", subtitle: "Suivi des titres de perception et des centres" },
  { path: "/tableaudebord", title: "Pilotage de l'archivage", subtitle: "Suivi des documents et des classeurs" },
  { path: "/archives/nouvelle", title: "Nouvelle archive", subtitle: "Enregistrement d'un document dans les archives" },
  { path: "/archives", title: "Archives ordinaires", subtitle: "Consultation et gestion des archives" },
  { path: "/types-documents", title: "Types de documents", subtitle: "Référentiel de l'archivage ordinaire" },
  { path: "/mots-cles", title: "Mots-clés", subtitle: "Métadonnées de recherche documentaire" },
  { path: "/titres/nouvelle", title: "Nouveau titre", subtitle: "Création d'un titre de perception" },
  { path: "/titres", title: "Titres de perception", subtitle: "Gestion des titres et notes de perception" },
  { path: "/assujettis", title: "Assujettis", subtitle: "Redevables rattachés aux titres" },
  { path: "/articles-budgetaires", title: "Articles budgétaires", subtitle: "Imputation des titres de perception" },
  { path: "/document", title: "Documents", subtitle: "Consultation et gestion des archives ordinaires" },
  { path: "/listedocument", title: "Documents du classeur", subtitle: "Contenu détaillé du classeur sélectionné" },
  { path: "/detail-document", title: "Détail du document", subtitle: "Informations, fichiers et texte OCR" },
  { path: "/addform", title: "Nouveau document", subtitle: "Enregistrement d'un document dans les archives" },
  { path: "/classeur", title: "Classeurs", subtitle: "Organisation logique des archives" },
  { path: "/emplacement", title: "Emplacements", subtitle: "Localisation physique des documents" },
  { path: "/direction", title: "Directions", subtitle: "Structure organisationnelle de la DGRAD" },
  { path: "/note-perception", title: "Titres de perception", subtitle: "Gestion des titres et notes de perception" },
  { path: "/listenote", title: "Titres du centre", subtitle: "Titres rattachés au centre d'ordonnancement" },
  { path: "/note", title: "Titre de perception", subtitle: "Création et modification d'un titre" },
  { path: "/centre-ordonnancement", title: "Centres d'ordonnancement", subtitle: "Centres émetteurs des titres" },
  { path: "/ministere", title: "Services d'assiette", subtitle: "Articles budgétaires et services associés" },
  { path: "/categories-titres", title: "Catégories de titres", subtitle: "Référentiel de classement et de numérotation" },
  { path: "/gestion-utilisateurs/utilisateurs/nouveau", title: "Nouvel utilisateur", subtitle: "Création d'un compte agent DGRAD" },
  { path: "/gestion-utilisateurs/utilisateurs", title: "Utilisateurs", subtitle: "Comptes, rôles et rattachements" },
  { path: "/gestion-utilisateurs/roles", title: "Rôles", subtitle: "Profils d'accès et permissions" },
  { path: "/gestion-utilisateurs/permissions", title: "Permissions", subtitle: "Droits disponibles sur la plateforme" },
  { path: "/gestion-utilisateurs/journal", title: "Journal d'audit", subtitle: "Historique des opérations sensibles" },
  { path: "/gestion-utilisateurs/divisions", title: "Divisions", subtitle: "Rattachement organisationnel des agents" },
  { path: "/gestion-utilisateurs/directions", title: "Divisions", subtitle: "Rattachement organisationnel des agents" },
  { path: "/profil", title: "Mon profil", subtitle: "Informations personnelles et sécurité" },
];

const Head = () => {
  const location = useLocation();
  const history = useHistory();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationRef = useRef(null);
  const [utilisateur, setUtilisateur] = useState(null);
  const [roles, setRoles] = useState([]);
  const [departement, setDepartement] = useState(null);

  useEffect(() => {
    try {
      setUtilisateur(JSON.parse(localStorage.getItem("utilisateur") || "null"));
      setRoles(JSON.parse(localStorage.getItem("role") || "[]"));
      const departements = JSON.parse(localStorage.getItem("divisions") || "[]");
      setDepartement(departements[0] || null);
    } catch {
      setRoles([]);
    }
  }, []);

  const actionableTypes = ["titre_brouillon", "ocr_issue"];

  const readStorageKey = () => {
    try {
      const current = JSON.parse(localStorage.getItem("utilisateur") || "null");
      return `read_notifications_${current?.id || "anon"}`;
    } catch {
      return "read_notifications_anon";
    }
  };

  const getReadIds = () => {
    try {
      return JSON.parse(localStorage.getItem(readStorageKey()) || "[]");
    } catch {
      return [];
    }
  };

  const saveReadIds = (ids) => {
    localStorage.setItem(readStorageKey(), JSON.stringify(Array.from(new Set(ids))));
  };

  const countUnread = (items) => {
    const readIds = getReadIds();
    return items.filter(
      (item) => actionableTypes.includes(item.type) && !readIds.includes(item.id)
    ).length;
  };

  const markAllNotificationsRead = () => {
    const ids = notifications
      .filter((item) => actionableTypes.includes(item.type))
      .map((item) => item.id);
    saveReadIds([...getReadIds(), ...ids]);
    setNotificationCount(0);
  };

  const loadNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setNotificationsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (response.data?.success) {
        const items = response.data.data?.items || [];
        setNotifications(items);
        setNotificationCount(countUnread(items));
      }
    } catch {
      // silencieux : la cloche ne doit pas bloquer l'interface
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeAgo = (date) => {
    if (!date) return "";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
    } catch {
      return "";
    }
  };

  const notificationIcon = (item) => {
    if (item.type === "ocr_issue") return <FaExclamationTriangle size={12} />;
    if (item.type === "titre_brouillon") return <FaFileInvoiceDollar size={12} />;
    if (item.type === "audit") return <FaHistory size={12} />;
    return <FaArchive size={12} />;
  };

  const notificationTone = (item) => {
    if (item.level === "danger") return "border-rose-100 bg-rose-50 text-rose-600";
    if (item.level === "warning") return "border-amber-100 bg-amber-50 text-amber-600";
    if (item.level === "info") return "border-sky-100 bg-sky-50 text-sky-600";
    return "border-slate-100 bg-slate-50 text-slate-600";
  };

  const metadata =
    [...pageMetadata]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname.startsWith(item.path)) || {
      title: "DGRAD Archive",
      subtitle: "Plateforme de gestion documentaire",
    };

  const fullName = utilisateur ? `${utilisateur.prenom || ""} ${utilisateur.nom || ""}`.trim() : "Utilisateur";
  const initials = utilisateur
    ? `${utilisateur.prenom?.[0] || ""}${utilisateur.nom?.[0] || ""}`.toUpperCase()
    : "DG";
  const currentRole = roles?.[0]?.nom || "Agent DGRAD";
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const logout = () => {
    localStorage.clear();
    history.replace("/");
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-4 pl-14 pr-4 sm:pr-6 lg:pl-64 lg:pr-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="hidden h-1.5 w-1.5 rounded-full bg-gold-400 sm:block" />
            <h1 className="truncate font-display text-[17px] font-extrabold leading-none tracking-tight text-navy-900">
              {metadata.title}
            </h1>
          </div>
          <p className="mt-1 hidden truncate text-[11px] font-medium text-slate-400 sm:block">
            {metadata.subtitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500 xl:flex">
            <FaCalendarAlt className="text-[10px] text-slate-400" />
            <span className="capitalize">{today}</span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 md:flex">
            <FaCircle className="text-[6px] text-emerald-500" />
            Système actif
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                const next = !showNotifications;
                setShowNotifications(next);
                setShowDropdown(false);
                if (next) markAllNotificationsRead();
              }}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <FaBell size={13} />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[8px] font-extrabold text-white ring-2 ring-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                <div className="flex items-center justify-between border-b border-slate-100 bg-[#fcfbf7] px-4 py-3">
                  <div>
                    <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-gold-600">
                      DGRAD · Activité
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-navy-900">Notifications</p>
                  </div>
                  <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-extrabold text-navy-700 ring-1 ring-navy-100">
                    {notificationCount}
                  </span>
                </div>

                <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-400">
                      <FaSpinner className="animate-spin" size={16} />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <FaCheckCircle className="mx-auto text-2xl text-emerald-300" />
                      <p className="mt-2 text-xs font-bold text-slate-600">Aucune notification</p>
                      <p className="mt-1 text-[10px] text-slate-400">Vous êtes à jour.</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <Link
                        key={item.id}
                        to={item.link}
                        onClick={() => {
                          markAllNotificationsRead();
                          setShowNotifications(false);
                        }}
                        className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50/80"
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${notificationTone(item)}`}>
                          {notificationIcon(item)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-800">{item.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
                            {item.message}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                            <FaClock size={8} /> {timeAgo(item.date)}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                  <span className="text-[9px] font-medium text-slate-400">
                    Mise à jour automatique
                  </span>
                  <button
                    onClick={loadNotifications}
                    disabled={notificationsLoading}
                    className="text-[10px] font-bold text-navy-700 transition hover:text-navy-900 disabled:opacity-50"
                  >
                    Actualiser
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowDropdown((value) => !value);
                setShowNotifications(false);
              }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-[10px] font-extrabold text-white">
                {initials}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[150px] truncate text-[12px] font-bold text-slate-800">
                  {fullName}
                </span>
                <span className="block max-w-[150px] truncate text-[10px] font-medium text-slate-400">
                  {currentRole}
                </span>
              </span>
              <FaChevronDown size={9} className="text-slate-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-xs font-extrabold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{fullName}</p>
                      <p className="truncate text-[11px] text-slate-500">{utilisateur?.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <span className="rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">{currentRole}</span>
                    {departement && (
                      <span className="truncate rounded-md bg-white px-2 py-1 ring-1 ring-slate-200">
                        {departement.sigle}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to="/profil"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <FaUser size={11} />
                  </span>
                  <span>
                    Mon profil
                    <span className="block text-[10px] font-medium text-slate-400">
                      Informations et sécurité
                    </span>
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                    <FaSignOutAlt size={11} />
                  </span>
                  <span>
                    Se déconnecter
                    <span className="block text-[10px] font-medium text-rose-400">
                      Fermer la session en cours
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Head;

