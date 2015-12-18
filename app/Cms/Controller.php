<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace App\Cms;

use App\Cms\Components\CmsList;
use App\Cms\Components\CmsForm;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use TwigBridge\Facade\Twig;

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

    /** @var  Request */
    protected $request;

    /**
     * Get module
     *
     * @param Request $request
     * @param $group
     * @param $module
     * @param null $params
     * @return \Illuminate\Http\JsonResponse
     */
    public function module(Request $request, $group = null, $module = null, $params = null)
    {
        $this->group = $group;
        $this->module = $module;
        $this->request = $request;

        $this->config = (new Config())->load($group, $module);
        if ($group && !$module) {
            return redirect('/cms/' . $group . '/' . array_keys($this->config->get('structure')[$group]['sections'])[0]);

        }

        if ($group && $module && !$this->config->get('module')) {
            // todo: это необязательно, если у нас полностью кастомный обработчик
            abort(404);
        }

        //todo: сомнения в красоте
        $this->config->set('module.baseUrl', '/cms/' . $group . '/' . $module);

        $this->parameters = $this->processParameters($params);

        //todo: process config structure with permissions
        //todo: process module config with permissions
        switch (request()->method()) {
            case 'GET':
                return $this->get();
                break;
            case 'POST':
                return $this->post();
                break;
            case 'DELETE':
                break;
        }

        return '';
    }

    protected function processParameters($params)
    {
        $params = explode('/', trim($params, '/ '));
        // todo: корректная обработка, если у нас добавляется уровень там (или не один)
        if ($params[0] == 'create') {
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
                return $this->showObjectsListPage();
                break;
            case self::ACTION_EDIT_OBJECT:
                return $this->showEditObjectFormPage();
                break;
            case self::ACTION_CREATE_OBJECT:
                return $this->showCreateObjectFormPage();
                break;
        }
    }

    /**
     * toggle[model][id][field]=..
     * save[model][id][field]=..
     * add[model][][field]=..
     *
     * todo: вынести все эти ебические циклы в общий алгоритм, куда просто передавать колбэк
     */
    protected function post()
    {
        $input = $this->request->all();
        $countOfSets = 0;
        if (Arr::has($input, 'toggle')) {
            $toggleResult = [];
            foreach ($input['toggle'] as $modelName => $data) {
                $fullModelName = 'App\Models\\' . Str::studly($modelName);
                if (!class_exists($fullModelName)) {
                    throw new \Exception('Cannot find class ' . $fullModelName);
                }
                if (is_array($data)) {
                    foreach ($data as $id => $keyValue) {
                        $object = call_user_func([$fullModelName, 'find'], $id);
                        if ($object) {
                            foreach (array_keys($keyValue) as $fieldName) {
                                $countOfSets++;
                                $object->$fieldName ^= 1;
                                $toggleResult[$modelName][$id][$fieldName] = $object->$fieldName;
                            }
                            $object->save();
                        }
                    }
                }
            }
            if ($countOfSets == 1) {
                // адская конструкция для доступа к конкретному единственному значению многомерного массива
                $singleElementFieldValue = array_values(array_values(array_values($toggleResult)[0])[0])[0];
                return response()->json($singleElementFieldValue);
            } else {
                return response()->json($toggleResult);
            }
        }
        if (Arr::has($input, 'create')) {
            foreach ($input['create'] as $modelName => $data) {
                $fullModelName = 'App\Models\\' . Str::studly($modelName);
                if (!class_exists($fullModelName)) {
                    throw new \Exception('Cannot find class ' . $fullModelName);
                }
                if (is_array($data)) {
                    foreach ($data as $keyValue) {
                        /** @var Model $object */
                        $object = new $fullModelName();
                        foreach ($keyValue as $fieldName => $value) {
                            if (!$object->$fieldName instanceof \Illuminate\Database\Eloquent\Collection) {
                                // todo: учитывать описания полей из общей схемы данных (которой пока нет :))
                                if (in_array($fieldName, $object->getDates())) {
                                    $object->$fieldName = (new \DateTime($value))->format('Y-m-d H:i:s');
                                } else {
                                    $object->$fieldName = $value;
                                }
                            }
                        }
                        $object->save();
                        foreach ($keyValue as $fieldName => $value) {
                            if ($object->$fieldName instanceof \Illuminate\Database\Eloquent\Collection) {
                                $object->$fieldName()->sync(array_keys($value));
                            }
                        }
                    }
                }
            }
        }
        if (Arr::has($input, 'save')) {
            foreach ($input['save'] as $modelName => $data) {
                $fullModelName = 'App\Models\\' . Str::studly($modelName);
                if (!class_exists($fullModelName)) {
                    throw new \Exception('Cannot find class ' . $fullModelName);
                }
                if (is_array($data)) {
                    foreach ($data as $id => $keyValue) {
                        /** @var Model $object */
                        $object = call_user_func([$fullModelName, 'find'], $id);
                        if ($object) {
                            foreach ($keyValue as $fieldName => $value) {
                                if ($object->$fieldName instanceof \Illuminate\Database\Eloquent\Collection) {
                                    $object->$fieldName()->sync(array_keys($value));
                                } else {
                                    // todo: учитывать описания полей из общей схемы данных (которой пока нет :))
                                    if (in_array($fieldName, $object->getDates())) {
                                        $object->$fieldName = (new \DateTime($value))->format('Y-m-d H:i:s');
                                    } else {
                                        $object->$fieldName = $value;
                                    }
                                }
                            }
                            $object->save();
                        }
                    }
                }
            }
        }
    }

    protected function showObjectsListPage()
    {
        $list = new CmsList($this->config->part('module'));
        $listData = $list->display();
        $params = [
            'list' => $listData,
            'pageTitle' => $this->config->get('strings.title') ?: 'Список объектов'
        ];


        return $this->renderPage('listPage', $params);
    }

    protected function showEditObjectFormPage()
    {
        $form = (new CmsForm($this->config->part('module')))->setEditedObject($this->objectId);
        $formData = $form->display();
        $params = [
            'form' => $formData,
            'pageTitle' => $this->config->get('strings.editTitle') ?: 'Редактирование объекта'
        ];

        return $this->renderPage('formPage', $params);
    }

    protected function showCreateObjectFormPage()
    {
        $form = (new CmsForm($this->config->part('module')));
        $formData = $form->display();
        $params = [
            'form' => $formData,
            'pageTitle' => $this->config->get('strings.editTitle') ?: 'Редактирование объекта'
        ];

        return $this->renderPage('formPage', $params);
    }

    protected function renderPage($template, $params)
    {
        $params = array_merge($params, [
            'currentPathSections' => [$this->group, $this->module],
            'cmsStructure' => $this->config->get('structure'),
            'moduleConfig' => $this->config->get('module'),
        ]);

        return Twig::render($template, $params);

    }

}