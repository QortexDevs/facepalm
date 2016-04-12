<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models\Foundation;


use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * Class AbstractEntity
 *
 * @package Facepalm\Models\Base
 *
 * @property integer id
 * @property integer parent_id
 * @property integer show_order
 * @property boolean status
 * @property string created_at
 * @property string updated_at
 */
abstract class AbstractEntity extends Model
{
    /**
     * @param $fieldName
     * @return bool
     */
    public function isDatetimeField($fieldName)
    {
        return in_array($fieldName, $this->getDates());
    }

    /**
     * @param $fieldName
     * @return bool
     */
    public function isBelongsToField($fieldName)
    {
        if (Str::endsWith($fieldName, '_id')) {
            $relationMethod = Str::camel(Str::substr($fieldName, 0, -3));
            if (method_exists($this, $relationMethod) && $this->$relationMethod() instanceof BelongsTo) {
//                return $relationMethod;
                return true;
            }
        }
        return false;
    }

    /**
     * @param $fieldName
     * @return bool
     */
    public function isManyToMany($fieldName)
    {
        return $this->$fieldName instanceof Collection;
    }


}