<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 19:53
 */

namespace App\Facepalm\Cms\Config;

use App\Facepalm\Cms\Config\ConfigLoaderInterface;
use Illuminate\Config\Repository;


class JsonFileConfigLoader implements ConfigLoaderInterface
{
    /**
     * @param $filePath
     * @return array|mixed
     */
    public function load($filePath)
    {
        if (file_exists($filePath)) {
            return json_decode(file_get_contents($filePath), true);
        }

        return [];
    }
}