<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace App\Facepalm\Controllers;

use App\Facepalm\Cms\Config\Config;
use App\Facepalm\PostProcessing\AmfProcessor;
use App\Models\User;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
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
        /** @var User $user */
        $user = User::find(601);
//        $user->texts()->create([
//            'group' => 'bio',
//            'languageCode' => 'ru',
//            'textBody' => 'Родился в Москве в 1980 году',
//        ]);
        dd($user->texts('ru'));


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