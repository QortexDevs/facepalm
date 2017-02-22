<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Types;


use Facepalm\Cms\CmsCommon;
use Facepalm\Cms\Components\CmsForm;
use Facepalm\Cms\Components\CmsList;
use Facepalm\Cms\Fields\AbstractField;
use Facepalm\Cms\Fields\FieldSet;
use Facepalm\Models\ModelFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

/**
 * @property mixed foreignDisplayName
 * @property mixed foreignModel
 * @property mixed cardinality
 * @property mixed collectionName
 * @property mixed foreignName
 */
class ComboboxField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/elements/combobox';


    public function prepareData($object = null)
    {
        $this->parameters['dictionary'] =
            collect($this->parameters['dictionary'])->merge(
                ModelFactory::builderFor($this->parameters['modelName'])
                    ->where('name', '!=', '')
                    ->groupBy($this->parameters['name'])
                    ->get()
                    ->pluck('name')
            )->unique()->sort();
    }


}