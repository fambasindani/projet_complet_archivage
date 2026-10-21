<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fichiers_documents', function (Blueprint $table) {
            $table->id();
            $table->enum('entite_type', ['archive', 'titre_perception']);
            $table->unsignedBigInteger('entite_id');
            $table->string('nom_original', 255);
            $table->string('nom_stocke', 255)->unique();
            $table->string('extension', 10);
            $table->string('type_mime', 100);
            $table->unsignedBigInteger('taille_octets')->default(0);
            $table->string('chemin_stockage', 500);
            $table->char('hash_sha256', 64)->nullable();
            $table->unsignedBigInteger('id_user_upload')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['entite_type', 'entite_id']);
            $table->index('hash_sha256');
            $table->foreign('id_user_upload')->references('id')->on('users')->nullOnDelete()->cascadeOnUpdate();
        });

        Schema::create('traitements_ocr', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_fichier');
            $table->enum('statut', ['en_attente', 'en_cours', 'termine', 'erreur'])->default('en_attente');
            $table->string('moteur', 50)->nullable();
            $table->longText('texte_extrait')->nullable();
            $table->text('message_erreur')->nullable();
            $table->timestamp('date_debut')->nullable();
            $table->timestamp('date_fin')->nullable();
            $table->integer('tentatives')->default(0);
            $table->timestamps();

            $table->index('id_fichier');
            $table->index('statut');
            $table->fullText('texte_extrait');
            $table->foreign('id_fichier')->references('id')->on('fichiers_documents')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('traitements_ocr');
        Schema::dropIfExists('fichiers_documents');
    }
};
