<?php

namespace Facepalm\Providers;

use Facepalm\Generators\MigrationCreator;
use Facepalm\Models\Image;
use Illuminate\Support\AggregateServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class GeneratorServiceProvider extends ServiceProvider
{

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('command.facepalm.model', function ($app) {
            return $app['Facepalm\Generators\Commands\ModelMakeCommand'];
        });
        $this->commands('command.facepalm.model');

        $this->app->singleton('command.facepalm.migration', function ($app) {
            return $app['Facepalm\Generators\Commands\MigrateMakeCommand'];
        });
        $this->commands('command.facepalm.migration');
    }
}
