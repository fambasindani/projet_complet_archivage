<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('division_user')) {
            Schema::create('division_user', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('division_id');
                $table->timestamps();

                $table->unique(['user_id', 'division_id']);
                $table->index('division_id');

                $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $table->foreign('division_id')->references('id')->on('divisions')->cascadeOnDelete();
            });
        }

        // Chaque utilisateur conserve sa division principale comme premier acces.
        DB::table('users')
            ->select('id', 'id_division')
            ->whereNotNull('id_division')
            ->orderBy('id')
            ->each(function ($user) {
                DB::table('division_user')->insertOrIgnore([
                    'user_id' => $user->id,
                    'division_id' => $user->id_division,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('division_user');
    }
};
