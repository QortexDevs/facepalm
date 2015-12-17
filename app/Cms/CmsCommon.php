<?php

namespace App\Cms;

use Illuminate\Support\Arr;
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
     * @param $columnName
     * @return bool
     */
    public static function isRelationColumn($columnName)
    {
        return Str::contains($columnName, '.');
    }


    /**
     * @param $modelName
     * @return null|string
     */
    public static function getFullModelClassName($modelName)
    {
        if ($modelName) {
            $modelName = 'App\Models\\' . Str::studly($modelName);
        }
        if (class_exists($modelName)) {
            return $modelName;
        }

        return null;
    }

    /**
     * @param $fields
     * @param $titles
     * @return array
     */
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

                if (self::isRelationColumn($columnName)) {
                    $column['type'] = CmsCommon::COLUMN_TYPE_RELATION;
                    $column['foreignModel'] = explode('.', $columnName)[0];
                    $column['foreignDisplayName'] = explode('.', $columnName)[1];
                    if ($column['cardinality'] == 'many') {
                        // todo: возможность переопределения
                        $column['collectionName'] = Str::snake($column['foreignModel']) . 's';
                    } else {
                        // todo: возможность переопределения
                        $column['foreignKey'] = Str::snake($column['foreignModel']) . '_id';
                    }
                    $output['relatedModels'][] = $column['foreignModel'];

                }

                if (!Arr::has($column, 'type') || !$column['type']) {
                    $column['type'] = CmsCommon::COLUMN_TYPE_DEFAULT;
                }

                $output['fields'][$columnName] = $column;
                $counter++;
            }
        }

        return $output;
    }
}