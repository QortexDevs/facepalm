<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace App\Facepalm\Fields\Types;


use App\Facepalm\Fields\AbstractField;
use App\Facepalm\Models\File;
use App\Facepalm\Models\Foundation\AbstractEntity;
use Illuminate\Support\Arr;

class FileField extends AbstractField
{
    protected $templateName = 'components/form/elements/file.twig';

    /**
     * @param null|AbstractEntity $object
     */
    public function prepareData($object = null)
    {
        parent::prepareData($object);

        $this->data['skipTransferringParameters'] = ['name', 'title', 'type', 'uploadName', 'fieldNameBase'];

        if ($object) {
            $files = $object->files()->ofGroup($this->parameters['name']);
            if (Arr::get($this->parameters, 'multiple', false)) {
                $files = $files->orderBy('show_order', 'asc');
            } else {
                $files = $files->orderBy('id', 'desc')->limit(1);
            }
            $this->data['files'] = [];
            /** @var File $file */
            foreach ($files->get() as $file) {
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
        } else {
            $this->setSkipped(true);
        }
    }


}