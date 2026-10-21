<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Codes historiques conserves pour le frontend + nouveaux codes metier.
     */
    private array $permissions = [
        'dashboard' => ['dashboard'],
        'configuration' => [
            'configuration', 'utilisateur', 'role', 'permission',
        ],
        'archives' => [
            'archiv_doc', 'acceder_au__document', 'direction', 'classeur', 'emplacement',
            'creer_direction', 'modifier_direction', 'supprimer_direction', 'consulter_direction',
            'creer_classeur', 'modifier_classeur', 'supprimer_classeur', 'consulter_classeur',
            'creer_emplacement', 'modifier_emplacement', 'supprimer_emplacement', 'consulter_emplacement',
            'creer_document', 'modifier_document', 'supprimer_document', 'consulter_document',
            'archives.view', 'archives.create', 'archives.update', 'archives.delete',
        ],
        'titres' => [
            'note_perception', 'acceder_au_note_perception', 'centre', 'serv_assiette',
            'creer_centre', 'modifier_centre', 'supprimer_centre', 'consulter_centre',
            'creer_service_assiette', 'modifier_service_assiette', 'supprimer_service_assiette', 'consulter_service_assiette',
            'creer_note_perception', 'modifier_note_perception', 'supprimer_note_perception', 'consulter_note_perception',
            'creer_assujetti', 'modifier_assujetti', 'supprimer_assujetti', 'consulter_assujetti',
            'creer_article', 'modifier_article', 'supprimer_article', 'consulter_article',
            'titres.view', 'titres.create', 'titres.update', 'titres.delete', 'titres.validate',
            'titres.export',
        ],
        'documents' => [
            'documents.view', 'documents.upload', 'documents.download', 'documents.delete',
            'ocr.view', 'ocr.run',
        ],
        'admin' => [
            'divisions.view', 'divisions.create', 'divisions.update', 'divisions.delete',
            'users.view', 'users.create', 'users.update', 'users.delete',
            'roles.view', 'roles.create', 'roles.update', 'roles.delete',
            'permissions.view', 'permissions.create', 'permissions.update', 'permissions.delete',
            'audit.view',
        ],
        'rapports' => [
            'rapports.view', 'rapports.export',
        ],
    ];

    public function run(): void
    {
        $allIds = [];

        foreach ($this->permissions as $module => $codes) {
            foreach (array_unique($codes) as $code) {
                $permission = Permission::updateOrCreate(
                    ['code' => $code],
                    [
                        'description' => ucwords(str_replace(['.', '_'], ' ', $code)),
                        'module' => $module,
                    ]
                );
                $allIds[] = $permission->id;
            }
        }

        $admin = Role::updateOrCreate(
            ['nom' => 'Admin'],
            ['description' => 'Administrateur complet de la plateforme']
        );
        $admin->permissions()->sync($allIds);

        $archiviste = Role::updateOrCreate(
            ['nom' => 'Archiviste AD'],
            ['description' => 'Gestion de l archivage ordinaire']
        );
        $archiviste->permissions()->sync(
            Permission::whereIn('code', [
                'dashboard', 'configuration', 'archiv_doc', 'acceder_au__document',
                'direction', 'classeur', 'emplacement',
                'creer_direction', 'modifier_direction', 'consulter_direction',
                'creer_classeur', 'modifier_classeur', 'supprimer_classeur', 'consulter_classeur',
                'creer_emplacement', 'modifier_emplacement', 'supprimer_emplacement', 'consulter_emplacement',
                'creer_document', 'modifier_document', 'supprimer_document', 'consulter_document',
                'archives.view', 'archives.create', 'archives.update', 'archives.delete',
                'documents.view', 'documents.upload', 'documents.download', 'documents.delete',
                'ocr.view', 'ocr.run', 'rapports.view',
            ])->pluck('id')->all()
        );

        $gestionnaireTitres = Role::updateOrCreate(
            ['nom' => 'Gestionnaire Titres'],
            ['description' => 'Gestion des titres de perception']
        );
        $gestionnaireTitres->permissions()->sync(
            Permission::whereIn('code', [
                'dashboard', 'note_perception', 'acceder_au_note_perception',
                'centre', 'serv_assiette',
                'creer_centre', 'modifier_centre', 'supprimer_centre', 'consulter_centre',
                'creer_service_assiette', 'modifier_service_assiette', 'supprimer_service_assiette', 'consulter_service_assiette',
                'creer_note_perception', 'modifier_note_perception', 'supprimer_note_perception', 'consulter_note_perception',
                'creer_assujetti', 'modifier_assujetti', 'supprimer_assujetti', 'consulter_assujetti',
                'creer_article', 'modifier_article', 'supprimer_article', 'consulter_article',
                'titres.view', 'titres.create', 'titres.update', 'titres.delete', 'titres.validate', 'titres.export',
                'documents.view', 'documents.upload', 'documents.download', 'documents.delete',
                'ocr.view', 'ocr.run', 'rapports.view',
            ])->pluck('id')->all()
        );

        $this->command?->info(
            'Roles & permissions : ' . count($allIds) . ' permissions, 3 roles.'
        );
    }
}
