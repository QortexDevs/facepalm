<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\Fields\AbstractField;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

/**
 * @property array dictionary
 */
class SelectField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/elements/select';

    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        if (!$this->name) {
            return '';
        }
        return Arr::get($this->dictionary, $object->{$this->name}, '');
    }

    /**
     * @param array $dictionary
     * @return $this
     */
    public function setDictionary($dictionary)
    {
        $this->setParameters(['dictionary' => $dictionary]);
        return $this;
    }

}