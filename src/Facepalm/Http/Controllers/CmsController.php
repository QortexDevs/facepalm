<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Facepalm\Tools\Tree;
use Facepalm\Models\User;
use TwigBridge\Facade\Twig;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Facepalm\Cms\Config\Config;
use Facepalm\Tools\AssetsBuster;
use Facepalm\Models\ModelFactory;
use Facepalm\Cms\PermissionManager;
use Facepalm\Cms\Components\CmsList;
use Facepalm\Cms\Components\CmsForm;
use Facepalm\PostProcessing\AmfProcessor;
use Illuminate\Foundation\Application;
use Illuminate\Routing\Controller as BaseController;

class CmsController extends BaseController
{
    const ACTION_LIST_OBJECTS = 1;
    const ACTION_EDIT_OBJECT = 2;
    const ACTION_CREATE_OBJECT = 3;

    const LAYOUT_SIMPLE = 1;
    const LAYOUT_TWO_COLUMN = 2;

    /** @var  User */
    protected $user;

    /** @var Config */
    protected $config;

    /** @var  Request */
    protected $request;

    /** @var  Application */
    protected $app;

    /** @var \Twig_Environment */
    protected $renderer;

    /** @var  PermissionManager */
    protected $permissionManager;

    /** @var  string */
    protected $group, $module, $baseUrl, $baseUrlNav;

    /** @var  array */
    protected $parameters;

    /** @var  integer */
    protected $objectId;

    /** @var  integer */
    protected $navigationId;

    /** @var  integer */
    protected $action;

    /** @var  bool */
    protected $isDifferentNavModel;


    /** @var  string */
    protected $layoutMode;


    /**
     * CmsController constructor.
     * @param Application $app
     * @param Request $request
     * @param User $user
     * @param PermissionManager $pm
     *
     * @noinspection MoreThanThreeArgumentsInspection
     */
    public function __construct(Application $app, Request $request, User $user, PermissionManager $pm)
    {
        $this->setupLocale();

        $this->app = $app;
        $this->user = $user;
        $this->request = $request;
        $this->permissionManager = $pm;
        $this->renderer = $this->app->make('twig');
    }

