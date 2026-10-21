<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            OrganisationSeeder::class,
            RolesAndPermissionsSeeder::class,
            ReferentielSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
