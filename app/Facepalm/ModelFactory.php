<?php

namespace App\Facepalm;

use Illuminate\Database\Eloquent\Builder;

/**
 * Class ModelFactory
 * @package App\Facepalm
 *
 * @method find(string $modelName)
 * @method all(string $modelName)
 * @method where(string $modelName, mixed ...$arguments)
 */
class ModelFactory
{

    /**
     * @param $modelName
     * @return Builder
     */
    public static function builderFor($modelName)
    {
        return self::where($modelName, CmsCommon::COLUMN_NAME_ID, '>', '0');
    }

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
        $fullModelName = CmsCommon::getFullModelClassName($modelName);
        if ($fullModelName) {
            return call_user_func_array([$fullModelName, $name], $arguments);
        }
    }

}