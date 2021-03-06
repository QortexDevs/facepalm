<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models;

use Facepalm\Models\Foundation\BindableEntity;
use Facepalm\Tools\Path;
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

    protected static $icons = [
        'file-archive-o' => ['zip', 'rar', '7z'],
        'file-audio-o' => ['wav', 'mp3', 'ogg', 'm4a'],
        'file-code-o' => ['php', 'py', 'c', 'cpp', 'h', 'rb', 'inc'],
        'file-excel-o' => ['xls', 'xlsx'],
        'file-image-o' => ['jpg', 'jpeg', 'png', 'gif', 'psd', 'tiff'],
        'file-pdf-o' => ['pdf'],
        'file-powerpoint-o' => ['ppt', 'pptx'],
        'file-text-o' => ['txt'],
        'file-video-o' => ['avi', 'mp4', 'mov'],
        'file-word-o' => ['doc', 'docx'],
    ];

    protected static $iconsByExtension = [];


    /**
     *
     */
    protected static function boot()
    {
        parent::boot();

        foreach (self::$icons as $icon => $extensions) {
            foreach ($extensions as $ext) {
                self::$iconsByExtension[$ext] = $icon;
            }
        }

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
                $file->original_name = $originalName ?: basename($srcFile);
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
        return '/media/files/' . $this->name . '/' . $this->display_name . '.' . $this->type;
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
    public function getPhysicalPath()
    {
        $path = $this->getRelativePath();
        if ($path) {
            return app()->storagePath() . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'files' . DIRECTORY_SEPARATOR . $path;
        }
    }


    /**
     * @return string
     */
    public function getRelativePath()
    {
        if ($this->name) {
            return Path::generateHierarchicalPrefix($this->name);
        }
    }

    public function getIconClass()
    {
        return Arr::get(self::$iconsByExtension, $this->type, 'file-o');
    }

    public function getReadableSize($decimals = 2)
    {
        $size = array('B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');
        $factor = floor((strlen($this->size) - 1) / 3);
        return sprintf("%.{$decimals}f", $this->size / pow(1024, $factor)) . @$size[$factor];
    }

}