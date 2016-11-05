<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Facepalm\Cms\Components\CmsForm;
use Facepalm\Cms\Components\CmsList;
use Facepalm\Cms\Config\Config;
use Facepalm\Cms\Fields\FieldSet;
use Facepalm\Cms\PermissionManager;
use Facepalm\Models\Foundation\BaseEntity;
use Facepalm\Models\Image;
use Facepalm\Models\ModelFactory;
use Facepalm\Models\User;
use Facepalm\PostProcessing\AmfProcessor;
use Facepalm\PostProcessing\UploadProcessor;
use Facepalm\Tools\AssetsBuster;
use Facepalm\Tools\Tree;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

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

    /** @var  FieldSet */
    protected $fieldSet;

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
        $locale = config('facepalm.cmsLocale') ?: config('app.locale');
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
     * Generate and output CMS UI pages
     *
     * @return mixed
     * @throws \Exception
     */
    protected function get()
    {
        if ($this->group) {

            // Setup Field Set and set this instance to service container
            $this->fieldSet = $this->app->make('CmsFieldSet')
                ->setDictionaries($this->config->get('module.dictionaries', []))
                ->setRender($this->renderer)
                ->setAdditionalParameter('config', $this->config);
            // Render page part content
            $moduleContent = '';
            if ($this->layoutMode === self::LAYOUT_TWO_COLUMN && !$this->navigationId) {
                $moduleContent = $this->renderTwoColumnIndexPage();
            } else {
                switch ($this->action) {
                    case self::ACTION_LIST_OBJECTS:
                        $moduleContent = $this->renderObjectsListPage();
                        break;
                    case self::ACTION_EDIT_OBJECT:
                    case self::ACTION_CREATE_OBJECT:
                        $moduleContent = $this->renderEditObjectFormPage();
                        break;
                }
            }
        } else {
            $moduleContent = $this->renderCmsDashboard();
        }

        return $this->renderPage('facepalm::layouts/base', $moduleContent);
    }

    /**
     * Render CMS starting page part
     *
     * @return mixed
     * @throws \Exception
     */
    protected function renderCmsDashboard()
    {
        return [
            'moduleContent' => $this->renderer->render(
                'facepalm::modulePages/cmsDashboard',
                [
                    'cmsStructure' => $this->config->get('structure')
                ]
            ),
            'pageTitle' => 'Welcome'
        ];
    }

    /**
     * Render index page part for two-column layout
     *
     * @return mixed
     * @throws \Twig_Error_Loader
     * @throws \Exception
     */
    protected function renderTwoColumnIndexPage()
    {
        return [
            'moduleContent' => $this->renderer->render('facepalm::modulePages/twoColumnIndex'),
            'pageTitle' => $this->config->get('module.strings.title') ?: 'Список объектов',
        ];
    }


    /**
     * Render List or tree page part
     *
     * @return mixed
     * @throws \Exception
     */
    protected function renderObjectsListPage()
    {

        $defaultPageTitle = $this->config->get('module.strings.title') ?: 'Список объектов';

        /** @var CmsList $list */
        $list = $this->app->make('CmsList', [$this->fieldSet])
            ->setBaseUrl($this->baseUrl)
            ->setupFromConfig($this->config->part('module'));

        // дополнительная фильтрация списка в зависимости от выбора в левом меню
        if ($this->navigationId && $this->isDifferentNavModel) {
            if ($this->config->get('module.navigation.titleField')) {
                $relationObject = ModelFactory::find($this->config->get('module.navigation.model'), $this->navigationId);
                $defaultPageTitle = $relationObject->{$this->config->get('module.navigation.titleField')};
            }

            $list->setAdditionalConstraints(function ($builder) {
                $relationField = Str::snake($this->config->get('module.navigation.model')) . '_id';
                return $builder->where($relationField, $this->navigationId);
            });
        }


        if ($this->config->get('module.constants') && is_array($this->config->get('module.constants'))) {
            foreach ($this->config->get('module.constants') as $constantField => $constantValue) {
                $list->setAdditionalConstraints(function ($builder) use ($constantField, $constantValue) {
                    if ($constantValue === 'not null') {
                        return $builder->whereNotNull($constantField);
                    } else {
                        return $builder->where($constantField, $constantValue);
                    }
                });
            }
        }


        $params = [
            'buttonsPanel' => (bool)$this->config->get('module.list.treeMode'),
            'listHtml' => $list->render($this->renderer),
        ];

        return [
            'moduleContent' => $this->renderer->render('facepalm::modulePages/list', $params),
            'pageTitle' => $defaultPageTitle
        ];

    }

    /**
     * Render form page part
     *
     * @return mixed
     * @throws \Exception
     */
    protected function renderEditObjectFormPage()
    {
        $defaultPageTitle = $this->objectId ? 'Редактирование объекта' : 'Создание объекта';

        if ($this->config->get('module.strings.editTitle')) {
            $defaultPageTitle = $this->config->get('module.strings.editTitle');
        }

        if ($this->navigationId) {
            if ($this->isDifferentNavModel) {
                $relationField = Str::snake($this->config->get('module.navigation.model')) . '_id';
                $this->fieldSet->prependHiddenField($relationField, $this->navigationId);
            } else {
                if ($this->config->get('module.navigation.titleField')) {
                    $relationObject = ModelFactory::find($this->config->get('module.navigation.model'), $this->navigationId);
                    $defaultPageTitle = $relationObject->{$this->config->get('module.navigation.titleField')};
                }
            }
        }

        if ($this->config->get('module.constants') && is_array($this->config->get('module.constants'))) {
            foreach ($this->config->get('module.constants') as $constantField => $constantValue) {
                $this->fieldSet->prependHiddenField($constantField, $constantValue);
            }
        }


        /** @var CmsForm $form */
        $form = $this->app->make('CmsForm', [$this->fieldSet]);

        //todo: refactor this!
        if ($this->config->get('module.forms')) {
            $form->setupFromConfig($this->config->part('module'), false);

            $customForm = null;
            $customForms = $this->config->get('module.forms');
            if ($customForms) {
                foreach ($customForms as $k => $v) {
                    if (Str::startsWith($k, 'for_id_')) {
                        $ids = Str::substr($k, Str::length('for_id_'));
                        if ($ids) {
                            $ids = explode(',', $ids);
                            if (in_array($this->objectId, $ids, true)) {
                                $customForm = $this->config->part('module.forms.' . $k);
                                break;
                            }
                        }
                    }
                }
            }
            if ($customForm && $customForm->get('fields')) {
                if ($customForm->get('model')) {
                    $form->setMainModel($customForm->get('model'));
                }
                if ($customForm->get('fields')) {
                    $this->fieldSet->process($customForm->get('fields'), $this->config->get('module.titles'));
                }
                if ($customForm->get('overrideObjectId')) {
                    //todo: унести это в форму и управлять параметром: createObjectOfNeed
                    if (!ModelFactory::find($customForm->get('model'), $customForm->get('overrideObjectId'))) {
                        $fullModelName = ModelFactory::getFullModelClassName($customForm->get('model'));
                        /** @var BaseEntity $obj */
                        $obj = new $fullModelName();
                        $obj->id = $customForm->get('overrideObjectId');
                        $obj->save();
                    }
                    $form->setEditedObject($customForm->get('overrideObjectId'));
                } else {
                    $form->setEditedObject($this->objectId);
                }
            } else {
                $this->fieldSet->process($this->config->get('module.forms.default.fields'), $this->config->get('module.titles'));
                $form->setEditedObject($this->objectId);
            }
        } else {
            $form->setupFromConfig($this->config->part('module'));
            $form->setEditedObject($this->objectId);
        }


        $params = [
            'creating' => !$this->objectId,
            'formHtml' => $form->render($this->renderer),
            'justCreated' => $this->app->session->get('justCreated'),
        ];

        return [
            'moduleContent' => $this->renderer->render('facepalm::modulePages/form', $params),
            'pageTitle' => $this->config->get('strings.editTitle') ?: $defaultPageTitle
        ];

    }


    /**
     * Render whoel UI page
     *
     * Render whole CMS page
     * @param $template
     * @param $params
     * @return mixed
     */
    protected function renderPage($template = 'facepalm::layouts/base', array $params = array())
    {
        $assetsBuster = new AssetsBuster();
        $assetsBusters = $assetsBuster->getCmsBusters();

        // todo: вынести в конфиг?
        $customCssPath = 'assets/build/cms/css/main.css';
        $customJsPath = 'assets/build/cms/js/all.js';

        $userpic = $this->user->images()->ofGroup('avatar')->first();
        $params = array_merge($params, [
            'user' => $this->user,
            'baseUrl' => $this->baseUrl,
            'assetsBusters' => $assetsBusters,
            'moduleConfig' => $this->config->get('module'),
            'cmsStructure' => $this->config->get('structure'),
            'assetsPath' => config('facepalm.facepalmAssetsPath'),
            'currentPathSections' => [$this->group, $this->module],
            'userpic' => $userpic ? $userpic->getUri('200x200') : '',
            'customJsPath' => is_file(public_path($customJsPath)) ? $customJsPath : '',
            'customCssPath' => is_file(public_path($customCssPath)) ? $customCssPath : '',
            'navigation' => $this->layoutMode === self::LAYOUT_TWO_COLUMN ? $this->renderNavigationMenu() : '',
        ]);


        return $this->renderer->render($template, $params);

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
            ->with('textItems')
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
        // Unbound image upload, for example from wysiwyg
        if ($this->request->files->has('unboundUpload')) {
            // Да, т.к. это непривязанная загрузка, и группа значения не имеет,
            // у нас "тип" и "группа" передеются одним параметром
            // Т.е. в unboundUpload[image] мы определяем тип по image и его же используем в UploadProcessor для группы
            $uploadProcessor = new UploadProcessor();
            $type = array_keys($this->request->files->get('unboundUpload'))[0];
            $result = $uploadProcessor->handle($type, null, $this->request->files->get('unboundUpload'), $this->request->all());
            return response()->json($result);
        }


        // Standard CMS
        $amfProcessor = new AmfProcessor();
        $amfProcessor->process($this->request->all());

        //todo:
        //todo: продумать нормальный возврат!
        //todo: события до, после и вместо!!!!


        if (Arr::has($amfProcessor->getAffectedFields(), 'toggle')) {
            // todo: какашка какая-то
            if ($amfProcessor->getAffectedFieldsCount() === 1) {
                // адская конструкция для доступа к конкретному единственному значению многомерного массива
                $singleElementFieldValue = array_values(array_values(array_values($amfProcessor->getAffectedFields()['toggle'])[0])[0])[0];
                return response()->json($singleElementFieldValue);
            } else {
                return response()->json($amfProcessor->getAffectedFields()['toggle']);
            }
        }
        if ($amfProcessor->isSingleObjectCreated()) {
            $id = array_values($amfProcessor->getAffectedObjects()['create'])[0][0];
            $this->app->session->flash('justCreated', $id);
            return response()->json($id);
        }
        if ($files = Arr::get($amfProcessor->getAffectedObjects(), 'upload')) {
            return response()->json(array_values($files)[0]);
        }
    }


}