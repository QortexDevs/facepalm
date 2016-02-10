<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace App\Facepalm\PostProcessing\AmfActions;

use App\Facepalm\Cms\CmsCommon;
use App\Facepalm\Models\ModelFactory;
use App\Facepalm\Models\File;
use App\Facepalm\Models\Foundation\AbstractEntity;
use App\Facepalm\Models\Foundation\BaseEntity;
use App\Facepalm\Models\Image;
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