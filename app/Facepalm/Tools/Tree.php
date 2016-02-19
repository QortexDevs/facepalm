<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 24.12.15
 * Time: 12:21
 */

namespace App\Facepalm\Tools;


use Closure;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class Tree
{
    public $output;
    /** @var  Model[] */
    protected $elementsById;

    /** @var  array */
    protected $elementsByParent;

    protected $elementsAncestors;
    protected $elementsDescendants;


    /**
     * @param Collection $objects
     * @return $this
     */
    public function fromEloquentCollection(Collection $objects)
    {
        /** @var Model $object */
        foreach ($objects as $object) {
            $this->elementsById[$object->id] = $object;
            $this->elementsByParent[$object->parent_id][] = $object->id;
        }

        $this->calculateAncestorsAndDescendants();

        return $this;
    }


    /**
     * @param int|Model $element
     * @return mixed
     */
    public function getDescendantsIds($element)
    {
        return Arr::get($this->elementsDescendants, $this->getIdFromParameter($element), []);
    }

    /**
     * @param int|Model $element
     * @return mixed
     */
    public function getDescendants($element)
    {
        return $this->getElementsByIds($this->getDescendantsIds($element));
    }

    /**
     * @param int|Model $element
     * @return mixed
     */
    public function getAncestorsIds($element)
    {
        return Arr::get($this->elementsAncestors, $this->getIdFromParameter($element), []);
    }

    /**
     * @param int|Model $element
     * @return mixed
     */
    public function getElementAncestors($element)
    {
        return $this->getElementsByIds($this->getAncestorsIds($element));
    }

    /**
     * @param $element
     * @return mixed
     */
    public function getElement($element)
    {
        return Arr::get($this->elementsById, $this->getIdFromParameter($element));
    }

    /**
     * @param $element
     * @return mixed
     */
    public function getParentId($element)
    {
        return Arr::get(Arr::get($this->elementsAncestors, $this->getIdFromParameter($element), null), 0);
    }

    /**
     * @param $element
     * @return mixed
     */
    public function getParent($element)
    {
        $parentId = $this->getParentId($element);
        if ($parentId) {
            return Arr::get($this->elementsById, $parentId);
        }
        return null;
    }

    /**
     * @param $element
     * @return mixed
     */
    public function getChildrenIds($element)
    {
        return Arr::get($this->elementsByParent, $this->getIdFromParameter($element), []);
    }

    /**
     * @param $element
     * @return mixed
     */
    public function getChildren($element)
    {
        return $this->getElementsByIds($this->getChildrenIds($element));
    }


    /**
     * @param $ids
     * @return array
     */
    protected function getElementsByIds($ids)
    {
        $out = [];
        foreach ($ids as $id) {
            $out[] = $this->elementsById[$id];
        }
        return $out;
    }


    /**
     * @param int|Model $element
     * @param string|Closure $field
     * @param string $separator
     * @return string
     */
    public function getPath($element, $field = null, $separator = "/")
    {
        $elementId = $this->getIdFromParameter($element);
        if ($elementId) {
            $pathArray = array_reverse($this->getAncestorsIds($elementId));
            array_push($pathArray, $elementId);
            if ($field) {
                $pathArray = array_map(function ($id) use ($field) {
                    if ($field instanceof Closure) {
                        return $field($this->getElement($id));
                    } else {
                        return $this->getElement($id)->$field;
                    }
                }, $pathArray);
            }
            return join($separator, $pathArray);
        }
        return '';
    }

    /**
     * @param $path
     * @param $separator
     * @param $field
     */
    public function getElementByPath($path, $field = null, $separator = '/')
    {
        //todo: сделать!
    }

    /**
     * todo: сделать возможность передавать не рендер-шаблон, а колбек. Для какого-то кастомного рендера
     * @param $rootId
     * @param $render
     * @param $templateName
     * @param array $additionalParameters
     * @param bool $renderRoot
     * @return string
     */
    public function render($rootId, $render, $templateName, $additionalParameters = [], $renderRoot = false)
    {
        return $this->process(
            $rootId,
            function (
                $elementId,
                $level,
                $nested,
                $isRoot = false
            ) use (
                $render,
                $templateName,
                $additionalParameters
            ) {
                return $render->render($templateName, [
                        'level' => $level,
                        'element' => $this->getElement($elementId),
                        'nested' => $nested,
                        'isRoot' => $isRoot,
                    ] + $additionalParameters);
            },
            $renderRoot
        );

    }


    /**
     * @param $rootId
     * @param null $callbackItem
     * @param bool $processRoot
     * @param int $level
     * @return string
     */
    protected function process($rootId, $callbackItem, $processRoot = false, $level = 0)
    {
        if (!is_callable($callbackItem)) {
            return null;
        }

        $output = '';
        if ($processRoot) {
            $output .= $callbackItem(
                $rootId,
                $level,
                $this->process($rootId, $callbackItem, false, $level + 1),
                true
            );
        } else {
            if (Arr::has($this->elementsByParent, $rootId)) {
                foreach ($this->elementsByParent[$rootId] as $elementId) {
                    $output .= $callbackItem(
                        $elementId,
                        $level,
                        $this->process($elementId, $callbackItem, false, $level + 1)
                    );
                }
            }
        }

        return $output;
    }


    /**
     * Build tree meta-information
     *
     */
    protected function calculateAncestorsAndDescendants()
    {
        $this->elementsAncestors = [];
        $this->elementsDescendants = [];

        if ($this->elementsById) {
            foreach ($this->elementsById as $id => $element) {

                // build ancestors list
                $tmpId = $id;
                while ($this->elementsById[$tmpId]->parent_id) {
                    $this->elementsAncestors[$id][] = $this->elementsById[$tmpId]->parent_id;
                    $tmpId = $this->elementsById[$tmpId]->parent_id;
                }

                // build descendants list
                if (Arr::has($this->elementsAncestors, $id)) {
                    foreach ($this->elementsAncestors[$id] as $ancestorId) {
                        $this->elementsDescendants[$ancestorId][] = $id;
                    }
                }
            }
        }
    }

    /**
     * @param $element
     * @return mixed
     */
    protected function getIdFromParameter($element)
    {
        $id = $element instanceof Model ? $element->id : $element;
        return $id;
    }
}