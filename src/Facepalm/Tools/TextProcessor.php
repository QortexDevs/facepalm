<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 17.05.16
 * Time: 11:54
 */

namespace Facepalm\Tools;

use Facepalm\Models\Image;
use Illuminate\Foundation\Application;

class TextProcessor
{
    /** @var \Twig_Environment */
    protected $renderer;

    public function __construct(Application $app)
    {
        $this->renderer = $app->make('twig');
    }

    /**
     * @param $text
     * @param $templates
     * @return mixed
     */
    public function replaceMceImages($text, $templates)
    {
        $pattern = '/<div class="mceNonEditable galleryPlaceholder type-(.+)" data-images="([0-9,]*)"( data-comments="(.*?)")?>.*<\/div>/i';
        preg_match_all($pattern, $text, $matches);

        if ($matches && $matches[1] && $matches[2]) {
            foreach ($matches[0] as $i => $match) {
                $html = '';
                if ($matches[2][$i]) {
                    $imageIds = explode(',', $matches[2][$i]);
                    $images = Image::whereIn('id', $imageIds)->get();

                    $html = $this->renderer->render(
                        is_array($templates) ? $templates[$matches[1][$i]] : $templates,
                        [
                            'images' => $images,
                            'comments' => json_decode(urldecode($matches[4][$i]), true),
                        ]
                    );
                }
                $text = str_replace($match, $html, $text);
            }
        }

        return $text;

    }

}