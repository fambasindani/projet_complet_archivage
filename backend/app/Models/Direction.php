<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Direction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'sigle',
        'nom',
        'description',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
    ];

    public function divisions()
    {
        return $this->hasMany(Division::class, 'id_direction');
    }

    public function centres()
    {
        return $this->hasMany(CentreOrdonnancement::class, 'id_direction');
    }

    public function users()
    {
        return $this->hasManyThrough(User::class, Division::class, 'id_direction', 'id_division', 'id', 'id');
    }
}
