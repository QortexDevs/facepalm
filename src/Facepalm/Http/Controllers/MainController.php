<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Facepalm\Http\Controllers\Actions\AutoResize;
use Facepalm\Http\Controllers\Actions\CmsAuth;
use Facepalm\Http\Controllers\Actions\CmsUI;
use Facepalm\Http\Controllers\Actions\DownloadFile;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

/**
 * todo: Подумать насчет передачи параметрво неявно, как в dd()
 * Class MainController
 * @package Facepalm\Controllers
 */
class MainController extends BaseController
{
    public function displayLoginScreen(Request $request)
    {
        return (new CmsAuth())->get($request);
    }

    /**
     * @param Request $request
     * @param null $group
     * @param null $module
     * @param null $params
     * @return \Illuminate\Http\JsonResponse
     */
    public function displayCmsUI(Request $request, $group = null, $module = null, $params = null)
    {
        return (new CmsUI())->handle($request, $group, $module, $params);
    }

    /**
     * @param Request $request
     * @param $hash
     * @param string $name
     * @return mixed
     */
    public function downloadFile(Request $request, $hash, $name = '')
    {
        return (new DownloadFile())->handle($request, $hash, $name);
    }

    /**
     * @param Request $request
     * @param $path
     * @param $name
     * @return mixed
     */
    public function autoResizeImage(Request $request, $path, $name)
    {
        return (new AutoResize())->handle($request, $path, $name);
    }


}