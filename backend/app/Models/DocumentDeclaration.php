<?php

namespace App\Models;

/**
 * Alias de compatibilite : les documents sont desormais stockes dans
 * `fichiers_documents` avec une relation polymorphe.
 */
class DocumentDeclaration extends FichierDocument
{
    protected $table = 'fichiers_documents';

    public function declaration()
    {
        return $this->belongsTo(Declaration::class, 'entite_id');
    }
}
