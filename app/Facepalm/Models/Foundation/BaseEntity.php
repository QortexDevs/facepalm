<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models\Foundation;


use Illuminate\Database\Eloquent\Model;

abstract class BaseEntity extends AbstractEntity
{
    /**
     * Get all binded images
     */
    public function images()
    {
        return $this->morphMany('App\Facepalm\Models\Image', 'bind');
    }

    /**
     * Get all binded images
     */
    public function files()
    {
        return $this->morphMany('App\Facepalm\Models\File', 'bind');
    }
}