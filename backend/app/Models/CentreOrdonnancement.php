<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CentreOrdonnancement extends Model
{
    use HasFactory;

    protected $table = 'centre_ordonnancements';

    protected $fillable = [
        'id_direction',
        'code',
        'nom',
        'description',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
    ];

    protected $appends = ['id_ministere'];

    public function direction()
    {
        return $this->belongsTo(Direction::class, 'id_direction');
    }

    public function titres()
    {
        return $this->hasMany(TitrePerception::class, 'id_centre_ordonnancement');
    }

    public function notes()
    {
        return $this->hasMany(NotePerception::class, 'id_centre_ordonnancement');
    }

    public function getIdMinistereAttribute()
    {
        return $this->id_direction;
    }

    public function setIdMinistereAttribute($value): void
    {
        $this->attributes['id_direction'] = $value;
    }
}
