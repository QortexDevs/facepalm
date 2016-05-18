<?php

namespace Facepalm\Cms\Fields;

use Facepalm\Models\Language;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use TwigBridge\Facade\Twig;

/**
 * Class AbstractField
 * @package Facepalm\Fields
 *
 * @property string name
 * @property string title
 * @property mixed isLinkInList
 * @property mixed randomId
 * @property mixed modelName
 */
abstract class AbstractField implements \ArrayAccess
{
    protected $parameters = [];
    protected $data = [];
    protected $templateName;
    protected $skipped = false;
    protected $forceValue;
    protected $amfNameBase;
    protected $fieldNameBase;

    /**
     * @return boolean
     */
    public function isSkipped()
    {
        return $this->skipped;
    }

    /**
     * @param boolean $skipped
     */
    public function setSkipped($skipped)
    {
        $this->skipped = $skipped;
    }

    /**
     * AbstractField constructor.
     */
    public function __construct()
    {
        $this->setParameters($this->getDefaults());
    }

    /**
     * @param $name
     * @return $this
     */
    public function setName($name)
    {
        $this->parameters['name'] = $name;
        return $this;
    }

    /**
     * @param $title
     * @return $this
     */
    public function setTitle($title)
    {
        $this->parameters['title'] = $title;
        return $this;
    }

    public function setForceValue($value)
    {
        $this->forceValue = $value;
        return $this;
    }

    /**
     * @return mixed
     */
    public function getForceValue()
    {
        return $this->forceValue;
    }

    /**
     * @param $parameters
     * @return $this
     */
    public function setParameters(array $parameters)
    {
        $this->parameters = array_replace($this->parameters, $parameters);
        return $this;
    }

    /**
     * @param $name
     * @param $value
     * @return $this
     */
    public function setParameter($name, $value)
    {
        $this->parameters[$name] = $value;
        return $this;
    }

    /**
     * @param $field
     * @return mixed
     */
    public function __get($field)
    {
        return Arr::get($this->parameters, $field, null);
    }

    /**
     * @param $field
     * @return bool
     */
    public function __isset($field)
    {
        return Arr::has($this->parameters, $field);
    }

    public function offsetGet($offset)
    {
        return $this->$offset;
    }

    public function offsetSet($offset, $value)
    {
    }

    public function offsetExists($offset)
    {
    }

    public function offsetUnset($offset)
    {
    }

    /**
     * @param Model $object
     * @return mixed
     */
    public function getValueForList($object)
    {
        return isset($object->{$this->name}) ? $object->{$this->name} : '';
    }

    /**
     * @param string[] $row
     * @return string
     */
    public function renderForList($row)
    {
        if ($row) {
            if ($this->isLinkInList) {
                return '<a href="' . $row->editUrl . '">' . $this->getValueForList($row) . '</a>';
            } else {
                return $this->getValueForList($row);
            }
        }
    }


    /**
     * @return array
     */
    protected function getDefaults()
    {
        return [];
    }

    /**
     * @param null|Model $object
     */
    public function prepareData($object = null)
    {

    }

    
    /**
     * @param $object
     */
    protected function makeNames($object)
    {
        $this->amfNameBase = $object
            ? '[' . class_basename($this->modelName) . '][' . $object->id . ']'
            : '[' . class_basename($this->modelName) . '][%CREATE_' . $this->randomId . '%]';

        $this->fieldNameBase = $object
            ? 'save' . $this->amfNameBase
            : 'create' . $this->amfNameBase;
    }

    /**
     * @param Model $object
     * @param array $parameters
     * @param string $template
     * @return string
     */
    public function renderFormField($object, $parameters = [], $template = '')
    {
        $template = $template ?: $this->templateName;

        $this->makeNames($object);
        if ($template) {
            $languages = Language::where('status', 1)->orderby('is_default', 'desc')->get()->pluck('code', 'code');

            // todo: некрасиво!
            return Twig::render($template, [
                    'object' => $object,
                    'field' => $this->name,
                    'uploadName' => 'upload' . $this->amfNameBase,
                    'fieldNameBase' => $this->fieldNameBase,
                    'inputName' => $this->fieldNameBase . '[' . $this->name . ']',
                    'parameters' => $this->parameters,
                    'data' => $this->data,
                    'languages' => $languages,
                    'forceValue' => $this->forceValue
                ] + $parameters);
        }
    }

    /**
     *
     */
    public function getRowClassName()
    {
        return Str::snake(Str::substr(class_basename($this), 0, -5));
    }

}