<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TraitementOcr extends Model
{
    use HasFactory;

    protected $table = 'traitements_ocr';

    protected $fillable = [
        'id_fichier',
        'statut',
        'moteur',
        'texte_extrait',
        'message_erreur',
        'date_debut',
        'date_fin',
        'tentatives',
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'tentatives' => 'integer',
    ];

    public function fichier()
    {
        return $this->belongsTo(FichierDocument::class, 'id_fichier');
    }
}
