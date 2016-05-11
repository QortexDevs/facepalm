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

class LatlngField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/extended/latlng.twig';

    public function renderFormField($object, $parameters = [], $template = '')
    {
        $this->makeNames($object);
        return Twig::render($this->templateName, [
                'inputNameLat' => $this->fieldNameBase . '[' . $this->name . '_lat]',
                'inputNameLng' => $this->fieldNameBase . '[' . $this->name . '_lng]',
                'lat' => $object->{$this->name . '_lat'},
                'lng' => $object->{$this->name . '_lng'},
                'parameters' => $this->parameters
            ] + $parameters);
    }


}