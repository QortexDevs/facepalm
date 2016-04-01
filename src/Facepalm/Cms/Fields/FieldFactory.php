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
     * @param $type
     * @param array $params
     * @return AbstractField|null
     */
    public function get($type, $params = [])
    {
        try {
            return app()->make($this->canonize($type));
        } catch (\Exception $e) {
            return app()->make($this->canonize('unknown'));
        }
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

        if (Str::contains($type, '.')) {
            return $type;
        } else {
            return 'facepalm.cms.field.' . Str::lower($type);
        }

    }


}