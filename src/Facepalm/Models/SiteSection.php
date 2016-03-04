<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models;

use Facepalm\Models\Foundation\BaseEntity;

/**
 * @property string path_name
 */
class SiteSection extends BaseEntity
{
    protected $stringFields = ['title'];

}