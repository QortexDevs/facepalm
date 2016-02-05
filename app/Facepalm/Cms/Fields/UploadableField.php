<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Cms\Fields;


use App\Facepalm\Cms\Fields\AbstractField;
use App\Facepalm\Models\Foundation\AbstractEntity;
use App\Facepalm\Models\Image;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

abstract class UploadableField extends AbstractField
{

    /**
     * @param null|AbstractEntity $object
     */
    public function prepareData($object = null)
    {
        parent::prepareData($object);

        $this->data['skipTransferringParameters'] = ['name', 'title', 'type', 'uploadName', 'fieldNameBase'];
        if (!$object) {
            $this->setSkipped(true);
        }
    }

    protected function getItems($object, $method)
    {
        $images = $object->{$method}()->ofGroup($this->parameters['name']);
        if (Arr::get($this->parameters, 'multiple', false)) {
            return $images->orderBy('show_order', 'asc');
        } else {
            return $images->orderBy('id', 'desc')->limit(1);
        }
    }


}