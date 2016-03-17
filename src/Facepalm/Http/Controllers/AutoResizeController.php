<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Facepalm\Cms\Components\CmsList;
use Facepalm\Cms\Components\CmsForm;
use Facepalm\Cms\Config\Config;
use Facepalm\Models\File;
use Facepalm\Models\Image;
use Facepalm\PostProcessing\AmfProcessor;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\File\MimeType\MimeTypeGuesser;
use TwigBridge\Facade\Twig;

class AutoResizeController extends BaseController
{
    public function handle(Request $request, $path, $name)
    {
        preg_match('/^(?<hash>[0-9a-f]+)(_(?<dimensions>[\dx]+))?\.(?<ext>jpg|png|gif)$/', $name, $matches);
        if (Arr::has($matches, 'hash') & Arr::has($matches, 'dimensions')) {
            if (in_array($matches['dimensions'], (array)config('app.allowedDimensions'))) {
                /** @var Image $image */
                $image = Image::where('name', $matches['hash'])->first();
                if ($image) {
                    $image->generateSize($matches['dimensions']);
                    return redirect(
                        $request->getUri(),
                        302,
                        ['Cache-Control' => 'no-store, no-cache, must-revalidate']
                    );
                }
            }
        }
        abort(404);
    }
}