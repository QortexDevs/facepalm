<?php
namespace Tests;

use Facepalm\Models\ModelFactory;

class ModelFactoryTest extends TestCase
{

    /**
     *
     */
//    public function testGetFullModelClassNameAppModel()
//    {
//        $fullModelName = ModelFactory::getFullModelClassName('user');
//        $this->assertEquals('App\Models\User', $fullModelName);
//    }

    /**
     *
     */
    public function testGetFullModelClassNameFacepalmModel()
    {
        $fullModelName = ModelFactory::getFullModelClassName('image');
        $this->assertEquals('Facepalm\Models\Image', $fullModelName);
    }

    /**
     *
     */
//    public function testGetFullModelClassNameWithNamespace()
//    {
//        $fullModelName = ModelFactory::getFullModelClassName('App\Models\User');
//        $this->assertEquals('App\Models\User', $fullModelName);
//    }

    /**
     *
     */
    public function testGetFullModelClassNameUndefined()
    {
        $fullModelName = ModelFactory::getFullModelClassName('bksdfbjdbve4kv' . random_int(1, PHP_INT_MAX));
        $this->assertNull($fullModelName);
    }

    /**
     *
     */
    public function testGetBuilder()
    {
//        $builder = ModelFactory::builderFor('image');
//        $this->assertTrue($builder instanceof \Illuminate\Database\Eloquent\Builder);
    }

    /**
     *
     */
    public function testGetBuilderUndefinedModel()
    {
//        $builder = ModelFactory::builderFor('bksdfbjdbve4kv' . random_int(1, PHP_INT_MAX));
//        $this->assertNull($builder);
    }
}
