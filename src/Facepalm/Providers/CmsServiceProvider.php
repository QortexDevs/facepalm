<?php

namespace Facepalm\Providers;

use Facepalm\Models\Image;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class CmsServiceProvider extends ServiceProvider
{

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $fieldTypes = [
            'boolean',
            'date',
            'datetime',
            'file',
            'float',
            'hidden',
            'image',
            'integer',
            'password',
            'relation',
            'select',
            'string',
            'text',
            'unknown',
        ];

        foreach ($fieldTypes as $fieldType) {
            $className = 'Facepalm\Cms\Fields\Types\\' . Str::ucfirst($fieldType) . 'Field';
            $this->app->bind('facepalm.cms.field.' . $fieldType, $className);
        }

        $this->app->bind('facepalm.cms.fields.extended.acl', 'Facepalm\Cms\Fields\Extended\AclField');

    }
}
