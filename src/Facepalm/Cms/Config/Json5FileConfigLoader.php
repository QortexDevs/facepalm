<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 19:53
 */

namespace Facepalm\Cms\Config;

use Facepalm\Cms\Config\ConfigLoaderInterface;
use HirotoK\JSON5\JSON5;
use Illuminate\Config\Repository;


class Json5FileConfigLoader implements ConfigLoaderInterface
{
    /**
     * @param $filePath
     * @return array|mixed
     */
    public function load($filePath)
    {
        if (file_exists($filePath)) {
            return JSON5::decodeFile($filePath, true);
        }

        return [];
    }
}