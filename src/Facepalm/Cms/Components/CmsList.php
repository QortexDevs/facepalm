<?php

namespace Facepalm\Cms\Components;

use Facepalm\Cms\CmsCommon;
use Facepalm\Cms\Fields\AbstractField;
use Facepalm\Cms\Fields\FieldListProcessor;
use Facepalm\Cms\Fields\Types\RelationField;
use Facepalm\Models\Foundation\BaseEntity;
use Facepalm\Models\ModelFactory;
use Facepalm\Tools\Tree;
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
    protected $isPlainTreeMode = false;

    protected $relatedModels = [];
    const DEFAULT_ORDERING = 'desc';

    protected $constraintCallbacks = [];


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
            ->toggleTreeMode($config->get('list.treeMode') == true)
            ->togglePlainTreeMode($config->get('list.plain') == true);

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
     * @param bool $isPlain
     * @return $this
     */
    public function togglePlainTreeMode($isPlain = true)
    {
        $this->isPlainTreeMode = (bool)$isPlain;
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

        $tableName = Str::snake(class_basename($this->modelName)) . 's';

        // get query builder with all records (dummy clause)
        /** @var Builder $queryBuilder */
        $queryBuilder = ModelFactory::builderFor($this->modelName);


        if ($this->constraintCallbacks) {
            foreach ($this->constraintCallbacks as $constraintCallback) {
                $queryBuilder = $constraintCallback($queryBuilder);
            }
        }

        // todo: сортировка из настроек
        // todo: хитровыебанные запрос для многоязычных полей
        if ($this->isTreeMode) {
            $queryBuilder = $queryBuilder->orderBy($tableName . '.' . CmsCommon::COLUMN_NAME_SHOW_ORDER, 'asc');
        } else {
            if ($this->config->get('list.sortable')) {
                $queryBuilder = $queryBuilder->orderBy($tableName . '.' . CmsCommon::COLUMN_NAME_SHOW_ORDER, 'asc');
            } else {
                $queryBuilder = $queryBuilder->orderBy(
                    $tableName . '.' . CmsCommon::COLUMN_NAME_ID,
                    self::DEFAULT_ORDERING
                );
            }
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

        $tree = Tree::fromEloquentCollection($objects);

        $output = [
            'settings' => [
                'showIdColumn' => $this->showIdColumn,
                'showStatusButton' => $this->showStatusButton,
                'showDeleteButton' => $this->showDeleteButton,
                'showEditButton' => $this->showEditButton,
                'treeMode' => $this->isTreeMode,
                'plainTreeMode' => $this->isPlainTreeMode,
                'sortable' => $this->config->get('list.sortable')
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
            $templateName = $listData['settings']['treeMode'] ? 'facepalm::components/list/containerTree.twig' : 'facepalm::components/list/container.twig';
        }
        if ($listData['settings']['treeMode']) {
            $treeContent = $listData['tree']->render(0, app()->make('twig'), 'facepalm::components/list/treeItem', [
                "list" => $listData,
                "moduleConfig" => $this->config,
            ]);
            $emptyTreeItem = app()->make('twig')->render('facepalm::components/list/treeItem', [
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

    public function setAdditionalConstraints($param)
    {
        $this->constraintCallbacks[] = $param;
    }

}