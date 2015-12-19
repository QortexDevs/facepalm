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
    /**
     * todo: подумать, как использовать ДИ-контейнер, чтобыне напрямую создавать, а через сервисы, чтоб можно было подменить
     * @param $type
     * @param array $params
     * @return AbstractField|null
     */
    public function get($type, $params = [])
    {
        //todo: aliases, instead of hardcode
        if ($type == 'checkbox') {
            $type = 'boolean';
        }
        $className = '\App\Facepalm\Fields\Types\\' . Str::ucfirst($type) . 'Field';
        if (class_exists($className)) {
            return new $className($params);
        }
        return new UnknownField();
    }


}