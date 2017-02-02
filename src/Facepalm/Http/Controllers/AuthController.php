<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Foundation\Auth\ThrottlesLogins;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Auth;

class AuthController extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
    use AuthenticatesUsers, ThrottlesLogins;

    protected $redirectAfterLogout = '/cms/';


    /**
     * @param Application $app
     * @param Request $request
     * @return string
     */
    public function get(Application $app, Request $request)
    {
        $customCssPath = 'assets/build/cms/css/main.css';
        $customJsPath = 'assets/build/cms/js/all.js';
        return $app->make('twig')->render('facepalm::loginPage', [
            'customJsPath' => is_file(public_path($customJsPath)) ? $customJsPath : '',
            'customCssPath' => is_file(public_path($customCssPath)) ? $customCssPath : '',
        ]);
    }

    /**
     * Handle a login request to the application.
     *
     * @param  \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function login(Request $request)
    {
        $this->validateLogin($request);


        $credentials = $request->only('email', 'password');
        $credentials['status'] = 1;

        $guards = config('facepalm.cmsAuthGuards')
            ? explode(',', config('facepalm.cmsAuthGuards'))
            : [config('auth.defaults.guard')];
        foreach ($guards as $guard) {
            try {
                if (Auth::guard($guard)->attempt($credentials)) {
                    if ($request->ajax()) {
                        return response()->json(['user' => Auth::guard($guard)->user()]);
                    } else {
                        return $this->handleUserWasAuthenticated($request, false);
                    }
                }
            } catch (\Exception $e) {
            }
        }
        //todo: переделать вывод текста ошибки! Локализация!
        //$this->getFailedLoginMessage()
        if ($request->ajax()) {
            return response()->json(['errors' => [$this->loginUsername() => 'Неверные логин или пароль']]);
        } else {
            return $this->sendFailedLoginResponse($request);
        }
    }


}