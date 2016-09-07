<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 22.03.16
 * Time: 9:49
 */

namespace Facepalm\Providers;

use Facepalm\Tools\StringsTranslationLoader;

class TranslationServiceProvider extends \Illuminate\Translation\TranslationServiceProvider
{
    /**
     * Register the service provider.
     *
     * @return void
     */
    public function registerLoader()
    {
        if (config('facepalm.useOwnTranslationLoader')) {
            $this->app->singleton('translation.loader', function ($app) {
                return new StringsTranslationLoader();
            });
        } else {
            parent::registerLoader();
        }
    }

}
