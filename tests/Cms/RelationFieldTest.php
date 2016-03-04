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

class RelationFieldTest extends TestCase
{
    /**
     *
     */
    public function testGetValueForListCardinalityOne()
    {
        $role = new \stdClass();
        $user = new \stdClass();
        $role->name = "Admin";
        $user->role = $role;
        $field = (new RelationField())
            ->setName('user')
            ->setParameters(
                [
                    'foreignModel' => 'role',
                    'foreignDisplayName' => 'name',
                    'cardinality' => 'one'
                ]
            );

        $this->assertEquals('Admin', $field->getValueForList($user));
    }

    /**
     *
     */
    public function testGetValueForListCardinalityMany()
    {
        $user = new \stdClass();
        $user->roles = collect([
            ['name' => 'Admin'],
            ['name' => 'Moderator']
        ]);
        $field = (new RelationField())
            ->setName('user')
            ->setParameters(
                [
                    'foreignModel' => 'role',
                    'foreignDisplayName' => 'name',
                    'cardinality' => 'many'
                ]
            );

        $this->assertEquals('Admin, Moderator', $field->getValueForList($user));
    }

    /**
     *
     */
    public function testGetValueForListCardinalityUnknown()
    {
        $user = new \stdClass();
        $field = (new RelationField())
            ->setName('user');

        $this->assertEquals('', $field->getValueForList($user));
    }
}