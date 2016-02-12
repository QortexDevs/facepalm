<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models\Foundation;


use App\Facepalm\Models\TextItem;
use Illuminate\Database\Eloquent\Model;

abstract class BaseEntity extends AbstractEntity
{
    protected $textFields = [];
    protected $stringFields = [];

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
        });
    }

    /**
     * Get all binded images
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function images()
    {
        return $this->morphMany('App\Facepalm\Models\Image', 'bind');
    }

    /**
     * Get all binded images
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function files()
    {
        return $this->morphMany('App\Facepalm\Models\File', 'bind');
    }

    /**
     * @param null $languageCode
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function textItems($languageCode = null)
    {
        if ($languageCode) {
            return $this->textItems()->ofLanguage($languageCode);
        } else {
            return $this->morphMany('App\Facepalm\Models\TextItem', 'bind');
        }
    }

    /**
     * @param null $group
     * @param null $languageCode
     * @return mixed
     */
    public function getTextItems($group = null, $languageCode = null)
    {
        $builder = $this->textItems();
        if ($languageCode && $group) {
            $builder = $builder->ofGroupAndLanguage($group, $languageCode);
        } elseif ($languageCode) {
            $builder = $builder->ofLanguage($languageCode);
        } elseif ($group) {
            $builder = $builder->ofGroup($group);
        }
        return $builder->get();
    }

    /**
     * @param $group
     * @param null $languageCode
     * @return mixed
     */
    public function getTextItem($group, $languageCode = null)
    {
        if (!$languageCode) {
            $languageCode = app()->getLocale();
        }
        return $this->textItems()->ofGroupAndLanguage($group, $languageCode)->first();
    }

    /**
     * @param $group
     * @param $languageCode
     * @param null $newValue
     * @return mixed
     */
    public function string($group, $languageCode = null, $newValue = null)
    {
        if ($newValue) {
            //
        } else {
            $textItem = $this->getTextItem($group, $languageCode);
            return $textItem ? $textItem->stringValue : null;
        }
    }

    /**
     * @param null $languageCode
     * @return mixed
     */
    public function strings($languageCode = null)
    {
        if (!$languageCode) {
            $languageCode = app()->getLocale();
        }
        $items = $this->getTextItems(null, $languageCode);
        return $items->filter(function ($item) {
            return $item->stringValue;
        })->pluck('stringValue', 'group');
    }

    /**
     * @param $group
     * @param $languageCode
     * @param null $newValue
     * @return mixed
     */
    public function text($group, $languageCode = null, $newValue = null)
    {
        if ($newValue) {
            //
        } else {
            $textItem = $this->getTextItem($group, $languageCode);
            return $textItem ? $textItem->textBody : null;
        }
    }

    /**
     * @param null $languageCode
     * @return mixed
     */
    public function texts($languageCode = null)
    {
        if (!$languageCode) {
            $languageCode = app()->getLocale();
        }
        $items = $this->getTextItems(null, $languageCode);
        return $items->filter(function ($item) {
            return $item->textBody;
        })->pluck('textBody', 'group');
    }

    /**
     * @param string $key
     * @return mixed
     */
    public function __get($key)
    {
        if (in_array($key, $this->stringFields)) {
            return $this->string($key);
        } elseif (in_array($key, $this->textFields)) {
            return $this->text($key);
        } else {
            return parent::__get($key);
        }
    }


    /**
     * @param $group
     * @param TextItem $textItem
     * @param null $languageCode
     */
    public function setTextItem($group, $textItem, $languageCode = null)
    {
        if (!$languageCode) {
            $languageCode = app()->getLocale();
        }
        // todo: values - массив или объект?
        // todo: setTextBody()
        // todo: setStringValue
        // todo: переименовать Text в text-object или вообще придумать другое название для объекта? Content? TextContent?
    }

    /*todo:
        ->string('title', 'value', 'en'*)
        ->text('title', 'value', 'en'*)
            ->__set

        todo: подумать, как это все кешировать, чтобы не дергать каждый раз базу, особенно при записи значений.
        todo: подумать, как сохранять, если уже есть такой объект (replace)

    */

}