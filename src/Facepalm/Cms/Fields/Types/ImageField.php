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
    protected $templateName = 'facepalm::components/form/elements/image';

    /**
     * @param null|AbstractEntity $object
     */
    public function prepareData($object = null)
    {
        parent::prepareData($object);

        if ($object) {
            if (!Arr::has($this->parameters, 'previewSize')) {
                $this->parameters['previewSize'] = config('facepalm.defaultThumbnailSize');
            }

            $this->data['images'] = [];

            /** @var Image $image */
            foreach ($this->getItems($object, 'images')->get() as $image) {
                $this->data['images'][] = [
                    'id' => $image->id,
                    'preview' => $image->getUri($this->parameters['previewSize']),
                    'full' => $image->getUri('original'),
                    'group' => $this->parameters['name'],
                    'is_video' => $image->is_video,
                    'video_link' => $image->video_link,
                    'embed_code' => $image->embed_code
                    // todo: показывать не оригинал по клику, а другой размер?
                ];
            }
        }
    }


}