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

namespace App\Facepalm\Cms\Components;

use App\Facepalm\Models\ModelFactory;
use App\Facepalm\Models\Image;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Mockery\CountValidator\Exception;
use TwigBridge\Facade\Twig;

class CmsForm extends CmsComponent
{
    protected $fields = [];
    protected $relatedModels = [];
    protected $modelName = null;

    /** @var BaseEntity */
    protected $editedObject = null;


    /**
     * @param Repository $config
     * @return $this
     */
    public function configure($config)
    {
        parent::configure($config);

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
            throw new \Exception('No model defined');
        }

        $amfNameBase = $this->editedObject
            ? '[' . class_basename($this->modelName) . '][' . $this->editedObject->id . ']'
            : '[' . class_basename($this->modelName) . '][%CREATE_' . Str::quickRandom(6) . '%]';

        foreach ($this->fieldsProcessor->getFields() as $field) {
            $field->setParameters([
                'uploadName' => 'upload' . $amfNameBase,
                'fieldNameBase' => $this->editedObject
                    ? 'save' . $amfNameBase
                    : 'create' . $amfNameBase
            ]);
            $field->prepareData($this->editedObject);

        }

        $output = [
            'fields' => $this->fieldsProcessor->getFields(),
            'object' => $this->editedObject

        ];

        return $output;
    }


    /**
     * @param $render
     * @param string $templateName
     * @return mixed
     * @throws \Exception
     */
    public function render($render, $templateName = 'components/form/container.twig')
    {
        return $render->render($templateName, [
            "form" => $this->build(),
            "moduleConfig" => $this->config,
        ]);
    }


}