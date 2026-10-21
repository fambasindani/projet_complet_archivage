<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TitrePerception extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'titres_perception';

    protected $fillable = [
        'reference',
        'numero_titre',
        'id_categorie_titre',
        'id_assujetti',
        'id_division',
        'id_centre_ordonnancement',
        'id_article_budgetaire',
        'id_classeur',
        'id_emplacement',
        'reference_dossier',
        'reference_declaration',
        'date_titre',
        'date_enregistrement',
        'date_ordonnancement',
        'montant',
        'devise',
        'objet',
        'observations',
        'statut',
        'id_user_createur',
        'id_user_modificateur',
        'id_user_validateur',
        'date_validation',
        // Compatibilite ancienne API
        'id_ministere',
        'numero_serie',
        'numero_article',
        'id_user',
    ];

    protected $casts = [
        'date_titre' => 'date',
        'date_enregistrement' => 'date',
        'date_ordonnancement' => 'date',
        'date_validation' => 'datetime',
        'montant' => 'decimal:2',
    ];

    protected $appends = [
        'id_ministere',
        'numero_serie',
        'numero_article',
        'id_user',
    ];

    protected static function booted(): void
    {
        static::creating(function (TitrePerception $titre) {
            $next = (int) static::withTrashed()->max('id') + 1;
            if (empty($titre->reference)) {
                $titre->reference = 'TP-' . date('Y') . '-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            }
            if (empty($titre->numero_titre)) {
                $titre->numero_titre = $titre->reference;
            }
            if (empty($titre->date_enregistrement)) {
                $titre->date_enregistrement = now()->toDateString();
            }
            if (empty($titre->statut)) {
                $titre->statut = 'brouillon';
            }
        });
    }

    public function categorie()
    {
        return $this->belongsTo(CategorieTitre::class, 'id_categorie_titre');
    }

    public function categorieTitre()
    {
        return $this->belongsTo(CategorieTitre::class, 'id_categorie_titre');
    }

    public function assujetti()
    {
        return $this->belongsTo(Assujetti::class, 'id_assujetti');
    }

    public function division()
    {
        return $this->belongsTo(Division::class, 'id_division');
    }

    public function centre()
    {
        return $this->belongsTo(CentreOrdonnancement::class, 'id_centre_ordonnancement');
    }

    public function articleBudgetaire()
    {
        return $this->belongsTo(ArticleBudgetaire::class, 'id_article_budgetaire');
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

    public function validateur()
    {
        return $this->belongsTo(User::class, 'id_user_validateur');
    }

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_user_createur');
    }

    public function motsCles()
    {
        return $this->belongsToMany(MotCle::class, 'titre_mot_cle', 'id_titre', 'id_mot_cle');
    }

    public function fichiers()
    {
        return $this->morphMany(FichierDocument::class, 'entite');
    }

    public function documents()
    {
        return $this->morphMany(FichierDocument::class, 'entite');
    }

    public function setIdMinistereAttribute($value): void
    {
        $this->attributes['id_article_budgetaire'] = $value;
    }

    public function getIdMinistereAttribute()
    {
        return $this->attributes['id_article_budgetaire'] ?? null;
    }

    public function setNumeroSerieAttribute($value): void
    {
        $this->attributes['numero_titre'] = $value;
    }

    public function getNumeroSerieAttribute()
    {
        return $this->attributes['numero_titre'] ?? null;
    }

    public function setNumeroArticleAttribute($value): void
    {
        $this->attributes['reference_declaration'] = $value;
    }

    public function getNumeroArticleAttribute()
    {
        return $this->attributes['reference_declaration'] ?? null;
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
            $this->attributes['statut'] = 'annule';
            return;
        }
        $this->attributes['statut'] = $value;
    }
}
