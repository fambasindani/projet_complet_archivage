<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archives', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 100)->unique();
            $table->string('titre', 255);
            $table->text('objet')->nullable();
            $table->unsignedBigInteger('id_type_document')->nullable();
            $table->unsignedBigInteger('id_division')->nullable();
            $table->unsignedBigInteger('id_classeur')->nullable();
            $table->unsignedBigInteger('id_emplacement')->nullable();
            $table->date('date_document')->nullable();
            $table->date('date_enregistrement');
            $table->string('numero_dossier', 100)->nullable();
            $table->enum('statut', ['brouillon', 'actif', 'archive', 'inactif'])->default('actif');
            $table->unsignedBigInteger('id_user_createur')->nullable();
            $table->unsignedBigInteger('id_user_modificateur')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('id_type_document');
            $table->index('id_division');
            $table->index('id_classeur');
            $table->index('id_emplacement');
            $table->index('date_document');
            $table->index('statut');

            $table->foreign('id_type_document')->references('id')->on('types_documents')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_division')->references('id')->on('divisions')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_classeur')->references('id')->on('classeurs')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_emplacement')->references('id')->on('emplacements')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_user_createur')->references('id')->on('users')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('id_user_modificateur')->references('id')->on('users')->nullOnDelete()->cascadeOnUpdate();
        });

        Schema::create('archive_mot_cle', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_archive');
            $table->unsignedBigInteger('id_mot_cle');

            $table->unique(['id_archive', 'id_mot_cle']);
            $table->index('id_mot_cle');
            $table->foreign('id_archive')->references('id')->on('archives')->cascadeOnDelete();
            $table->foreign('id_mot_cle')->references('id')->on('mots_cles')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archive_mot_cle');
        Schema::dropIfExists('archives');
    }
};
