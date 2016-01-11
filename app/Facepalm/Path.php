<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 24.12.15
 * Time: 12:21
 */

namespace App\Facepalm;


class Path
{
    //todo: вынести параметры в настройки проекта, сделать класс не статическим, а юзать через сервис
    public static function generateHierarchicalPrefix(
        $input,
        $countOfPrefixes = 2,
        $separator = "/",
        $prefixOnly = false
    ) {
        $output = "";
        for ($i = 0; $i < $countOfPrefixes; $i++) {
            $output .= substr($input, 0, ($i + 1)) . $separator;
        }

        return $output . ($prefixOnly ? '' : $input);
    }
}