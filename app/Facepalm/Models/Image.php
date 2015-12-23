<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models;


use Illuminate\Database\Eloquent\Model;

/**
 * @property string group
 */
class Image extends Model
{
    protected $fillable = ['group'];

    /**
     * Get all of the owning binded models.
     */
    public function bind()
    {
        return $this->morphTo();
    }
}