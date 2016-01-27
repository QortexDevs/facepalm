<?php

namespace App\Facepalm;

use Illuminate\Support\Str;

class CmsCommon
{
    const COLUMN_TYPE_STRING = 'string';
    const COLUMN_TYPE_ID = 'id';
    const COLUMN_TYPE_DATE = 'date';
    const COLUMN_TYPE_DATETIME = 'datetime';
    const COLUMN_TYPE_TEXT = 'text';
    const COLUMN_TYPE_DICTIONARY = 'dictionary';
    const COLUMN_TYPE_RELATION = 'relation';
    const COLUMN_TYPE_ACTION_BUTTON = 'button';

    const COLUMN_TYPE_DEFAULT = self::COLUMN_TYPE_STRING;

    const COLUMN_NAME_ID = 'id';
    const COLUMN_NAME_STATUS = 'status';


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
            && !Str::startsWith($modelName, 'App\Facepalm\Models\\')
        ) {
            $fullModelName = 'App\Models\\' . Str::studly($modelName);
        }
        if (class_exists($fullModelName)) {
            return $fullModelName;
        } else {
            $fullModelName = 'App\Facepalm\Models\\' . Str::studly($modelName);
            if (class_exists($fullModelName)) {
                return $fullModelName;
            }
        }

        return null;
    }


}