<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace App\Facepalm\Controllers;

use App\Facepalm\Cms\Components\CmsList;
use App\Facepalm\Cms\Components\CmsForm;
use App\Facepalm\Cms\Config\Config;
use App\Facepalm\Models\File;
use App\Facepalm\Models\Image;
use App\Facepalm\PostProcessing\AmfProcessor;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\File\MimeType\MimeTypeGuesser;
use TwigBridge\Facade\Twig;

trait ModuleTrait
{
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

        if ($request->input('ping')) {
            return 'ok';
        }

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
        }

        return '';
    }


    /**
     * @param $params
     * @return array
     */
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

    /**
     * @return mixed
     */
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
     * @return mixed
     * @throws \Exception
     */
    protected function showObjectsListPage()
    {
        $list = new CmsList($this->config->part('module'));
        $listData = $list->prepareData();
        $params = [
            'list' => $listData,
            'pageTitle' => $this->config->get('strings.title') ?: 'Список объектов'
        ];


        return $this->renderPage('listPage', $params);
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    protected function showEditObjectFormPage()
    {
        $form = (new CmsForm($this->config->part('module')))->setEditedObject($this->objectId);
        $formData = $form->display();
        $params = [
            'form' => $formData,
            'justCreated' => $this->request->input('justCreated'),
            'pageTitle' => $this->config->get('strings.editTitle') ?: 'Редактирование объекта'
        ];

        return $this->renderPage('formPage', $params);
    }

    /**
     * @return mixed
     * @throws \Exception
     */
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

    /**
     * AMF (Action-Model-Fields) processing
     * toggle[model][id][field]=..
     * save[model][id][field]=..
     * add[model][][field]=..
     */
    protected function post()
    {
        $amfProcessor = new AmfProcessor();
        $amfProcessor->process($this->request->all());

        //todo:
        //todo: продумать нормальный возврат!
        //todo: события до, после и вместо!!!!
        if (Arr::has($amfProcessor->getAffectedFields(), 'toggle')) {
            // todo: какашка какая-то
            if ($amfProcessor->getAffectedFieldsCount() == 1) {
                // адская конструкция для доступа к конкретному единственному значению многомерного массива
                $singleElementFieldValue = array_values(array_values(array_values($amfProcessor->getAffectedFields()['toggle'])[0])[0])[0];
                return response()->json($singleElementFieldValue);
            } else {
                return response()->json($amfProcessor->getAffectedFields()['toggle']);
            }
        }
        if (Arr::has($amfProcessor->getAffectedObjects(), "create")) {
            if ($amfProcessor->getAffectedObjectsCount() == 1) {
                $id = array_values($amfProcessor->getAffectedObjects()['create'])[0][0];
                return response()->json($id);
            }
        }
        if ($files = Arr::get($amfProcessor->getAffectedObjects(), 'upload')) {
            return response()->json(array_values($files)[0]);
        }
    }
}