<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models\Foundation;


use Facepalm\Models\TextItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

abstract class BaseEntity extends AbstractEntity
{
    use TranslatableTrait;

    protected $casts = [
        'status' => 'boolean',
    ];

    protected $bindedEntitiesByGroup = [];

    /**
     *
     */
    protected static function boot()
    {
        parent::boot();

        // generate name on model creating
        self::deleting(function (BaseEntity $entity) {
            $entity->images()
                ->get()
                ->each(function ($uploadableObject) {
                    $uploadableObject->delete();
                });
            $entity->files()
                ->get()
                ->each(function ($uploadableObject) {
                    $uploadableObject->delete();
                });
            $entity->textItems()->delete();
        });
    }

    /**
     * Get all binded images
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function images()
    {
        return $this->morphMany('Facepalm\Models\Image', 'bind');
    }

    /**
     * Get all binded images
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function files()
    {
        return $this->morphMany('Facepalm\Models\File', 'bind');
    }

    /**
     * @return array
     */
    public function imagesByGroup()
    {
        $this->processBindedEntities('images');
        return $this->bindedEntitiesByGroup['images'];
    }

    /**
     * @return array
     */
    public function filesByGroup()
    {
        $this->processBindedEntities('files');
        return $this->bindedEntitiesByGroup['files'];
    }

    /**
     * @param array|string $entitiesToGroup
     * @param bool $force
     * @return $this
     */
    public function processBindedEntities($entitiesToGroup = ['images', 'files'], $force = false)
    {
        $entitiesToGroup = (array)$entitiesToGroup;
        foreach ($entitiesToGroup as $type) {
            if (!Arr::has($this->bindedEntitiesByGroup, $type) || $force) {
                $this->bindedEntitiesByGroup[$type] = [];
                $objects = $this->{$type};
                if ($objects) {
                    foreach ($objects as $obj) {
                        if (Arr::has($this->bindedEntitiesByGroup[$type], $obj->group)) {
                            if (!is_array($this->bindedEntitiesByGroup[$type][$obj->group])) {
                                $this->bindedEntitiesByGroup[$type][$obj->group] = [$this->bindedEntitiesByGroup[$type][$obj->group]];
                            }
                            $this->bindedEntitiesByGroup[$type][$obj->group][] = $obj;
                        } else {
                            $this->bindedEntitiesByGroup[$type][$obj->group] = $obj;
                        }
                    }
                }
            }
        }

        return $this;
    }

    /**
     * @param $id
     * @return BaseEntity|null
     */
    public static function getByIdWithData($id)
    {
        $object = static::where('status', 1)
            ->with('images')
            ->with('textItems')
            ->find($id);

        if ($object) {
            $object->processBindedEntities('images');
        }

        return $object;
    }

}