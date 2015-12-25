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
 */
class Image extends BindableEntity
{
    protected $fillable = ['group', 'width', 'height', 'original_width', 'original_height', 'ext', 'original_name'];

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
    }

    /**
     * Cheating own protective mutator
     */
    protected function generateName()
    {
        $this->attributes['name'] = md5(uniqid(microtime(true), true));
    }

    /**
     * Protect name from external changing
     *
     * @param $value
     * @return bool
     */
    public function setNameAttribute($value)
    {
        return false;
    }

    /**
     * @param string $suffix
     * @return string
     */
    public function getFullPath($suffix = '')
    {
        if ($this->name) {
            return Path::generateHierarchicalPrefix($this->name)
            . ($suffix ? ('_' . $suffix) : '')
            . ($this->ext ? ('.' . $this->ext) : '');

        }
    }


}