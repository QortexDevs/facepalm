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

class ImageFieldTest extends TestCase
{
    public function testSkippedForNonObject()
    {
        $field = (new ImageField())->setName('avatar');
        $field->prepareData();
        $this->assertTrue($field->isSkipped());
        //todo: make mocks and test prepareData
    }


}
