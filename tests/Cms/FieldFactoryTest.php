<?php
namespace Tests;

use App\Facepalm\Fields\FieldFactory;
use App\Facepalm\Fields\Types\BooleanField;
use App\Facepalm\Fields\Types\DateField;
use App\Facepalm\Fields\Types\DatetimeField;
use App\Facepalm\Fields\Types\DictionaryField;
use App\Facepalm\Fields\Types\IntegerField;
use App\Facepalm\Fields\Types\PasswordField;
use App\Facepalm\Fields\Types\RelationField;
use App\Facepalm\Fields\Types\StringField;
use App\Facepalm\Fields\Types\TextField;
use App\Facepalm\Fields\Types\UnknownField;

class FieldFactoryTest extends TestCase
{

    const TYPE_STRING = 'string';
    const TYPE_DATE = 'date';
    const TYPE_DATETIME = 'datetime';
    const TYPE_TEXT = 'text';
    const TYPE_INTEGER = 'integer';
    const TYPE_DICTIONARY = 'dictionary';
    const TYPE_RELATION = 'relation';
    const TYPE_PASSWORD = 'password';
    const TYPE_BOOLEAN = 'boolean';

    /**
     */
    public function testCreateUnknownField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('sgaasdgn#sdfg');
        $this->assertTrue($field instanceof UnknownField);
    }

    /**
     */
    public function testCreateStringField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('string');
        $this->assertTrue($field instanceof StringField);
    }

    /**
     */
    public function testCreateDateField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('date');
        $this->assertTrue($field instanceof DateField);
    }

    /**
     */
    public function testCreateDatetimeField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('datetime');
        $this->assertTrue($field instanceof DatetimeField);
    }

    /**
     */
    public function testCreateTextField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('text');
        $this->assertTrue($field instanceof TextField);
    }

    /**
     */
    public function testCreateIntegerField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('integer');
        $this->assertTrue($field instanceof IntegerField);
    }

    /**
     */
    public function testCreateDictionaryField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('dictionary');
        $this->assertTrue($field instanceof DictionaryField);
    }

    /**
     */
    public function testCreateRelationField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('relation');
        $this->assertTrue($field instanceof RelationField);
    }

    /**
     */
    public function testCreatePasswordField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('password');
        $this->assertTrue($field instanceof PasswordField);
    }

    /**
     */
    public function testCreateBooleanField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('boolean');
        $this->assertTrue($field instanceof BooleanField);
    }
}
