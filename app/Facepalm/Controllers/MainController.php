<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace App\Facepalm\Controllers;

use App\Facepalm\Cms\Config\Config;
use App\Facepalm\Models\SiteSection;
use App\Facepalm\PostProcessing\AmfProcessor;
use App\Facepalm\Tools\Tree;
use App\Models\User;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Twig_Loader_Array;
use TwigBridge\Facade\Twig;

class MainController extends BaseController
{
    use AutoResizeTrait,
        DownloadFileTrait,
        ModuleTrait;

    const ACTION_LIST_OBJECTS = 1;
    const ACTION_EDIT_OBJECT = 2;
    const ACTION_CREATE_OBJECT = 3;


    /**
     * @param $template
     * @param $params
     * @return mixed
     */
    protected function renderPage($template, $params)
    {
        $tree = new Tree();
        $tree->fromEloquentCollection(SiteSection::all());

//        pre($tree->getPath(1464, 'path_name'));
//        pre($tree->getPath(1493, function ($element) {
//            return $element->path_name . $element->id;
//        }));


        $loader = new Twig_Loader_Array(array(
            'index.html' => '<li>{%if isRoot%}!{%endif%}({{level}}) {{element.path_name}} {%if nested%}<ul>{{nested|raw}}</ul>{%endif%}</li>',
        ));
        $env = new \Twig_Environment($loader, [
            'debug' => false,
            'cache' => storage_path('twig')
        ]);
        $t = microtime(1);
        echo '<ul class="tree">' . $tree->render(0, $env, 'index.html', false) . '</ul>';

        echo microtime(1) - $t;

        exit;

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