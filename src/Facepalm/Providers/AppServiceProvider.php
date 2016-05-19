<?php

namespace Facepalm\Providers;

use Facepalm\Models\Image;
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
        $this->publishes([__DIR__ . '/../../../build/' => public_path() . "/assets/facepalm/"], 'assets');
        $this->publishes([__DIR__ . '/../../../database/' => base_path("database")], 'database');

        $this->loadViewsFrom(__DIR__ . '/../../../resources/views/', 'facepalm');
        //test
//        DB::listen(function ($sql, $bindings = null, $time = null) {
//            d($sql, $time / 1000);
//            echo($sql->sql . " - " . $time / 1000 . "<br />\n");
//        });
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
    }
}
