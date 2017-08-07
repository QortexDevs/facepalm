<?php

namespace Tests;

class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
    /**
     * The base URL to use while testing the application.
     *
     * @var string
     */
    protected $baseUrl = 'http://facepalm.loc';

    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        $app = new \Illuminate\Foundation\Application(
            realpath(__DIR__ . '/../')
        );
        /*
        |--------------------------------------------------------------------------
        | Bind Important Interfaces
        |--------------------------------------------------------------------------
        |
        | Next, we need to bind some important interfaces into the container so
        | we will be able to resolve them when needed. The kernels serve the
        | incoming requests to this application from both the web and CLI.
        |
        */

        $app->singleton(
            \Illuminate\Contracts\Http\Kernel::class,
            \Tests\Bootstrap\Http\Kernel::class
        );

        $app->singleton(
            \Illuminate\Contracts\Console\Kernel::class,
            \Tests\Bootstrap\Console\Kernel::class
        );

        $app->singleton(
            \Illuminate\Contracts\Debug\ExceptionHandler::class,
            \Tests\Bootstrap\Exceptions\Handler::class
        );

        $app->register(\Facepalm\Providers\CmsServiceProvider::class);

        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();


        return $app;
    }
}
