<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models;


use Illuminate\Database\Eloquent\Model;

abstract class BaseEntity extends Model
{
    /**
     * Get all of the owning binded models.
     */
    public function images()
    {
        return $this->morphMany('App\Facepalm\Models\Image', 'bind');
    }
}