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
        return $app->make('twig')->render('facepalm::loginPage', []);
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

        if (Auth::attempt($credentials)) {
            if ($request->ajax()) {
                return response()->json(['user' => Auth::user()]);
            } else {
                return $this->handleUserWasAuthenticated($request, false);
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