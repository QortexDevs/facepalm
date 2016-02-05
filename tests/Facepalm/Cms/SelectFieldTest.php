<?php
namespace Tests;

use App\Facepalm\Cms\Fields\FieldFactory;
use App\Facepalm\Cms\Fields\Types\BooleanField;
use App\Facepalm\Cms\Fields\Types\DateField;
use App\Facepalm\Cms\Fields\Types\DatetimeField;
use App\Facepalm\Cms\Fields\Types\DictionaryField;
use App\Facepalm\Cms\Fields\Types\FileField;
use App\Facepalm\Cms\Fields\Types\ImageField;
use App\Facepalm\Cms\Fields\Types\IntegerField;
use App\Facepalm\Cms\Fields\Types\PasswordField;
use App\Facepalm\Cms\Fields\Types\RelationField;
use App\Facepalm\Cms\Fields\Types\SelectField;
use App\Facepalm\Cms\Fields\Types\StringField;
use App\Facepalm\Cms\Fields\Types\TextField;
use App\Facepalm\Cms\Fields\Types\UnknownField;

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
