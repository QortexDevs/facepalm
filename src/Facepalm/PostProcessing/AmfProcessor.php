<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace Facepalm\PostProcessing;

use Facepalm\Cms\CmsCommon;
use Facepalm\Models\ModelFactory;
use Facepalm\Models\Foundation\AbstractEntity;
use Facepalm\PostProcessing\AmfActions\AbstractAction;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;

class AmfProcessor
{
    protected $affectedObjectsCount = 0;
    protected $affectedFieldsCount = 0;
    protected $affectedObjects = [];
    protected $affectedFields = [];

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
        foreach ($amf as $actionName => $input) {
            try {
                $action = app()->make('facepalm.amf.action.' . Str::lower($actionName));
            } catch (\Exception $e) {
                //todo: unknown action
                $action = null;
            }
            if (isset($action) && $action) {
                foreach ($input as $modelName => $data) {
                    $fullModelName = ModelFactory::getFullModelClassName($modelName);
                    if ($fullModelName) {
                        if (is_array($data)) {
                            foreach ($data as $id => $keyValue) {
                                /** @var AbstractEntity $object */
                                $object = null;
                                if ((int)$id) {
                                    $object = ModelFactory::find($fullModelName, $id);
                                } elseif (preg_match('/\%CREATE_[\w]{6}\%/i', $id)) {
                                    $object = new $fullModelName();
                                }
                                if ($object) {
                                    /** @var AbstractAction $action */
                                    $action->process($object, $keyValue, $amf);


                                    // todo: вот эта хуета по прежнем не нравится
                                    // todo: подумать про какой-нибудь объект ActionResult

                                    $affectedObjects = $action->getAffectedObjects();
                                    if ($affectedObjects) {
                                        Arr::set(
                                            $this->affectedObjects,
                                            $actionName . '.' . $modelName,
                                            (array)Arr::get(
                                                $this->affectedObjects,
                                                $actionName . '.' . $modelName
                                            ) + $affectedObjects
                                        );

                                        $this->affectedObjectsCount += count($affectedObjects);
                                    }

                                    $affectedFields = $action->getAffectedFields();
                                    if ($affectedFields) {
                                        $resultArrayPath = $actionName . '.' . class_basename($object) . '.' . $object->{CmsCommon::COLUMN_NAME_ID};
                                        Arr::set(
                                            $this->affectedFields,
                                            $resultArrayPath,
                                            (array)Arr::get($this->affectedFields, $resultArrayPath) + $affectedFields
                                        );
                                        $this->affectedFieldsCount += count($affectedFields);
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
    public function getAffectedObjects()
    {
        return $this->affectedObjects;
    }

    /**
     * @return array
     */
    public function getAffectedFields()
    {
        return $this->affectedFields;
    }

    /**
     * @return bool
     */
    public function isSingleObjectCreated()
    {
        return $this->getAffectedObjectsCount() === 1 && Arr::has($this->getAffectedObjects(), 'create');
    }

}