<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace Facepalm\PostProcessing\AmfActions\Base;

use Facepalm\Cms\CmsCommon;
use Facepalm\Models\ModelFactory;
use Facepalm\Models\File;
use Facepalm\Models\Foundation\AbstractEntity;
use Facepalm\Models\Foundation\BaseEntity;
use Facepalm\Models\Image;
use Facepalm\PostProcessing\AmfActions\AbstractAction;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Illuminate\Support\Facades\Event;

class Delete extends AbstractAction
{
    /**
     * @param AbstractEntity $object
     * @param $keyValue
     * @param $requestRawData
     */
    public function process(AbstractEntity $object, $keyValue, $requestRawData)
    {
        Event::fire('facepalm.cms.beforeObjectDelete', [$object, $requestRawData]);
        Event::fire('facepalm.cms.beforeObjectDelete.' . class_basename($object), [$object, $requestRawData]);
        $object->delete();
        Event::fire('facepalm.cms.afterObjectDelete', [$object, $requestRawData]);
        Event::fire('facepalm.cms.afterObjectDelete.' . class_basename($object), [$object, $requestRawData]);
    }

}