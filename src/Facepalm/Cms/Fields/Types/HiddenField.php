<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\Fields\AbstractField;

class HiddenField extends AbstractField
{
    protected $templateName = 'components/form/elements/hidden.twig';

    protected function getDefaults()
    {
        return array_replace(parent::getDefaults(), [
            'isHidden' => true
        ]);
    }
}