<?php

namespace App\Models;

/**
 * Alias de compatibilite : une declaration de l'ancienne API est une archive.
 */
class Declaration extends Archive
{
    protected $table = 'archives';
}
