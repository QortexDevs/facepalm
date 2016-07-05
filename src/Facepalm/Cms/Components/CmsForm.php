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

namespace Facepalm\Cms\Components;

use Facepalm\Cms\Fields\Types\TextField;
use Facepalm\Models\ModelFactory;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Mockery\CountValidator\Exception;

class CmsForm extends CmsComponent
{
    protected $fields = [];

    /** @var BaseEntity */
    protected $editedObject;

    /**
     * @param Repository $config
     * @param bool $processFieldSet
     * @return $this
     */
    public function setupFromConfig(Repository $config, $processFieldSet = true)
    {
        $this->setMainModel($config->get('model'));

        if ($processFieldSet) {
            $this->fieldSet->process($config->get('form.fields'), $config->get('titles'));
        }

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
                    $this->editedObject = ModelFactory::find($this->modelName, $object);
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
    public function build()
    {
        if (!$this->modelName) {
            throw new \InvalidArgumentException('No model defined');
        }
        $randomId = Str::quickRandom(6);
        foreach ($this->fieldSet->getFields() as $field) {
            $field->setParameters([
                'randomId' => $randomId,
                'modelName' => $this->modelName
            ]);
            $field->prepareData($this->editedObject, $this->fieldSet);
        }

        $output = [
            'fields' => $this->fieldSet->getFields(),
            'object' => $this->editedObject,
            'singleFieldWysiwygMode' => count($this->fieldSet->getFields()) === 1 && $this->fieldSet->getFields()[array_keys($this->fieldSet->getFields())[0]] instanceof TextField
        ];

        return $output;
    }


    /**
     * @param $render
     * @param string $templateName
     * @return mixed
     * @throws \Exception
     */
    public function render($render, $templateName = 'facepalm::components/form/container')
    {
        return $render->render($templateName, [
            'form' => $this->build(),
        ]);
    }


}