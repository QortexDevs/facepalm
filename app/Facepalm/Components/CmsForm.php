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
use App\Facepalm\ModelFactory;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Database\Eloquent\Model;
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
     * @param int|null|Model $object
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
                    $this->editedObject = ModelFactory::getById($this->modelName, $object);
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

        foreach ($this->fieldsProcessor->getFields() as $field) {
            $field->setParameters([
                'fieldNameBase' => $this->editedObject
                    ? 'save[' . class_basename($this->modelName) . '][' . $this->editedObject->id . ']'
                    : 'create[' . class_basename($this->modelName) . '][%CREATE_' . Str::quickRandom(6) . '%]'
            ]);
            $field->prepareData($this->editedObject);

        }

        $output = [
            'fields' => $this->fieldsProcessor->getFields(),
            'object' => $this->editedObject

        ];

        return $output;
    }


}