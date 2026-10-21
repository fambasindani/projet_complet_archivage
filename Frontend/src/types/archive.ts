// Types miroirs du nouveau schema backend (archives, titres, fichiers, OCR)

export type ArchiveStatut = 'brouillon' | 'actif' | 'archive' | 'inactif';
export type TitreStatut = 'brouillon' | 'actif' | 'archive' | 'annule';
export type OcrStatut = 'en_attente' | 'en_cours' | 'termine' | 'erreur';

export interface TypeDocument {
  id: number;
  code: string;
  libelle: string;
  description?: string | null;
  duree_conservation_mois?: number | null;
  statut: boolean | number;
  archives_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategorieTitre {
  id: number;
  code: string;
  libelle: string;
  description?: string | null;
  champs_obligatoires?: string[] | null;
  regle_numerotation?: string | null;
  statut: boolean | number;
  titres_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MotCle {
  id: number;
  libelle: string;
  created_at?: string;
  updated_at?: string;
}

export interface TraitementOcr {
  id: number;
  id_fichier: number;
  statut: OcrStatut;
  moteur?: string | null;
  texte_extrait?: string | null;
  message_erreur?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  tentatives?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FichierDocument {
  id: number;
  entite_type: 'archive' | 'titre_perception';
  entite_id: number;
  nom_original: string;
  nom_stocke: string;
  extension: string;
  type_mime: string;
  taille_octets: number;
  chemin_stockage: string;
  hash_sha256?: string | null;
  id_user_upload?: number | null;
  montext?: string | null;
  ocr_status?: OcrStatut | null;
  ocr_method?: string | null;
  traitements_ocr?: TraitementOcr[];
  uploader?: { id: number; nom?: string; prenom?: string; full_name?: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface Archive {
  id: number;
  reference: string;
  titre: string;
  objet?: string | null;
  id_type_document?: number | null;
  id_division?: number | null;
  id_classeur?: number | null;
  id_emplacement?: number | null;
  date_document?: string | null;
  date_enregistrement: string;
  numero_dossier?: string | null;
  statut: ArchiveStatut;
  id_user_createur?: number | null;
  id_user_modificateur?: number | null;
  type_document?: TypeDocument | null;
  division?: { id: number; nom: string; sigle: string; direction?: { id: number; nom: string; sigle: string } } | null;
  classeur?: { id: number; nom_classeur: string } | null;
  emplacement?: { id: number; nom_emplacement: string } | null;
  createur?: { id: number; nom?: string; prenom?: string; full_name?: string } | null;
  mots_cles?: MotCle[];
  fichiers?: FichierDocument[];
  fichiers_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TitrePerception {
  id: number;
  reference: string;
  numero_titre?: string | null;
  id_categorie_titre: number;
  id_assujetti?: number | null;
  id_division?: number | null;
  id_centre_ordonnancement?: number | null;
  id_article_budgetaire?: number | null;
  id_classeur?: number | null;
  id_emplacement?: number | null;
  reference_dossier?: string | null;
  reference_declaration?: string | null;
  date_titre?: string | null;
  date_enregistrement: string;
  date_ordonnancement?: string | null;
  montant?: number | string | null;
  devise?: string | null;
  objet?: string | null;
  observations?: string | null;
  statut: TitreStatut;
  id_user_createur?: number | null;
  id_user_modificateur?: number | null;
  id_user_validateur?: number | null;
  date_validation?: string | null;
  categorie_titre?: CategorieTitre | null;
  assujetti?: { id: number; nom_raison_sociale: string; numero_nif?: string | null } | null;
  division?: { id: number; nom: string; sigle: string; direction?: { id: number; nom: string; sigle: string } } | null;
  centre?: { id: number; nom: string } | null;
  article_budgetaire?: { id: number; article_budgetaire: string; nom: string } | null;
  classeur?: { id: number; nom_classeur: string } | null;
  emplacement?: { id: number; nom_emplacement: string } | null;
  createur?: { id: number; nom?: string; prenom?: string; full_name?: string } | null;
  mots_cles?: MotCle[];
  fichiers?: FichierDocument[];
  fichiers_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateArchivePayload = Partial<
  Pick<
    Archive,
    | 'reference'
    | 'titre'
    | 'objet'
    | 'id_type_document'
    | 'id_division'
    | 'id_classeur'
    | 'id_emplacement'
    | 'date_document'
    | 'date_enregistrement'
    | 'numero_dossier'
    | 'statut'
  >
> & {
  titre: string;
  mots_cles?: string[];
  mots_cle_ids?: number[];
};

export type CreateTitrePayload = Partial<
  Pick<
    TitrePerception,
    | 'reference'
    | 'numero_titre'
    | 'id_assujetti'
    | 'id_division'
    | 'id_centre_ordonnancement'
    | 'id_article_budgetaire'
    | 'id_classeur'
    | 'id_emplacement'
    | 'reference_dossier'
    | 'reference_declaration'
    | 'date_titre'
    | 'date_enregistrement'
    | 'date_ordonnancement'
    | 'montant'
    | 'devise'
    | 'objet'
    | 'observations'
    | 'statut'
  >
> & {
  id_categorie_titre: number;
  mots_cles?: string[];
  mots_cle_ids?: number[];
};
