<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Fields\Types;


use App\Facepalm\Fields\AbstractField;

class DateField extends DatetimeField
{
    //todo: в параметры его втащить?
    protected $listFormat = 'd.m.Y';

}