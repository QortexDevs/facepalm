<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Illuminate\Foundation\Auth\AuthenticatesAndRegistersUsers;
use Illuminate\Foundation\Auth\ThrottlesLogins;
use Illuminate\Http\Request;
use TwigBridge\Facade\Twig;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class AuthController extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
    use AuthenticatesAndRegistersUsers, ThrottlesLogins;

    /**
     * @param Request $request
     * @return string
     */
    public function get(Request $request)
    {
        return Twig::render("loginPage.twig", []);
    }

//    /**
//     * @param Request $request
//     * @return string
//     */
//    public function login(Request $request)
//    {
//        return $request->input('login');
//    }


}