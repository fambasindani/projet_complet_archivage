<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';

    public $timestamps = false;

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
    ];

    protected $casts = [
        'valeurs_avant' => 'array',
        'valeurs_apres' => 'array',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (AuditLog $log) {
            if (empty($log->created_at)) {
                $log->created_at = now();
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function division()
    {
        return $this->belongsTo(Division::class, 'id_division');
    }
}
