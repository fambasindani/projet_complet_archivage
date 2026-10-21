<?php

namespace Database\Seeders;

use App\Models\CentreOrdonnancement;
use App\Models\Direction;
use App\Models\Division;
use Illuminate\Database\Seeder;

class OrganisationSeeder extends Seeder
{
    public function run(): void
    {
        $directions = [
            [
                'code' => 'DG', 'sigle' => 'DG', 'nom' => 'Direction Generale',
                'divisions' => [
                    ['code' => 'DG-SEC', 'sigle' => 'SEC', 'nom' => 'Secretariat de la Direction Generale'],
                ],
            ],
            [
                'code' => 'DRH', 'sigle' => 'DRH', 'nom' => 'Direction des Ressources Humaines',
                'divisions' => [
                    ['code' => 'DRH-ADM', 'sigle' => 'ADM', 'nom' => 'Division Administrative'],
                    ['code' => 'DRH-FP', 'sigle' => 'FP', 'nom' => 'Division de la Formation Professionnelle'],
                ],
            ],
            [
                'code' => 'DAF', 'sigle' => 'DAF', 'nom' => 'Direction Administrative et Financiere',
                'divisions' => [
                    ['code' => 'DAF-FIN', 'sigle' => 'FIN', 'nom' => 'Division Financiere'],
                    ['code' => 'DAF-BUD', 'sigle' => 'BUD', 'nom' => 'Division Budgetaire'],
                ],
            ],
            [
                'code' => 'DANTIC', 'sigle' => 'DANTIC', 'nom' => 'Direction des Archives et des Nouvelles Technologies',
                'divisions' => [
                    ['code' => 'DANTIC-ARC', 'sigle' => 'ARC', 'nom' => 'Division des Archives'],
                    ['code' => 'DANTIC-INFO', 'sigle' => 'INFO', 'nom' => 'Division Informatique'],
                ],
            ],
            [
                'code' => 'DPFC', 'sigle' => 'DPFC', 'nom' => 'Direction de la Perception et du Foncage',
                'divisions' => [
                    ['code' => 'DPFC-TP', 'sigle' => 'TP', 'nom' => 'Division des Titres de Perception'],
                    ['code' => 'DPFC-REC', 'sigle' => 'REC', 'nom' => 'Division du Recouvrement'],
                ],
            ],
        ];

        foreach ($directions as $data) {
            $direction = Direction::updateOrCreate(
                ['code' => $data['code']],
                [
                    'sigle' => $data['sigle'],
                    'nom' => $data['nom'],
                    'statut' => true,
                ]
            );

            foreach ($data['divisions'] as $divisionData) {
                Division::updateOrCreate(
                    ['code' => $divisionData['code']],
                    [
                        'id_direction' => $direction->id,
                        'sigle' => $divisionData['sigle'],
                        'nom' => $divisionData['nom'],
                        'statut' => true,
                    ]
                );
            }
        }

        $dantic = Direction::where('code', 'DANTIC')->first();
        $dpfc = Direction::where('code', 'DPFC')->first();

        if ($dantic) {
            CentreOrdonnancement::updateOrCreate(
                ['nom' => 'Centre d ordonnancement DANTIC'],
                ['id_direction' => $dantic->id, 'code' => 'CO-DANTIC', 'statut' => true]
            );
        }
        if ($dpfc) {
            CentreOrdonnancement::updateOrCreate(
                ['nom' => 'Centre d ordonnancement DPFC'],
                ['id_direction' => $dpfc->id, 'code' => 'CO-DPFC', 'statut' => true]
            );
        }

        $this->command?->info('Organisation DGRAD seedee.');
    }
}
