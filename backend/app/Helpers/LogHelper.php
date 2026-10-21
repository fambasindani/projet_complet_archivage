<?php

namespace App\Helpers;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogHelper
{
    public static function log(
        string $action,
        string $entite,
        ?int $entiteId = null,
        ?string $description = null,
        ?array $valeursAvant = null,
        ?array $valeursApres = null
    ): AuditLog {
        $user = Auth::user();

        return AuditLog::create([
            'user_id' => $user?->id,
            'id_division' => $user?->id_division,
            'action' => $action,
            'entite' => $entite,
            'entite_id' => $entiteId,
            'description' => $description,
            'valeurs_avant' => $valeursAvant,
            'valeurs_apres' => $valeursApres,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    public static function create(string $entite, ?int $entiteId = null, ?string $description = null, ?array $valeursApres = null): AuditLog
    {
        return self::log('CREATE', $entite, $entiteId, $description, null, $valeursApres);
    }

    public static function update(string $entite, ?int $entiteId = null, ?string $description = null, ?array $valeursAvant = null, ?array $valeursApres = null): AuditLog
    {
        return self::log('UPDATE', $entite, $entiteId, $description, $valeursAvant, $valeursApres);
    }

    public static function delete(string $entite, ?int $entiteId = null, ?string $description = null, ?array $valeursAvant = null): AuditLog
    {
        return self::log('DELETE', $entite, $entiteId, $description, $valeursAvant, null);
    }

    public static function login(?string $description = null): AuditLog
    {
        return self::log('LOGIN', 'users', Auth::id(), $description ?? 'Connexion reussie');
    }

    public static function logout(?string $description = null): AuditLog
    {
        return self::log('LOGOUT', 'users', Auth::id(), $description ?? 'Deconnexion');
    }
}
