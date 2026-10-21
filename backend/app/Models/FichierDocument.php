<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FichierDocument extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'fichiers_documents';

    protected $fillable = [
        'entite_type',
        'entite_id',
        'nom_original',
        'nom_stocke',
        'extension',
        'type_mime',
        'taille_octets',
        'chemin_stockage',
        'hash_sha256',
        'id_user_upload',
        // Compatibilite ancienne API
        'id_declaration',
        'id_note_perception',
        'id_classeur',
        'nom_fichier',
        'nom_native',
        'taille',
        'montext',
        'ocr_method',
        'ocr_status',
    ];

    protected $appends = [
        'id_declaration',
        'id_note_perception',
        'id_classeur',
        'nom_fichier',
        'nom_native',
        'taille',
        'montext',
        'ocr_status',
        'ocr_method',
    ];

    protected array $pendingOcr = [];

    public function entite()
    {
        return $this->morphTo('entite', 'entite_type', 'entite_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'id_user_upload');
    }

    public function traitementsOcr()
    {
        return $this->hasMany(TraitementOcr::class, 'id_fichier');
    }

    public function ocr()
    {
        return $this->hasOne(TraitementOcr::class, 'id_fichier')->latestOfMany();
    }

    protected static function booted(): void
    {
        static::created(function (FichierDocument $fichier) {
            TraitementOcr::firstOrCreate(
                ['id_fichier' => $fichier->id],
                ['statut' => 'en_attente']
            );
        });

        static::saved(function (FichierDocument $fichier) {
            $fichier->syncPendingOcr();
        });
    }

    public function syncPendingOcr(): void
    {
        if (empty($this->pendingOcr)) {
            return;
        }

        $ocr = $this->traitementsOcr()->latest('id')->first();
        if (!$ocr) {
            $ocr = new TraitementOcr([
                'id_fichier' => $this->id,
                'statut' => 'en_attente',
            ]);
        }

        if (array_key_exists('montext', $this->pendingOcr)) {
            $ocr->texte_extrait = $this->pendingOcr['montext'];
            if ($ocr->statut === 'en_attente') {
                $ocr->statut = 'termine';
            }
        }
        if (array_key_exists('ocr_status', $this->pendingOcr)) {
            $map = [
                'pending' => 'en_attente',
                'processing' => 'en_cours',
                'completed' => 'termine',
                'failed' => 'erreur',
            ];
            $ocr->statut = $map[$this->pendingOcr['ocr_status']] ?? $this->pendingOcr['ocr_status'];
        }
        if (array_key_exists('ocr_method', $this->pendingOcr)) {
            $ocr->moteur = $this->pendingOcr['ocr_method'];
        }

        $ocr->save();
        $this->pendingOcr = [];
    }

    public function setIdDeclarationAttribute($value): void
    {
        $this->attributes['entite_type'] = 'archive';
        $this->attributes['entite_id'] = $value;
    }

    public function getIdDeclarationAttribute()
    {
        return $this->attributes['entite_type'] === 'archive'
            ? ($this->attributes['entite_id'] ?? null)
            : null;
    }

    public function setIdNotePerceptionAttribute($value): void
    {
        $this->attributes['entite_type'] = 'titre_perception';
        $this->attributes['entite_id'] = $value;
    }

    public function getIdNotePerceptionAttribute()
    {
        return $this->attributes['entite_type'] === 'titre_perception'
            ? ($this->attributes['entite_id'] ?? null)
            : null;
    }

    public function setIdClasseurAttribute($value): void
    {
        // Le classeur est porte par l'entite (archive ou titre).
    }

    public function getIdClasseurAttribute()
    {
        $entite = $this->entite;

        return $entite ? $entite->id_classeur : null;
    }

    public function setNomFichierAttribute($value): void
    {
        $this->attributes['nom_stocke'] = $value;
    }

    public function getNomFichierAttribute()
    {
        return $this->attributes['nom_stocke'] ?? null;
    }

    public function setNomNativeAttribute($value): void
    {
        $this->attributes['nom_original'] = $value;
    }

    public function getNomNativeAttribute()
    {
        return $this->attributes['nom_original'] ?? null;
    }

    public function setTailleAttribute($value): void
    {
        $this->attributes['taille_octets'] = $value;
    }

    public function getTailleAttribute()
    {
        return $this->attributes['taille_octets'] ?? 0;
    }

    public function setMontextAttribute($value): void
    {
        $this->pendingOcr['montext'] = $value;
    }

    public function getMontextAttribute()
    {
        $ocr = $this->relationLoaded('ocr') ? $this->ocr : $this->ocr()->first();

        return $ocr ? $ocr->texte_extrait : null;
    }

    public function setOcrStatusAttribute($value): void
    {
        $this->pendingOcr['ocr_status'] = $value;
    }

    public function getOcrStatusAttribute()
    {
        $ocr = $this->relationLoaded('ocr') ? $this->ocr : $this->ocr()->first();

        return $ocr ? $ocr->statut : null;
    }

    public function setOcrMethodAttribute($value): void
    {
        $this->pendingOcr['ocr_method'] = $value;
    }

    public function getOcrMethodAttribute()
    {
        $ocr = $this->relationLoaded('ocr') ? $this->ocr : $this->ocr()->first();

        return $ocr ? $ocr->moteur : null;
    }

    public function getFileUrlAttribute(): string
    {
        if (str_starts_with((string) $this->chemin_stockage, 'http')) {
            return $this->chemin_stockage;
        }

        return asset('storage/' . ltrim((string) $this->chemin_stockage, '/'));
    }
}
