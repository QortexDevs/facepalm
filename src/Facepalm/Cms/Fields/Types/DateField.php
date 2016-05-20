<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\Fields\AbstractField;

class DateField extends DatetimeField
{
    //todo: в параметры его втащить?
    protected $listFormat = 'd.m.Y';
    protected $templateName = 'facepalm::components/form/elements/date';

}