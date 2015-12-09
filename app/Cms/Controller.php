<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace App\Cms;

use Illuminate\Routing\Controller as BaseController;
use Illuminate\Config\Repository;

class Controller extends BaseController
{
    const ACTION_LIST_OBJECTS = 1;
    const ACTION_EDIT_OBJECT = 2;
    const ACTION_CREATE_OBJECT = 3;


    /** @var Config */
    protected $config;

    /** @var  string */
    protected $group, $module;

    /** @var  array */
    protected $parameters;

    /** @var  integer */
    protected $objectId;

    /** @var  integer */
    protected $action;


    /**
     * Get module
     *
     * @param $group
     * @param $module
     * @param null $params
     * @return \Illuminate\Http\JsonResponse
     */
    public function module($group = null, $module = null, $params = null)
    {
        $this->group = $group;
        $this->module = $module;

        $this->config = (new Config())->load($group, $module);
        if ($group && $module && !$this->config->get('module')) {
            // todo: это необязательно, если у нас полностью кастомный обработчик
            abort(404);
        }

        $this->parameters = $this->processParameters($params);

        //todo: process config structure with permissions
        //todo: process module config with permissions
        switch (request()->method()) {
            case 'GET':
                return $this->get();
                break;
            case 'POST':
                break;
            case 'DELETE':
                break;
        }

        return '';
    }

    protected function processParameters($params)
    {
        // todo: корректная обработка, если у нас добавляется уровень там (или не один)
        if ($params == 'create') {
            $this->objectId = null;
            $this->action = self::ACTION_CREATE_OBJECT;
            array_shift($params);
        } elseif ((int)$params[0]) {
            $this->objectId = $params[0];
            $this->action = self::ACTION_EDIT_OBJECT;
            array_shift($params);
        } else {
            $this->action = self::ACTION_LIST_OBJECTS;
        }
        return $params;
    }

    protected function get()
    {
        switch ($this->action) {
            case self::ACTION_LIST_OBJECTS:
                return $this->showObjectsList();
                break;
            case self::ACTION_EDIT_OBJECT:
                break;
            case self::ACTION_CREATE_OBJECT:
                break;
        }
    }

    protected function showObjectsList()
    {
        $list = new CmsList($this->config->part('module'));
        dd($list->display());
    }

}