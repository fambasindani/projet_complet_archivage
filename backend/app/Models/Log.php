<?php

namespace App\Models;

/**
 * Alias de compatibilite : la table `logs` devient `audit_logs`.
 */
class Log extends AuditLog
{
    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'id_division',
        'action',
        'entite',
        'entite_id',
        'description',
        'valeurs_avant',
        'valeurs_apres',
        'ip_address',
        'user_agent',
        'created_at',
        // Compatibilite ancienne API
        'table_name',
        'record_id',
    ];

    protected $appends = ['table_name', 'record_id'];

    public function setTableNameAttribute($value): void
    {
        $this->attributes['entite'] = $value;
    }

    public function getTableNameAttribute()
    {
        return $this->attributes['entite'] ?? null;
    }

    public function setRecordIdAttribute($value): void
    {
        $this->attributes['entite_id'] = $value;
    }

    public function getRecordIdAttribute()
    {
        return $this->attributes['entite_id'] ?? null;
    }
}
