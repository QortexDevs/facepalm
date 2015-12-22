<?php

namespace App\Facepalm\Components;

use App\Facepalm\CmsCommon;
use App\Facepalm\Fields\AbstractField;
use App\Facepalm\Fields\FieldListProcessor;
use App\Facepalm\Fields\Types\RelationField;
use App\Facepalm\ModelFactory;
use Carbon\Carbon;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Query\Builder;
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
    const DEFAULT_ORDERING = 'desc';


    /**
     * @param Repository $config
     * @return $this
     */
    public function buildFromConfig($config)
    {
        $this->setColumns($config->get('list.columns'), $config->get('titles'))
            ->setBaseUrl($config->get('baseUrl'))
            ->setMainModel($config->get('model'))
            ->toggleIdColumn($config->get('list.showId') !== false)
            ->toggleStatusButtonColumn($config->get('list.showStatus') !== false)
            ->toggleDeleteButtonColumn($config->get('list.showDelete') !== false)
            ->toggleEditButtonColumn($config->get('list.showEdit') == true);

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
    public function prepareData()
    {
        if (!$this->modelName) {
            throw new \Exception('No model defined');
        }

        // get query builder with all records (dummy clause)
        /** @var Builder $queryBuilder */
        $queryBuilder = ModelFactory::builderFor($this->modelName);

        // todo: сортировка из настроек
        $queryBuilder = $queryBuilder->orderBy(CmsCommon::COLUMN_NAME_ID, self::DEFAULT_ORDERING);

        // eager loading of related models
        if ($this->fieldsProcessor->getRelatedModels()) {
            foreach ($this->fieldsProcessor->getRelatedModels() as $relatedModel) {
                $queryBuilder->with($relatedModel);
            }
        }

        // do query
        $objects = $queryBuilder->get();

        $rows = [];
        /** @var Model $object */
        foreach ($objects as $object) {
            $row = [
                CmsCommon::COLUMN_NAME_ID => $object->{CmsCommon::COLUMN_NAME_ID},
                CmsCommon::COLUMN_NAME_STATUS => $object->{CmsCommon::COLUMN_NAME_STATUS}
            ];
            /** @var AbstractField $column */
            foreach ($this->fieldsProcessor->getFields() as $column) {
                //todo: row - сделать классом, а не массивом
                $row[$column->name] = $column->getValueForList($object);
                $row['editUrl'] = $this->baseUrl . '/' . $object->{CmsCommon::COLUMN_NAME_ID} . '/';
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
                'columns' => $this->fieldsProcessor->getFields()
            ],
            'rows' => $rows

        ];

        return $output;
    }
}