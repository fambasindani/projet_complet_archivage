<?php

namespace App\Models;

/**
 * Alias de compatibilite : une note de perception est un titre de perception.
 */
class NotePerception extends TitrePerception
{
    protected $table = 'titres_perception';
}
