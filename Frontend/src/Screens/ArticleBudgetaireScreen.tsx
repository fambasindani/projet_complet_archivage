// @ts-nocheck
import { FaBook } from 'react-icons/fa';
import ReferentielCrud from '../Composant/ReferentielCrud';
import articleService from '../services/article.service';

const fields = [
  { name: 'article_budgetaire', label: 'Code article budgetaire', required: true, placeholder: 'Ex. 7111' },
  { name: 'nom', label: 'Libelle', required: true, placeholder: 'Ex. Impots directs' },
  { name: 'statut', label: 'Actif', type: 'checkbox', defaultValue: true },
];

const columns = [
  {
    key: 'article_budgetaire',
    label: 'Code',
    render: (row) => <span className="rounded-md bg-navy-50 px-2 py-1 text-[10px] font-extrabold text-navy-700 ring-1 ring-navy-100">{row.article_budgetaire}</span>,
  },
  { key: 'nom', label: 'Libelle', render: (row) => <span className="font-bold text-slate-900">{row.nom}</span> },
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

const ArticleBudgetaireScreen = () => (
  <ReferentielCrud
    title="Articles budgetaires"
    subtitle="Referentiel des articles utilises pour imputer les titres"
    icon={<FaBook size={19} />}
    service={articleService}
    fields={fields}
    columns={columns}
    searchPlaceholder="Rechercher un code ou un libelle..."
    emptyLabel="Aucun article budgetaire trouve"
    labelSingular="article budgetaire"
  />
);

export default ArticleBudgetaireScreen;
