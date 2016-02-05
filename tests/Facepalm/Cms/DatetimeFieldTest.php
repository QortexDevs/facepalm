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

class DatetimeFieldTest extends TestCase
{
    public function testGetValueForList()
    {
        $test = new \stdClass();
        $test->dt = '1980-01-24 12:30';
        $field = (new DatetimeField())->setName('dt');

        $this->assertEquals('24.01.1980 12:30', $field->getValueForList($test));
    }

    public function testGetValueForListUndefined()
    {
        $test = new \stdClass();
        $field = (new DatetimeField())->setName('dt');

        $this->assertEquals('', $field->getValueForList($test));
    }

    public function testGetValueForListZero()
    {
        $test = new \stdClass();
        $test->dt = '0000-01-00';
        $field = (new DatetimeField())->setName('dt');

        $this->assertEquals('', $field->getValueForList($test));
    }


}
