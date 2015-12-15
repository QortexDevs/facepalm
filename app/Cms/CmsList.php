<?php

namespace App\Cms;

use Carbon\Carbon;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class CmsList extends CmsComponent
{
    // todo: нцжна вьюшка со списком и параметром, отображать ли кнопку добавления.
    // todo: Подумать про массовые операции
    // todo: пейджер и фильтр
    // todo: type select from local dictionary

    protected $columns = [];
    protected $showIdColumn = true;
    protected $showStatusButton = true;
    protected $showDeleteButton = true;
    protected $showEditButton = false;

    protected $relatedModels = [];


    /**
     * @param Repository $config
     * @return $this
     */
    public function buildFromConfig($config)
    {
        $this->setColumns($config->get('list.columns'), $config->get('titles'))
            ->setMainModel($config->get('model'))
            ->toggleIdColumn($config->get('list.showId') !== false)
            ->toggleStatusButtonColumn($config->get('list.showStatus') !== false)
            ->toggleDeleteButtonColumn($config->get('list.showDelete') !== false)
            ->toggleEditButtonColumn($config->get('list.showEdit') == true);

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
        $processed = CmsCommon::processFieldsList($columns, $titles);
        $this->columns = $processed['fields'];
        $this->relatedModels = $processed['relatedModels'];

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
     * @return array
     * @throws \Exception
     */
    public function display()
    {
        // get query builder with all records (dummy clause)
        if (!$this->modelName) {
            throw new \Exception('No model defined');
        }
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
                CmsCommon::COLUMN_NAME_ID => $object->id,
                CmsCommon::COLUMN_NAME_STATUS => $object->status
            ];
            foreach ($this->columns as $columnName => $column) {
                if (CmsCommon::isRelationColumn($columnName)) {
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
     * @param $value
     * @param $column
     * @return mixed
     */
    protected function formatColumn($value, $column)
    {
        switch ($column['type']) {
            case CmsCommon::COLUMN_TYPE_DATETIME:
                return $this->formatDatetime($value);
                break;
            case CmsCommon::COLUMN_TYPE_DATE:
                return $this->formatDate($value);
                break;
            case CmsCommon::COLUMN_TYPE_TEXT:
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