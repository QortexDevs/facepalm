<?php

namespace App\Cms\Fields;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;

abstract class AbstractField
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

    public function __get($field)
    {
        switch ($field) {
            case 'name':
            case 'title':
            case 'type':
                return $this->{$field};
                break;
            default:
                return Arr::get($this->parameters, $field, null);
        }
    }


}