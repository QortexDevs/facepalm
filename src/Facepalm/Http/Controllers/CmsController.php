<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Facepalm\Cms\Components\CmsList;
use Facepalm\Cms\Components\CmsForm;
use Facepalm\Cms\Config\Config;
use Facepalm\Models\File;
use Facepalm\Models\Image;
use Facepalm\Models\ModelFactory;
use Facepalm\Models\SiteSection;
use Facepalm\PostProcessing\AmfProcessor;
use Facepalm\Tools\Tree;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\MimeType\MimeTypeGuesser;
use TwigBridge\Facade\Twig;

class CmsController extends BaseController
{
    const ACTION_LIST_OBJECTS = 1;
    const ACTION_EDIT_OBJECT = 2;
    const ACTION_CREATE_OBJECT = 3;

    const LAYOUT_SIMPLE = 1;
    const LAYOUT_TWO_COLUMN = 2;

    /** @var Config */
    protected $config;

    /** @var  string */
    protected $group, $module;

    /** @var  array */
    protected $parameters;

    /** @var  integer */
    protected $objectId;

    /** @var  integer */
    protected $navigationId;

    /** @var  integer */
    protected $action;

    /** @var  Request */
    protected $request;

    /** @var  string */
    protected $layoutMode;

    /**
     * Get module
     *
     * @param Request $request
     * @param $group
     * @param $module
     * @param null $params
     * @return \Illuminate\Http\JsonResponse
     */
    public function handle(Request $request, $group = null, $module = null, $params = null)
    {
        $this->group = $group;
        $this->module = $module;
        $this->request = $request;

        if ($request->input('ping')) {
            return 'pong';
        }

        $this->config = (new Config())->load($group, $module);

        $this->filterCmsStructureWithPermissions();

        if (!$this->config->get('structure')) {
            abort(403);
        }

        if ($group) {
            if (!$module) {
                return redirect('/cms/' . $group . '/' . array_keys($this->config->get('structure')[$group]['sections'])[0]);
            }

            if ($module && !$this->config->get('module')) {
                // todo: это необязательно, если у нас полностью кастомный обработчик
                abort(404);
            }

            //todo: сомнения в красоте
            $this->config->set('module.baseUrl', '/cms/' . $group . '/' . $module);
            $this->config->set('module.baseUrlNav', $this->config->get('module.baseUrl'));

            if ($this->config->get('module.navigation')) {
                $this->layoutMode = self::LAYOUT_TWO_COLUMN;
            } else {
                $this->layoutMode = self::LAYOUT_SIMPLE;
            }

            $this->parameters = $this->processParameters($params);
        }

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
     * @return bool
     */
    protected function filterCmsStructureWithPermissions()
    {
        if (Auth::user()->role->id === 1) {
            return true;
        }
        $acl = Auth::user()->acl ? json_decode(Auth::user()->acl, true) : [];

        $structure = $this->config->get('structure');
        if (!$acl || !Arr::has($acl, '/')) {
            $structure = [];
        }
        foreach ($structure as $sectionName => $data) {
            if (!array_key_exists($sectionName, $acl)) {
                unset($structure[$sectionName]);
            } else {
                if (array_key_exists('sections', $structure[$sectionName])) {
                    foreach ($structure[$sectionName]['sections'] as $subSectionName => $dataNested) {
                        if (!array_key_exists($sectionName . '/' . $subSectionName, $acl)) {
                            unset($structure[$sectionName]['sections'][$subSectionName]);
                        }
                    }
                }
            }
        }
        $this->config->set('structure', $structure);
    }


    /**
     * @param $params
     * @return array
     */
    protected function processParameters($params)
    {
        $params = explode('/', trim($params, '/ '));

        if ($this->config->get('module.navigation')) {
            if ((int)Arr::get($params, 0)) {
                $this->navigationId = (int)Arr::get($params, 0);
                // If navigation entity is not editing entity, remove first (navigation) id from parameters
                if ($this->config->get('module.navigation.model') != $this->config->get('module.model')) {
                    array_shift($params);
                    $this->config->set(
                        'module.baseUrl',
                        $this->config->get('module.baseUrl') . '/' . $this->navigationId
                    );

                }
            }
        }
        if (Arr::get($params, 0) === 'create') {
            $this->objectId = null;
            $this->action = self::ACTION_CREATE_OBJECT;
            array_shift($params);
        } elseif ((int)Arr::get($params, 0)) {
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
        if ($this->group) {
            $moduleContent = '';
            if ($this->layoutMode === self::LAYOUT_TWO_COLUMN && !$this->navigationId) {
                return $this->showDashboardPage();
            }

            switch ($this->action) {
                case self::ACTION_LIST_OBJECTS:
                    $moduleContent = $this->showObjectsListPage();
                    break;
                case self::ACTION_EDIT_OBJECT:
                    $moduleContent = $this->showEditObjectFormPage();
                    break;
                case self::ACTION_CREATE_OBJECT:
                    $moduleContent = $this->showCreateObjectFormPage();
                    break;
            }
        } else {
            $moduleContent = $this->showIndex();
        }

        return $moduleContent;
    }


    /**
     * @return mixed
     * @throws \Exception
     */
    protected function showDashboardPage()
    {
        return $this->renderPage('dashboardPage', []);
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    protected function showIndex()
    {
        return $this->renderPage(
            'indexPage',
            ['pageTitle' => 'Welcome', 'structure' => $this->config->get('structure')]
        );
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    protected function showObjectsListPage()
    {
        $list = new CmsList($this->config->part('module'));
        if ($this->navigationId && $this->config->get('module.navigation.model') != $this->config->get('module.model')) {
            $list->setAdditionalConstraints(function ($builder) {
                //todo: может быть установлен извне
                $relationField = Str::snake($this->config->get('module.navigation.model')) . '_id';
                return $builder->where($relationField, $this->navigationId);
            });
        }
        $params = [
            'buttonsPanel' => !!$this->config->get('module.list.treeMode'),
            'listHtml' => $list->render(app()->make('twig')),
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
        $form = (new CmsForm($this->config->part('module'), $this->config))->setEditedObject($this->objectId);

        if ($this->navigationId && $this->config->get('module.navigation.model') != $this->config->get('module.model')) {
            //todo: может быть установлен извне
            $relationField = Str::snake($this->config->get('module.navigation.model')) . '_id';
            $form->prependHiddenField($relationField, $this->navigationId);
        }

        $params = [
            'formHtml' => $form->render(app()->make('twig')),
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

        if ($this->navigationId && $this->config->get('module.navigation.model') != $this->config->get('module.model')) {
            //todo: может быть установлен извне
            $relationField = Str::snake($this->config->get('module.navigation.model')) . '_id';
            $form->prependHiddenField($relationField, $this->navigationId);
        }

        $params = [
            'formHtml' => $form->render(app()->make('twig')),
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

    /**
     * @param $template
     * @param $params
     * @return mixed
     */
    protected function renderPage($template, $params)
    {
        //todo: вынести в какую-то общую тулзу
        $assetsBusters = array_flip(
            array_map(
                function ($item) {
                    return mb_strpos($item, 'public/') !== false ? mb_substr($item, mb_strlen('public/')) : $item;
                },
                array_flip(@json_decode(@file_get_contents(app()->basePath() . '/busters.json'), true) ?: [])
            )
        );

        if ($this->layoutMode == self::LAYOUT_TWO_COLUMN) {
            $params['navigation'] = (new Tree())
                ->fromEloquentCollection(ModelFactory::builderFor($this->config->get('module.navigation.model'))->orderBy('show_order')->get())
                ->render(0, app()->make('twig'), 'leftNavigationItem', [
                    'moduleConfig' => $this->config->get('module'),
                    'navigationId' => $this->navigationId
                ], true);
        }
//        $params['navigation'] = 'fsdfsdf';
        $userpic = Auth::user()->images()->ofGroup('avatar')->first();
        $params = array_merge($params, [
            'assetsBusters' => $assetsBusters,
            'currentPathSections' => [$this->group, $this->module],
            'cmsStructure' => $this->config->get('structure'),
            'moduleConfig' => $this->config->get('module'),
            'user' => Auth::user(),
            'userpic' => $userpic ? $userpic->getUri('200x200') : ''
        ]);


        return Twig::render($template, $params);

    }
}