<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Extended;


use Facepalm\Cms\Fields\AbstractField;
use TwigBridge\Facade\Twig;

class AclField extends AbstractField
{
    protected $templateName = 'components/form/extended/acl.twig';

    public function renderFormField($object, $parameters = [], $template = '')
    {
//        $this->templateVars['acl'] = $object->acl ? json_decode($object->acl) : [];


        return Twig::render($this->templateName, [
                'structure' => $this->config->get('structure'),
            ] + $parameters);
    }


}