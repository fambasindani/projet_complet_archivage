// @ts-nocheck
import { FaUserTie } from 'react-icons/fa';
import ReferentielCrud from '../Composant/ReferentielCrud';
import assujettiService from '../services/assujetti.service';

const fields = [
  { name: 'nom_raison_sociale', label: 'Nom / raison sociale', required: true },
  { name: 'numero_nif', label: 'Numero NIF' },
  {
    name: 'type_personne',
    label: 'Type de personne',
    type: 'select',
    options: [
      { value: 'physique', label: 'Personne physique' },
      { value: 'morale', label: 'Personne morale' },
    ],
  },
  { name: 'telephone', label: 'Telephone', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'bp', label: 'Boite postale' },
  { name: 'adresse', label: 'Adresse', type: 'textarea' },
  { name: 'statut', label: 'Actif', type: 'checkbox', defaultValue: true },
];

const columns = [
  { key: 'nom_raison_sociale', label: 'Assujetti', render: (row) => <span className="font-bold text-slate-900">{row.nom_raison_sociale}</span> },
  { key: 'numero_nif', label: 'NIF' },
  { key: 'type_personne', label: 'Type' },
  { key: 'telephone', label: 'Telephone' },
  { key: 'email', label: 'Email' },
  {
    key: 'statut',
    label: 'Statut',
    render: (row) => (
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${row.statut ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
        {row.statut ? 'Actif' : 'Inactif'}
      </span>
    ),
  },
];

const AssujettiScreen = () => (
  <ReferentielCrud
    title="Assujettis"
    subtitle="Redevables rattaches aux titres de perception"
    icon={<FaUserTie size={19} />}
    service={assujettiService}
    fields={fields}
    columns={columns}
    searchPlaceholder="Rechercher un nom, un NIF, un telephone..."
    emptyLabel="Aucun assujetti trouve"
    labelSingular="assujetti"
  />
);

export default AssujettiScreen;
