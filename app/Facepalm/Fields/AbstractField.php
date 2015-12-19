<?php

namespace App\Facepalm\Fields;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * Class AbstractField
 * @package App\Facepalm\Fields
 *
 * @property string name
 * @property string title
 * @property mixed isLinkInList
 */
abstract class AbstractField implements \ArrayAccess
{
    protected $name = '';
    protected $title = '';
    protected $parameters = [];

    /**
     * AbstractField constructor.
     */
    public function __construct()
    {
    }

    /**
     * @param $name
     * @return $this
     */
    public function setName($name)
    {
        $this->name = $name;
        return $this;
    }

    /**
     * @param $title
     * @return $this
     */
    public function setTitle($title)
    {
        $this->title = $title;
        return $this;
    }

    /**
     * @param $parameters
     * @return $this
     */
    public function setParameters($parameters)
    {
        $this->parameters = $parameters;
        return $this;
    }

    /**
     * @param $field
     * @return mixed
     */
    public function __get($field)
    {
        switch ($field) {
            case 'name':
            case 'title':
                return $this->{$field};
                break;
            default:
                return Arr::get($this->parameters, $field, null);
        }
    }

    /**
     * @param $field
     * @return bool
     */
    public function __isset($field)
    {
        switch ($field) {
            case 'name':
            case 'title':
                return true;
                break;
            default:
                return Arr::has($this->parameters, $field);
        }
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
        return $object->{$this->name};
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


}