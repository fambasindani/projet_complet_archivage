<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'acces_direction')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('acces_direction')
                    ->default(false)
                    ->after('id_division')
                    ->comment('Acces a toutes les divisions de la direction');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'acces_direction')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('acces_direction');
            });
        }
    }
};
