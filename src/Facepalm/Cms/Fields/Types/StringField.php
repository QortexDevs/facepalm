<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\Fields\AbstractField;

class StringField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/elements/string';

    protected function getDefaults()
    {
        return array_replace(parent::getDefaults(), [
            'isLinkInList' => true
        ]);
    }
}