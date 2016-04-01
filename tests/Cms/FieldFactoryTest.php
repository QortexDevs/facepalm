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
        $this->assertTrue($field instanceof SelectField);
        $field = $factory->get('select');
        $this->assertTrue($field instanceof SelectField);
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
    public function testCreateFileField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('file');
        $this->assertTrue($field instanceof FileField);
    }

    /**
     */
    public function testCreateImageField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('image');
        $this->assertTrue($field instanceof ImageField);
    }

    /**
     */
    public function testCreateBooleanField()
    {
        $factory = new FieldFactory();
        $field = $factory->get('boolean');
        $this->assertTrue($field instanceof BooleanField);
        $field = $factory->get('checkbox');
        $this->assertTrue($field instanceof BooleanField);
    }

}
