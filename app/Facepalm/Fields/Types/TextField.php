<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Fields\Types;


use App\Facepalm\Fields\AbstractField;
use Illuminate\Support\Str;

class TextField extends AbstractField
{

    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        return Str::limit(parent::getValueForList($object), 20);
    }

}