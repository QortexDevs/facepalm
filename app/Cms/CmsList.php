<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 21:56
 */

namespace app\Cms;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Mockery\Exception;

class CmsList
{
    //todo: вынести отсюда в общий админский класс
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

    // todo: нцжна вьюшка со списком и параметром, отображать ли кнопку добавления.
    // todo: Подумать про массовые операции
    // todo: пейджер и фильтр
    // todo: джойны с другими таблицами. Продумать формат конфига. Отдельный метод для установки для установки из json-конфига

    protected $columns = [];
    protected $showIdColumn = true;
    protected $showStatusButton = true;
    protected $showDeleteButton = true;
    protected $showEditButton = false;
    protected $modelName = null;

    protected $relatedModels = [];

    public function __construct($config = null)
    {
        if ($config) {
            $this->buildFromConfig($config);
        }
    }

    public function buildFromConfig($config)
    {
        $this->setColumns($config['list.columns'], $config['titles'])
            ->setMainModel($config['model'])
            ->toggleIdColumn($config['list.showId'] !== false)
            ->toggleStatusButtonColumn($config['list.showStatus'] !== false)
            ->toggleDeleteButtonColumn($config['list.showDelete'] !== false)
            ->toggleEditButtonColumn($config['list.showEdit'] !== false);

        return $this;
    }

    /**
     * todo: описать в документации, как можно передавать разные параметры
     * @param $columns
     * @param null $titles
     * @return $this
     */
    public function setColumns($columns, $titles = null)
    {
        if (count($columns)) {
            if (!Arr::isAssoc($columns)) {
                if (!is_array($columns[0])) {
                    $columns = array_flip($columns);
                }
            }
            $counter = 0;
            foreach ($columns as $columnName => $column) {
                if (!is_array($column)) {
                    $column = (array)$column;
                }
                if (Arr::has($column, 'name')) {
                    $columnName = $column['name'];
                }
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
                if (!Arr::has($column, 'type') || !$column['type']) {
                    $column['type'] = self::COLUMN_TYPE_DEFAULT;
                }

                $this->columns[$columnName] = $column;
                if ($this->isRelationColumn($columnName)) {
                    $this->relatedModels[] = explode('.', $columnName)[0];
                }
                $counter++;

            }
        }
        return $this;
    }

    /**
     * @param bool $display
     * @return $this
     */
    public function toggleIdColumn($display = true)
    {
        $this->showIdColumn = (bool)$display;
        return $this;
    }

    /**
     * @param bool $display
     * @return $this
     */
    public function toggleStatusButtonColumn($display = true)
    {
        $this->showStatusButton = (bool)$display;
        return $this;
    }

    /**
     * @param bool $display
     * @return $this
     */
    public function toggleDeleteButtonColumn($display = true)
    {
        $this->showDeleteButton = (bool)$display;
        return $this;
    }

    /**
     * @param bool $display
     * @return $this
     */
    public function toggleEditButtonColumn($display = true)
    {
        $this->showEditButton = (bool)$display;
        return $this;
    }

    /**
     * @param $modelName
     * @return $this
     */
    public function setMainModel($modelName)
    {
        if ($modelName) {
            $modelName = 'App\Models\\' . Str::studly($modelName);
        }
        if (class_exists($modelName)) {
            $this->modelName = $modelName;
        } else {
            throw new Exception('Cannot find class ' . $modelName);
        }
        return $this;
    }

    /**
     * @return array
     */
    public function display()
    {
        // get query builder with all records (dummy clause)
        $queryBuilder = call_user_func([$this->modelName, 'where'], 'id', '>', '0');

        // todo: сортировка из настроек
        $queryBuilder = $queryBuilder->orderBy('id', 'desc');
        if ($this->relatedModels) {
            foreach ($this->relatedModels as $relatedModel) {
                $queryBuilder->with($relatedModel);
            }
        }
        $objects = $queryBuilder->get();

        $rows = [];
        /** @var Model $object */
        foreach ($objects as $object) {
            $row = [
                self::COLUMN_NAME_ID => $object->id
            ];
            foreach ($this->columns as $columnName => $column) {
                if ($this->isRelationColumn($columnName)) {
                    // todo: refactor this. Store this explodes in inner fields;
                    $path = explode('.', $columnName);
                    if ($object->{$path[0]}) {
                        $row[$columnName] = $object->{$path[0]}->{$path[1]};
                    }
                } else {
                    $row[$columnName] = $object->getAttribute($columnName);
                }

                $row[$columnName] = $this->formatColumn($row[$columnName], $column);
            }
            $rows[] = $row;
        }

        $output = [
            'settings' => [
                'showIdColumn' => $this->showIdColumn,
                'showStatusButton' => $this->showStatusButton,
                'showDeleteButton' => $this->showDeleteButton,
                'showEditButton' => $this->showEditButton,
            ],
            'meta' => [
                'model' => class_basename($this->modelName),
                'columns' => $this->columns
            ],
            'rows' => $rows

        ];

        return $output;
    }

    /**
     * @param $columnName
     * @return bool
     */
    protected function isRelationColumn($columnName)
    {
        return Str::contains($columnName, '.');
    }


    /**
     * @param $value
     * @param $column
     * @return mixed
     */
    protected function formatColumn($value, $column)
    {
        switch ($column['type']) {
            case self::COLUMN_TYPE_DATETIME:
                return $this->formatDatetime($value);
                break;
            case self::COLUMN_TYPE_DATE:
                return $this->formatDate($value);
                break;
            case self::COLUMN_TYPE_TEXT:
                return $this->formatText($value);
                break;
            default:
                return $value;
        }
    }

    /**
     * @param Carbon $value
     * @param string $format
     * @return mixed
     */
    protected function formatDatetime($value, $format = 'd.m.Y H:i')
    {

        if (Str::startsWith($value->year, '-')) {
            return null;
        }
        $value = $value->format($format);
        return $value;
    }

    /**
     * @param Carbon $value
     * @return mixed
     */
    protected function formatDate($value)
    {
        return $this->formatDatetime($value, 'd.m.Y');
    }

    /**
     * @param $value
     * @return string
     */
    protected function formatText($value)
    {
        return Str::limit($value, 20);
    }

}