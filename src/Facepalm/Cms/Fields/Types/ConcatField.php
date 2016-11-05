<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\Fields\AbstractField;

class ConcatField extends StringField
{
    public function getValueForList($object)
    {
        $value = '';
        if ($this->parameters['fields']) {
            foreach ($this->parameters['fields'] as $field => $dummy) {
                $value .= isset($object->{$field}) ? (' ' . $object->{$field}) : '';
            }
        }
        return $value;
    }
}