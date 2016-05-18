<?php

namespace Facepalm\Cms\Components;

use Facepalm\Cms\CmsCommon;
use Facepalm\Cms\Config\Config;
use Facepalm\Cms\Fields\FieldListProcessor;
use Facepalm\Models\ModelFactory;

class CmsComponent
{
    protected $modelName;
    protected $baseUrl = '.';
    protected $config;

    /** @var FieldListProcessor */
    protected $fieldsProcessor;
    protected $cmsConfig;


    /**
     * CmsComponent constructor.
     * @param Config $config
     */
    public function __construct($config = null, $cmsConfig = null)
    {
        $this->fieldsProcessor = new FieldListProcessor();
        if ($cmsConfig) {
            $this->cmsConfig = $cmsConfig;
            $this->fieldsProcessor->setCmsConfig($this->cmsConfig);
        }
        if ($config) {
            $this->fieldsProcessor->setDictionaries($config->get('dictionaries', []));
            $this->configure($config);
        }
    }

    /**
     * @param $modelName
     * @return $this
     * @throws \InvalidArgumentException
     */
    public function setMainModel($modelName)
    {
        $modelName = ModelFactory::getFullModelClassName($modelName);

        if ($modelName) {
            $this->modelName = $modelName;
        } else {
            throw new \InvalidArgumentException('Cannot find class ' . $modelName);
        }

        return $this;
    }

    /**
     * @param $config
     */
    public function configure($config)
    {
        $this->config = $config;
    }

    /**
     */
    public function build()
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