<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.12.15
 * Time: 18:51
 */

namespace Facepalm\Cms\Fields\Extended;


use Facepalm\Cms\Components\CmsForm;
use Facepalm\Cms\Fields\AbstractField;
use Facepalm\Cms\Fields\FieldSet;
use Illuminate\Support\Str;

class TabsField extends AbstractField
{
    protected $templateName = 'facepalm::components/form/extended/tabs';

    public function renderFormField($object, array $parameters = [], $template = '')
    {
        $randomId = Str::quickRandom(6);
        $parameters['tabs'] = [];
        foreach ($this->parameters['tabs'] as $tab) {
            /** @var FieldSet $fieldSet */
            $fieldSet = app()->make('CmsFieldSet')
                ->setDictionaries($this->config->get('module.dictionaries', []))
                ->setRender($this->render)
                ->setAdditionalParameter('config', $this->config);

            /** @var CmsForm $form */
            $form = app()->make('CmsForm', [$fieldSet]);

            $form->setMainModel($this->config->get('module.model'));
            $fieldSet->process($tab['form'], $this->config->get('module.titles'));
            $form->setEditedObject($object);
            $parameters['tabs'][] = [
                'title' => $tab['title'],
                'content' => $this->render->render('facepalm::components/form/container', [
                    'form' => $form->build($randomId),
                ])
            ];
        }


        return $this->render->render($this->templateName, $parameters);


    }


}