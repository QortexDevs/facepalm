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
        $images = $this->images;
        $out = [];
        foreach ($images as $img) {
            if (Arr::has($out, $img->group)) {
                $out[$img->group] = (array)$out[$img->group];
                $out[$img->group][] = $img;
            } else {
                $out[$img->group] = $img;
            }
        }
        return $out;
    }
}