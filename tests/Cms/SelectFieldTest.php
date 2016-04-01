<?php
namespace Facepalm\Tests;

use Facepalm\Cms\Fields\FieldFactory;
use Facepalm\Cms\Fields\Types\BooleanField;
use Facepalm\Cms\Fields\Types\DateField;
use Facepalm\Cms\Fields\Types\DatetimeField;
use Facepalm\Cms\Fields\Types\DictionaryField;
use Facepalm\Cms\Fields\Types\FileField;
use Facepalm\Cms\Fields\Types\ImageField;
use Facepalm\Cms\Fields\Types\IntegerField;
use Facepalm\Cms\Fields\Types\PasswordField;
use Facepalm\Cms\Fields\Types\RelationField;
use Facepalm\Cms\Fields\Types\SelectField;
use Facepalm\Cms\Fields\Types\AclField;
use Facepalm\Cms\Fields\Types\TextField;
use Facepalm\Cms\Fields\Types\UnknownField;

class SelectFieldTest extends TestCase
{
    public function testGetValueForList()
    {
        $test = new \stdClass();
        $test->role = 2;
        $field = (new SelectField())->setName('role')->setDictionary([1 => 'Admin', 2 => 'Moderator']);

        $this->assertEquals('Moderator', $field->getValueForList($test));
    }

    public function testGetValueForListNonExistent()
    {
        $test = new \stdClass();
        $test->role = 5;
        $field = (new SelectField())->setName('role')->setDictionary([1 => 'Admin', 2 => 'Moderator']);

        $this->assertEquals('', $field->getValueForList($test));
    }

    public function testGetValueForListWithoutDictionary()
    {
        $test = new \stdClass();
        $test->role = 5;
        $field = (new SelectField())->setName('role');

        $this->assertEquals('', $field->getValueForList($test));
    }

    public function testGetValueForListWithoutName()
    {
        $test = new \stdClass();
        $test->role = 5;
        $field = (new SelectField());

        $this->assertEquals('', $field->getValueForList($test));
    }


}
