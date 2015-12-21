<?php

namespace App\Facepalm;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ModelFactory
{

    /**
     * @param $modelName
     * @param $id
     * @return Model
     */
    public static function getById($modelName, $id)
    {
        return call_user_func([CmsCommon::getFullModelClassName($modelName), 'find'], $id);
    }

    /**
     * @param $modelName
     * @return \Illuminate\Database\Eloquent\Collection|static[]
     */
    public static function getAll($modelName)
    {
        return call_user_func([CmsCommon::getFullModelClassName($modelName), 'all']);
    }

    /**
     * @param $modelName
     * @return Builder
     */
    public static function getBuilderForModel($modelName)
    {
        return call_user_func(
            [CmsCommon::getFullModelClassName($modelName), 'where'],
            CmsCommon::COLUMN_NAME_ID,
            '>',
            '0'
        );
    }


}