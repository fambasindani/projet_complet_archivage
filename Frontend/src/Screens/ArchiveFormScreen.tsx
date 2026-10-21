// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import {
  FaArchive,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaFolderOpen,
  FaInfoCircle,
  FaSave,
  FaSpinner,
  FaTags,
} from 'react-icons/fa';
import Head from '../Composant/Head';
import Menus from '../Composant/Menus';
import DossierHeader from '../Composant/DossierHeader';
import PostSaveFilesModal from '../Modals/PostSaveFilesModal';
import { toast } from '../Composant/Toast';
import archiveService from '../services/archive.service';
import typeDocumentService from '../services/typeDocument.service';
import classeurService from '../services/classeur.service';
import emplacementService from '../services/emplacement.service';
import motCleService from '../services/motCle.service';
import { api } from '../services/api';

const EMPTY = {
  reference: '',
  titre: '',
  objet: '',
  id_type_document: '',
  id_direction: '',
  id_division: '',
  id_classeur: '',
  id_emplacement: '',
  date_document: '',
  date_enregistrement: new Date().toISOString().slice(0, 10),
  numero_dossier: '',
  statut: 'actif',
  mots_cles: '',
};

const STATUTS = [
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'actif', label: 'Actif' },
  { value: 'archive', label: 'Archive' },
  { value: 'inactif', label: 'Inactif' },
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-navy-600 focus:ring-4 focus:ring-navy-100';

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

