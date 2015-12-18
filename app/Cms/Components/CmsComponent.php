<?php

namespace App\Cms\Components;

use App\Cms\CmsCommon;
use Illuminate\Support\Str;

class CmsComponent
{
    protected $modelName = null;

    public function __construct($config = null)
    {
        if ($config) {
            $this->buildFromConfig($config);
        }
    }

    /**
     * @param $modelName
     * @return $this
     * @throws \Exception
     */
    public function setMainModel($modelName)
    {
        $modelName = CmsCommon::getFullModelClassName($modelName);

        if ($modelName) {
            $this->modelName = $modelName;
        } else {
            throw new \Exception('Cannot find class ' . $modelName);
        }

        return $this;
    }
}