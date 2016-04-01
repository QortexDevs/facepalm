<?php
namespace Facepalm\Tests;

use Facepalm\Providers\CmsServiceProvider;

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
            \Facepalm\Tests\Bootstrap\Http\Kernel::class
        );

        $app->singleton(
            \Illuminate\Contracts\Console\Kernel::class,
            \Facepalm\Tests\Bootstrap\Console\Kernel::class
        );

        $app->singleton(
            \Illuminate\Contracts\Debug\ExceptionHandler::class,
            \Facepalm\Tests\Bootstrap\Exceptions\Handler::class
        );

        $cmsServiceProvider = new CmsServiceProvider($app);
        $cmsServiceProvider->register();

        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();



        return $app;
    }
}
