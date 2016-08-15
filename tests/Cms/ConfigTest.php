<?php
namespace Facepalm\Tests;


use Facepalm\Cms\Config\Config;
use Facepalm\Cms\Config\ConfigLoaderInterface;
use Facepalm\Cms\Config\Json5FileConfigLoader;
use Facepalm\Cms\Config\JsonFileConfigLoader;
use Facepalm\Tools\Path;
use \Mockery as m;

class ConfigTest extends TestCase
{

    /**
     */
    public function testSetAndGetFromConfig()
    {
        $key = 'test.key';
        $value = 'test-value';
        $config = new Config();
        $config->set($key, $value);
        $this->assertEquals($value, $config->get($key));
    }

    /**
     */
    public function testPart()
    {
        $test = [
            'key1' => [
                'a' => 2,
                'b' => 3
            ],
            'key2' => [
                'c' => 3,
                'd' => 4
            ]
        ];
        $config = new Config($test);
        $part = $config->part('key2');
        $this->assertEquals(3, $part->get('c'));
    }

    /**
     *
     */
    public function testLoader()
    {
        /** @var ConfigLoaderInterface $loader */
        $loader = m::mock('Facepalm\Cms\Config\ConfigLoaderInterface');
        $loader->shouldReceive('load')->once()->with(app()->configPath() . DIRECTORY_SEPARATOR . 'cms/cms.json')->andReturn([
            'key1' => ['a' => 2, 'b' => 3],
            'key2' => ['c' => 3, 'd' => 4]
        ]);

        $config = new Config();
        $config->setLoader($loader);
        $config->load();
        $this->assertEquals(4, $config->get('key2.d'));
    }

//    /**
//     *
//     */
//    public function testLoaderWithModule()
//    {
//        /** @var ConfigLoaderInterface $loader */
//        $loader = m::mock('Facepalm\Cms\Config\ConfigLoaderInterface');
//        $loader->shouldReceive('load')->with(app()->configPath() . DIRECTORY_SEPARATOR . 'cms/cms.json')
//            ->andReturn([
//                'key1' => ['a' => 2, 'b' => 3],
//                'key2' => ['c' => 3, 'd' => 4]
//            ]);
//        $loader->shouldReceive('load')->with(app()->configPath() . DIRECTORY_SEPARATOR . 'cms/groups/users/modules/access.json')
//            ->andReturn([
//                'key3' => ['a' => 2, 'b' => 3],
//                'key4' => ['c' => 3, 'd' => 4]
//            ]);
//
//        $config = new Config();
//        $config->setLoader($loader);
//        $config->load('users', 'access');
//        dd($config);
//        $this->assertEquals(4, $config->get('key2.d'));
//        $this->assertEquals(2, $config->get('module.key3.a'));
//    }

    /**
     *
     */
    public function testJsonLoader()
    {
        $loader = new JsonFileConfigLoader();
        $this->assertEquals([], $loader->load('sdvasdvasdv' . random_int(0, PHP_INT_MAX)));
    }

    /**
     *
     */
    public function testJson5Loader()
    {
        $loader = new Json5FileConfigLoader();
        $this->assertEquals([], $loader->load('sdvasdvasdv' . random_int(0, PHP_INT_MAX)));
    }

}
