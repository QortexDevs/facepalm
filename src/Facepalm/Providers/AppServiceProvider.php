<?php

namespace Facepalm\Providers;

use Facepalm\Models\Image;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        $this->loadViewsFrom(__DIR__ . '../../../resources/', 'facepalm');
//        DB::listen(function ($sql, $bindings, $time) {
//            d($sql, $time/1000);
//        });
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}
