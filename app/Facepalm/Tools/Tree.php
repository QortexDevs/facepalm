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
    /** @var  Model[] */
    protected $elementsById;

    /** @var  array */
    protected $elementsByParent;

    protected $elementsAncestors;
    protected $elementsDescendants;


    /**
     * @param Collection $objects
     */
    public function fromEloquentCollection(Collection $objects)
    {
        /** @var Model $object */
        foreach ($objects as $object) {
            $this->elementsById[$object->id] = $object;
            $this->elementsByParent[$object->parent_id][] = $object->id;
        }

        $this->calculateAncestorsAndDescendants();
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