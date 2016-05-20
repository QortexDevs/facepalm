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

class BooleanField extends AbstractField
{
    protected function getDefaults()
    {
        return array_replace(parent::getDefaults(), [
            'doNotShowTitle' => true
        ]);
    }

    public function getValueForList($object)
    {
        return (bool)$object->{$this->name} ? '✓' : '';
    }

    protected $templateName = 'facepalm::components/form/elements/checkbox';
}