<?php

namespace App\Facepalm\Cms\Components;

use App\Facepalm\Cms\CmsCommon;
use App\Facepalm\Cms\Fields\AbstractField;
use App\Facepalm\Cms\Fields\FieldListProcessor;
use App\Facepalm\Cms\Fields\Types\RelationField;
use App\Facepalm\Models\Foundation\BaseEntity;
use App\Facepalm\Models\ModelFactory;
use App\Facepalm\Tools\Tree;
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
    protected $isTreeMode = false;

    protected $relatedModels = [];
    const DEFAULT_ORDERING = 'desc';


    /**
     * @param Repository $config
     * @return $this
     */
    public function configure($config)
    {
        parent::configure($config);

        $this->setColumns($config->get('list.columns'), $config->get('titles'))
            ->setBaseUrl($config->get('baseUrl'))
            ->setMainModel($config->get('model'))
            ->toggleIdColumn($config->get('list.showId') !== false)
            ->toggleStatusButtonColumn($config->get('list.showStatus') !== false)
            ->toggleDeleteButtonColumn($config->get('list.showDelete') !== false)
            ->toggleEditButtonColumn($config->get('list.showEdit') == true)
            ->toggleTreeMode($config->get('list.treeMode') == true);

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
     * @param bool $tree
     * @return $this
     */
    public function toggleTreeMode($tree = true)
    {
        $this->isTreeMode = (bool)$tree;
        return $this;
    }


    /**
     * @return array
     * @throws \Exception
     */
    public function build()
    {
        if (!$this->modelName) {
            throw new \Exception('No model defined');
        }

        // get query builder with all records (dummy clause)
        /** @var Builder $queryBuilder */
        $queryBuilder = ModelFactory::builderFor($this->modelName);

        // todo: сортировка из настроек
        // todo: хитровыебанные запрос для многоязычных полей
        if ($this->isTreeMode) {
            $queryBuilder = $queryBuilder->orderBy(CmsCommon::COLUMN_NAME_SHOW_ORDER, 'asc');
        } else {
            $queryBuilder = $queryBuilder->orderBy(CmsCommon::COLUMN_NAME_ID, self::DEFAULT_ORDERING);
        }

        // eager loading of related models
        if ($this->fieldsProcessor->getRelatedModels()) {
            foreach ($this->fieldsProcessor->getRelatedModels() as $relatedModel) {
                $queryBuilder->with($relatedModel);
            }
        }

        if ($this->isTreeMode) {
            foreach ($this->fieldsProcessor->getFields() as $field) {
                $field->setParameters([
                    'modelName' => $this->modelName
                ]);
                $field->prepareData();
            }
        }

        // do query
        $objects = $queryBuilder->get();

        /** @var BaseEntity $object */
        foreach ($objects as $object) {
            $object->editUrl = $this->baseUrl . '/' . $object->id . '/';
        }

        $tree = (new Tree())->fromEloquentCollection($objects);

        $output = [
            'settings' => [
                'showIdColumn' => $this->showIdColumn,
                'showStatusButton' => $this->showStatusButton,
                'showDeleteButton' => $this->showDeleteButton,
                'showEditButton' => $this->showEditButton,
                'treeMode' => $this->isTreeMode
            ],
            'meta' => [
                'model' => class_basename($this->modelName),
                'columns' => $this->fieldsProcessor->getFields()
            ],
            'tree' => $tree
        ];
        return $output;
    }


    /**
     * @param $render
     * @param string $templateName
     * @return mixed
     * @throws \Exception
     */
    public function render($render, $templateName = null)
    {
        $treeContent = $emptyTreeItem = '';
        $listData = $this->build();
        if (!$templateName) {
            $templateName = $listData['settings']['treeMode'] ? 'components/list/containerTree.twig' : 'components/list/container.twig';
        }
        if ($listData['settings']['treeMode']) {
            $treeContent = $listData['tree']->render(0, app()->make('twig'), 'components/list/treeItem', [
                "list" => $listData,
                "moduleConfig" => $this->config,
            ]);
            $emptyTreeItem = app()->make('twig')->render('components/list/treeItem', [
                "list" => $listData,
                "moduleConfig" => $this->config,
            ]);
        }
        return $render->render($templateName, [
            "list" => $listData,
            "moduleConfig" => $this->config,
            'treeContent' => $treeContent ?: '',
            'emptyTreeItem' => $emptyTreeItem ?: ''
        ]);
    }

}