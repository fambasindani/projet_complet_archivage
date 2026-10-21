<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MotCle extends Model
{
    use HasFactory;

    protected $table = 'mots_cles';

    protected $fillable = ['libelle'];

    public function archives()
    {
        return $this->belongsToMany(Archive::class, 'archive_mot_cle', 'id_mot_cle', 'id_archive');
    }

    public function titres()
    {
        return $this->belongsToMany(TitrePerception::class, 'titre_mot_cle', 'id_mot_cle', 'id_titre');
    }
}
