<?php

namespace App\Models;

/**
 * Alias de compatibilite : l'unique modele d'authentification est desormais User.
 */
class MonUtilisateur extends User
{
    protected $table = 'users';
}
