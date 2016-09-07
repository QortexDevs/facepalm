<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.05.16
 * Time: 11:54
 */

namespace Facepalm\Tools;

use Facepalm\Models\Image;
use Facepalm\Models\StringValue;
use Facepalm\Models\TranslatableStringValue;
use Illuminate\Foundation\Application;
use Illuminate\Translation\ArrayLoader;

class StringsTranslationLoader extends ArrayLoader
{
    /**
     * @var string[]
     */
    protected $stringValues;
    protected $inited = false;

    /**
     * @return \string[]
     */
    public function getStringValues()
    {
        return $this->stringValues;
    }

    /**
     * @return bool
     */
    public function isInited()
    {
        return $this->inited;
    }

    /**
     * StringsTranslationLoader constructor.
     */
    public function __construct()
    {
        foreach (StringValue::all() as $v) {
            $this->stringValues[$v->name] = $v->value;
        }
        foreach (TranslatableStringValue::all() as $v) {
            $this->stringValues[$v->name] = $v->value;
        }

        $stringsByGroup = [];
        foreach ($this->stringValues as $k => $v) {
            $parts = explode('.', $k);
            $group = array_shift($parts);
            $key = implode('.', $parts);
            $stringsByGroup[$group][$key] = $v;

        }
        foreach ($stringsByGroup as $group => $messages) {
            $this->addMessages(app()->getLocale(), $group, $messages);
        }

        $this->inited = true;
    }
}