<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Fields\Types;


use App\Facepalm\Fields\AbstractField;

class StringField extends AbstractField
{

    protected function getDefaults()
    {
        return array_replace(parent::getDefaults(), [
            'isLinkInList' => true
        ]);
    }


}