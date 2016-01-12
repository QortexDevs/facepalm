<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Fields\Types;


use App\Facepalm\Fields\AbstractField;
use Illuminate\Database\Eloquent\Model;

class ImageField extends AbstractField
{
    protected $templateName = 'components/form/elements/image.twig';
}