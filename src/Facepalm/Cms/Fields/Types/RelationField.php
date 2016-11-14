<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\CmsCommon;
use Facepalm\Cms\Fields\AbstractField;
use Facepalm\Models\ModelFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * @property mixed foreignDisplayName
 * @property mixed foreignModel
 * @property mixed cardinality
 * @property mixed collectionName
 * @property mixed foreignName
 */
class RelationField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/elements/relation';

    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        if ($this->cardinality == 'one') {
            if ($object->{$this->foreignModel}) {
                return $object->{$this->foreignModel}->{$this->foreignDisplayName};
            }
        } elseif ($this->cardinality == 'many') {
            return $object->{$this->collectionName}->implode($this->foreignDisplayName, ', ');
        }

        return '';
    }

    /**
     * todo: переделать на два метода - для просто поля и для поля у указангого объекта
     * todo: т.к., напрмиер грузить словарь можно и без объекта
     *
     * @param null|Model $object
     */
    public function prepareData($object = null)
    {
        //todo: add query conditions
        //todo: переделать статический вызов на di
        foreach (ModelFactory::all($this->foreignModel) as $foreignObject) {
            $this->parameters['dictionary'][$foreignObject->{CmsCommon::COLUMN_NAME_ID}] = $foreignObject->{$this->foreignDisplayName};
        }

        if ($this->cardinality === 'many') {

            if ($object) {
                //todo: format displayname in config with placeholders-string
                //todo: add query conditions

                $relatedItems = $object->{$this->collectionName};
                foreach ($relatedItems as $relatedItem) {
                    $this->parameters['relations'][] = $relatedItem->{CmsCommon::COLUMN_NAME_ID};
                }
            }
        }
    }

    /**
     * Дополнительное действие при установке параметра foreignModel
     * @param $name
     * @param $value
     * @return $this
     */
    public function setParameter($name, $value)
    {
        parent::setParameter($name, $value);
        if ($name == 'foreignModel') {
            $this->buildRelationFieldsNames();
        }
        return $this;
    }

    /**
     * Дополнительное действие при установке параметра foreignModel
     * @param $parameters
     * @return $this
     */
    public function setParameters(array $parameters)
    {
        parent::setParameters($parameters);
        if (Arr::has($parameters, 'foreignModel')) {
            $this->buildRelationFieldsNames();
        }
        return $this;
    }

    /**
     * @return $this
     */
    protected function buildRelationFieldsNames()
    {
        //todo: если они не установлены извне!!!
        $this->setParameter('collectionName', Str::plural(Str::snake($this->foreignModel)));
        $this->setParameter('foreignKey', Str::snake($this->foreignModel) . '_id');
        return $this;
    }


}