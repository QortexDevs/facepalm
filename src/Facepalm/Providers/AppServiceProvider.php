<?php

namespace Facepalm\Providers;

use Facepalm\Models\Image;
use Facepalm\Tools\StringsTranslationLoader;
use Facepalm\Tools\TextProcessor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        $this->publishes([__DIR__ . '/../../../database/' => base_path("database")], 'database');
        $this->publishes([__DIR__ . '/../../../build/' => public_path() . "/assets/facepalm/"], 'assets');
        $this->publishes([__DIR__ . '/../../../config/facepalm.php' => config_path() . "/facepalm.php"], 'config');
        $this->publishes([__DIR__ . '/../../../config/hooks/' => config_path() . "/hooks/"], 'config');
 //       $this->publishes([__DIR__ . '/../../../config/cms-sample-multilang/' => config_path() . "/cms/"], 'config');

        $this->loadViewsFrom(__DIR__ . '/../../../resources/views/', 'facepalm');
        //test
//        DB::listen(function ($sql) {
//            pre($sql->sql, $sql->time /= 1000, $sql->bindings);
//        });
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('Facepalm\Tools\TextProcessor', TextProcessor::class);
    }
}
