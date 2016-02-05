<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Cms\Fields\Types;


use App\Facepalm\Cms\Fields\AbstractField;
use App\Facepalm\Cms\Fields\UploadableField;
use App\Facepalm\Models\File;
use App\Facepalm\Models\Foundation\AbstractEntity;
use Illuminate\Support\Arr;

class FileField extends UploadableField
{
    protected $templateName = 'components/form/elements/file.twig';

    /**
     * @param null|AbstractEntity $object
     */
    public function prepareData($object = null)
    {
        parent::prepareData($object);

        if ($object) {
            $this->data['files'] = [];

            /** @var File $file */
            foreach ($this->getItems($object, 'files')->get() as $file) {
                $this->data['files'][] = [
                    'id' => $file->id,
                    'icon' => $file->getIconClass(),
                    'name' => $file->display_name,
                    'type' => $file->type,
                    'size' => $file->getReadableSize(),
                    'uri' => $file->getUri(),
                    'group' => $this->parameters['name']
                ];
            }
        }
    }


}