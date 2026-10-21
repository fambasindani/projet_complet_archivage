// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import {
  FaBell,
  FaCalendarAlt,
  FaChevronDown,
  FaCircle,
  FaSignOutAlt,
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

          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
            <FaBell size={13} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-500 ring-2 ring-white" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown((value) => !value)}
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
