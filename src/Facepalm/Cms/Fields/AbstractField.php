<?php

namespace Facepalm\Cms\Fields;

use Facepalm\Models\Language;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

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
    protected $render;

    /**
     * @param mixed $render
     * @return $this
     */
    public function setRender($render)
    {
        $this->render = $render;
        return $this;
    }

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
        return isset($object->{$this->name}) ? strip_tags($object->{$this->name}) : '';
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

    public function getCustomStyle()
    {
        $style = '';
        if (Arr::has($this->parameters, 'style')) {
            $style = $this->parameters['style'];
            array_walk($style, function (&$v, $k) {
                $v = $k . ': ' . $v;
            });
            $style = implode(';', $style);
        }

        return $style;
    }

    /**
     * @param $object
     */
    protected function makeNames($object)
    {
//        d($this->createObjectRandomName);
        //note: убрал пока эту хуйню, потому что она не только из формы должна отсанавливаться но и из списка. И это тупо
//        $createName = $this->createObjectRandomName ? '%CREATE_' . $this->randomId . '%' : '';
        $createName = '%CREATE_' . $this->randomId . '%' ;
        $this->amfNameBase = $object
            ? '[' . class_basename($this->modelName) . '][' . $object->id . ']'
            : '[' . class_basename($this->modelName) . '][' . $createName . ']';

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
    public function renderFormField($object, array $parameters = array(), $template = '')
    {
        $template = $template ?: $this->templateName;
        $this->makeNames($object);
        if ($template) {
            $languages = Language::where('status', 1)->orderby('is_default', 'desc')->get()->pluck('code', 'code');

            return $this->render->render($template, [
                    'object' => $object,
                    'data' => $this->data,
                    'field' => $this->name,
                    'languages' => $languages,
                    'forceValue' => $this->forceValue,
                    'parameters' => $this->parameters,
                    'fieldNameBase' => $this->fieldNameBase,
                    'uploadName' => 'upload' . $this->amfNameBase,
                    'inputName' => $this->fieldNameBase . '[' . $this->name . ']',
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