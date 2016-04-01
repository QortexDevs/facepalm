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
        //todo: разобраться!
        $this->loadViewsFrom(__DIR__ . '../../../resources/', 'facepalm');
//        DB::listen(function ($sql, $bindings = null, $time = null) {
//            d($sql, $time / 1000);
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
