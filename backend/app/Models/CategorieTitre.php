<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategorieTitre extends Model
{
    use HasFactory;

    protected $table = 'categories_titres';

    protected $fillable = [
        'code',
        'libelle',
        'description',
        'champs_obligatoires',
        'regle_numerotation',
        'statut',
    ];

    protected $casts = [
        'champs_obligatoires' => 'array',
        'statut' => 'boolean',
    ];

    public function titres()
    {
        return $this->hasMany(TitrePerception::class, 'id_categorie_titre');
    }
}
