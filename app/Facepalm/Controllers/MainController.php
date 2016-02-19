<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace App\Facepalm\Controllers;

use App\Facepalm\Controllers\Actions\AutoResize;
use App\Facepalm\Controllers\Actions\CmsUI;
use App\Facepalm\Controllers\Actions\DownloadFile;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;

/**
 * todo: Подумать насчет передачи параметрво неявно, как в dd()
 * Class MainController
 * @package App\Facepalm\Controllers
 */
class MainController extends BaseController
{
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