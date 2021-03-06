<?php

namespace Facepalm\Providers;

use Facepalm\Cms\Components\CmsForm;
use Facepalm\Cms\Components\CmsList;
use Facepalm\Cms\Fields\FieldFactory;
use Facepalm\Cms\Fields\FieldSet;
use Facepalm\Cms\PermissionManager;
use Facepalm\Models\Image;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class CmsServiceProvider extends ServiceProvider
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
            'concat',
            'text',
            'plaintext',
            'unknown',
            'separator',
            'combobox',
        ];

        foreach ($fieldTypes as $fieldType) {
            $className = 'Facepalm\Cms\Fields\Types\\' . Str::ucfirst($fieldType) . 'Field';
            $this->app->bind('facepalm.cms.field.' . $fieldType, $className);
        }

        $this->app->bind('facepalm.amf.action.save', 'Facepalm\PostProcessing\AmfActions\Base\Save');
        $this->app->bind('facepalm.amf.action.create', 'Facepalm\PostProcessing\AmfActions\Base\Create');
        $this->app->bind('facepalm.amf.action.delete', 'Facepalm\PostProcessing\AmfActions\Base\Delete');
        $this->app->bind('facepalm.amf.action.toggle', 'Facepalm\PostProcessing\AmfActions\Base\Toggle');
        $this->app->bind('facepalm.amf.action.upload', 'Facepalm\PostProcessing\AmfActions\Base\Upload');

        $this->app->bind('facepalm.cms.fields.extended.acl', 'Facepalm\Cms\Fields\Extended\AclField');
        $this->app->bind('facepalm.cms.fields.extended.latlng', 'Facepalm\Cms\Fields\Extended\LatlngField');

        $this->app->bind('CmsList', CmsList::class);
        $this->app->bind('CmsForm', CmsForm::class);
        $this->app->bind('CmsFieldSet', FieldSet::class);
        $this->app->bind('Facepalm\Cms\Fields\FieldFactory', FieldFactory::class);
        $this->app->bind('Facepalm\Cms\PermissionManager', PermissionManager::class);
        $this->app->bind('Facepalm\Models\User', function () {
            return Auth::user() ?: null;
        });

        //        $this->app->bind('facepalm.amf.action.acl', 'Facepalm\PostProcessing\AmfActions\Extended\Acl');

    }
}
