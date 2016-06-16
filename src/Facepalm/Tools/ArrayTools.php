<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.05.16
 * Time: 11:54
 */

namespace Facepalm\Tools;


class ArrayTools
{
    /**
     * @param array $arr
     * @param $prefixToRemove
     * @param null $prefixToAdd
     * @return array
     */
    public static function replaceArrayKeyPrefix(array $arr, $prefixToRemove, $prefixToAdd = null)
    {
        return array_flip(
            array_map(
                function ($item) use ($prefixToRemove, $prefixToAdd) {
                    return (string)$prefixToAdd
                    . (mb_strpos($item, $prefixToRemove) !== false ? mb_substr($item, mb_strlen($prefixToRemove)) : $item);
                },
                array_flip($arr)
            )
        );

    }

}