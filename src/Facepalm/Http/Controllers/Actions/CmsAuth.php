<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers\Actions;

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

class CmsAuth
{

    /**
     * @param Request $request
     * @return string
     */
    public function get(Request $request)
    {
        return Twig::render("loginPage.twig", []);


        return '';
    }

}