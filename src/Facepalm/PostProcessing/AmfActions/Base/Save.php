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
                } elseif (is_array($value)) {
                    continue;
                } else {
                    $object->$fieldName = $value;
                }
            }
        }

        if (!$object->id) {
            $className = class_basename($object);
            DB::transaction(function () use ($object, $className) {
                $object->show_order = ModelFactory::max($className, 'show_order') + 1;
                $object->save();
            });
        } else {
            $object->save();
        }


        $this->saveTranslatableItems($object, $keyValue);
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

    /**
     * todo: объединить два пост-сейв метода
     * @param $object
     * @param $keyValue
     */
    protected function saveTranslatableItems($object, $keyValue)
    {
        foreach ($keyValue as $fieldName => $value) {
            if (!$object->isManyToMany($fieldName)) {
                if (is_array($value)) {
                    if ((Arr::has(reset($value), 'textBody') || Arr::has(reset($value), 'stringValue'))) {
                        //translatable textitem
                        foreach ($value as $languageCode => $data) {
                            $object->setTextItem($fieldName, $data, $languageCode);
                        }
                    }
                }
            }
        }
    }
}