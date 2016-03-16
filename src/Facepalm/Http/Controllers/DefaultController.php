<?php

namespace Facepalm\Http\Controllers;

//use App\Models\CurrencyRate;
use Illuminate\Routing\Controller as BaseController;

class DefaultController extends BaseController
{
    public function display($params = null)
    {
//        d(CurrencyRate::euro()->first()->value);
        if ($params) {
            $params = explode('/', $params);
            print_r($params);
        }
    }
}
