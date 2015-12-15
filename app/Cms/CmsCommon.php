<?php

namespace App\Cms;

use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class CmsCommon
{
    const COLUMN_TYPE_STRING = 1;
    const COLUMN_TYPE_ID = 2;
    const COLUMN_TYPE_DATE = 3;
    const COLUMN_TYPE_DATETIME = 4;
    const COLUMN_TYPE_TEXT = 5;
    const COLUMN_TYPE_DICTIONARY = 6;
    const COLUMN_TYPE_RELATED = 7;
    const COLUMN_TYPE_RELATED_MULTIPLE = 8;
    const COLUMN_TYPE_ACTION_BUTTON = 9;

    const COLUMN_TYPE_DEFAULT = self::COLUMN_TYPE_STRING;

    const COLUMN_NAME_ID = 'id';
    const COLUMN_NAME_STATUS = 'status';

    /**
     * @param $columnName
     * @return bool
     */
    public static function isRelationColumn($columnName)
    {
        return Str::contains($columnName, '.');
    }

    public static function processFieldsList($fields, $titles)
    {
        $output = [
            'fields' => [],
            'relatedModels' => []
        ];
        if (!$fields) {
            return $output;
        }
        if (!is_array($fields)) {
            $fields = (array)$fields;
        }
        if (count($fields)) {
            if (!Arr::isAssoc($fields)) {
                if (!is_array($fields[0])) {
                    $fields = array_flip($fields);
                }
            }
            $counter = 0;
            foreach ($fields as $columnName => $column) {
                if (!is_array($column)) {
                    $column = (array)$column;
                }
                if (Arr::has($column, 'name')) {
                    $columnName = $column['name'];
                }
                if (is_array($titles)) {
                    if (!Arr::has($column, 'title') || !$column['title']) {
                        if (Arr::isAssoc($titles)) {
                            if (Arr::has($titles, $columnName)) {
                                $column['title'] = $titles[$columnName];
                            }
                        } else {
                            if (Arr::has($titles, $counter)) {
                                $column['title'] = $titles[$counter];
                            }
                        }
                    }
                }
                if (!Arr::has($column, 'type') || !$column['type']) {
                    $column['type'] = CmsCommon::COLUMN_TYPE_DEFAULT;
                }

                $output['fields'][$columnName] = $column;
                if (self::isRelationColumn($columnName)) {
                    $output['relatedModels'][] = explode('.', $columnName)[0];
                }

                $counter++;
            }
        }

        return $output;
    }
}