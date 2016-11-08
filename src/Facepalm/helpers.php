<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 05.02.16
 * Time: 11:50
 */
use Illuminate\Support\Debug\Dumper;

if (!function_exists('d')) {
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

if (!function_exists('pre')) {
    /**
     * Dump using print_r
     */
    function pre()
    {
        array_map(function ($x) {
            if (PHP_SAPI != 'cli') {
                echo '<pre>';
            }
            print_r($x);
            echo PHP_EOL;

            if (PHP_SAPI != 'cli') {
                echo '</pre>';
            }
        }, func_get_args());

    }
}

if (!function_exists('pluralize')) {
    function pluralize($value, $strings)
    {
        $value = round($value);
        if ($value > 100) {
            $value = $value % 100;
        }

        $firstDigit = $value % 10;
        $secondDigit = floor($value / 10);

        if ($secondDigit != 1) {
            if ($firstDigit == 1) {
                return $strings[0];
            } else {
                if ($firstDigit > 1 && $firstDigit < 5) {
                    return $strings[1];
                } else {
                    return $strings[2];
                }
            }
        } else {
            return $strings[2];
        }
    }
}