<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $division = Division::where('code', 'DANTIC-ARC')->first()
            ?? Division::first();

        if (!$division) {
            $this->command?->warn('Aucune division disponible : admin non cree.');
            return;
        }

        $admin = User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@dgrad.cd')],
            [
                'nom' => 'Administrateur',
                'prenom' => 'DGRAD',
                'password' => Hash::make(env('ADMIN_PASSWORD', '12345678')),
                'statut' => 'active',
                'id_division' => $division->id,
                'matricule' => 'ADMIN001',
                'email_verified_at' => now(),
            ]
        );

        $role = Role::where('nom', 'Admin')->first();
        if ($role) {
            $admin->roles()->syncWithoutDetaching([$role->id]);
        }

        $this->command?->info("Admin : {$admin->email} / mot de passe : " . env('ADMIN_PASSWORD', '12345678'));
    }
}
