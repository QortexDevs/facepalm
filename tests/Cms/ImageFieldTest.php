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
