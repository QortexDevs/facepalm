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