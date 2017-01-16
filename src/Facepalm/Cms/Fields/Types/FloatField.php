<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\Fields\AbstractField;
use Illuminate\Database\Eloquent\Model;

class FloatField extends StringField
{
    protected $templateName = 'facepalm::components/form/elements/float';

}