    /**
     * Get module
     *
     * @param $group
     * @param $module
     * @param null $params
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     *
     */
    public function handle($group = null, $module = null, $params = null)
    {

        $this->group = $group;
        $this->module = $module;
        $this->config = $this->permissionManager->filterCmsStructureWithPermissions(Config::fromFile($group, $module));

        // Abort 404 if user has no access
        $this->permissionManager->checkAccess($this->config, $group, $module);

        if ($group) {
            if (!$module) {
                return redirect('/cms/' . $group . '/' . array_keys($this->config->get('structure')[$group]['sections'])[0]);
            }

            if ($module && !$this->config->get('module')) {
                // todo: это необязательно, если у нас полностью кастомный обработчик
                abort(404);
            }

            $this->baseUrl = $this->baseUrlNav = '/cms/' . $group . '/' . $module;

            if ($this->config->get('module.navigation')) {
                $this->layoutMode = self::LAYOUT_TWO_COLUMN;
            } else {
                $this->layoutMode = self::LAYOUT_SIMPLE;
            }

            $this->parameters = $this->processParameters($params);
        }

        switch ($this->request->method()) {
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
     *
     */
    protected function setupLocale()
    {
        $locale = config('app.cmsLocale') ?: config('app.locale');
        if ($locale) {
            app()->setLocale($locale);
        }
    }


    /**
     * @param $params
     * @return array
     */
    protected function processParameters($params)
    {
        $params = explode('/', trim($params, '/ '));

        if ($this->config->get('module.navigation') && (int)Arr::get($params, 0)) {
            $this->navigationId = (int)Arr::get($params, 0);

            // If navigation entity is not editing entity, remove first (navigation) id from parameters
            if ($this->config->get('module.navigation.model') !== $this->config->get('module.model')) {
                array_shift($params);
                $this->isDifferentNavModel = true;
                $this->baseUrl .= ('/' . $this->navigationId);
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
     * @throws \Exception
     */
    protected function get()
    {
        if ($this->group) {
            $moduleContent = '';
            if ($this->layoutMode === self::LAYOUT_TWO_COLUMN && !$this->navigationId) {
                $moduleContent = $this->showTwoColumnIndexPage();
            } else {
                switch ($this->action) {
                    case self::ACTION_LIST_OBJECTS:
                        $moduleContent = $this->showObjectsListPage();
                        break;
                    case self::ACTION_EDIT_OBJECT:
                    case self::ACTION_CREATE_OBJECT:
                        $moduleContent = $this->showEditObjectFormPage();
                        break;
                }
            }
        } else {
            $moduleContent = $this->showCmsDashboard();
        }

        return $this->renderPage('facepalm::layouts/base', $moduleContent);
    }

    /**
     * @return mixed
     * @throws \Exception
     */
    protected function showCmsDashboard()
    {
        return [
            'moduleContent' => $this->renderer->render(
                'facepalm::modulePages/cmsDashboard',
                [
                    'cmsStructure' => $this->config->get('structure'),
                    'palette' => [
                        '#dcedc1',
                        '#f2ecc8',
                        '#ffd3b6',
                        '#c3dff9',
                        '#a8e6cf',
                        '#b9e7ae',
                        '#dfd7da',
                        '#d5f4f0',
                        '#d9ecff',
                        '#d0ecc5',
                        '#e4ffd3',
                        '#ffe3ad',
                        '#ffaaa5',
                        '#ff8b94',
                        '#f0d6bb',
                        '#f2ecc8',
                        '#dbbac7',
                        '#c1f0d0',
                    ]
                ]
            ),
            'pageTitle' => 'Welcome'
        ];
    }

    /**
     * @return mixed
     * @throws \Twig_Error_Loader
     * @throws \Exception
     */
    protected function showTwoColumnIndexPage()
    {
        return [
            'moduleContent' => $this->renderer->render('facepalm::modulePages/twoColumnIndex'),
            'pageTitle' => $this->config->get('module.strings.title') ?: 'Список объектов'
        ];
    }


    /**
     * @return mixed
     * @throws \Exception
     */
    protected function showObjectsListPage()
    {
        $list = (new CmsList($this->config->part('module')))->setBaseUrl($this->baseUrl);

        if ($this->navigationId && $this->isDifferentNavModel) {
            $list->setAdditionalConstraints(function ($builder) {
                //todo: имя поля может быть установлено из вне
                $relationField = Str::snake($this->config->get('module.navigation.model')) . '_id';
                return $builder->where($relationField, $this->navigationId);
            });
        }

        $params = [
            'buttonsPanel' => (bool)$this->config->get('module.list.treeMode'),
            'listHtml' => $list->render($this->renderer),
        ];

        return [
            'moduleContent' => $this->renderer->render('facepalm::modulePages/list', $params),
            'pageTitle' => $this->config->get('module.strings.title') ?: 'Список объектов'
        ];

    }

    /**
     * @return mixed
     * @throws \Exception
     */
    protected function showEditObjectFormPage()
    {
        $defaultPageTitle = $this->objectId ? 'Редактирование объекта' : 'Создание объекта';
        $form = (new CmsForm($this->config->part('module'), $this->config))->setEditedObject($this->objectId);

        if ($this->navigationId && $this->isDifferentNavModel) {
            //todo: имя поля может быть установлено из вне
            $relationField = Str::snake($this->config->get('module.navigation.model')) . '_id';
            $form->prependHiddenField($relationField, $this->navigationId);
        }

        $params = [
            'formHtml' => $form->render($this->renderer),
            'justCreated' => $this->request->input('justCreated'),
        ];

        return [
            'moduleContent' => $this->renderer->render('facepalm::modulePages/form', $params),
            'pageTitle' => $this->config->get('strings.editTitle') ?: $defaultPageTitle
        ];

    }


    /**
     * Render whole CMS page
     * @param $template
     * @param $params
     * @return mixed
     */
    protected function renderPage($template = 'facepalm::layouts/base', array $params = array())
    {
        $assetsBuster = new AssetsBuster();
        $assetsBusters = $assetsBuster->getCmsBusters();

        $userpic = $this->user->images()->ofGroup('avatar')->first();
        $params = array_merge($params, [
            'user' => $this->user,
            'baseUrl' => $this->baseUrl,
            'assetsBusters' => $assetsBusters,
            'moduleConfig' => $this->config->get('module'),
            'assetsPath' => config('app.facepalmAssetsPath'),
            'cmsStructure' => $this->config->get('structure'),
            'currentPathSections' => [$this->group, $this->module],
            'userpic' => $userpic ? $userpic->getUri('200x200') : '',
            'navigation' => $this->layoutMode === self::LAYOUT_TWO_COLUMN ? $this->renderNavigationMenu() : '',
        ]);


        return Twig::render($template, $params);

    }

    /**
     * Additional navigation tree menu
     * @return string
     */
    protected function renderNavigationMenu()
    {
        $skip = (array)$this->config->get('module.navigation.skip');
        $model = (string)$this->config->get('module.navigation.model');
        $showRoot = (boolean)$this->config->get('module.navigation.showRoot');

        $sectionsCollection = ModelFactory::builderFor($model)
            ->whereNotIn('id', $skip ?: [])
            ->orderBy('show_order')
            ->get();

        $tree = Tree::fromEloquentCollection($sectionsCollection);

        return $tree->render(
            $this->renderer,
            'facepalm::layouts/menu/navigationItem',
            0,
            $showRoot,
            [
                'baseUrlNav' => $this->baseUrlNav,
                'navigationId' => $this->navigationId
            ]
        );
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