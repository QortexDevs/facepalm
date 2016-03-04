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
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class Create extends Save
{
    public function process(AbstractEntity $object, $keyValue, $requestRawData)
    {
        parent::process($object, $keyValue, $requestRawData);
        $this->affectedObjects[] = $object->id;
    }
}