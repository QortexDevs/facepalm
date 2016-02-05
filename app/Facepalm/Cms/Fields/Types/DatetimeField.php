<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Cms\Fields\Types;


use App\Facepalm\Cms\Fields\AbstractField;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DatetimeField extends AbstractField
{
    //todo: в параметры его втащить?
    protected $listFormat = 'd.m.Y H:i';
    protected $templateName = 'components/form/elements/datetime.twig';

    /**
     * @param Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        $value = parent::getValueForList($object);
        if (!$value || Str::startsWith($value, '0000') || Str::startsWith($value, '-0001')) {
            return '';
        } else {
            return (new \DateTime($value))->format($this->listFormat);
        }
    }
}