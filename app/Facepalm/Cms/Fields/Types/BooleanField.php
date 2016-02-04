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

class BooleanField extends AbstractField
{
    protected function getDefaults()
    {
        return array_replace(parent::getDefaults(), [
            'doNotShowTitle' => true
        ]);
    }
    protected $templateName = 'components/form/elements/checkbox.twig';
}