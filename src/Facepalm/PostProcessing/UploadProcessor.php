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
        $isVideo = false;
        if ($fieldName === 'video') {
            $fieldName = 'image';
            $isVideo = true;
        }
        $relationMethodName = $fieldName . 's';
        $className = Str::ucfirst($fieldName);
        $resultMethodName = 'getResultArrayFor' . $className;
        $afterSaveMethodName = 'processAfterSave' . $className;

        $processedFiles = [];
        if (is_array($value)) {
            foreach ($value as $groupName => $uploadedFiles) {
                if ($uploadedFiles instanceof UploadedFile || is_string($uploadedFiles)) {
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
                    if ($isVideo) {
                        $thumbnailUrl = $this->getVideoThumbnail($uploadedFile);
                        if ($thumbnailUrl) {
                            $thumbnailImageName = 'videoThumbnail.jpg';
                            $thumbnailImagePath = tempnam(sys_get_temp_dir(), 'myApp_');
                            $ch = curl_init($thumbnailUrl);
                            $fp = fopen($thumbnailImagePath, 'wb');
                            curl_setopt($ch, CURLOPT_FILE, $fp);
                            curl_setopt($ch, CURLOPT_HEADER, 0);
                            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                            curl_exec($ch);
                            curl_close($ch);
                            fclose($fp);
                            //todo: обработка ошибок
                            //todo: наложение треугольничка
                        } else {
                            $thumbnailImageName = 'video-play-dummy.png';
                            $thumbnailImagePath = app()->publicPath() . DIRECTORY_SEPARATOR . config('facepalm.facepalmAssetsPath') . 'i' . DIRECTORY_SEPARATOR . $thumbnailImageName;
                        }
                        /** @var Image $uploadableObject */
                        $uploadableObject = Image::createFromFile($thumbnailImagePath, $thumbnailImageName);

                        $uploadableObject->video_link = $uploadedFile;
                        $uploadableObject->embed_code = $this->convertYoutube($uploadedFile);
                        $uploadableObject->is_video = true;
                        $uploadableObject->group = $groupName;

                        if ($thumbnailUrl) {
                            $uploadableObject->postProcess(function (\Intervention\Image\Image $image) {
                                $playIconImagePath = app()->publicPath() . DIRECTORY_SEPARATOR . config('facepalm.facepalmAssetsPath') . 'i/video-play-icon.png';
                                $playIcon = \Intervention\Image\Facades\Image::make($playIconImagePath);
                                $playIcon->fit(0.85 * min($image->getWidth(), $image->getHeight()));
                                $image->insert($playIcon, 'center');
                                $image->save();
                            });
                        }
                    } else {
                        $uploadableObject = ModelFactory::createFromUpload($className, $uploadedFile)
                            ->setAttribute('group', $groupName);
                    }


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
            'basePath' => $image->getUri(null, true),
            'ext' => $image->ext,
            'group' => $image->group,
            'video_link' => $image->video_link,
            'embed_code' => $image->embed_code,
            'is_video' => $image->is_video
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

    /**
     * Convert youtube link to embed code
     * @param $string
     * @return mixed
     */
    protected function convertYoutube($string)
    {
        return preg_replace(
            "/\s*[a-zA-Z\/\/:\.]*youtu(be.com\/watch\?v=|.be\/)([a-zA-Z0-9\-_]+)([a-zA-Z0-9\/\*\-\_\?\&\;\%\=\.]*)/i",
            "<iframe src=\"//www.youtube.com/embed/$2\" width=\"560\" height=\"315\" frameborder=\"0\" allowfullscreen></iframe>",
            $string
        );
    }

    /**
     * Get thumbnail image for video
     * @param $string
     * @return string
     */
    protected function getVideoThumbnail($string)
    {
        if (strstr($string, 'youtu')) {
            preg_match(
                '/(youtu\.be\/|youtube\.com\/(watch\?(.*&)?v=|(embed|v)\/))([^#\?&"\'>]+)((\S*)t=(\d+))?/',
                $string,
                $matches
            );
            if (isset($matches[5])) {
                $video['id'] = $matches[5];
                $imgUrl = "http://img.youtube.com/vi/" . $video['id'] . "/maxresdefault.jpg";
                $headers = get_headers($imgUrl);
                if (strstr($headers[0], "404")) {
                    $imgUrl = "http://img.youtube.com/vi/" . $video['id'] . "/0.jpg";
                }
                return $imgUrl;
            }
        } elseif (strstr($string, 'vimeo')) {
            preg_match('/(http\:\/\/)?vimeo\.com\/([0-9]+)/', $string, $matches);
            if (isset($matches[2])) {
                $video['id'] = $matches[2];
                $hash = unserialize(file_get_contents("http://vimeo.com/api/v2/video/" . $video['id'] . ".php"));
                $imgUrl = $hash[0]["thumbnail_large"];
                return $imgUrl;
            }
        }
    }
}