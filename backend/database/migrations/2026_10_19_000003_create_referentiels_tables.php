<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classeurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom_classeur', 255)->unique();
            $table->string('code', 50)->nullable();
            $table->text('description')->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();
        });

        Schema::create('emplacements', function (Blueprint $table) {
            $table->id();
            $table->string('nom_emplacement', 255)->unique();
            $table->string('code', 50)->nullable();
            $table->string('batiment', 100)->nullable();
            $table->string('salle', 100)->nullable();
            $table->string('etagere', 100)->nullable();
            $table->text('description')->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();
        });

        Schema::create('assujettis', function (Blueprint $table) {
            $table->id();
            $table->string('numero_nif', 255)->nullable();
            $table->string('nom_raison_sociale', 255);
            $table->enum('type_personne', ['physique', 'morale'])->nullable();
            $table->string('bp', 255)->nullable();
            $table->text('adresse')->nullable();
            $table->string('telephone', 50)->nullable();
            $table->string('email', 255)->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();

            $table->index('numero_nif');
            $table->index('nom_raison_sociale');
        });

        Schema::create('types_documents', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('libelle', 255);
            $table->text('description')->nullable();
            $table->integer('duree_conservation_mois')->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();
        });

        Schema::create('categories_titres', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('libelle', 255);
            $table->text('description')->nullable();
            $table->json('champs_obligatoires')->nullable();
            $table->string('regle_numerotation', 255)->nullable();
            $table->boolean('statut')->default(true);
            $table->timestamps();
        });

        Schema::create('articles_budgetaires', function (Blueprint $table) {
            $table->id();
            $table->string('article_budgetaire', 255)->unique();
            $table->string('nom', 255);
            $table->boolean('statut')->default(true);
            $table->timestamps();
        });

        Schema::create('mots_cles', function (Blueprint $table) {
            $table->id();
            $table->string('libelle', 100)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mots_cles');
        Schema::dropIfExists('articles_budgetaires');
        Schema::dropIfExists('categories_titres');
        Schema::dropIfExists('types_documents');
        Schema::dropIfExists('assujettis');
        Schema::dropIfExists('emplacements');
        Schema::dropIfExists('classeurs');
    }
};
