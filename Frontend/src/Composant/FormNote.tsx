// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaFilePdf,
  FaFolder,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPaperclip,
  FaSave,
  FaTimes,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import { toast } from "../Composant/Toast";
import FileUploadModal from "../Modals/FileUploadModal";
import ConfirmModal from "../Modals/ConfirmModal";
import ModalAssujetti from "../Modals/ModalAssujetti";

const today = () => new Date().toISOString().split("T")[0];

const FormNote = ({
  isEditing = false,
  noteToEdit = null,
  onCancel,
  onSuccess,
  articles = [],
  classeurs = [],
  centres = [],
  emplacements = [],
  categories = [],
}) => {
  const token = GetTokenOrRedirect();
  const utilisateur = JSON.parse(localStorage.getItem("utilisateur") || "null") || {};
  const divisions = JSON.parse(localStorage.getItem("divisions") || "[]");
  const userDivision = divisions[0] || null;

  const emptyForm = useMemo(
    () => ({
      reference: "",
      numero_titre: "",
      id_categorie_titre: "",
      id_assujetti: "",
      id_division: userDivision ? String(userDivision.id) : "",
      id_centre_ordonnancement: "",
      id_article_budgetaire: "",
      id_classeur: "",
      id_emplacement: "",
      reference_dossier: "",
      reference_declaration: "",
      date_titre: "",
      date_enregistrement: today(),
      date_ordonnancement: "",
      montant: "",
      devise: "CDF",
      objet: "",
      observations: "",
      statut: "brouillon",
      mots_cles: "",
    }),
    [userDivision]
  );

  const [formData, setFormData] = useState(emptyForm);
  const [selectedAssujetti, setSelectedAssujetti] = useState(null);
  const [showAssujettiModal, setShowAssujettiModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [filePreviews, setFilePreviews] = useState([]);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState(null);
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState({ open: false, index: null });
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (isEditing && noteToEdit) {
      setFormData({
        reference: noteToEdit.reference || "",
        numero_titre: noteToEdit.numero_titre || noteToEdit.numero_serie || "",
        id_categorie_titre: noteToEdit.id_categorie_titre ? String(noteToEdit.id_categorie_titre) : "",
        id_assujetti: noteToEdit.id_assujetti ? String(noteToEdit.id_assujetti) : "",
        id_division: noteToEdit.id_division ? String(noteToEdit.id_division) : emptyForm.id_division,
        id_centre_ordonnancement: noteToEdit.id_centre_ordonnancement ? String(noteToEdit.id_centre_ordonnancement) : "",
        id_article_budgetaire: noteToEdit.id_article_budgetaire
          ? String(noteToEdit.id_article_budgetaire)
          : noteToEdit.id_ministere
          ? String(noteToEdit.id_ministere)
          : "",
        id_classeur: noteToEdit.id_classeur ? String(noteToEdit.id_classeur) : "",
        id_emplacement: noteToEdit.id_emplacement ? String(noteToEdit.id_emplacement) : "",
        reference_dossier: noteToEdit.reference_dossier || "",
        reference_declaration: noteToEdit.reference_declaration || "",
        date_titre: noteToEdit.date_titre ? String(noteToEdit.date_titre).slice(0, 10) : "",
        date_enregistrement: noteToEdit.date_enregistrement
          ? String(noteToEdit.date_enregistrement).slice(0, 10)
          : today(),
        date_ordonnancement: noteToEdit.date_ordonnancement
          ? String(noteToEdit.date_ordonnancement).slice(0, 10)
          : "",
        montant: noteToEdit.montant ?? "",
        devise: noteToEdit.devise || "CDF",
        objet: noteToEdit.objet || "",
        observations: noteToEdit.observations || "",
        statut: noteToEdit.statut || "brouillon",
        mots_cles: (noteToEdit.mots_cles || []).map((mot) => mot.libelle).join(", "),
      });

      if (noteToEdit.assujetti) {
        setSelectedAssujetti({
          id: noteToEdit.id_assujetti,
          nom_raison_sociale: noteToEdit.assujetti.nom_raison_sociale,
        });
      }

      fetchExistingFiles(noteToEdit.id);
    } else {
      setFormData(emptyForm);
      setSelectedAssujetti(null);
    }

    setErrors({});
    setFilePreviews([]);
    setNoteSubmitted(false);
    setCreatedNoteId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteToEdit, isEditing]);

  const fetchExistingFiles = async (titreId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes/download/${titreId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const files = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setFilePreviews(
        files.map((file) => ({
          id: file.id,
          fileId: file.id,
          name: file.nom_original || file.nom_native || file.nom_fichier,
          size: formatFileSize(file.taille_octets || file.taille || 0),
          preview: null,
          uploadDate: file.created_at ? new Date(file.created_at).toLocaleDateString("fr-FR") : "",
          status: "existing",
        }))
      );
    } catch (error) {
      console.error("Erreur fichiers du titre:", error);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const setToday = (field) => setFormData((prev) => ({ ...prev, [field]: today() }));

  const selectAssujetti = (assujetti) => {
    setSelectedAssujetti(assujetti);
    setFormData((prev) => ({ ...prev, id_assujetti: assujetti.id }));
    setShowAssujettiModal(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;

    const validation = {};
    [
      "numero_titre",
      "id_categorie_titre",
      "id_article_budgetaire",
      "id_classeur",
      "id_centre_ordonnancement",
      "id_emplacement",
      "date_titre",
      "date_enregistrement",
    ].forEach((field) => {
      if (!String(formData[field] || "").trim()) validation[field] = ["Ce champ est obligatoire"];
    });

    if (!selectedAssujetti?.id) validation.id_assujetti = ["Veuillez sélectionner un assujetti"];

    if (Object.keys(validation).length) {
      setErrors(validation);
      toast.error("Veuillez compléter les champs obligatoires");
      return;
    }

    const payload = {
      reference: formData.reference.trim() || null,
      numero_titre: formData.numero_titre.trim(),
      id_categorie_titre: Number(formData.id_categorie_titre),
      id_assujetti: Number(selectedAssujetti.id),
      id_division: formData.id_division ? Number(formData.id_division) : userDivision?.id || null,
      id_centre_ordonnancement: Number(formData.id_centre_ordonnancement),
      id_article_budgetaire: Number(formData.id_article_budgetaire),
      id_classeur: Number(formData.id_classeur),
      id_emplacement: Number(formData.id_emplacement),
      reference_dossier: formData.reference_dossier.trim() || null,
      reference_declaration: formData.reference_declaration.trim() || null,
      date_titre: formData.date_titre || null,
      date_enregistrement: formData.date_enregistrement,
      date_ordonnancement: formData.date_ordonnancement || null,
      montant: formData.montant !== "" ? Number(formData.montant) : null,
      devise: formData.devise || "CDF",
      objet: formData.objet.trim() || null,
      observations: formData.observations.trim() || null,
      statut: formData.statut,
      mots_cles: formData.mots_cles
        .split(",")
        .map((mot) => mot.trim())
        .filter(Boolean),
    };

    setLoading(true);
    try {
      const response = isEditing
        ? await axios.put(`${API_BASE_URL}/titres/${noteToEdit.id}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : await axios.post(`${API_BASE_URL}/titres`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

      const titre = response.data?.data || response.data;
      setCreatedNoteId(titre.id);
      setNoteSubmitted(true);
      setShowFileUploadModal(true);
      toast.success(
        isEditing
          ? "Titre mis à jour. Vous pouvez ajouter des fichiers."
          : "Titre créé. Vous pouvez ajouter des fichiers."
      );
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        toast.error("Erreur de validation");
      } else {
        toast.error(error.response?.data?.message || "Une erreur est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploadComplete = (uploadedFiles) => {
    const previews = uploadedFiles.map((file) => ({
      id: file.id || Date.now(),
      fileId: file.id,
      name: file.name,
      size: formatFileSize(file.size),
      uploadDate: new Date().toLocaleTimeString("fr-FR"),
      status: "uploaded",
    }));
    setFilePreviews((prev) => [...prev, ...previews]);
    setShowFileUploadModal(false);
    toast.success(`${uploadedFiles.length} fichier(s) ajouté(s)`);
    if (!isEditing && onSuccess) setTimeout(onSuccess, 500);
  };

  const handleFilesUploadCancel = () => {
    setShowFileUploadModal(false);
    if (!isEditing && onSuccess) onSuccess();
  };

  const confirmRemoveFile = async () => {
    const { index } = confirmDeleteFile;
    const file = filePreviews[index];
    setConfirmDeleteFile({ open: false, index: null });
    if (file?.fileId) {
      try {
        await axios.delete(`${API_BASE_URL}/notes/delete/${file.fileId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Erreur suppression fichier:", error);
      }
    }
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
  };

  const getFieldLabel = (field) => {
    const labels = {
      numero_titre: "Numéro du titre",
      id_categorie_titre: "Catégorie",
      id_article_budgetaire: "Article budgétaire",
      id_classeur: "Classeur",
      id_centre_ordonnancement: "Centre d'ordonnancement",
      id_emplacement: "Emplacement",
      date_titre: "Date du titre",
      date_enregistrement: "Date d'enregistrement",
      id_assujetti: "Assujetti",
    };
    return labels[field] || field;
  };

  const sections = [
    { id: 1, title: "Identification", icon: <FaFileAlt /> },
    { id: 2, title: "Affectation & dates", icon: <FaCalendarAlt /> },
    { id: 3, title: "Montant & objet", icon: <FaMoneyBillWave /> },
  ];

  const renderError = (field) =>
    errors[field] ? (
      <p className="mt-1.5 text-xs font-medium text-rose-600">
        {Array.isArray(errors[field]) ? errors[field][0] : errors[field]}
      </p>
    ) : null;

  const divisionLabel = userDivision
    ? `${userDivision.direction?.sigle ? userDivision.direction.sigle + " / " : ""}${userDivision.sigle} — ${userDivision.nom}`
    : "Division non renseignée";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="sticky top-16 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-base font-extrabold text-navy-900">
                {isEditing ? "Modifier le titre de perception" : "Nouveau titre de perception"}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Les champs correspondent au modèle backend titres_perception.
              </p>
            </div>
            {!noteSubmitted && (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <FaTimes size={11} /> Annuler
              </button>
            )}
          </div>

          <div className="mt-3 flex justify-center gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                disabled={loading || noteSubmitted}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeSection === section.id
                    ? "bg-navy-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {section.icon} {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-6">
        <form id="noteForm" onSubmit={handleSubmit}>
          {activeSection === 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                  <FaFileAlt className="text-navy-600" /> Identification du titre
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Catégorie <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="id_categorie_titre"
                    value={formData.id_categorie_titre}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="">Sélectionner une catégorie...</option>
                    {categories.map((categorie) => (
                      <option key={categorie.id} value={categorie.id}>
                        {categorie.libelle}
                      </option>
                    ))}
                  </select>
                  {renderError("id_categorie_titre")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Numéro du titre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    name="numero_titre"
                    value={formData.numero_titre}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    placeholder="Ex. TP-2026-000123"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                  {renderError("numero_titre")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Référence</label>
                  <input
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    placeholder="Générée automatiquement si vide"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                  {renderError("reference")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Article budgétaire <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="id_article_budgetaire"
                    value={formData.id_article_budgetaire}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="">Sélectionner un article...</option>
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.article_budgetaire} — {article.nom}
                      </option>
                    ))}
                  </select>
                  {renderError("id_article_budgetaire")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Assujetti <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={selectedAssujetti?.nom_raison_sociale || ""}
                      placeholder="Sélectionner un assujetti"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAssujettiModal(true)}
                      disabled={loading || noteSubmitted}
                      className="rounded-xl border border-navy-200 px-4 py-2.5 text-xs font-bold text-navy-700 transition hover:bg-navy-50"
                    >
                      Choisir
                    </button>
                  </div>
                  {renderError("id_assujetti")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Division émettrice</label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
                    <FaBuilding size={11} className="text-slate-400" />
                    <span className="truncate">{divisionLabel}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Statut</label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="actif">Actif</option>
                    <option value="archive">Archivé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 2 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                  <FaCalendarAlt className="text-navy-600" /> Affectation et dates
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Classeur <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="id_classeur"
                    value={formData.id_classeur}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="">Sélectionner un classeur...</option>
                    {classeurs.map((classeur) => (
                      <option key={classeur.id} value={classeur.id}>
                        {classeur.nom_classeur}
                      </option>
                    ))}
                  </select>
                  {renderError("id_classeur")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Centre d'ordonnancement <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="id_centre_ordonnancement"
                    value={formData.id_centre_ordonnancement}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="">Sélectionner un centre...</option>
                    {centres.map((centre) => (
                      <option key={centre.id} value={centre.id}>
                        {centre.nom}
                      </option>
                    ))}
                  </select>
                  {renderError("id_centre_ordonnancement")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Emplacement <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="id_emplacement"
                    value={formData.id_emplacement}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="">Sélectionner un emplacement...</option>
                    {emplacements.map((emplacement) => (
                      <option key={emplacement.id} value={emplacement.id}>
                        {emplacement.nom_emplacement}
                      </option>
                    ))}
                  </select>
                  {renderError("id_emplacement")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Date du titre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_titre"
                    value={formData.date_titre}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                  {renderError("date_titre")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Date d'ordonnancement</label>
                  <input
                    type="date"
                    name="date_ordonnancement"
                    value={formData.date_ordonnancement}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                  {renderError("date_ordonnancement")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Date d'enregistrement <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="date_enregistrement"
                      value={formData.date_enregistrement}
                      onChange={handleChange}
                      disabled={loading || noteSubmitted}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                    />
                    <button
                      type="button"
                      onClick={() => setToday("date_enregistrement")}
                      disabled={loading || noteSubmitted}
                      className="rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Aujourd'hui
                    </button>
                  </div>
                  {renderError("date_enregistrement")}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Référence dossier</label>
                  <input
                    name="reference_dossier"
                    value={formData.reference_dossier}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    placeholder="Référence du dossier"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Référence déclaration</label>
                  <input
                    name="reference_declaration"
                    value={formData.reference_declaration}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    placeholder="Référence de la déclaration"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 3 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                  <FaMoneyBillWave className="text-navy-600" /> Montant et objet
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Montant</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="montant"
                    value={formData.montant}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Devise</label>
                  <select
                    name="devise"
                    value={formData.devise}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  >
                    <option value="CDF">CDF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Objet</label>
                  <textarea
                    name="objet"
                    value={formData.objet}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    rows={3}
                    placeholder="Objet du titre de perception..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Observations</label>
                  <textarea
                    name="observations"
                    value={formData.observations}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    rows={3}
                    placeholder="Observations complémentaires..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">Mots-clés</label>
                  <input
                    name="mots_cles"
                    value={formData.mots_cles}
                    onChange={handleChange}
                    disabled={loading || noteSubmitted}
                    placeholder="Séparer par des virgules : impôt, recouvrement, amende"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-navy-600 focus:ring-4 focus:ring-navy-100"
                  />
                </div>
              </div>
            </div>
          )}

          {noteSubmitted && filePreviews.length > 0 && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                  <FaPaperclip className="text-emerald-600" /> Fichiers ({filePreviews.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2">
                {filePreviews.map((file, index) => (
                  <div key={file.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <FaFilePdf className="shrink-0 text-rose-500" size={18} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">{file.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {file.size} · {file.uploadDate}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteFile({ open: true, index })}
                      className="ml-2 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-lg lg:left-64">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            {activeSection > 1 && !noteSubmitted && (
              <button
                type="button"
                onClick={() => setActiveSection((section) => section - 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <FaArrowLeft size={11} /> Précédent
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!noteSubmitted ? (
              activeSection < sections.length ? (
                <button
                  type="button"
                  onClick={() => setActiveSection((section) => section + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800"
                >
                  Suivant <FaArrowRight size={11} />
                </button>
              ) : (
                <button
                  type="submit"
                  form="noteForm"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <FaSave size={12} /> {isEditing ? "Enregistrer" : "Créer le titre"}
                    </>
                  )}
                </button>
              )
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <FaCheckCircle size={10} /> Titre enregistré
                </span>
                <button
                  type="button"
                  onClick={() => setShowFileUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-bold text-navy-700 hover:bg-navy-50"
                >
                  <FaPaperclip size={11} /> Ajouter des fichiers
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ModalAssujetti
        isOpen={showAssujettiModal}
        selectnom={(assujetti) => selectAssujetti(assujetti)}
        onClose={() => setShowAssujettiModal(false)}
      />

      {showFileUploadModal && createdNoteId && (
        <FileUploadModal
          documentId={createdNoteId}
          id_classeur={formData.id_classeur}
          id_ministere={formData.id_article_budgetaire}
          onClose={handleFilesUploadCancel}
          onUploadComplete={handleFilesUploadComplete}
          token={token}
          existingFiles={filePreviews}
          nom_fichier={selectedAssujetti?.nom_raison_sociale || "titre de perception"}
          uploadType="note"
        />
      )}

      <ConfirmModal
        isOpen={confirmDeleteFile.open}
        onClose={() => setConfirmDeleteFile({ open: false, index: null })}
        onConfirm={confirmRemoveFile}
        title="Supprimer le fichier"
        message="Voulez-vous vraiment supprimer ce fichier ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
        title="Quitter le formulaire"
        message="Les données non enregistrées seront perdues. Continuer ?"
        confirmText="Oui, quitter"
        cancelText="Rester"
        variant="warning"
      />
    </div>
  );
};

export default FormNote;
