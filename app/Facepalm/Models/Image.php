<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models;

use App\Facepalm\Models\Foundation\BindableEntity;


/**
 * @property integer bind_id
 * @property integer bind_type
 * @property string group
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
}