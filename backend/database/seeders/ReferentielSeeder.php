<?php

namespace Database\Seeders;

use App\Models\ArticleBudgetaire;
use App\Models\CategorieTitre;
use App\Models\Classeur;
use App\Models\Emplacement;
use App\Models\TypeDocument;
use Illuminate\Database\Seeder;

class ReferentielSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'DECLARATION', 'libelle' => 'Declaration', 'duree_conservation_mois' => 120],
            ['code' => 'COURRIER', 'libelle' => 'Courrier', 'duree_conservation_mois' => 60],
            ['code' => 'RAPPORT', 'libelle' => 'Rapport', 'duree_conservation_mois' => 120],
            ['code' => 'NOTE_SERVICE', 'libelle' => 'Note de service', 'duree_conservation_mois' => 60],
            ['code' => 'PIECE_COMPTABLE', 'libelle' => 'Piece comptable', 'duree_conservation_mois' => 120],
        ];

        foreach ($types as $type) {
            TypeDocument::updateOrCreate(['code' => $type['code']], $type + ['statut' => true]);
        }

        $categories = [
            [
                'code' => 'NOTE_PERCEPTION',
                'libelle' => 'Note de perception',
                'description' => 'Titre individuel rattache a un assujetti.',
                'champs_obligatoires' => ['id_assujetti'],
                'regle_numerotation' => 'TP-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'AVIS_RECOUVREMENT',
                'libelle' => 'Avis de mise en recouvrement',
                'description' => 'Titre individuel de recouvrement.',
                'champs_obligatoires' => ['id_assujetti'],
                'regle_numerotation' => 'AMR-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'AMENDE',
                'libelle' => 'Amende',
                'description' => 'Titre individuel de penalite.',
                'champs_obligatoires' => ['id_assujetti'],
                'regle_numerotation' => 'AMD-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'EXTRAIT_ROLE',
                'libelle' => 'Extrait de role',
                'description' => 'Extrait individualise rattache a un assujetti.',
                'champs_obligatoires' => ['id_assujetti'],
                'regle_numerotation' => 'ER-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'ACQUIS_LIBERATOIRE',
                'libelle' => 'Acquis liberatoire',
                'description' => 'Piece individualisee rattachee a un assujetti.',
                'champs_obligatoires' => ['id_assujetti'],
                'regle_numerotation' => 'AL-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'RESTE_A_RECOUVRER',
                'libelle' => 'Reste a recouvrer',
                'description' => 'Etat general de tous les assujettis redevables.',
                'champs_obligatoires' => [],
                'regle_numerotation' => 'RR-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'EXTRAIT_JOURNALIER',
                'libelle' => 'Extrait journalier',
                'description' => 'Etat general journalier.',
                'champs_obligatoires' => [],
                'regle_numerotation' => 'EJ-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'EXTRAIT_ACTE_SERVICE',
                'libelle' => 'Extrait par acte et service',
                'description' => 'Etat general par acte et service.',
                'champs_obligatoires' => [],
                'regle_numerotation' => 'EAS-{YYYY}-{SEQ}',
            ],
            [
                'code' => 'TABLEAU_RETROCESSION_SERVICE',
                'libelle' => 'Tableau de retrocession par service',
                'description' => 'Etat general de retrocession par service.',
                'champs_obligatoires' => [],
                'regle_numerotation' => 'TRS-{YYYY}-{SEQ}',
            ],
        ];

        foreach ($categories as $categorie) {
            CategorieTitre::updateOrCreate(['code' => $categorie['code']], $categorie + ['statut' => true]);
        }

        $articles = [
            ['article_budgetaire' => '7111', 'nom' => 'Impots directs'],
            ['article_budgetaire' => '7112', 'nom' => 'Impots indirects'],
            ['article_budgetaire' => '7211', 'nom' => 'Taxes administratives'],
            ['article_budgetaire' => '7212', 'nom' => 'Frais de dossier'],
            ['article_budgetaire' => '7311', 'nom' => 'Amendes et penalites'],
        ];

        foreach ($articles as $article) {
            ArticleBudgetaire::updateOrCreate(
                ['article_budgetaire' => $article['article_budgetaire']],
                $article + ['statut' => true]
            );
        }

        $classeurs = [
            ['nom_classeur' => 'Declarations fiscales', 'code' => 'CL-DECL'],
            ['nom_classeur' => 'Titres de perception', 'code' => 'CL-TP'],
            ['nom_classeur' => 'Courriers administratifs', 'code' => 'CL-COUR'],
            ['nom_classeur' => 'Pieces comptables', 'code' => 'CL-COMPTA'],
        ];

        foreach ($classeurs as $classeur) {
            Classeur::updateOrCreate(['nom_classeur' => $classeur['nom_classeur']], $classeur + ['statut' => true]);
        }

        $emplacements = [
            ['nom_emplacement' => 'Archives centrales', 'code' => 'EMP-ARCH', 'batiment' => 'Batiment A', 'salle' => 'Salle 01'],
            ['nom_emplacement' => 'Bureau DANTIC', 'code' => 'EMP-DANTIC', 'batiment' => 'Batiment B', 'salle' => 'Salle 12'],
            ['nom_emplacement' => 'Bureau DPFC', 'code' => 'EMP-DPFC', 'batiment' => 'Batiment C', 'salle' => 'Salle 05'],
        ];

        foreach ($emplacements as $emplacement) {
            Emplacement::updateOrCreate(
                ['nom_emplacement' => $emplacement['nom_emplacement']],
                $emplacement + ['statut' => true]
            );
        }

        $this->command?->info('Referentiels seedes.');
    }
}
