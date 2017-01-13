<?php
namespace Facepalm\Cms\Fields;


use Facepalm\Cms\Fields\Types\SelectField;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class FieldSet
{
    const FIELD_TYPE_DEFAULT = 'string';
    const RELATION_TYPE_NAME = 'relation';
    const CARDINALITY_ONE = 'one';
    const CARDINALITY_MANY = 'many';

    /** @var AbstractField[] */
    protected $fields = [];

    /** @var FieldFactory */
    protected $fieldFactory;

    protected $dictionaries = [];
    protected $relatedModels = [];
    protected $additionalParameters = [];

    protected $render;

    /**
     * @param mixed $render
     * @return $this
     */
    public function setRender($render)
    {
        $this->render = $render;
        return $this;
    }

    /**
     * FieldSet constructor.
     * @param FieldFactory $fieldFactory
     */
    public function __construct(FieldFactory $fieldFactory)
    {
        $this->fieldFactory = $fieldFactory;
    }


    /**
     * @param $fields
     * @param $titles
     * @return FieldSet $this
     */
    public function process($fields, $titles = array())
    {
        // Ensure $fields is array
        $fields = (array)$fields;

        if (count($fields)) {

            // Convert plain array to associative
            if (!Arr::isAssoc($fields) && !is_array($fields[0])) {
                $fields = array_flip($fields);
            }

            // Now we definitely have associative array of fields, with names as keys
            $counter = 0;
            foreach ($fields as $name => $parameters) {
                // Ensure $parameters is array
                $parameters = (array)$parameters;

                // Override name from parameters, if it exists
                if (Arr::has($parameters, 'name')) {
                    $name = $parameters['name'];
                }

                $title = $this->getTitle($name, $parameters, $titles, $counter);
                if ($this->isRelationColumn($name)) {
                    $type = self::RELATION_TYPE_NAME;
                    list($parameters['foreignModel'], $parameters['foreignDisplayName']) = explode('.', $name);
                    $parameters['cardinality'] = Arr::get($parameters, 'cardinality', self::CARDINALITY_ONE);

                    //note: добавлено условие, чтобы many2many связи не попадали в eager-loading списка
                    //todo: разобраться с eager-loading many2many relations
                    if ($parameters['cardinality'] === self::CARDINALITY_ONE) {
                        $this->relatedModels[] = $parameters['foreignModel'];
                    }
                    $type = Arr::get($parameters, 'type', $type);
                } else {
                    $type = Arr::get($parameters, 'type', self::FIELD_TYPE_DEFAULT);
                }

                // todo: подумтаь насчет ключа все же
                $this->fields[$name] = $this->fieldFactory->get($type)
                    ->setName($name)
                    ->setTitle($title)
                    ->setRender($this->render)
                    ->setParameters($parameters);


                $this->fields[$name]->setParameters($this->additionalParameters);

                //todo: перенести в сам класс типа поля
//                d($this->fields[$name]);
                if ($this->fields[$name] instanceof SelectField && !$this->fields[$name]->dictionary) {
                    if ($this->fields[$name]->options) {
                        $this->fields[$name]->setDictionary($this->fields[$name]->options);
                    } else {
                        $this->fields[$name]->setDictionary(Arr::get($this->dictionaries, $name, []));
                    }
                }


                $counter++;
            }
        }

        return $this;
    }

    /**
     * @param $name
     * @param $value
     */
    public function prependHiddenField($name, $value)
    {
        $field = $this->fieldFactory->get('hidden')->setRender($this->render)->setName($name)->setForceValue($value);
        $this->fields = Arr::prepend($this->fields, $field, $name);
    }

    /**
     * @return AbstractField[]
     */
    public function getFields()
    {
        return $this->fields;
    }

    /**
     * @return string[]
     */
    public function getRelatedModels()
    {
        return $this->relatedModels;
    }


    /**
     * @param $columnName
     * @return bool
     */
    protected function isRelationColumn($columnName)
    {
        //todo: проверка не только по имени, но и по параметрам внутри
        return Str::contains($columnName, '.');
    }


    /**
     * If title isn't set in parameters, try to get it from common $titles array
     * Title can be associative array with names as keys, or can be plain array
     *
     * @param $column
     * @param $columnName
     * @param $titles
     * @param $counter
     * @return string|null
     */
    protected function getTitle($columnName, $column, $titles, $counter)
    {
        if (Arr::has($column, 'title') && $column['title']) {
            return $column['title'];
        } else {
            if (is_array($titles)) {
                if (Arr::isAssoc($titles)) {
                    if (Arr::has($titles, $columnName)) {
                        return $titles[$columnName];
                    }
                } else {
                    if (Arr::has($titles, $counter)) {
                        return $titles[$counter];
                    }
                }
            }
        }
        return null;
    }

    /**
     * @param array $dictionaries
     * @return FieldSet
     */
    public function setDictionaries($dictionaries)
    {
        $this->dictionaries = $dictionaries;
        return $this;
    }

    /**
     * @param $name
     * @param $value
     * @return $this
     */
    public function setAdditionalParameter($name, $value)
    {
        $this->additionalParameters[$name] = $value;
        return $this;
    }
}