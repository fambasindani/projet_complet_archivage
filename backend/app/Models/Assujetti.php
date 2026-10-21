<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assujetti extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero_nif',
        'nom_raison_sociale',
        'type_personne',
        'bp',
        'adresse',
        'telephone',
        'email',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
    ];

    public function titres()
    {
        return $this->hasMany(TitrePerception::class, 'id_assujetti');
    }

    public function notes()
    {
        return $this->hasMany(NotePerception::class, 'id_assujetti');
    }
}
