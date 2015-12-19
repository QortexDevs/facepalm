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

/**
 * @property mixed foreignDisplayName
 * @property mixed foreignModel
 */
class RelationField extends AbstractField
{
    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        if ($object->{$this->foreignModel}) {
            return $object->{$this->foreignModel}->{$this->foreignDisplayName};
        }
        return '';
    }

}