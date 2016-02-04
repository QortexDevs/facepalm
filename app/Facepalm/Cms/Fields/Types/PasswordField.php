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

class PasswordField extends AbstractField
{

    protected $templateName = 'components/form/elements/password.twig';

}