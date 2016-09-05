<?php

namespace Facepalm\Http\Controllers;

use App\Models\ProductType;
use Facepalm\Models\SiteSection;
use Facepalm\Models\StringValue;
use Facepalm\Models\TranslatableStringValue;
use Facepalm\Tools\AssetsBuster;
use Facepalm\Tools\TextProcessor;
use Facepalm\Tools\Tree;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as FrameworkBaseController;
use Illuminate\Support\Arr;

class BaseController extends FrameworkBaseController
{
    /** @var Request */
    protected $request;

    /** @var  SiteSection */
    protected $currentSection;

    /** @var  TextProcessor */
    protected $textProcessor;

    protected $commonViewValues = [];
    protected $requestSegments = [];
    protected $activeBranch = [];
    protected $stringValues = [];

    protected $addSiteNameToTitle;
    protected $siteName;
    protected $siteTree;

    protected $languages;
    protected $currentLanguage;

    protected $productTypes;

    /**
     * BaseController constructor.
     * @param Request $request
     * @param TextProcessor $textProcessor
     */
    public function __construct(Request $request, TextProcessor $textProcessor)
    {
        $this->request = $request;
        $this->textProcessor = $textProcessor;
        $this->requestSegments = $request->segments();
        $this->languages = $request->attributes->get('languages');
        $this->currentLanguage = $request->attributes->get('currentLanguage');

        if ($this->currentLanguage) {
            array_shift($this->requestSegments);
        }
        $this->siteTree = Tree::fromEloquentCollection(
            SiteSection::where('status', 1)->orderBy('show_order')->with('textItems')->get()
        );

        $root = $this->siteTree->findRoot();

        if ($this->requestSegments) {
            $this->currentSection = $this->siteTree->getElementByPath(
                implode('/', $this->requestSegments),
                'path_name',
                '/',
                config('facepalm.rootSection') ? $root : 0
            );
        }

        if ($this->currentSection) {
            $this->activeBranch = array_reverse($this->siteTree->getElementAncestors($this->currentSection));
            if (config('facepalm.rootSection') && $this->activeBranch[0]->id == $root) {
                array_shift($this->activeBranch);
            }
            $this->activeBranch[] = $this->currentSection;
        }

        foreach (StringValue::all() as $v) {
            $this->stringValues[$v->name] = $v->value;
        }
        foreach (TranslatableStringValue::all() as $v) {
            $this->stringValues[$v->name] = $v->value;
        }

        $this->commonViewValues = [
            'siteTree' => $this->siteTree,
            'topLevelMenu' => $this->siteTree->getChildren(config('facepalm.rootSection') ? $root : 0),
            'activeBranch' => $this->activeBranch,
            'staticRoot' => '/',
            'root' => '/' . ($this->currentLanguage ? ($this->currentLanguage->code . '/') : ''),
            'requestSegments' => $this->requestSegments,
            'currentPath' => implode('/', $this->requestSegments) . '/',
            'currentLanguage' => $this->currentLanguage,
            'languages' => $this->languages,
            'busters' => (new AssetsBuster())->getSiteBusters(),
            'values' => $this->stringValues,
            'menu' => [
                'expandableItems' => [
                    'shop',
                    'cabinet'
                ]
            ]
        ];

        if ($this->currentSection) {
            $this->commonViewValues += [
                'currentSection' => $this->currentSection,
                'pageHeader' => $this->currentSection->title,
                'meta' => [
                    'title' => $this->currentSection->title . ($this->addSiteNameToTitle ? (' – ' . $this->siteName) : '')
                ],
            ];
        } else {
            $this->commonViewValues += [
                'meta' => [
                    'title' => $this->siteName
                ],
            ];
        }
    }

    /**
     * @param $template
     * @param $parameters
     * @return mixed
     */
    protected function render($template, array $parameters = array())
    {
        return view($template, $parameters + $this->commonViewValues);
    }
}
