<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models;

use App\Facepalm\Models\Foundation\BaseEntity;

/**
 * @property string path_name
 */
class SiteSection extends BaseEntity
{
    protected $stringFields = ['title'];

}