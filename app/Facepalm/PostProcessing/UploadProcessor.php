<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace App\Facepalm\PostProcessing;

use App\Facepalm\Cms\CmsCommon;
use App\Facepalm\Models\ModelFactory;
use App\Facepalm\Models\File;
use App\Facepalm\Models\Foundation\AbstractEntity;
use App\Facepalm\Models\Foundation\BaseEntity;
use App\Facepalm\Models\Image;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class UploadProcessor
{
    /**
     * @param $fieldName
     * @param $object
     * @param $value
     * @param $requestRawData
     * @return array
     */
    public function handle($fieldName, $object, $value, $requestRawData)
    {
        $processedFiles = [];

        if ($this->isImageUploadField($fieldName)) {
            $processedFiles += $this->handleImageUpload($object, $value, $requestRawData);
        } elseif ($this->isFileUploadField($fieldName)) {
            $processedFiles += $this->handleFileUpload($object, $value, $requestRawData);
        }

        return $processedFiles;
    }

    /**
     * @param BaseEntity $object
     * @param $value
     * @param $requestRawData
     * @return array
     */
    protected function handleImageUpload(BaseEntity $object, $value, $requestRawData)
    {
        $processedFiles = [];
        if (is_array($value)) {
            foreach ($value as $imageName => $files) {
                if ($files instanceof UploadedFile) {
                    $files = [$files];
                }
                foreach ($files as $file) {
                    if (!Arr::get($requestRawData, 'multiple', false)) {
                        //удаляем предыдущие картинки
                        $object->images()->ofGroup($imageName)->get()->each(function ($image) {
                            $image->delete();
                        });
                    }

                    $previewSize = Arr::get($requestRawData, 'previewSize', config('app.defaultThumbnailSize'));

                    $img = Image::createFromUpload($file)
                        ->setAttribute('group', $imageName)
                        ->generateSize($previewSize);

                    //todo: дополнительные прегенерируемые размеры
                    DB::transaction(function () use ($img) {
                        $img->show_order = Image::max('show_order') + 1;
                        $img->save();
                    });

                    $object->images()->save($img);
                    $processedFiles[] = [
                        'image' => [
                            'id' => $img->id,
                            'preview' => $img->getUri($previewSize),
                            'full' => $img->getUri('original'),
                            'group' => $imageName
                        ]
                    ];
                }
            }
        }
        return $processedFiles;
    }

    /**
     * @param BaseEntity $object
     * @param $value
     * @param $requestRawData
     * @return array
     */
    protected function handleFileUpload(BaseEntity $object, $value, $requestRawData)
    {
        $processedFiles = [];
        if (is_array($value)) {
            foreach ($value as $fileName => $files) {
                if ($files instanceof UploadedFile) {
                    $files = [$files];
                }
                foreach ($files as $file) {
                    if (!Arr::get($requestRawData, 'multiple', false)) {
                        //удаляем предыдущие картинки
                        $object->files()->ofGroup($fileName)->get()->each(function ($file) {
                            $file->delete();
                        });
                    }

                    $fileObj = File::createFromUpload($file)
                        ->setAttribute('group', $fileName);

                    DB::transaction(function () use ($fileObj) {
                        $fileObj->show_order = File::max('show_order') + 1;
                        $fileObj->save();
                    });

                    $object->files()->save($fileObj);
                    $processedFiles[] = [
                        'file' => [
                            'id' => $fileObj->id,
                            'icon' => $fileObj->getIconClass(),
                            'name' => $fileObj->display_name,
                            'type' => $fileObj->type,
                            'size' => $fileObj->getReadableSize(),
                            'uri' => $fileObj->getUri(),
                            'group' => $fileName
                        ]
                    ];
                }

            }
        }
        return $processedFiles;
    }

    /**
     * @param $fieldName
     * @return bool
     */
    protected function isImageUploadField($fieldName)
    {
        return $fieldName == 'image';
    }

    /**
     * @param $fieldName
     * @return bool
     */
    protected function isFileUploadField($fieldName)
    {
        return $fieldName == 'file';
    }
}