// @ts-nocheck
import { FaTags } from 'react-icons/fa';
import ReferentielCrud from '../Composant/ReferentielCrud';
import motCleService from '../services/motCle.service';

const fields = [{ name: 'libelle', label: 'Libelle', required: true, placeholder: 'Ex. contentieux' }];

const columns = [
  {
    key: 'libelle',
    label: 'Mot-cle',
    render: (row) => <span className="rounded-md bg-navy-50 px-2 py-1 text-[11px] font-bold text-navy-700 ring-1 ring-navy-100">{row.libelle}</span>,
  },
  { key: 'created_at', label: 'Cree le', render: (row) => (row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '—') },
];

const MotCleScreen = () => (
  <ReferentielCrud
    title="Mots-cles"
    subtitle="Referentiel partage par les archives et les titres de perception"
    icon={<FaTags size={19} />}
    service={motCleService}
    fields={fields}
    columns={columns}
    searchPlaceholder="Rechercher un mot-cle..."
    emptyLabel="Aucun mot-cle trouve"
    labelSingular="mot-cle"
  />
);

export default MotCleScreen;
