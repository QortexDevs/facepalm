<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\Fields\UploadableField;
use Facepalm\Models\Foundation\AbstractEntity;
use Facepalm\Models\Image;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class ImageField extends UploadableField
{
    protected $templateName = 'facepalm::components/form/elements/image.twig';

    /**
     * @param null|AbstractEntity $object
     */
    public function prepareData($object = null)
    {
        parent::prepareData($object);

        if ($object) {
            if (!Arr::has($this->parameters, 'previewSize')) {
                $this->parameters['previewSize'] = config('app.defaultThumbnailSize');
            }

            $this->data['images'] = [];

            /** @var Image $image */
            foreach ($this->getItems($object, 'images')->get() as $image) {
                $this->data['images'][] = [
                    'id' => $image->id,
                    'preview' => $image->getUri($this->parameters['previewSize']),
                    'full' => $image->getUri('original'),
                    'group' => $this->parameters['name']
                    // todo: показывать не оригинал по клику, а другой размер?
                ];
            }
        }
    }


}