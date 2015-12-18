<?php
namespace Tests;

use App\Cms\Fields\FieldFactory;
use app\Cms\Fields\Types\BooleanField;
use app\Cms\Fields\Types\DateField;
use app\Cms\Fields\Types\DatetimeField;
use app\Cms\Fields\Types\DictionaryField;
use app\Cms\Fields\Types\IntegerField;
use App\Cms\Fields\Types\PasswordField;
use app\Cms\Fields\Types\RelationField;
use app\Cms\Fields\Types\StringField;
use app\Cms\Fields\Types\TextField;

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
        $this->assertEquals(null, $field);
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
