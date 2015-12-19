<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 19:03
 */

namespace App\Facepalm\Fields;


use App\Facepalm\Fields\Types\UnknownField;
use Illuminate\Support\Str;

class FieldFactory
{

    const TYPE_STRING = 'string';
    const TYPE_DATE = 'date';
    const TYPE_DATETIME = 'datetime';
    const TYPE_TEXT = 'text';
    const TYPE_INTEGER = 'integer';
    const TYPE_DICTIONARY = 'dictionary';
    const TYPE_RELATION = 'relation';
    const TYPE_PASSWORD = 'password';
    const TYPE_BOOLEAN = 'boolean';

    /**
     * todo: подумать, как использовать ДИ-контейнер, чтобыне напрямую создавать, а через сервисы, чтоб можно было подменить
     * @param $type
     * @param array $params
     * @return AbstractField|null
     */
    public function get($type, $params = [])
    {
        $className = '\App\Facepalm\Fields\Types\\' . Str::ucfirst($type) . 'Field';
        if (class_exists($className)) {
            return new $className($params);
        }
        return new UnknownField();
    }


}