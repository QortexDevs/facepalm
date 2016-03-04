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
use Facepalm\Cms\Fields\Types\StringField;
use Facepalm\Cms\Fields\Types\TextField;
use Facepalm\Cms\Fields\Types\UnknownField;

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
