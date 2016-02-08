<?php

namespace App\Facepalm\Cms;

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
}