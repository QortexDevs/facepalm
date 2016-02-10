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
use App\Facepalm\PostProcessing\AmfActions\AbstractAction;
use App\Facepalm\PostProcessing\UploadProcessor;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class Upload extends AbstractAction
{
    /**
     * @param AbstractEntity $object
     * @param $keyValue
     * @param $requestRawData
     */
    public function process(AbstractEntity $object, $keyValue, $requestRawData)
    {
        $uploadProcessor = new UploadProcessor();
        foreach ($keyValue as $fieldName => $value) {
            $this->affectedObjects += $uploadProcessor->handle($fieldName, $object, $value, $requestRawData);
        }
    }

}