// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaArrowLeft,
  FaBuilding,
  FaCheckCircle,
  FaChevronRight,
  FaEnvelope,
  FaIdBadge,
  FaLock,
  FaPhone,
  FaSave,
  FaShieldAlt,
  FaSpinner,
  FaUser,
  FaUserCheck,
} from 'react-icons/fa';
import DossierHeader from '../Composant/DossierHeader';
import GetTokenOrRedirect from '../Composant/getTokenOrRedirect';
import { API_BASE_URL } from '../config';
import { toast } from '../Composant/Toast';

const EMPTY = {
  nom: '',
  prenom: '',
  email: '',
  password: '',
  statut: 'active',
  id_direction: '',
  id_division: '',
  division_ids: [],
  acces_direction: false,
  matricule: '',
  telephone: '',
  role_ids: [],
};

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

const UserFormScreen = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const history = useHistory();
  const token = GetTokenOrRedirect();
  const [form, setForm] = useState(EMPTY);
  const [roles, setRoles] = useState([]);
  const [directions, setDirections] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' }),
    [token]
  );

  useEffect(() => {
    if (!token) return;

    const loadOptions = async () => {
      const results = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/roles`, { headers, params: { per_page: 100 } }),
        axios.get(`${API_BASE_URL}/divisions`, { headers, params: { per_page: 200 } }),
        axios.get(`${API_BASE_URL}/directions`, { headers }),
      ]);

      const rolesPayload = results[0]?.status === 'fulfilled' ? results[0].value.data : null;
      const divisionsPayload = results[1]?.status === 'fulfilled' ? results[1].value.data : null;
      const directionsPayload = results[2]?.status === 'fulfilled' ? results[2].value.data : null;

      setRoles(rolesPayload?.success ? rolesPayload.data?.data || [] : []);
      setDivisions(
        divisionsPayload?.success
          ? divisionsPayload.data?.data || divisionsPayload.data || []
          : []
      );
      setDirections(Array.isArray(directionsPayload) ? directionsPayload : directionsPayload?.data || []);
    };

    const loadUser = async () => {
      if (!id) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/mon-utilisateurs/${id}`, { headers });
        const user = response.data?.data || response.data;
        setForm({
          nom: user.nom || '',
          prenom: user.prenom || '',
          email: user.email || '',
          password: '',
          statut: user.statut || 'active',
          id_direction: String(user.division?.id_direction || user.division?.direction?.id || ''),
          id_division: String(user.id_division || user.division?.id || ''),
          division_ids: (user.divisions || [])
            .map((division) => Number(division.id))
            .filter((divisionId) => String(divisionId) !== String(user.id_division)),
          acces_direction: !!user.acces_direction,
          matricule: user.matricule || '',
          telephone: user.telephone || '',
          role_ids: (user.roles || []).map((role) => role.id),
        });
      } catch {
        toast.error("Impossible de charger l'utilisateur");
        history.push('/gestion-utilisateurs/utilisateurs');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
    loadUser();
  }, [token, id, history]);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const selectedDirection = directions.find((d) => String(d.id) === String(form.id_direction));
  const selectedDivision = divisions.find((d) => String(d.id) === String(form.id_division));
  const filteredDivisions = divisions.filter(
    (division) => String(division.id_direction) === String(form.id_direction)
  );
  const selectedRoles = roles.filter((role) => form.role_ids.includes(role.id));

  const completion = useMemo(() => {
    const checks = [
      { label: 'Identité renseignée', done: !!form.nom.trim() && !!form.prenom.trim() },
      { label: 'Email renseigné', done: !!form.email.trim() },
      { label: 'Direction choisie', done: !!form.id_direction },
      { label: 'Division choisie', done: !!form.id_division },
      { label: 'Rôle attribué', done: form.role_ids.length > 0 },
    ];
    return { checks, percent: Math.round((checks.filter((c) => c.done).length / checks.length) * 100) };
  }, [form]);

  const toggleAdditionalDivision = (divisionId) => {
    const value = Number(divisionId);
    setForm((prev) => ({
      ...prev,
      division_ids: prev.division_ids.includes(value)
        ? prev.division_ids.filter((item) => item !== value)
        : [...prev.division_ids, value],
    }));
  };

  const toggleRole = (roleId) => {
    const value = Number(roleId);
    setForm((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(value)
        ? prev.role_ids.filter((item) => item !== value)
        : [...prev.role_ids, value],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});

    if (!form.id_direction) {
      setErrors({ id_direction: ['La direction est obligatoire.'] });
      return;
    }
    if (!form.id_division) {
      setErrors({ id_division: ['La division est obligatoire.'] });
      return;
    }

    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim(),
      statut: form.statut,
      id_division: Number(form.id_division),
      division_ids: form.division_ids,
      acces_direction: !!form.acces_direction,
      matricule: form.matricule.trim() || null,
      telephone: form.telephone.trim() || null,
      role_ids: form.role_ids,
    };

    if (form.password) payload.password = form.password;

    setSubmitting(true);
    try {
      if (editing) {
        await axios.put(`${API_BASE_URL}/mon-utilisateurs/${id}`, payload, { headers });
        toast.success('Utilisateur mis à jour');
      } else {
        await axios.post(`${API_BASE_URL}/mon-utilisateurs`, payload, { headers });
        toast.success('Utilisateur créé');
      }
      history.push('/gestion-utilisateurs/utilisateurs');
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-600 shadow-card">
          <FaSpinner className="animate-spin text-navy-700" /> Chargement du compte...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
            <Link to="/gestion-utilisateurs/utilisateurs" className="hover:text-navy-700">Utilisateurs</Link>
            <FaChevronRight size={8} />
            <span className="text-navy-800">{editing ? 'Modification' : 'Nouveau compte'}</span>
          </div>

          <DossierHeader
            registry="DGRAD · Comptes agents"
            title={editing ? 'Révision du compte agent' : "Création d'un compte agent"}
            reference={form.email || form.matricule}
            status={form.statut}
            backTo="/gestion-utilisateurs/utilisateurs"
            backLabel="Liste des utilisateurs"
            meta={[
              { label: 'Direction', value: selectedDirection?.sigle },
              { label: 'Division', value: selectedDivision?.sigle },
              { label: 'Rôles', value: selectedRoles.length ? `${selectedRoles.length} rôle(s)` : null },
              { label: 'Accès', value: form.acces_direction ? 'Direction entière' : null },
            ]}
          />

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Section icon={<FaUser size={13} />} title="Identité de l'agent" subtitle="Informations personnelles et coordonnées">
                <Field label="Nom" required error={errors.nom?.[0]}>
                  <input value={form.nom} onChange={(e) => set('nom', e.target.value)} required className={inputClass} />
                </Field>
                <Field label="Prénom" required error={errors.prenom?.[0]}>
                  <input value={form.prenom} onChange={(e) => set('prenom', e.target.value)} required className={inputClass} />
                </Field>
                <Field label="Matricule" error={errors.matricule?.[0]}>
                  <input value={form.matricule} onChange={(e) => set('matricule', e.target.value)} placeholder="DGRAD-001" className={inputClass} />
                </Field>
                <Field label="Email" required error={errors.email?.[0]}>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputClass} />
                </Field>
                <Field label="Téléphone" error={errors.telephone?.[0]}>
                  <input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+243 ..." className={inputClass} />
                </Field>
              </Section>

              <Section icon={<FaBuilding size={13} />} title="Rattachement organisationnel" subtitle="Direction, division principale et accès supplémentaires">
                <Field label="Direction" required error={errors.id_direction?.[0]}>
                  <select
                    value={form.id_direction}
                    onChange={(e) => {
                      set('id_direction', e.target.value);
                      set('id_division', '');
                    }}
                    required
                    className={inputClass}
                  >
                    <option value="">Veuillez sélectionner une direction</option>
                    {directions.map((direction) => (
                      <option key={direction.id} value={direction.id}>{direction.sigle} — {direction.nom}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Division principale" required error={errors.id_division?.[0]}>
                  <select
                    value={form.id_division}
                    onChange={(e) => set('id_division', e.target.value)}
                    required
                    disabled={!form.id_direction}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                  >
                    <option value="">
                      {!form.id_direction
                        ? "Veuillez d'abord sélectionner une direction"
                        : filteredDivisions.length === 0
                          ? 'Aucune division disponible'
                          : 'Veuillez sélectionner une division'}
                    </option>
                    {filteredDivisions.map((division) => (
                      <option key={division.id} value={division.id}>{division.sigle} — {division.nom}</option>
                    ))}
                  </select>
                </Field>

                {form.id_division && (
                  <>
                    <div className="sm:col-span-2">
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                          form.acces_direction
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-slate-200 bg-slate-50/60 hover:border-amber-200 hover:bg-amber-50/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!form.acces_direction}
                          onChange={(e) => set('acces_direction', e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-900 focus:ring-navy-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Accès à toute la direction</p>
                          <p className="mt-0.5 text-[10px] leading-5 text-slate-500">
                            Voir les archives et titres de toutes les divisions de la direction choisie.
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                          Divisions supplémentaires
                        </p>
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700 ring-1 ring-sky-100">
                          {form.division_ids.length} sélectionnée(s)
                        </span>
                      </div>
                      <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-2">
                        {divisions
                          .filter((division) => String(division.id) !== String(form.id_division))
                          .map((division) => {
                            const checked = form.division_ids.includes(Number(division.id));
                            return (
                              <label
                                key={division.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] transition ${
                                  checked ? 'bg-sky-50 text-sky-900 ring-1 ring-sky-100' : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAdditionalDivision(division.id)}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-navy-900 focus:ring-navy-200"
                                />
                                <span className="min-w-0 truncate">
                                  {division.direction?.sigle ? `${division.direction.sigle} / ` : ''}
                                  {division.sigle} — {division.nom}
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  </>
                )}
              </Section>

              <Section icon={<FaLock size={13} />} title="Sécurité et statut" subtitle="Mot de passe et état du compte">
                <Field label="Mot de passe" required={!editing} hint={editing ? 'Laisser vide pour conserver' : 'Minimum 6 caractères'} error={errors.password?.[0]}>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    required={!editing}
                    placeholder={editing ? '••••••••' : 'Minimum 6 caractères'}
                    className={inputClass}
                  />
                </Field>
                <Field label="Statut" error={errors.statut?.[0]}>
                  <select value={form.statut} onChange={(e) => set('statut', e.target.value)} className={inputClass}>
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="bloque">Bloqué</option>
                  </select>
                </Field>
              </Section>

              <Section icon={<FaShieldAlt size={13} />} title="Rôles et permissions" subtitle="Droits d'accès attribués au compte">
                <div className="sm:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {roles.map((role) => {
                    const selected = form.role_ids.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                          selected
                            ? 'border-navy-200 bg-navy-50 ring-1 ring-navy-100'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">{role.nom}</p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-400">
                            {role.description || 'Aucune description'}
                          </p>
                        </div>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                          <FaCheckCircle size={9} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/gestion-utilisateurs/utilisateurs"
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
                  {editing ? 'Enregistrer les modifications' : 'Créer le compte'}
                </button>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-display text-sm font-extrabold text-navy-900">Aperçu du compte</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">Rendu de la fiche agent</p>
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-sm font-extrabold text-white">
                      {(form.prenom?.[0] || '') + (form.nom?.[0] || '') || 'DG'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-900">
                        {`${form.prenom || ''} ${form.nom || ''}`.trim() || 'Nom de l’agent'}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-slate-400">{form.email || 'Email non renseigné'}</p>
                      <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${form.statut === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                        {form.statut}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Direction</span>
                      <span className="truncate font-semibold text-slate-700">{selectedDirection?.sigle || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Division</span>
                      <span className="truncate font-semibold text-slate-700">{selectedDivision?.sigle || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Rôles</span>
                      <span className="font-semibold text-slate-700">{selectedRoles.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Accès</span>
                      <span className="font-semibold text-slate-700">
                        {form.acces_direction ? 'Toute la direction' : `${1 + form.division_ids.length} division(s)`}
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
                  <FaUserCheck size={12} />
                  <h3 className="text-xs font-extrabold">Bon à savoir</h3>
                </div>
                <ul className="mt-3 space-y-2 text-[11px] leading-5 text-blue-900/70">
                  <li>• La direction filtre automatiquement les divisions.</li>
                  <li>• Le rôle détermine les modules accessibles.</li>
                  <li>• L’accès direction ouvre toutes les divisions de la direction.</li>
                </ul>
              </div>
            </aside>
          </form>
    </div>
  );
};

export default UserFormScreen;
