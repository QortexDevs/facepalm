<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 19:53
 */

namespace Facepalm\Cms\Config;

use Illuminate\Config\Repository;


interface ConfigLoaderInterface
{
    public function load($filePath);
}