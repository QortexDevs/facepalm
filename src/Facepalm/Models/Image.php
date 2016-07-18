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
 * @property integer width
 * @property integer height
 * @property integer original_width
 * @property integer original_height
 * @property string ext
 * @property string original_name
 * @property UploadedFile video_link
 * @property bool is_video
 * @property mixed embed_code
 */
class Image extends BindableEntity
{
    protected $fillable = [
        'group',
        'width',
        'height',
        'status',
        'original_width',
        'original_height',
        'ext',
        'original_name'
    ];

    /**
     *
     */
    protected static function boot()
    {
        parent::boot();

        // generate name on model creating
        self::creating(function (Image $image) {
            $image->generateName();
        });
        self::deleted(function (Image $image) {
            $files = glob($image->getPhysicalPath('*'));
            if ($files) {
                foreach ($files as $file) {
                    @unlink($file);
                }
            }
        });

        //todo: событие на удаление
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
        $size = getimagesize($srcFile);
        if ($size || self::getExtension($originalName) === 'svg') {
            $image = new Image();
            $image->generateName();

            if (is_uploaded_file($srcFile)) {
                $image->original_name = $originalName;
            } else {
                $image->original_name = basename($srcFile);
            }

            $image->ext = self::getExtension($image->original_name);
            $image->status = 1;
            $image->original_width = $size[0];
            $image->original_height = $size[1];

            //todo: think about it
            if (!is_dir(dirname($image->getPhysicalPath('original')))) {
                mkdir(dirname($image->getPhysicalPath('original')), 0755, true);
            }

            if (is_uploaded_file($srcFile)) {
                move_uploaded_file($srcFile, $image->getPhysicalPath('original'));
            } else {
                copy($srcFile, $image->getPhysicalPath('original'));
            }

            return $image;
        } else {
            throw new Exception('Not an image');
        }
    }

    /**
     * todo: вынести пути в конфиги
     * @param string $suffix
     * @param bool $skipExtension
     * @return string
     */
    public function getUri($suffix = 'original', $skipExtension = false)
    {
        $path = $this->getRelativePath($suffix, $skipExtension);
        if ($path) {
            return '/media/images/' . $path;
        }
    }

    /**
     * Allowed formats:
     *
     * 200x300
     * 200
     * x300
     * i200x200 - Inscribe into rectangle, keeping aspect ratio
     * todo: think about non-proportional resize
     * todo: for imagick: $geometry = "{$dimension}^ -gravity North(Center, etc) -extent {$dimension}";
     * todo: не увеличивать картинку, копировать картинку, если совпадают размеры
     *
     * @param $sizeString
     * @param $modifier
     * @return $this
     */
    public function generateSize($sizeString, $modifier = '')
    {
        $width = $height = null;
        $size = explode('x', $sizeString);
        if (isset($size[0]) && (int)$size[0] > 0) {
            $width = (int)$size[0];
        }
        if (isset($size[1]) && (int)$size[1] > 0) {
            $height = (int)$size[1];
        }
        if ($modifier) {
            $sizeString = $modifier . $sizeString;
        }
        if ($width || $height) {
            if ($this->ext == 'svg') {
                copy($this->getPhysicalPath('original'), $this->getPhysicalPath($sizeString));
            } else {
                $image = \Intervention\Image\Facades\Image::make($this->getPhysicalPath('original'));
                if ($modifier === 'i' || !$width || !$height) {
                    $image->resize($width, $height, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    });
                } else {
                    $image->fit($width, $height);
                }
                $image->save($this->getPhysicalPath($sizeString));
            }
        }
        return $this;
    }

    /**
     * @param $callback
     */
    public function postProcess($callback)
    {
        $image = \Intervention\Image\Facades\Image::make($this->getPhysicalPath('original'));
        $callback($image);
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
     * @param $filename
     * @return mixed|string
     */
    protected static function getExtension($filename)
    {
        //todo: подумать, конечео, на эту тему. Уныло это.
        $allowed = ['jpg', 'png', 'gif', 'svg'];
        $replaceable = [
            'jpeg' => 'jpg'
        ];

        $ext = Str::lower(substr($filename, strrpos($filename, '.') + 1));

        $ext = Arr::get($replaceable, $ext, $ext);
        $ext = in_array($ext, $allowed, true) ? $ext : array_shift($allowed);

        return $ext;
    }


    /**
     * todo: вынести пути в конфиги
     * @param string $suffix
     * @return string
     */
    protected function getPhysicalPath($suffix = '')
    {
        $path = $this->getRelativePath($suffix);
        if ($path) {
            return app()->publicPath() . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . $path;
        }
    }


    /**
     * @param string $suffix
     * @param bool $skipExtension
     * @return string
     */
    protected function getRelativePath($suffix = '', $skipExtension = false)
    {
        if ($this->name) {
            return Path::generateHierarchicalPrefix($this->name)
            . ($suffix ? ('_' . $suffix) : '')
            . ($this->ext && !$skipExtension ? ('.' . $this->ext) : '');
        }
    }


}