// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import logo from "../Images/Logo.png";
import {
  FaArchive,
  FaBars,
  FaBook,
  FaBuilding,
  FaChartPie,
  FaChevronDown,
  FaFileAlt,
  FaFileInvoiceDollar,
  FaFolderOpen,
  FaHistory,
  FaKey,
  FaMapMarkerAlt,
  FaSearch,
  FaSignOutAlt,
  FaTags,
  FaTachometerAlt,
  FaTimes,
  FaUser,
  FaUserShield,
  FaUserTie,
  FaUsers,
  FaWarehouse,
} from "react-icons/fa";

const Menus = () => {
  const location = useLocation();
  const history = useHistory();
  const sidebarRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [utilisateur, setUtilisateur] = useState(null);
  const [departement, setDepartement] = useState(null);
  const [openGroups, setOpenGroups] = useState([]);

  useEffect(() => {
    try {
      setPermissions(JSON.parse(localStorage.getItem("permissions") || "[]"));
      setUtilisateur(JSON.parse(localStorage.getItem("utilisateur") || "null"));
      const divisions = JSON.parse(localStorage.getItem("divisions") || "[]");
      setDepartement(divisions[0] || null);
    } catch {
      setPermissions([]);
    }
  }, []);

  const has = (permission) => permissions.includes(permission);

  const canArchive =
    has("archiv_doc") ||
    has("acceder_au__document") ||
    has("archives.view") ||
    has("direction") ||
    has("classeur") ||
    has("emplacement");

  const canTitres =
    has("note_perception") ||
    has("acceder_au_note_perception") ||
    has("titres.view") ||
    has("centre") ||
    has("serv_assiette");

  const canAdmin =
    has("utilisateur") ||
    has("role") ||
    has("permission") ||
    has("audit.view") ||
    has("users.view") ||
    has("roles.view") ||
    has("permissions.view");

  const groups = [
    {
      id: "archives",
      label: "Archivage ordinaire",
      icon: <FaArchive size={13} />,
      visible: canArchive,
      items: [
        {
          to: "/dashboard/archivage",
          label: "Tableau de bord AD",
          icon: <FaTachometerAlt size={10} />,
          visible: true,
          activePaths: ["/dashboard/archivage"],
        },
        {
          to: "/archives",
          label: "Archives",
          icon: <FaArchive size={10} />,
          visible: true,
          activePaths: ["/archives"],
        },
        {
          to: "/direction",
          label: "Directions",
          icon: <FaBuilding size={10} />,
          visible: has("direction") || has("archives.view") || has("utilisateur"),
          activePaths: ["/direction"],
        },
        {
          to: "/classeur",
          label: "Classeurs",
          icon: <FaFolderOpen size={10} />,
          visible: has("classeur") || has("archives.view"),
          activePaths: ["/classeur"],
        },
        {
          to: "/emplacement",
          label: "Emplacements",
          icon: <FaMapMarkerAlt size={10} />,
          visible: has("emplacement") || has("archives.view"),
          activePaths: ["/emplacement"],
        },
        {
          to: "/types-documents",
          label: "Types de documents",
          icon: <FaFileAlt size={10} />,
          visible: true,
          activePaths: ["/types-documents"],
        },
        {
          to: "/mots-cles",
          label: "Mots-clés",
          icon: <FaTags size={10} />,
          visible: true,
          activePaths: ["/mots-cles"],
        },
      ],
    },
    {
      id: "titres",
      label: "Titres de perception",
      icon: <FaFileInvoiceDollar size={13} />,
      visible: canTitres,
      items: [
        {
          to: "/dashboard/titres",
          label: "Tableau de bord TP",
          icon: <FaTachometerAlt size={10} />,
          visible: true,
          activePaths: ["/dashboard/titres"],
        },
        {
          to: "/titres",
          label: "Titres",
          icon: <FaFileInvoiceDollar size={10} />,
          visible: true,
          activePaths: ["/titres"],
        },
        {
          to: "/categories-titres",
          label: "Catégories",
          icon: <FaTags size={10} />,
          visible: has("note_perception") || has("titres.view"),
          activePaths: ["/categories-titres"],
        },
        {
          to: "/centre-ordonnancement",
          label: "Centres",
          icon: <FaWarehouse size={10} />,
          visible: has("centre") || has("titres.view"),
          activePaths: ["/centre-ordonnancement"],
        },
        {
          to: "/assujettis",
          label: "Assujettis",
          icon: <FaUserTie size={10} />,
          visible: true,
          activePaths: ["/assujettis"],
        },
        {
          to: "/articles-budgetaires",
          label: "Articles budgétaires",
          icon: <FaBook size={10} />,
          visible: true,
          activePaths: ["/articles-budgetaires"],
        },
      ],
    },
    {
      id: "admin",
      label: "Administration",
      icon: <FaUserShield size={13} />,
      visible: canAdmin,
      items: [
        {
          to: "/gestion-utilisateurs/utilisateurs",
          label: "Utilisateurs",
          icon: <FaUsers size={10} />,
          visible: has("utilisateur") || has("users.view"),
          activePaths: ["/gestion-utilisateurs/utilisateurs"],
        },
        {
          to: "/gestion-utilisateurs/divisions",
          label: "Divisions",
          icon: <FaBuilding size={10} />,
          visible: has("utilisateur") || has("divisions.view"),
          activePaths: ["/gestion-utilisateurs/divisions"],
        },
        {
          to: "/gestion-utilisateurs/roles",
          label: "Rôles",
          icon: <FaUserShield size={10} />,
          visible: has("role") || has("roles.view"),
          activePaths: ["/gestion-utilisateurs/roles"],
        },
        {
          to: "/gestion-utilisateurs/permissions",
          label: "Permissions",
          icon: <FaKey size={10} />,
          visible: has("permission") || has("permissions.view"),
          activePaths: ["/gestion-utilisateurs/permissions"],
        },
        {
          to: "/gestion-utilisateurs/journal",
          label: "Journal d'audit",
          icon: <FaHistory size={10} />,
          visible: has("audit.view") || has("utilisateur"),
          activePaths: ["/gestion-utilisateurs/journal"],
        },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.visible) }))
    .filter((group) => group.visible && group.items.length > 0);

  const isItemActive = (item) =>
    item.activePaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
    );

  useEffect(() => {
    const activeGroup = groups.find((group) => group.items.some(isItemActive));
    // Un seul groupe ouvert : celui de la page courante.
    // Dashboard, profil ou toute page hors groupe : tous les groupes sont fermés.
    setOpenGroups(activeGroup ? [activeGroup.id] : []);
    setSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, permissions.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const toggleGroup = (id) => {
    setOpenGroups((current) =>
      current.includes(id) ? current.filter((group) => group !== id) : [...current, id]
    );
  };

  const logout = () => {
    localStorage.clear();
    history.replace("/");
  };

  const fullName = utilisateur
    ? `${utilisateur.prenom || ""} ${utilisateur.nom || ""}`.trim()
    : "Utilisateur";
  const initials = utilisateur
    ? `${utilisateur.prenom?.[0] || ""}${utilisateur.nom?.[0] || ""}`.toUpperCase()
    : "DG";

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="relative flex h-[76px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg shadow-black/25">
          <img src={logo} alt="DGRAD" className="h-full w-auto object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[16px] font-extrabold tracking-tight text-white">
            DGRAD Archive
          </p>
          <p className="mt-0.5 truncate text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Gestion documentaire
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Fermer le menu"
        >
          <FaTimes size={14} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
          Navigation
        </p>

        <Link
          to="/dashboard"
          className={`group flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2.5 text-[14px] font-semibold transition-all ${
            location.pathname === "/dashboard"
              ? "border-gold-400 bg-white/[0.09] text-white shadow-sm"
              : "border-transparent text-slate-300/80 hover:border-white/20 hover:bg-white/[0.055] hover:text-white"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 transition group-hover:text-white">
            <FaChartPie size={11} />
          </span>
          <span className="min-w-0 flex-1">Tableau de bord</span>
        </Link>

        {has("ocr.view") && (
          <Link
            to="/recherche-ocr"
            className={`group mt-1 flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2.5 text-[13px] font-semibold transition-all ${
              location.pathname === "/recherche-ocr"
                ? "border-gold-400 bg-white/[0.09] text-white shadow-sm"
                : "border-transparent text-slate-300/80 hover:border-white/20 hover:bg-white/[0.055] hover:text-white"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 transition group-hover:text-white">
              <FaSearch size={11} />
            </span>
            <span className="min-w-0 flex-1">Recherche OCR</span>
          </Link>
        )}

        <div className="mt-2 space-y-1">
          {groups.map((group) => {
            const isOpen = openGroups.includes(group.id);
            const isActiveGroup = group.items.some(isItemActive);
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-bold transition ${
                    isActiveGroup
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-300/80 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                      isActiveGroup
                        ? "bg-gold-400/[0.15] text-gold-300"
                        : "bg-white/[0.04] text-slate-400"
                    }`}
                  >
                    {group.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <FaChevronDown
                    size={9}
                    className={`shrink-0 text-slate-500 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-200 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                      {group.items.map((item) => {
                        const active = isItemActive(item);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`relative flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-[13px] font-semibold transition ${
                              active
                                ? "bg-gold-400/10 text-gold-200"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gold-400" />
                            )}
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                                active ? "bg-gold-400/10 text-gold-300" : "bg-white/[0.03] text-slate-500"
                              }`}
                            >
                              {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mb-2 mt-5 px-3 text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
          Compte
        </p>
        <Link
          to="/profil"
          className={`group flex items-center gap-2.5 rounded-xl border-l-2 px-3 py-2.5 text-[14px] font-semibold transition-all ${
            location.pathname === "/profil"
              ? "border-gold-400 bg-white/[0.09] text-white shadow-sm"
              : "border-transparent text-slate-300/80 hover:border-white/20 hover:bg-white/[0.055] hover:text-white"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-slate-400 transition group-hover:text-white">
            <FaUser size={11} />
          </span>
          <span className="min-w-0 flex-1">Mon profil</span>
        </Link>
      </nav>

      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.055] px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-400/[0.15] text-[11px] font-extrabold text-gold-300 ring-1 ring-gold-400/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white">{fullName}</p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
              {departement ? `${departement.sigle} - ${departement.nom}` : "Agent DGRAD"}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            title="Se déconnecter"
          >
            <FaSignOutAlt size={13} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-slate-600">
          DGRAD &middot; Plateforme {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white shadow-lg shadow-navy-900/25 transition hover:bg-navy-800 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <FaBars size={16} />
      </button>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden bg-[#08182c] text-white shadow-2xl lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.18),transparent_42%),radial-gradient(circle_at_100%_100%,rgba(199,154,39,0.12),transparent_38%)]" />
        <div className="relative flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside
            ref={sidebarRef}
            className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-hidden bg-[#08182c] text-white shadow-2xl"
          >
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Menus;
