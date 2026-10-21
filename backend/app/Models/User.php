<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'matricule',
        'telephone',
        'avatar',
        'statut',
        'id_division',
        'acces_direction',
        'derniere_connexion',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'derniere_connexion' => 'datetime',
        'acces_direction' => 'boolean',
    ];

    protected $appends = ['full_name', 'datecreation', 'dernierconnection'];

    protected static function booted(): void
    {
        static::saved(function (User $user) {
            if ($user->id_division) {
                $user->divisions()->syncWithoutDetaching([$user->id_division]);
            }
        });
    }

    public function division()
    {
        return $this->belongsTo(Division::class, 'id_division');
    }

    /**
     * Divisions accessibles en plus de la division principale.
     * Permet notamment aux directeurs de consulter plusieurs divisions.
     */
    public function divisions()
    {
        return $this->belongsToMany(Division::class, 'division_user', 'user_id', 'division_id')
            ->withTimestamps();
    }

    public function accessibleDivisionIds(): array
    {
        $ids = $this->divisions()->pluck('divisions.id')->all();

        if ($this->id_division) {
            $ids[] = (int) $this->id_division;

            if ($this->acces_direction) {
                $directionId = Division::whereKey($this->id_division)->value('id_direction');

                if ($directionId) {
                    $ids = array_merge(
                        $ids,
                        Division::where('id_direction', $directionId)->pluck('id')->all()
                    );
                }
            }
        }

        return array_values(array_unique(array_map('intval', $ids)));
    }

    public function canAccessDivision($divisionId): bool
    {
        if ($this->hasRole('Admin')) {
            return true;
        }

        return in_array((int) $divisionId, $this->accessibleDivisionIds(), true);
    }

    public function hasGlobalDivisionAccess(): bool
    {
        return $this->hasRole('Admin');
    }

    /**
     * Compatibilite API : un utilisateur appartient a une seule division,
     * mais les anciens endpoints attendent une collection "departements".
     */
    public function departements()
    {
        return $this->hasMany(Division::class, 'id', 'id_division');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_role', 'user_id', 'role_id');
    }

    public function archivesCrees()
    {
        return $this->hasMany(Archive::class, 'id_user_createur');
    }

    public function titresCrees()
    {
        return $this->hasMany(TitrePerception::class, 'id_user_createur');
    }

    public function titresValides()
    {
        return $this->hasMany(TitrePerception::class, 'id_user_validateur');
    }

    public function fichiers()
    {
        return $this->hasMany(FichierDocument::class, 'id_user_upload');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    public function getFullNameAttribute()
    {
        return trim($this->prenom . ' ' . $this->nom);
    }

    public function getInitialesAttribute()
    {
        return strtoupper(mb_substr($this->prenom ?? '', 0, 1) . mb_substr($this->nom ?? '', 0, 1));
    }

    public function getDatecreationAttribute()
    {
        return $this->created_at;
    }

    public function setDatecreationAttribute($value): void
    {
        $this->attributes['created_at'] = $value;
    }

    public function getDernierconnectionAttribute()
    {
        return $this->derniere_connexion;
    }

    public function setDernierconnectionAttribute($value): void
    {
        $this->attributes['derniere_connexion'] = $value;
    }

    public function setStatutAttribute($value): void
    {
        $normalized = strtolower((string) $value);
        if (in_array($normalized, ['bloque', 'bloqué', 'bloquǸ'], true)) {
            $normalized = 'bloque';
        }
        $this->attributes['statut'] = $normalized;
    }

    public function getPrincipalDepartementAttribute()
    {
        return $this->division;
    }

    public function getDepartementsSiglesAttribute()
    {
        return $this->departements->pluck('sigle')->implode(', ');
    }

    public function scopeActive($query)
    {
        return $query->where('statut', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('statut', 'inactive');
    }

    public function scopeBlocked($query)
    {
        return $query->where('statut', 'bloque');
    }

    public function scopeByDepartement($query, $departementId)
    {
        return $query->where('id_division', $departementId);
    }

    public function hasPermission($permissionCode)
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionCode) {
                $query->where('code', $permissionCode);
            })
            ->exists();
    }

    public function hasAnyPermission(array $permissions)
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissions) {
                $query->whereIn('code', $permissions);
            })
            ->exists();
    }

    public function hasAllPermissions(array $permissions)
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }

        return true;
    }

    public function getAllPermissions()
    {
        return $this->roles()
            ->with('permissions')
            ->get()
            ->pluck('permissions')
            ->flatten()
            ->unique('id')
            ->values();
    }

    public function getAllPermissionCodes()
    {
        return $this->getAllPermissions()->pluck('code')->toArray();
    }

    public function hasRole($roleName)
    {
        return $this->roles()->where('nom', $roleName)->exists();
    }

    public function estDansDepartement($departementId)
    {
        return (int) $this->id_division === (int) $departementId;
    }
}