const ArchiveFormScreen = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const history = useHistory();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);
  const [savedArchive, setSavedArchive] = useState(null);
  const [options, setOptions] = useState({ types: [], directions: [], divisions: [], classeurs: [], emplacements: [], motsCles: [] });

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        typeDocumentService.list({ per_page: 200 }),
        api.get('/mes-divisions').then((response) => response.data),
        classeurService.listAll(),
        emplacementService.listAll(),
        motCleService.list({ per_page: 200 }),
        api.get('/mes-directions').then((response) => response.data),
      ]);
      const pick = (index) => (results[index]?.status === 'fulfilled' ? results[index].value : null);
      const asList = (payload) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.data?.data)) return payload.data.data;
        return [];
      };
      setOptions({
        types: asList(pick(0)),
        divisions: asList(pick(1)),
        classeurs: asList(pick(2)),
        emplacements: asList(pick(3)),
        motsCles: asList(pick(4)),
        directions: asList(pick(5)),
      });
    };

    const loadArchive = async () => {
      if (!id) return;
      try {
        const response = await archiveService.getById(id);
        const archive = response?.data || response;
        setForm({
          reference: archive.reference || '',
          titre: archive.titre || '',
          objet: archive.objet || '',
          id_type_document: archive.id_type_document || '',
          id_direction: archive.division?.id_direction || '',
          id_division: archive.id_division || '',
          id_classeur: archive.id_classeur || '',
          id_emplacement: archive.id_emplacement || '',
          date_document: archive.date_document ? String(archive.date_document).slice(0, 10) : '',
          date_enregistrement: archive.date_enregistrement ? String(archive.date_enregistrement).slice(0, 10) : '',
          numero_dossier: archive.numero_dossier || '',
          statut: archive.statut || 'actif',
          mots_cles: (archive.mots_cles || []).map((m) => m.libelle || m).join(', '),
        });
      } catch {
        toast.error("Impossible de charger l'archive");
        history.push('/archives');
      } finally {
        setLoading(false);
      }
    };

    load();
    loadArchive();
  }, [id, history]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const selectedType = options.types.find((t) => String(t.id) === String(form.id_type_document));
  const selectedDirection = options.directions.find((d) => String(d.id) === String(form.id_direction));
  const selectedDivision = options.divisions.find((d) => String(d.id) === String(form.id_division));
  const filteredDivisions = options.divisions.filter(
    (division) => String(division.id_direction) === String(form.id_direction)
  );
  const completion = useMemo(() => {
    const checks = [
      { label: 'Titre renseigné', done: !!form.titre.trim() },
      { label: 'Type de document choisi', done: !!form.id_type_document },
      { label: 'Division rattachée', done: !!form.id_division },
      { label: 'Date enregistrement', done: !!form.date_enregistrement },
      { label: 'Mots-clés ajoutés', done: !!form.mots_cles.trim() },
    ];
    return { checks, percent: Math.round((checks.filter((c) => c.done).length / checks.length) * 100) };
  }, [form]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    const payload = {
      reference: form.reference.trim() || null,
      titre: form.titre.trim(),
      objet: form.objet.trim() || null,
      id_type_document: form.id_type_document || null,
      id_division: form.id_division || null,
      id_classeur: form.id_classeur || null,
      id_emplacement: form.id_emplacement || null,
      date_document: form.date_document || null,
      date_enregistrement: form.date_enregistrement || null,
      numero_dossier: form.numero_dossier.trim() || null,
      statut: form.statut,
      mots_cles: form.mots_cles.split(',').map((item) => item.trim()).filter(Boolean),
    };
    try {
      const response = editing
        ? await archiveService.update(id, payload)
        : await archiveService.create(payload);
      const archive = response?.data || response;
      toast.success(editing ? 'Archive mise à jour' : 'Archive créée');
      setSavedArchive({
        id: archive?.id,
        reference: archive?.reference,
        id_classeur: archive?.id_classeur,
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
            <FaSpinner className="animate-spin text-navy-700" /> Chargement de l'archive...
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
            <Link to="/archives" className="hover:text-navy-700">Archives</Link>
            <FaChevronRight size={8} />
            <span className="text-navy-800">{editing ? 'Modification' : 'Nouvelle archive'}</span>
          </div>

          <DossierHeader
            registry="DGRAD · Registre de l'archivage ordinaire"
            title={editing ? "Révision de la fiche archive" : "Versement d'une archive"}
            reference={form.reference}
            status={form.statut}
            backTo="/archives"
            backLabel="Registre des archives"
            meta={[
              { label: 'Exercice', value: new Date().getFullYear() },
              { label: 'Direction', value: selectedDirection?.sigle },
              { label: 'Division', value: selectedDivision?.sigle },
              { label: 'Enregistrement', value: form.date_enregistrement },
              { label: 'Type', value: selectedType?.libelle },
            ]}
          />

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Section icon={<FaArchive size={13} />} title="Identification" subtitle="Référence et objet du document">
                <Field label="Titre du document" required error={errors.titre?.[0]} className="sm:col-span-2">
                  <input
                    value={form.titre}
                    onChange={(e) => set('titre', e.target.value)}
                    required
                    placeholder="Ex. Déclaration fiscale exercice 2026"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Référence"
                  hint="Auto si vide"
                  error={errors.reference?.[0]}
                >
                  <input
                    value={form.reference}
                    onChange={(e) => set('reference', e.target.value)}
                    placeholder="ARC-2026-000001"
                    className={inputClass}
                  />
                </Field>
                <Field label="Numéro de dossier" error={errors.numero_dossier?.[0]}>
                  <input
                    value={form.numero_dossier}
                    onChange={(e) => set('numero_dossier', e.target.value)}
                    placeholder="DOS-2026-001"
                    className={inputClass}
                  />
                </Field>
                <Field label="Objet / description" className="sm:col-span-2" error={errors.objet?.[0]}>
                  <textarea
                    value={form.objet}
                    onChange={(e) => set('objet', e.target.value)}
                    rows={3}
                    placeholder="Décrivez brièvement le contenu du document..."
                    className={`${inputClass} resize-none`}
                  />
                </Field>
              </Section>

              <Section icon={<FaFolderOpen size={13} />} title="Classement" subtitle="Type, division et localisation physique">
                <Field label="Type de document" error={errors.id_type_document?.[0]}>
                  <select value={form.id_type_document} onChange={(e) => set('id_type_document', e.target.value)} className={inputClass}>
                    <option value="">Veuillez sélectionner un type de document</option>
                    {options.types.map((type) => (
                      <option key={type.id} value={type.id}>{type.libelle}</option>
                    ))}
                  </select>
                </Field>
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
                <Field label="Division propriétaire" error={errors.id_division?.[0]}>
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

              <Section icon={<FaCalendarAlt size={13} />} title="Dates et suivi" subtitle="Dates métier et statut de l’archive">
                <Field label="Date du document" error={errors.date_document?.[0]}>
                  <input type="date" value={form.date_document} onChange={(e) => set('date_document', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Date d’enregistrement" error={errors.date_enregistrement?.[0]}>
                  <input type="date" value={form.date_enregistrement} onChange={(e) => set('date_enregistrement', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Statut" error={errors.statut?.[0]}>
                  <select value={form.statut} onChange={(e) => set('statut', e.target.value)} className={inputClass}>
                    {STATUTS.map((statut) => (
                      <option key={statut.value} value={statut.value}>{statut.label}</option>
                    ))}
                  </select>
                </Field>
              </Section>

              <Section icon={<FaTags size={13} />} title="Mots-clés" subtitle="Facilitez la recherche documentaire">
                <Field
                  label="Mots-clés"
                  hint="Séparés par des virgules"
                  className="sm:col-span-2"
                  error={errors.mots_cles?.[0]}
                >
                  <input
                    value={form.mots_cles}
                    onChange={(e) => set('mots_cles', e.target.value)}
                    placeholder="fiscalité, contentieux, 2026"
                    className={inputClass}
                  />
                  {options.motsCles.length > 0 && (
                    <p className="mt-2 text-[10px] text-slate-400">
                      Suggestions : {options.motsCles.slice(0, 8).map((m) => m.libelle).join(', ')}
                    </p>
                  )}
                </Field>
              </Section>

              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/archives"
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
                  {editing ? 'Enregistrer les modifications' : "Créer l'archive"}
                </button>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-display text-sm font-extrabold text-navy-900">Aperçu</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">Rendu de la fiche archive</p>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                      <FaArchive size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-extrabold text-slate-900">
                        {form.titre || 'Titre du document'}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {form.reference || 'Référence automatique'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Type</span>
                      <span className="truncate font-semibold text-slate-700">{selectedType?.libelle || 'Non défini'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Division</span>
                      <span className="truncate font-semibold text-slate-700">{selectedDivision?.sigle || 'Non définie'}</span>
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
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all" style={{ width: `${completion.percent}%` }} />
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

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex items-center gap-2 text-blue-800">
                  <FaInfoCircle size={12} />
                  <h3 className="text-xs font-extrabold">Conseils</h3>
                </div>
                <ul className="mt-3 space-y-2 text-[11px] leading-5 text-blue-900/70">
                  <li>• Utilisez un titre explicite et unique.</li>
                  <li>• Rattachez l’archive à une division pour la traçabilité.</li>
                  <li>• Ajoutez des mots-clés pour améliorer la recherche.</li>
                  <li>• Vous pourrez joindre des fichiers après l’enregistrement.</li>
                </ul>
              </div>
            </aside>
          </form>
        </div>
      </div>

      <PostSaveFilesModal
        isOpen={!!savedArchive?.id}
        entiteType="archive"
        entiteId={savedArchive?.id}
        reference={savedArchive?.reference}
        idClasseur={savedArchive?.id_classeur}
        onClose={() => history.push('/archives')}
        onFinish={() => history.push('/archives')}
      />
    </div>
  );
};

export default ArchiveFormScreen;
