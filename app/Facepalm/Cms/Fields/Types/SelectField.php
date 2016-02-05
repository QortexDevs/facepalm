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
use Illuminate\Support\Arr;

/**
 * @property array dictionary
 */
class SelectField extends AbstractField
{
    protected $templateName = 'components/form/elements/select.twig';

    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        if (!$this->name) {
            return '';
        }
        return Arr::get($this->dictionary, (int)$object->{$this->name}, '');
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