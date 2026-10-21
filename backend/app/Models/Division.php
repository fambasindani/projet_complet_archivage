<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Division extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'id_direction',
        'code',
        'sigle',
        'nom',
        'description',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
    ];

    public function direction()
    {
        return $this->belongsTo(Direction::class, 'id_direction');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'id_division');
    }

    /**
     * Utilisateurs ayant acces a cette division (principale ou secondaire).
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'division_user', 'division_id', 'user_id')
            ->withTimestamps();
    }

    public function archives()
    {
        return $this->hasMany(Archive::class, 'id_division');
    }

    public function declarations()
    {
        return $this->archives();
    }

    public function titres()
    {
        return $this->hasMany(TitrePerception::class, 'id_division');
    }
}
