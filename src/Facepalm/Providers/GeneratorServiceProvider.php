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

        $this->app->singleton('command.facepalm.migrationaddfields', function ($app) {
            return $app['Facepalm\Generators\Commands\MigrateAddFieldsCommand'];
        });
        $this->commands('command.facepalm.migrationaddfields');

        $this->app->singleton('command.facepalm.superuser', function ($app) {
            return $app['Facepalm\Generators\Commands\SuperuserCommand'];
        });
        $this->commands('command.facepalm.superuser');

        $this->app->singleton('command.facepalm.resetpassword', function ($app) {
            return $app['Facepalm\Generators\Commands\ResetPasswordCommand'];
        });
        $this->commands('command.facepalm.resetpassword');

        $this->app->singleton('command.facepalm.addcmsmodule', function ($app) {
            return $app['Facepalm\Generators\Commands\AddCmsModuleCommand'];
        });
        $this->commands('command.facepalm.addcmsmodule');

        $this->app->singleton('command.facepalm.purgeimages', function ($app) {
            return $app['Facepalm\Generators\Commands\PurgeImagesCommand'];
        });
        $this->commands('command.facepalm.purgeimages');

        $this->app->singleton('command.facepalm.purgetextitems', function ($app) {
            return $app['Facepalm\Generators\Commands\PurgeTextItemsCommand'];
        });
        $this->commands('command.facepalm.purgetextitems');

        $this->app->singleton('command.facepalm.translatevalues', function ($app) {
            return $app['Facepalm\Generators\Commands\TranslateValuesCommand'];
        });
        $this->commands('command.facepalm.translatevalues');

        $this->app->singleton('command.facepalm.reorder', function ($app) {
            return $app['Facepalm\Generators\Commands\ReorderCommand'];
        });
        $this->commands('command.facepalm.reorder');

        $this->app->singleton('command.facepalm.install', function ($app) {
            return $app['Facepalm\Generators\Commands\InstallCommand'];
        });
        $this->commands('command.facepalm.install');
    }
}
