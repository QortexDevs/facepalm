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

        $output = [
            'settings' => [
            ],
            'meta' => [
                'model' => class_basename($this->modelName),
                'fields' => $this->fields,
                'fieldNameBase' => 'save[' . class_basename($this->modelName) . '][' . $this->editedObject->id . ']'
            ],
            'object' => $this->editedObject

        ];
        return $output;
    }


}