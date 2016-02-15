<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models\Foundation;


use App\Facepalm\Models\TextItem;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

// note:
// наверное, трейт не самый подходящий способ. Т.к. трейт не должен использовать методы класса,
// к которому он подключается

trait TranslatableTrait
{
    protected $textFields = [];
    protected $stringFields = [];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function textItems()
    {
        return $this->morphMany('App\Facepalm\Models\TextItem', 'bind');
    }

    /**
     * Returns collection of TextItem objects
     *
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
     * Returns single TextItem object
     * If no language is specified the default one is used
     *
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
     * Get or set single string
     * If no language is specified the default one is used
     *
     * @param $group
     * @param $languageCode
     * @param null $newValue
     * @return mixed
     */
    public function string($group, $languageCode = null, $newValue = null)
    {
        if ($newValue) {
            $this->setTextItem($group, ['stringValue' => $newValue], $languageCode);
        } else {
            $textItem = $this->getTextItem($group, $languageCode);
            return $textItem ? $textItem->stringValue : null;
        }
    }

    /**
     * Get strings collection
     * If no language is specified the default one is used
     *
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
     * Get or set single text
     * If no language is specified the default one is used
     *
     * @param $group
     * @param $languageCode
     * @param null $newValue
     * @return mixed
     */
    public function text($group, $languageCode = null, $newValue = null)
    {
        if ($newValue) {
            $this->setTextItem($group, ['textBody' => $newValue], $languageCode);
        } else {
            $textItem = $this->getTextItem($group, $languageCode);
            return $textItem ? $textItem->textBody : null;
        }
    }

    /**
     * Get texts collection
     * If no language is specified the default one is used
     *
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
     * Magic method for accessing string- and text- fields, that is specified in $textFields and $stringFields arrays
     * The default language is used
     *
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
     * Magic method for setting string- and text- fields, that is specified in $textFields and $stringFields arrays
     * The default language is used
     *
     * todo: каждое присваивание вызывает сохранение в базу сразу.
     * todo: Это ОЧЕНЬ ПЛОХО! Нужно переделать в отложенное сохранение.
     *
     * @param string $key
     * @param $value
     * @return mixed
     */
    public function __set($key, $value)
    {
        if (in_array($key, $this->stringFields)) {
            return $this->string($key, null, $value);
        } elseif (in_array($key, $this->textFields)) {
            return $this->text($key, null, $value);
        } else {
            return parent::__set($key, $value);
        }
    }


    /**
     * @param $group
     * @param TextItem|array $newValue
     * @param null $languageCode
     */
    public function setTextItem($group, $newValue, $languageCode = null)
    {
        if (!$languageCode) {
            $languageCode = app()->getLocale();
        }

        DB::transaction(function () use ($group, $languageCode, $newValue) {
            //todo: potential multi-threading problem
            //todo: подумать, как оно себя будет вести в случае одновременных запросов
            $textItem = $this->getTextItem($group, $languageCode);
            if (!$textItem) {
                $textItem = new TextItem([
                    'group' => $group,
                    'languageCode' => $languageCode,
                    'status' => 1,
                    'show_order' => TextItem::max('show_order') + 1
                ]);
            }

            if ($newValue instanceof TextItem) {
                $textItem->stringValue = $newValue->stringValue;
                $textItem->textBody = $newValue->textBody;
            } elseif (is_array($newValue)) {
                if (Arr::has($newValue, 'stringValue')) {
                    $textItem->stringValue = $newValue['stringValue'];
                }
                if (Arr::has($newValue, 'textBody')) {
                    $textItem->textBody = $newValue['textBody'];
                }
            }

            $this->textItems()->save($textItem);
        });
    }

    /*todo:

        todo: подумать, как это все кешировать, чтобы не дергать каждый раз базу, особенно при записи значений.

        todo: рефакторинг, объединить одинаковые методы
        todo: single lang mode

        todo: поиск и сортировка по этому полю

    */

}