<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Cms\Fields\Types;


use App\Facepalm\CmsCommon;
use App\Facepalm\Cms\Fields\AbstractField;
use App\Facepalm\ModelFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property mixed foreignDisplayName
 * @property mixed foreignModel
 * @property mixed cardinality
 * @property mixed collectionName
 * @property mixed foreignName
 */
class RelationField extends AbstractField
{
    protected $templateName = 'components/form/elements/relation.twig';

    /**
     * @param \Illuminate\Database\Eloquent\Model $object
     * @return string
     */
    public function getValueForList($object)
    {
        if ($object->{$this->foreignModel}) {
            return $object->{$this->foreignModel}->{$this->foreignDisplayName};
        }
        return '';
    }

    /**
     * @param null|Model $object
     */
    public function prepareData($object = null)
    {
        //todo: add query conditions
        //todo: переделать статический вызов на di
        foreach (ModelFactory::all($this->foreignModel) as $foreignObject) {
            $this->parameters['dictionary'][$foreignObject->{CmsCommon::COLUMN_NAME_ID}] = $foreignObject->{$this->foreignDisplayName};
        }

        if ($this->cardinality == 'many') {
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


}