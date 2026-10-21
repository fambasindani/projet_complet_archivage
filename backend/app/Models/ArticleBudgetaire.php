<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticleBudgetaire extends Model
{
    use HasFactory;

    protected $table = 'articles_budgetaires';

    protected $fillable = [
        'article_budgetaire',
        'nom',
        'statut',
    ];

    protected $casts = [
        'statut' => 'boolean',
    ];

    public function titres()
    {
        return $this->hasMany(TitrePerception::class, 'id_article_budgetaire');
    }
}
