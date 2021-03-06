<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models\Foundation;


use Closure;
use Facepalm\Http\Middleware\RedirectTrailingSlash;
use Facepalm\Models\File;
use Facepalm\Models\Image;
use Facepalm\Models\ModelFactory;
use Facepalm\Models\TextItem;
use HirotoK\JSON5\Tests\Base;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;

abstract class BaseEntity extends AbstractEntity
{
    use TranslatableTrait;

    protected $casts = [
        'status' => 'boolean',
    ];

    protected $bindedEntitiesByGroup = [];
    protected $exposeImagesInArray = [];

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
     * @param null $group
     * @return array
     */
    public function imagesByGroup($group = null)
    {
        $this->processBindedEntities('images');
        if ($group) {
            if (Arr::has($this->bindedEntitiesByGroup['images'], $group)) {
                return $this->bindedEntitiesByGroup['images'][$group];
            }
            return null;
        }
        return $this->bindedEntitiesByGroup['images'];
    }

    /**
     * @return array
     */
    public function filesByGroup($group = null)
    {
        $this->processBindedEntities('files');
        if ($group) {
            if (Arr::has($this->bindedEntitiesByGroup['files'], $group)) {
                return $this->bindedEntitiesByGroup['files'][$group];
            }
            return null;
        }
        return $this->bindedEntitiesByGroup['files'];
    }


    public function attachImage($group, $path, $deleteOld = false)
    {
        if ($deleteOld) {
            $this->images()
                ->ofGroup($group)
                ->get()
                ->each(function ($uploadableObject) {
                    $uploadableObject->delete();
                });

        }
        if ($path instanceof UploadedFile) {
            $uploadableObject = Image::createFromFile($path->getPathName(), $path->getClientOriginalName());
        } else {
            $uploadableObject = Image::createFromFile($path);
        }

        $uploadableObject->setAttribute('group', $group);
        $uploadableObject->show_order = Image::max('show_order') + 1;
        $uploadableObject->save();
        $this->images()->save($uploadableObject);
        return $uploadableObject;
    }

    public function attachFile($group, $path, $deleteOld = false)
    {
        if ($deleteOld) {
            $this->files()
                ->ofGroup($group)
                ->get()
                ->each(function ($uploadableObject) {
                    $uploadableObject->delete();
                });

        }
        if ($path instanceof UploadedFile) {
            $uploadableObject = File::createFromFile($path->getPathName(), $path->getClientOriginalName());
        } else {
            $uploadableObject = File::createFromFile($path);
        }

        $uploadableObject->setAttribute('group', $group);
        $uploadableObject->show_order = File::max('show_order') + 1;
        $uploadableObject->save();
        $this->images()->save($uploadableObject);
        return $uploadableObject;
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
            foreach ($this->bindedEntitiesByGroup[$type] as $group => $arr) {
                $this->bindedEntitiesByGroup[$type][$group] = collect($arr)->sortBy('show_order')->all();
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
     * @param $id
     * @return BaseEntity|null
     */
    public static function getByIdOrAbort($id)
    {
        $object = static::getByIdWithData($id);
        if (!$object) {
            abort(404);
        }
        return $object;
    }

    /**
     * Returns collection of active objects with related textItems and images grouped
     *
     * @param Closure $callback
     * @return mixed
     */
    public static function getCollectionWithData($callback = null, $onlyImages = false)
    {
        // todo: подумать, как вставить здесь table_name.status
        /** @var Builder $builder */
        $builder = static::where('status', 1)
            ->with('images');

        if (!$onlyImages) {
            $builder = $builder->with('textItems');
        }

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
     * @param Closure $callback
     * @return mixed
     */
    public static function getCountWithLocalization($localizationFieldName, $languageCode, Closure $callback = null)
    {
        $builder = static::where('status', 1);
        self::setLocalizationExistenceConstraint($builder, $localizationFieldName, $languageCode);
        if ($callback) {
            $callback($builder);
        }
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

    public function toArray()
    {
        if ($this->exposeImagesInArray) {
            foreach ($this->imagesByGroup() as $group => $images) {
                $this->$group = array_map(function ($element) {
                    return $element->getUri('500x500');
                }, $images);
            }
        }
        if (method_exists($this, 'toArrayTranslatable')) {
            return $this->toArrayTranslatable();
        } else {
            return parent::toArray();
        }
    }

}