<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Extended;


use Facepalm\Cms\Fields\AbstractField;

class AclField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/extended/acl';

    public function renderFormField($object, array $parameters = [], $template = '')
    {
        $this->makeNames($object);

        return $this->render->render($this->templateName, [
                'acl' => ($object && $object->acl) ? json_decode($object->acl) : [],
                'inputName' => $this->fieldNameBase . '[' . $this->name . ']',
                'structure' => $this->config ? $this->config->get('structure') : null,
            ] + $parameters);
    }


}