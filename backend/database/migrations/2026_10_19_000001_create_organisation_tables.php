<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('directions', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('sigle', 20)->unique();
            $table->string('nom', 255);
            $table->text('description')->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('divisions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_direction');
            $table->string('code', 20)->unique();
            $table->string('sigle', 20)->unique();
            $table->string('nom', 255);
            $table->text('description')->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('id_direction');
            $table->foreign('id_direction')
                ->references('id')->on('directions')
                ->restrictOnDelete()->cascadeOnUpdate();
        });

        Schema::create('centre_ordonnancements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_direction')->nullable();
            $table->string('code', 20)->nullable();
            $table->string('nom', 255);
            $table->string('description', 255)->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();

            $table->index('id_direction');
            $table->foreign('id_direction')
                ->references('id')->on('directions')
                ->nullOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('centre_ordonnancements');
        Schema::dropIfExists('divisions');
        Schema::dropIfExists('directions');
    }
};
