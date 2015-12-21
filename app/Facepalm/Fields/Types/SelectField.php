<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Fields\Types;


use App\Facepalm\Fields\AbstractField;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

/**
 * @property array dictionary
 */
class SelectField extends AbstractField
{
    protected $templateName = 'components/form/elements/select.twig';

    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        return Arr::get($this->dictionary, (int)$object->{$this->name}, '');
    }

}