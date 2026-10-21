<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Archive extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'archives';

    protected $fillable = [
        'reference',
        'titre',
        'objet',
        'id_type_document',
        'id_division',
        'id_classeur',
        'id_emplacement',
        'date_document',
        'date_enregistrement',
        'numero_dossier',
        'statut',
        'id_user_createur',
        'id_user_modificateur',
        // Compatibilite ancienne API
        'id_direction',
        'date_creation',
        'intitule',
        'num_reference',
        'mot_cle',
        'num_declaration',
        'id_user',
    ];

    protected $casts = [
        'date_document' => 'date',
        'date_enregistrement' => 'date',
    ];

    protected $appends = [
        'id_direction',
        'date_creation',
        'intitule',
        'num_reference',
        'mot_cle',
        'num_declaration',
        'id_user',
    ];

    protected static function booted(): void
    {
        static::creating(function (Archive $archive) {
            if (empty($archive->reference)) {
                $next = (int) static::withTrashed()->max('id') + 1;
                $archive->reference = 'ARC-' . date('Y') . '-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            }
            if (empty($archive->date_enregistrement)) {
                $archive->date_enregistrement = now()->toDateString();
            }
            if (empty($archive->statut)) {
                $archive->statut = 'actif';
            }
        });
    }

    public function typeDocument()
    {
        return $this->belongsTo(TypeDocument::class, 'id_type_document');
    }

    public function division()
    {
        return $this->belongsTo(Division::class, 'id_division');
    }

    public function departement()
    {
        return $this->belongsTo(Division::class, 'id_division');
    }

    public function classeur()
    {
        return $this->belongsTo(Classeur::class, 'id_classeur');
    }

    public function emplacement()
    {
        return $this->belongsTo(Emplacement::class, 'id_emplacement');
    }

    public function createur()
    {
        return $this->belongsTo(User::class, 'id_user_createur');
    }

    public function modificateur()
    {
        return $this->belongsTo(User::class, 'id_user_modificateur');
    }

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_user_createur');
    }

    public function motsCles()
    {
        return $this->belongsToMany(MotCle::class, 'archive_mot_cle', 'id_archive', 'id_mot_cle');
    }

    public function fichiers()
    {
        return $this->morphMany(FichierDocument::class, 'entite');
    }

    public function documents()
    {
        return $this->morphMany(FichierDocument::class, 'entite');
    }

    public function setIdDirectionAttribute($value): void
    {
        $this->attributes['id_division'] = $value;
    }

    public function getIdDirectionAttribute()
    {
        return $this->attributes['id_division'] ?? null;
    }

    public function setDateCreationAttribute($value): void
    {
        $this->attributes['date_document'] = $value;
    }

    public function getDateCreationAttribute()
    {
        return $this->date_document;
    }

    public function setIntituleAttribute($value): void
    {
        $this->attributes['titre'] = $value;
    }

    public function getIntituleAttribute()
    {
        return $this->attributes['titre'] ?? null;
    }

    public function setNumReferenceAttribute($value): void
    {
        $this->attributes['reference'] = $value;
    }

    public function getNumReferenceAttribute()
    {
        return $this->attributes['reference'] ?? null;
    }

    public function setMotCleAttribute($value): void
    {
        $this->attributes['objet'] = $value;
    }

    public function getMotCleAttribute()
    {
        return $this->attributes['objet'] ?? null;
    }

    public function setNumDeclarationAttribute($value): void
    {
        $this->attributes['numero_dossier'] = $value;
    }

    public function getNumDeclarationAttribute()
    {
        return $this->attributes['numero_dossier'] ?? null;
    }

    public function setIdUserAttribute($value): void
    {
        $this->attributes['id_user_createur'] = $value;
    }

    public function getIdUserAttribute()
    {
        return $this->attributes['id_user_createur'] ?? null;
    }

    public function setStatutAttribute($value): void
    {
        if ($value === true || $value === 1 || $value === '1') {
            $this->attributes['statut'] = 'actif';
            return;
        }
        if ($value === false || $value === 0 || $value === '0') {
            $this->attributes['statut'] = 'inactif';
            return;
        }
        $this->attributes['statut'] = $value;
    }
}
