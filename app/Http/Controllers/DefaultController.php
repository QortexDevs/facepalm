<?php

namespace App\Http\Controllers;

class DefaultController extends Controller
{
    public function display($params = null)
    {
        if ($params) {
            $params = explode('/', $params);
            print_r($params);
        }
    }
}
