<?php
namespace App\Facepalm\Fields;


use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class FieldListProcessor
{
    const FIELD_TYPE_DEFAULT = 'string';
    const RELATION_TYPE_NAME = 'relation';
    const CARDINALITY_ONE = 'one';
    const CARDINALITY_MANY = 'many';

    protected $fields = [];
    protected $relatedModels = [];

    /**
     * @param $fields
     * @param $titles
     * @return FieldListProcessor $this
     */
    public function process($fields, $titles)
    {
        $factory = new FieldFactory();

        // Ensure $fields is array
        $fields = (array)$fields;

        if (count($fields)) {

            // Convert plain array to associative
            if (!Arr::isAssoc($fields)) {
                if (!is_array($fields[0])) {
                    $fields = array_flip($fields);
                }
            }

            // Now whe definitely have associative array of fields, with names as keys
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
                    $parameters['foreignModel'] = explode('.', $name)[0];
                    $parameters['foreignDisplayName'] = explode('.', $name)[1];
                    $parameters['cardinality'] = Arr::get($parameters, 'cardinality', self::CARDINALITY_ONE);

                    if ($parameters['cardinality'] == self::CARDINALITY_MANY) {
                        // todo: возможность переопределения в параметрах
                        $parameters['collectionName'] = Str::snake($parameters['foreignModel']) . 's';
                    } else {
                        // todo: возможность переопределения в параметрах
                        $parameters['foreignKey'] = Str::snake($parameters['foreignModel']) . '_id';
                    }
                    $this->relatedModels[] = $parameters['foreignModel'];
                } else {
                    $type = Arr::get($parameters, 'type', self::FIELD_TYPE_DEFAULT);
                }


                // todo: подумтаь насчет ключа все же
                $this->fields[$name] = $factory->get($type)
                    ->setName($name)
                    ->setTitle($title)
                    ->setParameters($parameters);

                $counter++;
            }
        }

        return $this;
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
     * @return null
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
}