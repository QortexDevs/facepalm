<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace Facepalm\PostProcessing\AmfActions;

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

class Toggle extends AbstractAction
{
    /**
     * @param AbstractEntity $object
     * @param $keyValue
     * @param $requestRawData
     */
    public function process(AbstractEntity $object, $keyValue, $requestRawData)
    {
        foreach (array_keys($keyValue) as $fieldName) {
            $object->$fieldName ^= 1;
            $this->affectedFields[$fieldName] = $object->$fieldName;
        }
        $object->save();
    }

}