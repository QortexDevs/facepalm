<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 05.02.16
 * Time: 11:50
 */
use Illuminate\Support\Debug\Dumper;

if (! function_exists('d')) {
    /**
     * Dump the passed variables.
     *
     * @param  mixed
     * @return void
     */
    function d()
    {
        array_map(function ($x) {
            (new Dumper)->dump($x);
        }, func_get_args());
    }
}