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

namespace app\Cms;

use Carbon\Carbon;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class CmsForm extends CmsComponent
{
    protected $fields = [];
    protected $modelName = null;


    /**
     * @param Repository $config
     * @return $this
     */
    public function buildFromConfig($config)
    {
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
        ];

        return $output;
    }


}