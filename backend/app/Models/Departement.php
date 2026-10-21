<?php

namespace App\Models;

/**
 * Compatibilite API : l'ancien concept "departement" correspond desormais
 * a une division interne de la DGRAD (table `divisions`).
 */
class Departement extends Division
{
    protected $table = 'divisions';

    protected $appends = ['datecreation'];

    public function getDatecreationAttribute()
    {
        return $this->created_at;
    }

    public function setDatecreationAttribute($value): void
    {
        $this->attributes['created_at'] = $value;
    }

    public function declarations()
    {
        return $this->hasMany(Declaration::class, 'id_division');
    }

    public function getNomDirectionAttribute()
    {
        return $this->direction ? $this->direction->nom : null;
    }
}
