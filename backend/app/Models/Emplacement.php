<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emplacement extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom_emplacement',
        'code',
        'batiment',
        'salle',
        'etagere',
        'description',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
    ];

    public function archives()
    {
        return $this->hasMany(Archive::class, 'id_emplacement');
    }

    public function titres()
    {
        return $this->hasMany(TitrePerception::class, 'id_emplacement');
    }
}
