<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('titres_perception', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 100)->unique();
            $table->string('numero_titre', 100)->nullable()->unique();
            $table->unsignedBigInteger('id_categorie_titre');
            $table->unsignedBigInteger('id_assujetti')->nullable();
            $table->unsignedBigInteger('id_division')->nullable();
            $table->unsignedBigInteger('id_centre_ordonnancement')->nullable();
            $table->unsignedBigInteger('id_article_budgetaire')->nullable();
            $table->unsignedBigInteger('id_classeur')->nullable();
            $table->unsignedBigInteger('id_emplacement')->nullable();
            $table->string('reference_dossier', 100)->nullable();
            $table->string('reference_declaration', 100)->nullable();
            $table->date('date_titre')->nullable();
            $table->date('date_enregistrement');
            $table->date('date_ordonnancement')->nullable();
            $table->decimal('montant', 18, 2)->nullable();
            $table->string('devise', 10)->nullable()->default('CDF');
            $table->text('objet')->nullable();
            $table->text('observations')->nullable();
            $table->enum('statut', ['brouillon', 'actif', 'archive', 'annule'])->default('brouillon');
            $table->unsignedBigInteger('id_user_createur')->nullable();
            $table->unsignedBigInteger('id_user_modificateur')->nullable();
            $table->unsignedBigInteger('id_user_validateur')->nullable();
            $table->timestamp('date_validation')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('id_categorie_titre');
            $table->index('id_assujetti');
            $table->index('id_division');
            $table->index('id_centre_ordonnancement');
            $table->index('id_article_budgetaire');
            $table->index('id_classeur');
            $table->index('id_emplacement');
            $table->index('date_titre');
            $table->index('statut');

            $table->foreign('id_categorie_titre')->references('id')->on('categories_titres')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('id_assujetti')->references('id')->on('assujettis')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_division')->references('id')->on('divisions')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_centre_ordonnancement')->references('id')->on('centre_ordonnancements')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_article_budgetaire')->references('id')->on('articles_budgetaires')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_classeur')->references('id')->on('classeurs')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_emplacement')->references('id')->on('emplacements')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_user_createur')->references('id')->on('users')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_user_modificateur')->references('id')->on('users')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_user_validateur')->references('id')->on('users')->nullOnDelete()->cascadeOnUpdate();
        });

        Schema::create('titre_mot_cle', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_titre');
            $table->unsignedBigInteger('id_mot_cle');

            $table->unique(['id_titre', 'id_mot_cle']);
            $table->index('id_mot_cle');
            $table->foreign('id_titre')->references('id')->on('titres_perception')->cascadeOnDelete();
            $table->foreign('id_mot_cle')->references('id')->on('mots_cles')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('titre_mot_cle');
        Schema::dropIfExists('titres_perception');
    }
};
