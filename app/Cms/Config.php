<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 19:53
 */

namespace App\Cms;

use Illuminate\Config\Repository;


class Config
{
    const CONFIG_PATH = 'cms/config/';
    const DEFAULT_CONFIG_NAME = 'cms.json';
    const MODULES_CONFIGS_FOLDER = 'modules';

    /** @var Repository */
    protected $configRepository;

    public function load($group = null, $module = null)
    {
        $this->configRepository = new Repository($this->loadConfig(self::DEFAULT_CONFIG_NAME));
        if ($group && $module) {
            $this->configRepository->set(
                'module',
                $this->loadConfig(self::MODULES_CONFIGS_FOLDER . DIRECTORY_SEPARATOR . $group . DIRECTORY_SEPARATOR . $module . '.json')
            );
        }
        return $this;
    }

    /**
     * @param $key
     * @param null $default
     * @return mixed
     */
    public function get($key, $default = null)
    {
        return $this->configRepository->get($key, $default);
    }

    /**
     * @param $key
     * @param $value
     */
    public function set($key, $value)
    {
        $this->configRepository->set($key, $value);
    }

    /**
     * @param $key
     * @return Repository
     */
    public function part($key)
    {
        return new Repository($this->get($key, []));
    }

    /**
     * @return string
     */
    protected function getConfigPath()
    {
        return app()->path() . DIRECTORY_SEPARATOR . self::CONFIG_PATH;
    }

    /**
     * @param $name
     * @return mixed
     */
    protected function loadConfig($name)
    {
        $filePath = $this->getConfigPath() . $name;
        if (file_exists($filePath)) {
            return json_decode(file_get_contents($filePath), true);
        }
    }
}