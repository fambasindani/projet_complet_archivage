// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import {
  FaBook,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaFileInvoiceDollar,
  FaInfoCircle,
  FaMoneyBillWave,
  FaSave,
  FaSpinner,
  FaTags,
  FaUserTie,
} from 'react-icons/fa';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import DossierHeader from '../Composant/DossierHeader';
import SearchableSelect from '../Composant/SearchableSelect';
import PostSaveFilesModal from '../Modals/PostSaveFilesModal';
import { toast } from '../Composant/Toast';
import titreService from '../services/titre.service';
import classeurService from '../services/classeur.service';
import emplacementService from '../services/emplacement.service';
import assujettiService from '../services/assujetti.service';
import articleService from '../services/article.service';
import { api } from '../services/api';

const EMPTY = {
  reference: '',
  numero_titre: '',
  id_categorie_titre: '',
  id_assujetti: '',
  id_direction: '',
  id_division: '',
  id_centre_ordonnancement: '',
  id_article_budgetaire: '',
  id_classeur: '',
  id_emplacement: '',
  reference_dossier: '',
  reference_declaration: '',
  date_titre: '',
  date_enregistrement: new Date().toISOString().slice(0, 10),
  date_ordonnancement: '',
  montant: '',
  devise: 'CDF',
  objet: '',
  observations: '',
  statut: 'brouillon',
  mots_cles: '',
};

const STATUTS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'actif', label: 'Actif' },
  { value: 'archive', label: 'Archivé' },
  { value: 'annule', label: 'Annulé' },
];

