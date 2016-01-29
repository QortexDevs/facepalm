<?php
/**
 * Action-Model-Field (AMF) processor
 */

namespace App\Facepalm;

use App\Facepalm\Components\CmsList;
use App\Facepalm\Components\CmsForm;
use App\Facepalm\Models\File;
use App\Facepalm\Models\Foundation\AbstractEntity;
use App\Facepalm\Models\Foundation\BaseEntity;
use App\Facepalm\Models\Image;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Input;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use TwigBridge\Facade\Twig;

class AmfProcessor
{
    protected $affectedObjectsCount = 0;
    protected $affectedFieldsCount = 0;
    protected $toggledFields = [];
    protected $uploadedFiles = [];

    /**
     * Run through AMF input array
     *
     * AMF is: action[Model][id][field]=value,
     * e.g.: save[User][2][email]='..',save[User][2][name]='..', etc
     *
     * @param $amf
     */
    public function process($amf)
    {
        foreach ($amf as $action => $input) {
            $processMethod = 'processObject' . Str::studly($action);
            if (method_exists($this, $processMethod)) {
                foreach ($input as $modelName => $data) {
                    $fullModelName = CmsCommon::getFullModelClassName($modelName);
                    if ($fullModelName) {
                        if (is_array($data)) {
                            foreach ($data as $id => $keyValue) {
                                /** @var Model $object */
                                if ((int)$id) {
                                    $object = ModelFactory::find($fullModelName, $id);
                                } elseif (preg_match('/\%CREATE_[\w]{6}\%/i', $id)) {
                                    $object = new $fullModelName();
                                }
                                if ($object) {
                                    $this->{$processMethod}($object, $keyValue, $amf);
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    /**
     * @return int
     */
    public function getAffectedObjectsCount()
    {
        return $this->affectedObjectsCount;
    }

    /**
     * @return int
     */
    public function getAffectedFieldsCount()
    {
        return $this->affectedFieldsCount;
    }

    /**
     * @return array
     */
    public function getToggledFields()
    {
        return $this->toggledFields;
    }

    /**
     * @return array
     */
    public function getUploadedFiles()
    {
        return $this->uploadedFiles;
    }


    /**
     * @param Model $object
     * @param $keyValue
     */
    protected function processObjectSave($object, $keyValue, $requestRawData)
    {
        // Run through all incoming fields except Many-to-Many relations and set it
        foreach ($keyValue as $fieldName => $value) {
            if (!$this->isManyToMany($object, $fieldName)) {
                // todo: учитывать описания полей из общей схемы данных (которой пока нет :))
                if ($this->isBelongsToField($object, $fieldName)) {
                    $this->processBelongsToField($object, $fieldName, $value);
                } elseif ($this->isDatetimeField($object, $fieldName)) {
                    $object->$fieldName = (new \DateTime($value))->format('Y-m-d H:i:s');
                } else {
                    $object->$fieldName = $value;
                }
            }
        }

        // Save
        $object->save();

        // And after saving process Many-to-Many relations
        foreach ($keyValue as $fieldName => $value) {
            if ($this->isManyToMany($object, $fieldName)) {
                $object->$fieldName()->sync(array_keys($value));
            }
        }
    }

    /**
     * Alias for [Save]
     * @param $object
     * @param $keyValue
     */
    protected function processObjectCreate($object, $keyValue, $requestRawData)
    {
        $this->processObjectSave($object, $keyValue, $requestRawData);
    }

    /**
     * @param $object
     * @param $keyValue
     */
    protected function processObjectToggle($object, $keyValue, $requestRawData)
    {
        foreach (array_keys($keyValue) as $fieldName) {
            $this->affectedFieldsCount++;
            $object->$fieldName ^= 1;
            $this->toggledFields[class_basename($object)][$object->{CmsCommon::COLUMN_NAME_ID}][$fieldName] = $object->$fieldName;
        }
        $object->save();

    }

    protected function processObjectDelete($object, $keyValue, $requestRawData)
    {
        $object->delete();
    }

    /**
     * @param $object
     * @param $keyValue
     */
    protected function processObjectUpload($object, $keyValue, $requestRawData)
    {
        // Run through all incoming fields except Many-to-Many relations and set it
        foreach ($keyValue as $fieldName => $value) {
            //todo: а всякие параметры как передавать сюда?
            if ($this->isImageUploadField($fieldName)) {
                $this->handleImageUpload($object, $value, $requestRawData);
            } elseif ($this->isFileUploadField($fieldName)) {
                $this->handleFileUpload($object, $value, $requestRawData);
            }
        }
    }

    /**
     * @param $object
     * @param $fieldName
     * @return bool|string
     */
    protected function isBelongsToField($object, $fieldName)
    {
        if (Str::endsWith($fieldName, '_id')) {
            $relationMethod = Str::substr($fieldName, 0, -3);
            if (method_exists($object, $relationMethod) && $object->$relationMethod() instanceof BelongsTo) {
                return $relationMethod;
            }
        }
        return false;
    }


    /**
     * @param $object
     * @param $fieldName
     * @param $value
     */
    protected function processBelongsToField($object, $fieldName, $value)
    {
        $relationMethod = Str::substr($fieldName, 0, -3);
        if ($value) {
            $foreignObject = ModelFactory::find($relationMethod, $value);
            if ($foreignObject) {
                $object->$relationMethod()->associate($foreignObject);
            }
        } else {
            $object->$relationMethod()->dissociate();

        }
    }

    /**
     * @param Model $object
     * @param $fieldName
     * @return bool
     */
    protected function isDatetimeField($object, $fieldName)
    {
        return in_array($fieldName, $object->getDates());
    }

    /**
     * @param $object
     * @param $fieldName
     * @return bool
     */
    protected function isManyToMany($object, $fieldName)
    {
        return $object->$fieldName instanceof Collection;
    }

    /**
     * @param $fieldName
     * @return bool
     */
    private function isImageUploadField($fieldName)
    {
        return $fieldName == 'image';
    }

    /**
     * @param $fieldName
     * @return bool
     */
    private function isFileUploadField($fieldName)
    {
        return $fieldName == 'file';
    }

    /**
     * @param $object
     * @param $value
     * @return array
     */
    private function handleImageUpload(BaseEntity $object, $value, $requestRawData)
    {
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
                    $this->uploadedFiles[] = [
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
    }

    private function handleFileUpload(BaseEntity $object, $value, $requestRawData)
    {
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

                    //todo: дополнительные прегенерируемые размеры
                    DB::transaction(function () use ($fileObj) {
                        $fileObj->show_order = File::max('show_order') + 1;
                        $fileObj->save();
                    });

                    $object->files()->save($fileObj);
                    $this->uploadedFiles[] = [
                        'file' => [
                            'id' => $fileObj->id,
                            'icon' => $fileObj->getIconClass(),
                            'name' => $fileObj->display_name,
                            'type' => $file->type,
                            'size' => $file->getReadableSize(),
                            'uri' => $fileObj->getUri(),
                            'group' => $fileName
                        ]
                    ];
                }

            }
        }
    }
}