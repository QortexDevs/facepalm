<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\CmsCommon;
use Facepalm\Cms\Components\CmsForm;
use Facepalm\Cms\Components\CmsList;
use Facepalm\Cms\Fields\AbstractField;
use Facepalm\Cms\Fields\FieldFactory;
use Facepalm\Cms\Fields\FieldSet;
use Facepalm\Models\ModelFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
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
     * todo: т.к., например грузить словарь можно и без объекта
     *
     * @param null|Model $object
     */
    public function prepareData($object = null)
    {
        if ($this->relationType === 'hasMany') {
            if ($object) {
                $modelName = Str::ucfirst(Str::singular($this->foreignModel));
                $constantField = Str::lower(class_basename($object) . "_id");
                $constantValue = $object->id;

                /** @var FieldSet $fieldSet */
                $fieldSet = app()->make('CmsFieldSet')->setRender($this->render);
                $fieldSet->process($this->parameters['form']);
                $fieldSet->prependHiddenField($constantField, $constantValue);

                /** @var CmsList $list */
                $list = app()->make('CmsList', [$fieldSet])
                    ->setMainModel($modelName)
                    ->setTreeRoot(0)
                    ->toggleTreeMode(true)
                    ->togglePlainTreeMode(true)
                    ->toggleStatusButtonColumn(false)
                    ->toggleAddButton(true)
                    ->setAdditionalConstraints(function ($builder) use ($constantField, $constantValue) {
                        return $builder->where($constantField, $constantValue);
                    });

                $this->parameters['listHtml'] = $list->render($this->render);
            } else {
                $this->setSkipped(true);
            }
        } else {
            //todo: add query conditions
            //todo: переделать статический вызов на di
            $cacheKey = "dictionary_" . md5($this->name . json_encode($this->filter) . $this->concat . $this->withSearch);
            if (Cache::store('array')->has($cacheKey)) {
                $this->parameters['dictionary'] = Cache::store('array')->get($cacheKey);
            } else {

                if ($this->filter) {
                    $builder = ModelFactory::builderFor($this->foreignModel);
                    foreach ($this->filter as $field => $value) {
                        $builder->where($field, $value);
                    }
                    $items = $builder->get();
                } else {
                    $items = ModelFactory::builderFor($this->foreignModel);
                    if (Arr::has($this->parameters, 'customConstraint')) {
                        $fieldFactory = new FieldFactory();
                        $className = '\\' . $fieldFactory->dottedNotationToNamespace($this->parameters['customConstraint']);
                        $filter = app()->make($className);
                        $items = $filter->filter($items);
                    }

                    $fullModelName = ModelFactory::getFullModelClassName($this->foreignModel);
                    if (method_exists($fullModelName, 'textItems')) {
                        $items->with('textItems');
                    }
                    $items = $items->get();
                }

                $concatMatches = null;
                if (Arr::has($this->parameters, 'concat')) {
                    preg_match_all('/%(.*?)%/', $this->parameters['concat'], $concatMatches);
                }

                foreach ($items as $foreignObject) {
                    $concat = "";
                    $isConcatEmpty = true;
                    if ($concatMatches && $concatMatches[0]) {
                        $concat = $this->parameters['concat'];
                        foreach ($concatMatches[0] as $k => $v) {
                            if ($foreignObject->{$concatMatches[1][$k]}) {
                                $isConcatEmpty = false;
                                $concat = str_replace($v, $foreignObject->{$concatMatches[1][$k]}, $concat);
                            }
                        }
                        if (!$isConcatEmpty && $concat && Arr::get($this->parameters, 'withSearch')) {
                            $concat = '%|' . $concat;
                        }
                    }
                    $this->parameters['dictionary'][$foreignObject->{CmsCommon::COLUMN_NAME_ID}] = $foreignObject->{$this->foreignDisplayName} . ($isConcatEmpty ? '' : '' . $concat);
                }

                asort($this->parameters['dictionary']);
                Cache::store('array')->put($cacheKey, $this->parameters['dictionary'], 1);
            }

            if ($this->cardinality === 'many') {

                if ($object) {
                    //todo: format displayname in config with placeholders-string
                    //todo: add query conditions
                    $relatedItems = $object->{$this->collectionName};
                    $this->parameters['relations'] = [];
                    foreach ($relatedItems as $relatedItem) {
                        $this->parameters['relations'][] = $relatedItem->{CmsCommon::COLUMN_NAME_ID};
                    }
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