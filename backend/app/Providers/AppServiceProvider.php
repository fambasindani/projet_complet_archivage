<?php

namespace App\Providers;

use App\Models\Archive;
use App\Models\TitrePerception;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Relation::morphMap([
            'archive' => Archive::class,
            'titre_perception' => TitrePerception::class,
        ]);
    }
}
