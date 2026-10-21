// @ts-nocheck
import { FaFileAlt } from 'react-icons/fa';
import ReferentielCrud from '../Composant/ReferentielCrud';
import typeDocumentService from '../services/typeDocument.service';

const fields = [
  { name: 'code', label: 'Code', required: true, placeholder: 'Ex. DECLARATION' },
  { name: 'libelle', label: 'Libelle', required: true, placeholder: 'Ex. Declaration' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'duree_conservation_mois', label: 'Duree de conservation (mois)', type: 'number' },
  { name: 'statut', label: 'Actif', type: 'checkbox', defaultValue: true },
];

const columns = [
  {
    key: 'code',
    label: 'Code',
    render: (row) => (
      <span className="rounded-md bg-navy-50 px-2 py-1 text-[10px] font-extrabold text-navy-700 ring-1 ring-navy-100">{row.code}</span>
    ),
  },
  { key: 'libelle', label: 'Libelle', render: (row) => <span className="font-bold text-slate-900">{row.libelle}</span> },
  { key: 'duree_conservation_mois', label: 'Conservation', render: (row) => (row.duree_conservation_mois ? `${row.duree_conservation_mois} mois` : '—') },
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

const TypeDocumentScreen = () => (
  <ReferentielCrud
    title="Types de documents"
    subtitle="Referentiel des types utilises par l archivage ordinaire"
    icon={<FaFileAlt size={19} />}
    service={typeDocumentService}
    fields={fields}
    columns={columns}
    searchPlaceholder="Rechercher un code ou un libelle..."
    emptyLabel="Aucun type de document trouve"
    labelSingular="type de document"
  />
);

export default TypeDocumentScreen;
