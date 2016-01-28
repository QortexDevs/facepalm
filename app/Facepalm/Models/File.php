<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models;

use App\Facepalm\Models\Foundation\BindableEntity;
use App\Facepalm\Path;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Mockery\CountValidator\Exception;
use Symfony\Component\HttpFoundation\File\UploadedFile;


/**
 * @property integer bind_id
 * @property integer bind_type
 * @property string group
 * @property string name
 * @property integer size
 * @property integer type
 * @property string original_name
 * @property string display_name
 */
class File extends BindableEntity
{
    protected $fillable = [
        'group',
        'width',
        'height',
        'status',
        'size',
        'original_name'
    ];

    /**
     *
     */
    protected static function boot()
    {
        parent::boot();

        // generate name on model creating
        self::creating(function (File $file) {
            $file->generateName();
        });
        self::deleted(function (File $file) {
            @unlink($file->getPhysicalPath());
        });
    }

    public static function createFromUpload($file)
    {
        if ($file instanceof UploadedFile) {
            return self::createFromFile($file->getPathName(), $file->getClientOriginalName());
        } else {
            return self::createFromFile($_FILES[$file]['tmp_name'], $_FILES[$file]['name']);
        }
    }

    //todo: make from url
    public static function createFromFile($srcFile, $originalName = '')
    {
        $size = filesize($srcFile);
        if ($size) {
            $file = new File();
            $file->generateName();

            if (is_uploaded_file($srcFile)) {
                $file->original_name = $originalName;
            } else {
                $file->original_name = basename($srcFile);
            }

            $file->type = $file->getExtension();
            $file->display_name = substr($file->original_name, 0, -strlen($file->type) - 1);
            $file->status = 1;
            $file->size = $size;

            //todo: think about it
            if (!is_dir(dirname($file->getPhysicalPath()))) {
                mkdir(dirname($file->getPhysicalPath()), 0755, true);
            }

            if (is_uploaded_file($srcFile)) {
                move_uploaded_file($srcFile, $file->getPhysicalPath());
            } else {
                copy($srcFile, $file->getPhysicalPath());
            }

            return $file;
        } else {
            throw new Exception('Empty file');
        }
    }

    /**
     * todo: вынести пути в конфиги
     * @return string
     */
    public function getUri()
    {
        $path = $this->getRelativePath();
        if ($path) {
            return '/media/files/' . $path . '/' . $this->display_name . '.' . $this->type;
        }
    }

    /**
     * Allowed formats:
     *
     * 200x300
     * 200
     * x300
     * todo: think about non-proportional resize
     *
     * @param $sizeString
     * @return $this
     */
    public function generateSize($sizeString)
    {
        $width = $height = null;
        $size = explode('x', $sizeString);
        if (isset($size[0]) && (int)$size[0] > 0) {
            $width = (int)$size[0];
        }
        if (isset($size[1]) && (int)$size[1] > 0) {
            $height = (int)$size[1];
        }
        if ($width || $height) {
            $image = \Intervention\Image\Facades\Image::make($this->getPhysicalPath('original'));
            if ($width && $height) {
                $image->fit($width, $height);
            } else {
                $image->resize($width, $height, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }
            $image->save($this->getPhysicalPath($sizeString));
        }
        return $this;
    }


    /**
     * Cheating own protective mutator
     */
    protected function generateName()
    {
        if (!$this->name) {
            $this->attributes['name'] = md5(uniqid(microtime(true), true));
        }
    }

    /**
     * Protect name from external changing
     * @return bool
     */
    protected function setNameAttribute()
    {
        return false;
    }

    /**
     * todo: а оно точно должно быть статическим? наверное да, но подумать. Или переименовать
     * @return mixed|string
     */
    public function getExtension()
    {
        $ext = Str::lower(substr($this->original_name, strrpos($this->original_name, '.') + 1));

        return $ext;
    }


    /**
     * todo: вынести пути в конфиги
     * @return string
     */
    protected function getPhysicalPath()
    {
        $path = $this->getRelativePath();
        if ($path) {
            return app()->storagePath() . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'files' . DIRECTORY_SEPARATOR . $path;
        }
    }


    /**
     * @return string
     */
    protected function getRelativePath()
    {
        if ($this->name) {
            return Path::generateHierarchicalPrefix($this->name);
        }
    }


}