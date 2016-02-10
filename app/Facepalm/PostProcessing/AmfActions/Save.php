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
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class Save extends AbstractAction
{
    /**
     * @param AbstractEntity $object
     * @param $keyValue
     * @param $requestRawData
     */
    public function process(AbstractEntity $object, $keyValue, $requestRawData)
    {
        // Run through all incoming fields except Many-to-Many relations and set it
        foreach ($keyValue as $fieldName => $value) {
            if (!$object->isManyToMany($fieldName)) {
                // todo: учитывать описания полей из общей схемы данных (которой пока нет :))
                if ($object->isBelongsToField($fieldName)) {
                    $this->processBelongsToField($object, $fieldName, $value);
                } elseif ($object->isDatetimeField($fieldName)) {
                    $object->$fieldName = (new \DateTime($value))->format('Y-m-d H:i:s');
                } else {
                    $object->$fieldName = $value;
                }
            }
        }

        $object->save();

        $this->syncManyToManyRelations($object, $keyValue);
    }


    /**
     * @param $object
     * @param $fieldName
     * @param $value
     */
    protected function processBelongsToField($object, $fieldName, $value)
    {
        $relationMethod = Str::substr($fieldName, 0, -3);
        if ($value) {
            $foreignObject = ModelFactory::find($relationMethod, $value);
            if ($foreignObject) {
                $object->$relationMethod()->associate($foreignObject);
            }
        } else {
            $object->$relationMethod()->dissociate();

        }
    }

    /**
     * @param AbstractEntity $object
     * @param $keyValue
     */
    protected function syncManyToManyRelations(AbstractEntity $object, $keyValue)
    {
        foreach ($keyValue as $fieldName => $value) {
            if ($object->isManyToMany($fieldName)) {
                // get keys of non-zero array elements
                $object->$fieldName()->sync(array_keys(array_filter($value)));
            }
        }
    }
}