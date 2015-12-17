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

namespace App\Cms;

use Carbon\Carbon;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
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
            ->setMainModel($config->get('model'));
        return $this;
    }

    public function setFields($fields, $titles = null)
    {
        $processed = CmsCommon::processFieldsList($fields, $titles);
        $this->fields = $processed['fields'];
        $this->relatedModels = $processed['relatedModels'];

        return $this;
    }

    public function setEditedObject($object)
    {
        if ($object) {
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
        // get query builder with all records (dummy clause)
        if (!$this->modelName) {
            throw new \Exception('No model defined');
        }

        $relatedDictionaries = [];
        if ($this->relatedModels) {
            foreach ($this->relatedModels as $relatedModelName) {
                //todo: add query conditions
                $relatedDictionaries[$relatedModelName] = call_user_func([
                    CmsCommon::getFullModelClassName($relatedModelName),
                    'all'
                ]);
            }
        }

        foreach ($this->fields as $fieldName => $field) {
            //todo: format displayname in config with placeholders-string
            if ($field['type'] == CmsCommon::COLUMN_TYPE_RELATION) {
                $this->fields[$fieldName]['dictionary'] = [];
                foreach ($relatedDictionaries[$this->fields[$fieldName]['foreignModel']] as $item) {
                    $this->fields[$fieldName]['dictionary'][$item->id] = $item->__get($this->fields[$fieldName]['foreignDisplayName']);
                }
                if ($field['cardinality'] == 'many') {
                    //todo: тоже что-то не очень нравится :(
                    if ($this->editedObject) {
                        $this->fields[$fieldName]['relations'] = [];
                        $relatedItems = $this->editedObject->__get($field['collectionName']);
                        foreach ($relatedItems as $relatedItem) {
                            $this->fields[$fieldName]['relations'][] = $relatedItem->id;
                        }
                    }
                }
            }
        }

        $output = [
            'settings' => [
            ],
            'meta' => [
                'model' => class_basename($this->modelName),
                'fields' => $this->fields,
                'fieldNameBase' =>
                    $this->editedObject
                        ? 'save[' . class_basename($this->modelName) . '][' . $this->editedObject->id . ']'
                        : 'create[' . class_basename($this->modelName) . '][' . Str::quickRandom() . ']'
            ],
            'object' => $this->editedObject

        ];

//        dd((new \App\Models\User())->roles instanceof \Illuminate\Database\Eloquent\Collection);

        return $output;
    }


}