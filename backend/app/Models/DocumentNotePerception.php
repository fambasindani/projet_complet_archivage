<?php

namespace App\Models;

/**
 * Alias de compatibilite : les documents sont desormais stockes dans
 * `fichiers_documents` avec une relation polymorphe.
 */
class DocumentNotePerception extends FichierDocument
{
    protected $table = 'fichiers_documents';

    public function notePerception()
    {
        return $this->belongsTo(NotePerception::class, 'entite_id');
    }
}
