<?php
/**
 *
 * Вариант создания из кода
 * $list = (new CmsList())
 * ->setColumns([
 * 'name' => ['title' => 'ФИО'],
 * 'email' => 1,
 * 'updated_at' => ['type' => CmsList::COLUMN_TYPE_DATETIME],
 * 'role.name' => 1
 * ], [
 * 'Имя',
 * 'Email',
 * 'updated_at',
 * 'Роль'
 * ])
 * ->setMainModel('User'); *
 */

namespace App\Facepalm\Components;

use App\Facepalm\CmsCommon;
use App\Facepalm\Fields\FieldListProcessor;
use App\Facepalm\Fields\Types\RelationField;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Str;
use Mockery\CountValidator\Exception;

class CmsForm extends CmsComponent
{
    protected $fields = [];
    protected $relatedModels = [];
    protected $modelName = null;
    protected $editedObject = null;


    /**
     * @param Repository $config
     * @return $this
     */
    public function buildFromConfig($config)
    {
        $this->setFields($config->get('form.fields'), $config->get('titles'))
            ->setBaseUrl($config->get('baseUrl'))
            ->setMainModel($config->get('model'));
        return $this;
    }

    /**
     * @param $object
     * @return $this
     */
    public function setEditedObject($object)
    {
        if ($object) {
            // todo: когда будем делать аозможность "неуказания" модели, не забыть исправить это
            if ($object instanceof $this->modelName) {
                $this->editedObject = $object;
            } elseif ((int)$object) {
                if ($this->modelName) {
                    $this->editedObject = call_user_func([$this->modelName, 'find'], $object);
                    if (!$this->editedObject) {
                        throw new Exception('Object with id:' . $object . ' not found');
                    }
                }
            }
        }
        return $this;
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function display()
    {
        if (!$this->modelName) {
            throw new \Exception('No model defined');
        }

        //todo: prepareData();
//        $relatedDictionaries = [];
//        if ($this->relatedModels) {
//            foreach ($this->relatedModels as $relatedModelName) {
//                //todo: add query conditions
//                $relatedDictionaries[$relatedModelName] = call_user_func([
//                    CmsCommon::getFullModelClassName($relatedModelName),
//                    'all'
//                ]);
//            }
//        }

        foreach ($this->fieldsProcessor->getFields() as $field) {
            $field->setParameters([
                'fieldNameBase' => $this->editedObject
                    ? 'save[' . class_basename($this->modelName) . '][' . $this->editedObject->id . ']'
                    : 'create[' . class_basename($this->modelName) . '][' . Str::quickRandom() . ']'
            ]);

            //todo: format displayname in config with placeholders-string
            //todo: перенести это все потом внутрь самого поля!
            if ($field instanceof RelationField) {
//                $this->fields[$field->name]['dictionary'] = [];
//                foreach ($relatedDictionaries[$this->fields[$field->name]['foreignModel']] as $item) {
//                    $this->fields[$field->name]['dictionary'][$item->id] = $item->__get($this->fields[$field->name]['foreignDisplayName']);
//                }
//                if ($field['cardinality'] == 'many') {
//                    //todo: тоже что-то не очень нравится :(
//                    if ($this->editedObject) {
//                        $this->fields[$field->name]['relations'] = [];
//                        $relatedItems = $this->editedObject->__get($field['collectionName']);
//                        foreach ($relatedItems as $relatedItem) {
//                            $this->fields[$field->name]['relations'][] = $relatedItem->id;
//                        }
//                    }
//                }
            }
        }

        $output = [
            'fields' => $this->fieldsProcessor->getFields(),
            'object' => $this->editedObject

        ];

        return $output;
    }


}