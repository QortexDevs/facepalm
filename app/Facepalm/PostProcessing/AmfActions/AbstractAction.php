<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 10.02.16
 * Time: 9:29
 */

namespace App\Facepalm\PostProcessing\AmfActions;


use App\Facepalm\Models\Foundation\AbstractEntity;

abstract class AbstractAction
{
    protected $affectedFields = [];
    protected $affectedObjects = [];

    /**
     * AbstractAction constructor.
     */
    public function __construct()
    {
    }

    /**
     * @return array
     */
    public function getAffectedFields()
    {
        return $this->affectedFields;
    }

    /**
     * @return array
     */
    public function getAffectedObjects()
    {
        return $this->affectedObjects;
    }

    /**
     * @param AbstractEntity $object
     * @param $keyValue
     * @param $requestRawData
     */
    abstract public function process(AbstractEntity $object, $keyValue, $requestRawData);


}