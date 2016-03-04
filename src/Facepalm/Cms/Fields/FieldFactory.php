<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 19:03
 */

namespace Facepalm\Cms\Fields;


use Facepalm\Cms\Fields\Types\UnknownField;
use Illuminate\Support\Str;

class FieldFactory
{
    /**
     * todo: подумать, как использовать ДИ-контейнер, чтобы не напрямую создавать, а через сервисы, чтоб можно было подменить
     * @param $type
     * @param array $params
     * @return AbstractField|null
     */
    public function get($type, $params = [])
    {
        $className = 'Facepalm\Cms\Fields\Types\\' . $this->canonize($type) . 'Field';
        if (class_exists($className)) {
            return new $className($params);
        }
        return new UnknownField();
    }

    /**
     * @param $type
     * @return string
     */
    private function canonize($type)
    {
        // todo: aliases, instead of hardcode
        // todo: пиши сука, подробные тудушки, которые понятно читать через месяц. А то не ясно, что имел в виду.
        if ($type == 'checkbox') {
            $type = 'boolean';
        }
        if ($type == 'dictionary') {
            $type = 'select';
        }
        return Str::ucfirst($type);
    }


}