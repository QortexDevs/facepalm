<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace App\Facepalm;

use App\Facepalm\Cms\Components\CmsList;
use App\Facepalm\Cms\Components\CmsForm;
use App\Facepalm\Cms\Config\Config;
use App\Facepalm\Models\File;
use App\Facepalm\Models\Image;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\MimeType\MimeTypeGuesser;
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

    //todo: вынести это в трейты
    public function autoResizeImage(Request $request, $path, $name)
    {
        preg_match('/^(?<hash>[0-9a-f]+)(_(?<dimensions>[\dx]+))?\.(?<ext>jpg|png|gif)$/', $name, $matches);
        if (Arr::has($matches, 'hash') & Arr::has($matches, 'dimensions')) {
            if (in_array($matches['dimensions'], (array)config('app.allowedDimensions'))) {
                /** @var Image $image */
                $image = Image::where('name', $matches['hash'])->first();
                if ($image) {
                    $image->generateSize($matches['dimensions']);
                    return redirect(
                        $request->getUri(),
                        302,
                        ['Cache-Control' => 'no-store, no-cache, must-revalidate']
                    );
                }
            }
        }
        abort(404);
    }

    //todo: вынести это в трейты
    public function downloadFile(Request $request, $hash, $name = '')
    {
        /** @var File $file */
        $file = File::where('name', $hash)->first();
        if ($file) {
            $fileName = ($name ?: ($file->display_name . '.' . $file->type));
            $guesser = MimeTypeGuesser::getInstance();
            if (strpos($request->server('SERVER_SOFTWARE'), 'nginx') !== false) {
                return response('', 200)
                    ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"')
                    ->header('Content-Type', $guesser->guess($file->getPhysicalPath()))
                    ->header('X-Accel-Redirect', '/_internal_files/' . $file->getRelativePath());
            } else {
                return response()->download(
                    $file->getPhysicalPath(),
                    $fileName,
                    ['Content-Type' => $guesser->guess($file->getPhysicalPath())]
                );
            }
        } else {
            abort(404);
        }
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
        if ($amfProcessor->getToggledFields()) {
            if ($amfProcessor->getAffectedFieldsCount() == 1) {
                // адская конструкция для доступа к конкретному единственному значению многомерного массива
                $singleElementFieldValue = array_values(array_values(array_values($amfProcessor->getToggledFields())[0])[0])[0];
                return response()->json($singleElementFieldValue);
            } else {
                return response()->json($amfProcessor->getToggledFields());
            }
        }
        if ($amfProcessor->getAffectedObjects()) {
            if ($amfProcessor->getAffectedObjectsCount() == 1) {
                $id = array_values($amfProcessor->getAffectedObjects())[0][0];
                return response()->json($id);
            }
        }
        if ($files = $amfProcessor->getUploadedFiles()) {
            return response()->json($files);
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
            'justCreated' => Session::get('creatingObject'),
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
        $params = array_merge($params, [
            'assetsBusters' => $assetsBusters,
            'currentPathSections' => [$this->group, $this->module],
            'cmsStructure' => $this->config->get('structure'),
            'moduleConfig' => $this->config->get('module'),
        ]);

        return Twig::render($template, $params);

    }

}