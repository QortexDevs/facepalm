<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace Facepalm\PostProcessing;

use Facepalm\Models\File;
use Facepalm\Models\Foundation\AbstractEntity;
use Facepalm\Models\Foundation\BaseEntity;
use Facepalm\Models\Image;
use Facepalm\Models\ModelFactory;
use Facepalm\PostProcessing\AmfActions\AbstractAction;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class UploadProcessor
{
    /**
     * @param $fieldName (image|file)
     * @param AbstractEntity|null $object
     * @param $value
     * @param $requestRawData
     * @return array
     */
    public function handle($fieldName, $object, $value, $requestRawData)
    {
        $relationMethodName = $fieldName . 's';
        $className = Str::ucfirst($fieldName);
        $resultMethodName = 'getResultArrayFor' . $className;
        $afterSaveMethodName = 'processAfterSave' . $className;
        $processedFiles = [];
        if (is_array($value)) {
            foreach ($value as $groupName => $uploadedFiles) {
                if ($uploadedFiles instanceof UploadedFile) {
                    $uploadedFiles = [$uploadedFiles];
                }
                /** @var UploadedFile $uploadedFile */
                foreach ($uploadedFiles as $uploadedFile) {
                    if ($object && !Arr::get($requestRawData, 'multiple', false)) {
                        //удаляем предыдущие картинки
                        $object->{$relationMethodName}()
                            ->ofGroup($groupName)
                            ->get()
                            ->each(function ($uploadableObject) {
                                $uploadableObject->delete();
                            });
                    }


                    /** @var Image|File $uploadableObject */
                    $uploadableObject = ModelFactory::createFromUpload($className, $uploadedFile)
                        ->setAttribute('group', $groupName);


                    DB::transaction(function () use ($uploadableObject, $className) {
                        $uploadableObject->show_order = ModelFactory::max($className, 'show_order') + 1;
                        $uploadableObject->save();
                    });

                    if (method_exists($this, $afterSaveMethodName)) {
                        $this->{$afterSaveMethodName}($uploadableObject, $requestRawData);
                    }

                    if ($object) {
                        $object->{$relationMethodName}()->save($uploadableObject);
                    }
                    $processedFiles[] = [
                        $fieldName => $this->{$resultMethodName}($uploadableObject, $requestRawData)
                    ];
                }
            }
        }
        return $processedFiles;
    }


    /**
     * @param $image
     * @param $requestRawData
     */
    protected function processAfterSaveImage(Image $image, $requestRawData)
    {
        //todo: дополнительные прегенерируемые размеры
        $previewSize = Arr::get($requestRawData, 'previewSize', config('facepalm.defaultThumbnailSize'));
        $image->generateSize($previewSize);
    }


    /**
     * @param Image $image
     * @param $requestRawData
     * @return array
     */
    protected function getResultArrayForImage(Image $image, $requestRawData)
    {
        $previewSize = Arr::get($requestRawData, 'previewSize', config('facepalm.defaultThumbnailSize'));
        return [
            'id' => $image->id,
            'preview' => $image->getUri($previewSize),
            'full' => $image->getUri('original'),
            'group' => $image->group
        ];
    }

    /**
     * @param File $file
     * @return array
     */
    protected function getResultArrayForFile(File $file)
    {
        return [
            'id' => $file->id,
            'icon' => $file->getIconClass(),
            'name' => $file->display_name,
            'type' => $file->type,
            'size' => $file->getReadableSize(),
            'uri' => $file->getUri(),
            'group' => $file->group
        ];
    }
}