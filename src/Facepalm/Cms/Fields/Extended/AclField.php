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
    protected $templateName = 'facepalm::components/form/extended/acl.twig';

    public function renderFormField($object, $parameters = [], $template = '')
    {
        $this->makeNames($object);

        return Twig::render($this->templateName, [
                'inputName' => $this->fieldNameBase . '[' . $this->name . ']',
                'structure' => $this->config->get('structure'),
                'acl' => $object->acl ? json_decode($object->acl) : []
            ] + $parameters);
    }


}