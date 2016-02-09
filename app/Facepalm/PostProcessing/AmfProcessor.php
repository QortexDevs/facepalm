<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace App\Facepalm\PostProcessing;

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

class AmfProcessor
{
    protected $affectedObjectsCount = 0;
    protected $affectedFieldsCount = 0;
    protected $affectedObjects = [];
    protected $toggledFields = [];
    protected $uploadedFiles = [];

    /**
     * Run through AMF input array
     *
     * AMF is: action[Model][id][field]=value,
     * e.g.: save[User][2][email]='..',save[User][2][name]='..', etc
     *
     * @param $amf
     */
    public function process($amf)
    {
        foreach ($amf as $action => $input) {
            $processMethod = 'processObject' . Str::studly($action);
            if (method_exists($this, $processMethod)) {
                foreach ($input as $modelName => $data) {
                    $fullModelName = ModelFactory::getFullModelClassName($modelName);
                    if ($fullModelName) {
                        if (is_array($data)) {
                            foreach ($data as $id => $keyValue) {
                                /** @var AbstractEntity $object */
                                if ((int)$id) {
                                    $object = ModelFactory::find($fullModelName, $id);
                                } elseif (preg_match('/\%CREATE_[\w]{6}\%/i', $id)) {
                                    $object = new $fullModelName();
                                    Session::flash('creatingObject', true);
                                }
                                if ($object) {
                                    $this->{$processMethod}($object, $keyValue, $amf);
                                    if ($processMethod == 'create') {
                                        $this->affectedObjectsCount++;
                                        $this->affectedObjects[$modelName][] = $object->id;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @return array
     */
    public function getAffectedObjects()
    {
        return $this->affectedObjects;
    }

    /**
     * @return int
     */
    public function getAffectedObjectsCount()
    {
        return $this->affectedObjectsCount;
    }

    /**
     * @return int
     */
    public function getAffectedFieldsCount()
    {
        return $this->affectedFieldsCount;
    }

    /**
     * @return array
     */
    public function getToggledFields()
    {
        return $this->toggledFields;
    }

    /**
     * @return array
     */
    public function getUploadedFiles()
    {
        return $this->uploadedFiles;
    }


    /**
     * @param AbstractEntity $object
     * @param $keyValue
     */
    protected function processObjectSave(AbstractEntity $object, $keyValue, $requestRawData)
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

        // Save
        $object->save();

        // And after saving process Many-to-Many relations
        foreach ($keyValue as $fieldName => $value) {
            if ($object->isManyToMany($fieldName)) {
                // get keys of non-zero array elements
                $object->$fieldName()->sync(array_keys(array_filter($value)));
            }
        }
    }

    /**
     * Alias for [Save]
     * @param $object
     * @param $keyValue
     */
    protected function processObjectCreate($object, $keyValue, $requestRawData)
    {
        $this->processObjectSave($object, $keyValue, $requestRawData);
    }

    /**
     * @param $object
     * @param $keyValue
     */
    protected function processObjectToggle($object, $keyValue, $requestRawData)
    {
        foreach (array_keys($keyValue) as $fieldName) {
            $this->affectedFieldsCount++;
            $object->$fieldName ^= 1;
            $this->toggledFields[class_basename($object)][$object->{CmsCommon::COLUMN_NAME_ID}][$fieldName] = $object->$fieldName;
        }
        $object->save();

    }

    /**
     * @param AbstractEntity $object
     */
    protected function processObjectDelete(AbstractEntity $object)
    {
        $object->delete();
    }

    /**
     * @param $object
     * @param $keyValue
     */
    protected function processObjectUpload($object, $keyValue, $requestRawData)
    {
        $uploadProcessor = new UploadProcessor();
        foreach ($keyValue as $fieldName => $value) {
            $this->uploadedFiles += $uploadProcessor->handle($fieldName, $object, $value, $requestRawData);
        }
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
}