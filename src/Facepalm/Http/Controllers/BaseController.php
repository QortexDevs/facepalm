<?php

namespace Facepalm\Http\Controllers;

use Facepalm\Models\SiteSection;
use Facepalm\Tools\Tree;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as FrameworkBaseController;

class BaseController extends FrameworkBaseController
{
    /** @var Request */
    protected $request;

    /** @var  SiteSection */
    protected $currentSection;

    protected $commonViewValues = [];
    protected $requestSegments = [];
    protected $activeBranch = [];

    protected $addSiteNameToTitle;
    protected $siteName;
    protected $siteTree;

    /**
     * BaseController constructor.
     * @param Request $request
     */
    public function __construct(Request $request)
    {
        $this->request = $request;
        $this->requestSegments = $request->segments();
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

        $this->commonViewValues = [
            'siteTree' => $this->siteTree,
            'topLevelMenu' => $this->siteTree->getChildren(config('facepalm.rootSection') ? $root : 0),
            'activeBranch' => $this->activeBranch,
            'root' => '/',
            'requestSegments' => $this->requestSegments,
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
