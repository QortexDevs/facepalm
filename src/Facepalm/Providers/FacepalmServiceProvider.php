<?php

/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 22.03.16
 * Time: 9:49
 */

namespace Facepalm\Providers;

use Illuminate\Support\AggregateServiceProvider;

class FacepalmServiceProvider extends AggregateServiceProvider
{
    /**
     * Indicates if loading of the provider is deferred.
     *
     * @var bool
     */
    //    protected $defer = true;

    /**
     * The provider class names.
     *
     * @var array
     */
    protected $providers = [
        'TwigBridge\ServiceProvider',
        'Intervention\Image\ImageServiceProvider',

        'Facepalm\Providers\CmsServiceProvider',
        'Facepalm\Providers\AppServiceProvider',
        'Facepalm\Providers\RouteServiceProvider',
        'Facepalm\Providers\GeneratorServiceProvider',
        'Facepalm\Providers\TranslationServiceProvider',
    ];
}
