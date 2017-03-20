<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace Facepalm\PostProcessing\AmfActions\Base;

use Carbon\Carbon;
use Facepalm\Cms\CmsCommon;
use Facepalm\Models\ModelFactory;
use Facepalm\Models\File;
use Facepalm\Models\Foundation\AbstractEntity;
use Facepalm\Models\Foundation\BaseEntity;
use Facepalm\Models\Image;
use Facepalm\PostProcessing\AmfActions\AbstractAction;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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

        if (Arr::has($requestRawData, 'listLanguage')) {
            app()->setLocale(Arr::get($requestRawData, 'listLanguage'));
        }

        foreach ($keyValue as $fieldName => $value) {
            if (!$object->isManyToMany($fieldName)) {
                // todo: учитывать описания полей из общей схемы данных (которой пока нет :))
                if ($object->isBelongsToField($fieldName)) {
                    $this->processBelongsToField($object, $fieldName, $value);
                } elseif ($object->isDatetimeField($fieldName)) {
                    if ($value) {
                        $object->$fieldName = (new \DateTime($value))->format('Y-m-d H:i:s');
                    } else {
                        $object->$fieldName = null;
                    }
                } elseif (is_array($value)) {
                    if (!$this->isMultiLangValue($value)) {
                        //todo: think некрасиво это все
                        $object->$fieldName = json_encode($value, JSON_UNESCAPED_UNICODE);
                    }
                } else {
                    $object->$fieldName = $value;
                }
            }
        }


        if (!$object->id) {
            $className = class_basename($object);
            DB::transaction(function () use ($object, $className, $requestRawData) {
//                $object->show_order = ModelFactory::max($className, 'show_order') + 1;
                $object->setAttribute('show_order', ModelFactory::max($className, 'show_order') + 1);
                Event::fire('facepalm.cms.beforeObjectSave', [$object, $requestRawData]);
                Event::fire('facepalm.cms.beforeObjectSave.' . class_basename($object), [$object, $requestRawData]);
                $object->save();
            });
        } else {
            Event::fire('facepalm.cms.beforeObjectSave', [$object, $requestRawData]);
            Event::fire('facepalm.cms.beforeObjectSave.' . class_basename($object), [$object, $requestRawData]);
            $object->save();
        }
        Event::fire('facepalm.cms.afterObjectSave', [$object, $requestRawData]);
        Event::fire('facepalm.cms.afterObjectSave.' . class_basename($object), [$object, $requestRawData]);

        if ($object->id) {

            //todo: save showorder localizations
            //todo: save showorder localizations
            //todo: save showorder localizations

            $this->setTranslatableItems($object, $keyValue);
            $this->syncManyToManyRelations($object, $keyValue);

            //to save translatable items!
            $object->save();
            Event::fire('facepalm.cms.afterObjectSaveRelations.' . class_basename($object), [$object, $requestRawData]);
            Event::fire('facepalm.cms.afterObjectSaveRelations', [$object, $requestRawData]);
        }
    }


    /**
     * @param $object
     * @param $fieldName
     * @param $value
     */
    protected function processBelongsToField($object, $fieldName, $value)
    {
        $relationMethod = Str::camel(Str::substr($fieldName, 0, -3));
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
    protected function setTranslatableItems($object, $keyValue)
    {
        foreach ($keyValue as $fieldName => $value) {
            if (!$object->isManyToMany($fieldName)) {
                if ($this->isMultiLangValue($value)) {
                    //translatable textitem
                    foreach ($value as $languageCode => $data) {
                        $object->setTextItem($fieldName, $data, $languageCode);
                    }
                }
            }
        }
    }

    /**
     * @param $value
     * @return bool
     */
    private function isMultiLangValue($value)
    {
        return is_array($value)
            && is_array(reset($value))
            && (Arr::has(reset($value), 'textBody') || Arr::has(reset($value), 'stringValue'));
    }
}