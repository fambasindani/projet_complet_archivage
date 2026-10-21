<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classeur extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom_classeur',
        'code',
        'description',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
    ];

    public function archives()
    {
        return $this->hasMany(Archive::class, 'id_classeur');
    }

    public function titres()
    {
        return $this->hasMany(TitrePerception::class, 'id_classeur');
    }

    public function declarations()
    {
        return $this->hasMany(Declaration::class, 'id_classeur');
    }
}