const CHAMP_LABELS = {
  id_assujetti: 'Assujetti',
  montant: 'Montant',
  date_titre: 'Date du titre',
  id_division: 'Division',
  id_centre_ordonnancement: 'Centre d’ordonnancement',
  id_article_budgetaire: 'Article budgétaire',
  reference_dossier: 'Référence dossier',
  reference_declaration: 'Référence déclaration',
  objet: 'Objet',
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-navy-600 focus:ring-4 focus:ring-navy-100';

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const Field = ({ label, required, hint, error, children, className = '' }) => (
  <div className={className}>
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label className="text-xs font-bold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {hint && <span className="text-[10px] font-medium text-slate-400">{hint}</span>}
    </div>
    {children}
    {error && <p className="mt-1.5 text-[10px] font-semibold text-rose-600">{error}</p>}
  </div>
);

const Section = ({ icon, title, subtitle, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white shadow-sm">
        {icon}
      </span>
      <div>
        <h2 className="font-display text-sm font-extrabold text-navy-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[10px] text-slate-400">{subtitle}</p>}
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">{children}</div>
  </section>
);

const TitreFormScreen = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const history = useHistory();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [savedTitre, setSavedTitre] = useState(null);
  const [options, setOptions] = useState({
    categories: [],
    directions: [],
    divisions: [],
    centres: [],
    assujettis: [],
    articles: [],
    classeurs: [],
    emplacements: [],
  });

  useEffect(() => {
    const loadOptions = async () => {
      const results = await Promise.allSettled([
        api.get('/categories-titres', { params: { per_page: 200 } }).then((r) => r.data),
        api.get('/mes-divisions').then((r) => r.data),
        api.get('/centre_ordonnancements/all', { params: { per_page: 200 } }).then((r) => r.data),
        assujettiService.list({ per_page: 200 }),
        articleService.listAll(),
        classeurService.listAll(),
        emplacementService.listAll(),
        api.get('/mes-directions').then((r) => r.data),
      ]);
      const pick = (index) => (results[index]?.status === 'fulfilled' ? results[index].value : null);
      setOptions({
        categories: asList(pick(0)),
        divisions: asList(pick(1)),
        centres: asList(pick(2)),
        assujettis: asList(pick(3)),
        articles: asList(pick(4)),
        classeurs: asList(pick(5)),
        emplacements: asList(pick(6)),
        directions: asList(pick(7)),
      });
    };

    const loadTitre = async () => {
      if (!id) return;
      try {
        const response = await titreService.getById(id);
        const titre = response?.data || response;
        setForm({
          reference: titre.reference || '',
          numero_titre: titre.numero_titre || '',
          id_categorie_titre: titre.id_categorie_titre || '',
          id_assujetti: titre.id_assujetti || '',
          id_direction: titre.division?.id_direction || titre.division?.direction?.id || '',
          id_division: titre.id_division || '',
          id_centre_ordonnancement: titre.id_centre_ordonnancement || '',
          id_article_budgetaire: titre.id_article_budgetaire || '',
          id_classeur: titre.id_classeur || '',
          id_emplacement: titre.id_emplacement || '',
          reference_dossier: titre.reference_dossier || '',
          reference_declaration: titre.reference_declaration || '',
          date_titre: titre.date_titre ? String(titre.date_titre).slice(0, 10) : '',
          date_enregistrement: titre.date_enregistrement ? String(titre.date_enregistrement).slice(0, 10) : '',
          date_ordonnancement: titre.date_ordonnancement ? String(titre.date_ordonnancement).slice(0, 10) : '',
          montant: titre.montant ?? '',
          devise: titre.devise || 'CDF',
          objet: titre.objet || '',
          observations: titre.observations || '',
          statut: titre.statut || 'brouillon',
          mots_cles: (titre.mots_cles || []).map((m) => m.libelle || m).join(', '),
        });
      } catch {
        toast.error('Impossible de charger le titre');
        history.push('/titres');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
    loadTitre();
  }, [id, history]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const selectedCategory = options.categories.find((c) => String(c.id) === String(form.id_categorie_titre));
  const selectedAssujetti = options.assujettis.find((a) => String(a.id) === String(form.id_assujetti));
  const selectedDirection = options.directions.find((d) => String(d.id) === String(form.id_direction));
  const selectedDivision = options.divisions.find((d) => String(d.id) === String(form.id_division));
  const filteredDivisions = options.divisions.filter(
    (division) => String(division.id_direction) === String(form.id_direction)
  );
  const requiredFields = selectedCategory?.champs_obligatoires || [];

  const completion = useMemo(() => {
    const checks = [
      { label: 'Catégorie sélectionnée', done: !!form.id_categorie_titre },
      { label: 'Assujetti renseigné', done: !!form.id_assujetti },
      { label: 'Montant renseigné', done: form.montant !== '' && form.montant !== null },
      { label: 'Date du titre', done: !!form.date_titre },
      { label: 'Direction choisie', done: !!form.id_direction },
      { label: 'Division émettrice', done: !!form.id_division },
      { label: 'Classement effectué', done: !!form.id_classeur || !!form.id_emplacement },
    ];
    return { checks, percent: Math.round((checks.filter((c) => c.done).length / checks.length) * 100) };
  }, [form]);

  const money = (value, devise = 'CDF') =>
    `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${devise || ''}`.trim();

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    const payload = {
      reference: form.reference.trim() || null,
      numero_titre: form.numero_titre.trim() || null,
      id_categorie_titre: Number(form.id_categorie_titre),
      id_assujetti: form.id_assujetti || null,
      id_division: form.id_division || null,
      id_centre_ordonnancement: form.id_centre_ordonnancement || null,
      id_article_budgetaire: form.id_article_budgetaire || null,
      id_classeur: form.id_classeur || null,
      id_emplacement: form.id_emplacement || null,
      reference_dossier: form.reference_dossier.trim() || null,
      reference_declaration: form.reference_declaration.trim() || null,
      date_titre: form.date_titre || null,
      date_enregistrement: form.date_enregistrement || null,
      date_ordonnancement: form.date_ordonnancement || null,
      montant: form.montant === '' ? null : Number(form.montant),
      devise: form.devise || 'CDF',
      objet: form.objet.trim() || null,
      observations: form.observations.trim() || null,
      statut: form.statut,
      mots_cles: form.mots_cles.split(',').map((item) => item.trim()).filter(Boolean),
    };
    try {
      const response = editing
        ? await titreService.update(id, payload)
        : await titreService.create(payload);
      const titre = response?.data || response;
      toast.success(editing ? 'Titre de perception mis à jour' : 'Titre de perception créé');
      setSavedTitre({
        id: titre?.id,
        reference: titre?.reference,
        id_classeur: titre?.id_classeur,
      });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        toast.error('Veuillez corriger les erreurs du formulaire');
      } else {
        toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f4ee]">
        <Menus />
        <Head />
        <div className="flex min-h-[70vh] items-center justify-center lg:pl-64">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-600 shadow-card">
            <FaSpinner className="animate-spin text-navy-700" /> Chargement du titre...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <Menus />
      <Head />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-navy-700">Tableau de bord</Link>
            <FaChevronRight size={8} />
            <Link to="/titres" className="hover:text-navy-700">Titres de perception</Link>
            <FaChevronRight size={8} />
            <span className="text-navy-800">{editing ? 'Modification' : 'Nouveau titre'}</span>
          </div>

          <DossierHeader
            registry="DGRAD · Registre des titres de perception"
            title={editing ? 'Révision du titre de perception' : "Émission d'un titre de perception"}
            reference={form.reference || selectedCategory?.regle_numerotation}
            status={form.statut}
            backTo="/titres"
            backLabel="Registre des titres"
            meta={[
              { label: 'Exercice', value: new Date().getFullYear() },
              { label: 'Catégorie', value: selectedCategory?.libelle },
              { label: 'Direction', value: selectedDirection?.sigle },
              { label: 'Division', value: selectedDivision?.sigle },
              { label: 'Assiette', value: selectedAssujetti?.nom_raison_sociale },
            ]}
          />

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Section icon={<FaFileInvoiceDollar size={13} />} title="Identification du titre" subtitle="Catégorie, référence et statut">
                <Field label="Catégorie de titre" required error={errors.id_categorie_titre?.[0]}>
                  <select
                    value={form.id_categorie_titre}
                    onChange={(e) => set('id_categorie_titre', e.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Veuillez sélectionner une catégorie</option>
                    {options.categories.map((categorie) => (
                      <option key={categorie.id} value={categorie.id}>{categorie.libelle}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Statut" error={errors.statut?.[0]}>
                  <select value={form.statut} onChange={(e) => set('statut', e.target.value)} className={inputClass}>
                    {STATUTS.map((statut) => (
                      <option key={statut.value} value={statut.value}>{statut.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Référence" hint="Auto si vide" error={errors.reference?.[0]}>
                  <input
                    value={form.reference}
                    onChange={(e) => set('reference', e.target.value)}
                    placeholder={selectedCategory?.regle_numerotation || 'TP-2026-000001'}
                    className={inputClass}
                  />
                </Field>
                <Field label="Numéro du titre" hint="Auto si vide" error={errors.numero_titre?.[0]}>
                  <input
                    value={form.numero_titre}
                    onChange={(e) => set('numero_titre', e.target.value)}
                    placeholder="Numéro métier du titre"
                    className={inputClass}
                  />
                </Field>
                {requiredFields.length > 0 ? (
                  <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
                    <span className="font-bold">Champs obligatoires pour cette catégorie :</span>{' '}
                    {requiredFields.map((field) => CHAMP_LABELS[field] || field).join(', ')}
                  </div>
                ) : selectedCategory ? (
                  <div className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[11px] text-sky-800">
                    <span className="font-bold">Catégorie générale :</span> aucun assujetti n’est obligatoire.
                    Les champs assujetti, montant et date du titre restent facultatifs.
                  </div>
                ) : null}
              </Section>

              <Section icon={<FaUserTie size={13} />} title="Assujetti et montant" subtitle="Redevable et imputation financière">
                <Field
                  label={requiredFields.includes('id_assujetti') ? 'Assujetti' : 'Assujetti (facultatif)'}
                  required={requiredFields.includes('id_assujetti')}
                  error={errors.id_assujetti?.[0]}
                >
                  <SearchableSelect
                    value={form.id_assujetti}
                    onChange={(value) => set('id_assujetti', value)}
                    options={options.assujettis.map((assujetti) => ({
                      value: String(assujetti.id),
                      label: assujetti.nom_raison_sociale,
                      hint: assujetti.numero_nif || '',
                    }))}
                    placeholder={
                      requiredFields.includes('id_assujetti')
                        ? 'Veuillez sélectionner un assujetti'
                        : 'Assujetti (facultatif)'
                    }
                    searchPlaceholder="Rechercher par nom ou NIF..."
                  />
                </Field>
                <Field label="Article budgétaire" error={errors.id_article_budgetaire?.[0]}>
                  <select value={form.id_article_budgetaire} onChange={(e) => set('id_article_budgetaire', e.target.value)} className={inputClass}>
                    <option value="">Veuillez sélectionner un article budgétaire</option>
                    {options.articles.map((article) => (
                      <option key={article.id} value={article.id}>{article.article_budgetaire} — {article.nom}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={requiredFields.includes('montant') ? 'Montant' : 'Montant (facultatif)'}
                  required={requiredFields.includes('montant')}
                  error={errors.montant?.[0]}
                >
                  <div className="relative">
                    <FaMoneyBillWave className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.montant}
                      onChange={(e) => set('montant', e.target.value)}
                      placeholder="0,00"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </Field>
                <Field label="Devise" error={errors.devise?.[0]}>
                  <select value={form.devise} onChange={(e) => set('devise', e.target.value)} className={inputClass}>
                    <option value="CDF">CDF — Franc congolais</option>
                    <option value="USD">USD — Dollar américain</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </Field>
              </Section>

              <Section icon={<FaBook size={13} />} title="Classement et localisation" subtitle="Division, centre, classeur et emplacement">
                <Field label="Direction" hint="Préalable à la division">
                  <select
                    value={form.id_direction}
                    onChange={(e) => {
                      set('id_direction', e.target.value);
                      set('id_division', '');
                    }}
                    className={inputClass}
                  >
                    <option value="">Veuillez sélectionner une direction</option>
                    {options.directions.map((direction) => (
                      <option key={direction.id} value={direction.id}>
                        {direction.sigle ? `${direction.sigle} — ` : ''}{direction.nom}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Division émettrice" error={errors.id_division?.[0]}>
                  <select
                    value={form.id_division}
                    onChange={(e) => set('id_division', e.target.value)}
                    disabled={!form.id_direction}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                  >
                    <option value="">
                      {!form.id_direction
                        ? "Veuillez d'abord sélectionner une direction"
                        : filteredDivisions.length === 0
                          ? 'Aucune division disponible pour cette direction'
                          : 'Veuillez sélectionner une division'}
                    </option>
                    {filteredDivisions.map((division) => (
                      <option key={division.id} value={division.id}>{division.sigle} — {division.nom}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Centre d’ordonnancement" error={errors.id_centre_ordonnancement?.[0]}>
                  <select value={form.id_centre_ordonnancement} onChange={(e) => set('id_centre_ordonnancement', e.target.value)} className={inputClass}>
                    <option value="">Veuillez sélectionner un centre</option>
                    {options.centres.map((centre) => (
                      <option key={centre.id} value={centre.id}>{centre.nom}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Classeur" error={errors.id_classeur?.[0]}>
                  <select value={form.id_classeur} onChange={(e) => set('id_classeur', e.target.value)} className={inputClass}>
                    <option value="">Veuillez sélectionner un classeur</option>
                    {options.classeurs.map((classeur) => (
                      <option key={classeur.id} value={classeur.id}>{classeur.nom_classeur}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Emplacement physique" error={errors.id_emplacement?.[0]}>
                  <select value={form.id_emplacement} onChange={(e) => set('id_emplacement', e.target.value)} className={inputClass}>
                    <option value="">Veuillez sélectionner un emplacement</option>
                    {options.emplacements.map((emplacement) => (
                      <option key={emplacement.id} value={emplacement.id}>{emplacement.nom_emplacement}</option>
                    ))}
                  </select>
                </Field>
              </Section>

              <Section icon={<FaCalendarAlt size={13} />} title="Dates et références" subtitle="Dates métier et références externes">
                <Field
                  label={requiredFields.includes('date_titre') ? 'Date du titre' : 'Date du titre (facultative)'}
                  required={requiredFields.includes('date_titre')}
                  error={errors.date_titre?.[0]}
                >
                  <input type="date" value={form.date_titre} onChange={(e) => set('date_titre', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Date d’enregistrement" error={errors.date_enregistrement?.[0]}>
                  <input type="date" value={form.date_enregistrement} onChange={(e) => set('date_enregistrement', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Date d’ordonnancement" error={errors.date_ordonnancement?.[0]}>
                  <input type="date" value={form.date_ordonnancement} onChange={(e) => set('date_ordonnancement', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Référence dossier" error={errors.reference_dossier?.[0]}>
                  <input value={form.reference_dossier} onChange={(e) => set('reference_dossier', e.target.value)} placeholder="DOS-2026-001" className={inputClass} />
                </Field>
                <Field label="Référence déclaration" error={errors.reference_declaration?.[0]}>
                  <input value={form.reference_declaration} onChange={(e) => set('reference_declaration', e.target.value)} placeholder="DEC-2026-001" className={inputClass} />
                </Field>
              </Section>

              <Section icon={<FaTags size={13} />} title="Objet et métadonnées" subtitle="Description, observations et mots-clés">
                <Field label="Objet" className="sm:col-span-2" error={errors.objet?.[0]}>
                  <textarea
                    value={form.objet}
                    onChange={(e) => set('objet', e.target.value)}
                    rows={3}
                    placeholder="Objet du titre de perception..."
                    className={`${inputClass} resize-none`}
                  />
                </Field>
                <Field label="Observations" className="sm:col-span-2" error={errors.observations?.[0]}>
                  <textarea
                    value={form.observations}
                    onChange={(e) => set('observations', e.target.value)}
                    rows={2}
                    placeholder="Observations internes..."
                    className={`${inputClass} resize-none`}
                  />
                </Field>
                <Field label="Mots-clés" hint="Séparés par des virgules" className="sm:col-span-2" error={errors.mots_cles?.[0]}>
                  <input
                    value={form.mots_cles}
                    onChange={(e) => set('mots_cles', e.target.value)}
                    placeholder="recouvrement, amende, 2026"
                    className={inputClass}
                  />
                </Field>
              </Section>

              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/titres"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-navy-800 disabled:opacity-50"
                >
                  {submitting ? <FaSpinner className="animate-spin" size={12} /> : <FaSave size={12} />}
                  {editing ? 'Enregistrer les modifications' : 'Créer le titre'}
                </button>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-display text-sm font-extrabold text-navy-900">Aperçu</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">Rendu de la fiche titre</p>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <FaFileInvoiceDollar size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-extrabold text-slate-900">
                        {selectedCategory?.libelle || 'Titre de perception'}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {form.reference || selectedCategory?.regle_numerotation || 'Référence automatique'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Assujetti</span>
                      <span className="truncate font-semibold text-slate-700">{selectedAssujetti?.nom_raison_sociale || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Division</span>
                      <span className="truncate font-semibold text-slate-700">{selectedDivision?.sigle || 'Non définie'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Montant</span>
                      <span className="font-extrabold text-navy-900">{money(form.montant, form.devise)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Statut</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-600">
                        {form.statut}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold text-navy-900">Complétude</h3>
                  <span className="text-[11px] font-extrabold text-navy-700">{completion.percent}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all" style={{ width: `${completion.percent}%` }} />
                </div>
                <div className="mt-4 space-y-2">
                  {completion.checks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-[11px]">
                      <FaCheckCircle size={10} className={check.done ? 'text-emerald-500' : 'text-slate-200'} />
                      <span className={check.done ? 'font-semibold text-slate-700' : 'text-slate-400'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="flex items-center gap-2 text-emerald-800">
                  <FaInfoCircle size={12} />
                  <h3 className="text-xs font-extrabold">Règles de gestion</h3>
                </div>
                <ul className="mt-3 space-y-2 text-[11px] leading-5 text-emerald-900/70">
                  <li>• La référence peut être générée selon la catégorie.</li>
                  <li>• Les champs obligatoires dépendent de la catégorie.</li>
                  <li>• Un titre validé passe au statut « actif ».</li>
                  <li>• Joignez les pièces justificatives après création.</li>
                </ul>
              </div>
            </aside>
          </form>
        </div>
      </div>

      <PostSaveFilesModal
        isOpen={!!savedTitre?.id}
        entiteType="titre_perception"
        entiteId={savedTitre?.id}
        reference={savedTitre?.reference}
        idClasseur={savedTitre?.id_classeur}
        onClose={() => history.push('/titres')}
        onFinish={() => history.push('/titres')}
      />
    </div>
  );
};

export default TitreFormScreen;
