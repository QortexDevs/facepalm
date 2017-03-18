<?php

namespace Facepalm\Cms\Components;

use Facepalm\Cms\Fields\FieldSet;
use Facepalm\Models\ModelFactory;

abstract class CmsComponent
{
    /** @var string */
    protected $modelName;

    /** @var string */
    protected $baseUrl = '.';

    /** @var string */
    protected $baseUrlNav = '.';

    /** @var FieldSet */
    protected $fieldSet;

    /**
     * CmsComponent constructor.
     * @param FieldSet $fieldSet
     */
    public function __construct(FieldSet $fieldSet)
    {
        $this->fieldSet = $fieldSet;
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
     * @param $baseUrl
     * @return CmsComponent|CmsList|CmsForm
     */
    public function setBaseUrl($baseUrl, $baseUrlNav)
    {
        $this->baseUrl = $baseUrl;
        $this->baseUrlNav = $baseUrlNav;

        return $this;
    }


    abstract public function build();


}