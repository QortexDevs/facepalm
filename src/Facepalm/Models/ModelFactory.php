<?php

namespace Facepalm\Models;

use Facepalm\Cms\CmsCommon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * Class ModelFactory
 * @package Facepalm
 *
 * @method @static find(string $modelName, int $id)
 * @method @static all(string $modelName)
 * @method @static where(string $modelName, mixed ...$arguments)
 */
class ModelFactory
{

    /**
     * Forward static methods to appropriate model
     *
     * @param $name
     * @param $arguments
     * @return mixed
     */
    public static function __callStatic($name, $arguments)
    {
        $modelName = array_shift($arguments);
        $fullModelName = self::getFullModelClassName($modelName);
        if ($fullModelName) {
            return call_user_func_array([$fullModelName, $name], $arguments);
        }
        return null;
    }

    /**
     * todo: эта херня не работает. когда имя таблицы не совпадает
     * @param $modelName
     * @return Builder
     */
    public static function builderFor($modelName)
    {
        return self::whereRaw($modelName, '1');
    }

    /**
     * @param $modelName
     * @return null|string
     */
    public static function getFullModelClassName($modelName)
    {
        $fullModelName = $modelName;
        //todo: change namespace!!!!
        if ($modelName
            && !Str::startsWith($modelName, 'App\Models\\')
            && !Str::startsWith($modelName, 'Facepalm\Models\\')
        ) {
            $fullModelName = 'App\Models\\' . Str::studly($modelName);
        }
        if (class_exists($fullModelName)) {
            return $fullModelName;
        } else {
            $fullModelName = 'Facepalm\Models\\' . Str::studly($modelName);
            if (class_exists($fullModelName)) {
                return $fullModelName;
            }
        }

        return null;
    }

}