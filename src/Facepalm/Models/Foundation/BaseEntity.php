<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models\Foundation;


use Closure;
use Facepalm\Models\TextItem;
use HirotoK\JSON5\Tests\Base;
use Illuminate\Database\Eloquent\Builder;
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
        self::saving(function (BaseEntity $entity) {
            $entity->saveDirtyTextItems();
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
                        $this->bindedEntitiesByGroup[$type][$obj->group][] = $obj;
                    }
                }
            }
        }

        return $this;
    }

    /**
     * Returns active object with related textItems and images grouped
     *
     * @param $id
     * @return BaseEntity|null
     */
    public static function getByIdWithData($id)
    {
        /** @var BaseEntity $object */
        $object = static::where('status', 1)
            ->with('images')
            ->with('textItems')
            ->find($id);

        if ($object) {
            $object->processBindedEntities('images');
        }

        return $object;
    }

    /**
     * Returns collection of active objects with related textItems and images grouped
     *
     * @param Closure $callback
     * @return mixed
     */
    public static function getCollectionWithData($callback = null)
    {
        /** @var Builder $builder */
        $builder = static::where('status', 1)
            ->with('images')
            ->with('textItems');

        if ($callback) {
            $callback($builder);
        }

        $collection = $builder->get()
            ->map(function (BaseEntity $item) {
                return $item->processBindedEntities('images');
            });

        return $collection;
    }

    /**
     * @param $localizationFieldName
     * @param $languageCode
     * @return mixed
     */
    public static function getCountWithLocalization($localizationFieldName, $languageCode)
    {
        $builder = static::where('status', 1);
        self::setLocalizationExistenceConstraint($builder, $localizationFieldName, $languageCode);
        return $builder->count();
    }

    /**
     * @param $builder
     * @param $localizationFieldName
     * @param $languageCode
     * @return mixed
     */
    public static function setLocalizationExistenceConstraint($builder, $localizationFieldName, $languageCode)
    {
        $builder->whereHas('textItems', function ($query) use ($localizationFieldName, $languageCode) {
            $query->where('languageCode', $languageCode);
            $query->where('group', $localizationFieldName);
            $query->where('stringValue', '!=', '');
        });
    }

}