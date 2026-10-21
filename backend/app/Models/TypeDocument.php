<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeDocument extends Model
{
    use HasFactory;

    protected $table = 'types_documents';

    protected $fillable = [
        'code',
        'libelle',
        'description',
        'duree_conservation_mois',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
        'duree_conservation_mois' => 'integer',
    ];

    public function archives()
    {
        return $this->hasMany(Archive::class, 'id_type_document');
    }
}
