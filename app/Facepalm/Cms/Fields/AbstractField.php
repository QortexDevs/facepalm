<?php

namespace App\Facepalm\Cms\Fields;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use TwigBridge\Facade\Twig;

/**
 * Class AbstractField
 * @package App\Facepalm\Fields
 *
 * @property string name
 * @property string title
 * @property mixed isLinkInList
 * @property mixed fieldNameBase
 * @property mixed uploadName
 */
abstract class AbstractField implements \ArrayAccess
{
    protected $parameters = [];
    protected $data = [];
    protected $templateName;
    protected $skipped = false;

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

    /**
     * @param $parameters
     * @return $this
     */
    public function setParameters($parameters)
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
        if ($this->isLinkInList) {
            return '<a href="' . $row['editUrl'] . '">' . $row[$this->name] . '</a>';
        } else {
            return $row[$this->name];
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
     * @param Model $object
     * @param array $parameters
     * @param string $template
     * @return
     */
    public function renderFormField($object, $parameters = [], $template = '')
    {
        $template = $template ?: $this->templateName;

        if ($template) {
            return Twig::render($template, [
                    'object' => $object,
                    'field' => $this->name,
                    'uploadName' => $this->uploadName,
                    'fieldNameBase' => $this->fieldNameBase,
                    'inputName' => $this->fieldNameBase . '[' . $this->name . ']',
                    'parameters' => $this->parameters,
                    'data' => $this->data,
                ] + $parameters);
        }
    }

}