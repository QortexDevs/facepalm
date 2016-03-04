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
use Facepalm\PostProcessing\UploadProcessor;
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