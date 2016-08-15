<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 19:53
 */

namespace Facepalm\Cms\Config;

use Facepalm\Cms\Config\ConfigLoaderInterface;
use Facepalm\Cms\Config\JsonFileConfigLoader;
use Illuminate\Config\Repository;


class Config
{
    // todo: вынести в конфиги
    // todo: сделать возможность загрузки из строки
    const CONFIG_PATH = 'cms/';
    const DEFAULT_CONFIG_NAME = 'cms.json';
    const MODULES_CONFIGS_FOLDER = 'modules';

    /** @var Repository */
    protected $configRepository;

    /** @var  ConfigLoaderInterface */
    protected $configLoader;


    /**
     * @param null $group
     * @param null $module
     * @return Config
     */
    public static function fromFile($group = null, $module = null)
    {
        $instance = new self();
        return $instance->load($group, $module);
    }

    /**
     * Config constructor.
     * @param array|null $data
     */
    public function __construct($data = [])
    {
        $this->configRepository = new Repository($data);

        //todo: стоит ли это здесь делать или все же передавать снаружи?
        $this->setLoader(new Json5FileConfigLoader());
    }

    /**
     * @param \Facepalm\Cms\Config\ConfigLoaderInterface $configLoader
     */
    public function setLoader(ConfigLoaderInterface $configLoader)
    {
        $this->configLoader = $configLoader;
    }

    /**
     * @param null $group
     * @param null $module
     * @return $this
     */
    public function load($group = null, $module = null)
    {
        $cachedConfigPath = app()->storagePath() . DIRECTORY_SEPARATOR . 'cms-config-cache.json';

        // get the latest modification time among all cms configs
        $latestModificationTime = @max(array_map(function ($el) {
            return filemtime($el);
        }, array_merge(glob($this->getConfigPath() . 'groups/*/*.json'), glob($this->getConfigPath() . 'groups/*/*/*.json'))));

        if (is_file($cachedConfigPath) && $latestModificationTime && filemtime($cachedConfigPath) >= $latestModificationTime) {
            // if cached file is newer - load it
            $this->configRepository = new Repository(json_decode(file_get_contents($cachedConfigPath), true));
        } else {
            // else load all configs and compile into one

            // main config
            $this->configRepository = new Repository($this->loadMainConfig());

            $cmsStructure = [];
            if ($this->configRepository->has('structure')) {
                foreach ($this->configRepository->get('structure') as $groupName) {
                    // groups configs
                    $cmsStructure[$groupName] = $this->loadGroupConfig($groupName);
                    $groupStructure = [];
                    foreach ($cmsStructure[$groupName]['structure'] as $moduleName) {
                        // modules configs
                        $groupStructure[$moduleName] = $this->loadModuleConfig($groupName, $moduleName);
                    }
                    $cmsStructure[$groupName]['sections'] = $groupStructure;
                }
            }
            $this->configRepository->set('structure', $cmsStructure);

            file_put_contents($cachedConfigPath, json_encode($this->configRepository->all()));
        }

        if ($group && $module) {
            $this->configRepository->set('module', $this->configRepository->get('structure.' . $group . '.sections.' . $module));
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
     * @return array
     */
    public function all()
    {
        return $this->configRepository->all();
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
    public function getConfigPath()
    {
        return app()->configPath() . DIRECTORY_SEPARATOR . self::CONFIG_PATH;
    }

    /**
     * @param $name
     * @return mixed
     */
    protected function loadConfig($name)
    {
        $filePath = $this->getConfigPath() . $name;
        return $this->configLoader->load($filePath);
    }

    /**
     * @return mixed
     */
    protected function loadMainConfig()
    {
        return $this->loadConfig(self::DEFAULT_CONFIG_NAME);
    }

    /**
     * @param $groupName
     * @return mixed
     */
    protected function loadGroupConfig($groupName)
    {
        return $this->loadConfig('groups' . DIRECTORY_SEPARATOR . $groupName . DIRECTORY_SEPARATOR . 'group.json');
    }

    /**
     * @param $groupName
     * @param $moduleName
     * @return mixed
     */
    protected function loadModuleConfig($groupName, $moduleName)
    {
        return $this->loadConfig('groups' . DIRECTORY_SEPARATOR . $groupName . DIRECTORY_SEPARATOR . 'modules' . DIRECTORY_SEPARATOR . $moduleName . '.json');
    }
}