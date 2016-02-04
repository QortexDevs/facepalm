<?php

namespace App\Facepalm\Cms\Components;

use App\Facepalm\Cms\CmsCommon;
use App\Facepalm\Cms\Config;
use App\Facepalm\Cms\Fields\FieldListProcessor;
use App\Facepalm\ModelFactory;

class CmsComponent
{
    protected $modelName = null;
    protected $baseUrl = '.';

    /** @var FieldListProcessor */
    protected $fieldsProcessor = null;


    /**
     * CmsComponent constructor.
     * @param Config $config
     */
    public function __construct($config = null)
    {
        $this->fieldsProcessor = new FieldListProcessor();
        if ($config) {
            $this->fieldsProcessor->setDictionaries($config->get('dictionaries', []));
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
        $modelName = ModelFactory::getFullModelClassName($modelName);

        if ($modelName) {
            $this->modelName = $modelName;
        } else {
            throw new \Exception('Cannot find class ' . $modelName);
        }

        return $this;
    }

    /**
     * @param $config
     */
    public function buildFromConfig($config)
    {
    }

    /**
     * todo: описать в документации, как можно передавать разные параметры
     * @param $columns
     * @param null $titles
     * @return CmsComponent|CmsList|CmsForm
     */
    public function setFields($columns, $titles = null)
    {
        $this->fieldsProcessor->process($columns, $titles);

        return $this;
    }

    /**
     * @param $columns
     * @param null $titles
     * @return CmsComponent|CmsForm|CmsList
     */
    public function setColumns($columns, $titles = null)
    {
        return $this->setFields($columns, $titles);
    }


    /**
     * @param $baseUrl
     * @return CmsComponent|CmsList|CmsForm
     */
    public function setBaseUrl($baseUrl)
    {
        $this->baseUrl = $baseUrl;

        return $this;
    }
}