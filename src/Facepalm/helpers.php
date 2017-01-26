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
if (!function_exists('ed')) {
    /**
     * Dump the passed variables.
     *
     * @param  mixed
     * @return void
     */
    function ed($x)
    {
        echo($x);
        exit;
    }
}

if (!function_exists('dietime')) {
    /**
     * Dump the passed variables.
     *
     * @param  mixed
     * @return void
     */
    function dietime($t = null)
    {
        if (defined('T1')) {
            if (!$t) {
                $t = microtime(1);
            }
            ed(round($t - T1, 4));
        } else {
            ed('not defined T1');
        }
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
if (!function_exists('prd')) {
    /**
     * Dump using print_r
     */
    function prd()
    {
        call_user_func_array('pre', func_get_args());
        exit;
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

function russian_date($date)
{
    $monthes = [
        "",
        "января",
        "февраля",
        "марта",
        "апреля",
        "мая",
        "июня",
        "июля",
        "августа",
        "сентября",
        "октября",
        "ноября",
        "декабря"
    ];
    $date = strtotime($date);
    return date('d', $date) . ' ' . $monthes[date('n', $date)] . ' ' . date('Y', $date);
}