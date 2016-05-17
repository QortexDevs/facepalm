<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.05.16
 * Time: 11:43
 */

namespace Facepalm\Tools;


class AssetsBuster
{

    /**
     * @return array
     */
    public function getCmsBusters()
    {
        $facepalmBustersPath = app()->publicPath() . DIRECTORY_SEPARATOR . config('app.facepalmAssetsPath') . 'busters.json';
        $projectBustersPath = app()->publicPath() . DIRECTORY_SEPARATOR . 'assets/build/cms/busters.json';

        return
            $this->get($facepalmBustersPath, 'build/', 'facepalm::') + $this->get($projectBustersPath, 'public/');

    }

    /**
     * @param $bustersFilePath
     * @param $prefixToRemove
     * @param null $prefixToAdd
     * @return array
     */
    public function get($bustersFilePath, $prefixToRemove, $prefixToAdd = null)
    {
        return ArrayTools::replaceArrayKeyPrefix($this->getBusters($bustersFilePath), $prefixToRemove, $prefixToAdd);
    }

    /**
     * @param $path
     * @return array
     */
    protected function getBusters($path)
    {
        if (is_file($path)) {
            return @json_decode(file_get_contents($path), true) ?: [];
        }
        return [];
    }

}