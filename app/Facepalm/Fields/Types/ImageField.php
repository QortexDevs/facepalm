<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Fields\Types;


use App\Facepalm\Fields\AbstractField;
use App\Facepalm\Models\Foundation\AbstractEntity;
use App\Facepalm\Models\Image;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class ImageField extends AbstractField
{
    protected $templateName = 'components/form/elements/image.twig';

    /**
     * @param null|AbstractEntity $object
     */
    public function prepareData($object = null)
    {
        parent::prepareData($object);

        $this->data['skipTransferringParameters'] = ['name', 'title', 'type', 'uploadName', 'fieldNameBase'];
        if (!Arr::has($this->parameters, 'previewSize')) {
            $this->parameters['previewSize'] = '80x80'; //todo: вынести в дефорлтные приложения параметры
        }

        if ($object) {
            $images = $object->images()->ofGroup($this->parameters['name']);
            if (Arr::get($this->parameters, 'multiple', false)) {
                $images = $images->orderBy('id', 'asc');
            } else {
                $images = $images->orderBy('id', 'desc')->limit(1);
            }
            $this->data['images'] = [];
            /** @var Image $image */
            foreach ($images->get() as $image) {
                $this->data['images'][] = [
                    'id' => $image->id,
                    'preview' => $image->getUri($this->parameters['previewSize']),
                    'full' => $image->getUri('original')
                    // todo: показывать не оригинал по клику, а другой размер?
                ];
            }
        } else {
            $this->setSkipped(true);
        }
    }


}