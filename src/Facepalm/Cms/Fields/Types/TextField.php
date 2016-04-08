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
use Illuminate\Support\Str;

class TextField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/elements/text.twig';

    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        return Str::limit(parent::getValueForList($object), 20);
    }
}