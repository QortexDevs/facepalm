<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers;

use Facepalm\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Arr;

class AutoResizeController extends BaseController
{
    public function handle(Request $request, $path, $name)
    {
        preg_match(
            '/^(?<hash>[0-9a-f]+)(_(?<modifier>[a-wy-z])?(?<dimensions>[\dx]+))?\.(?<ext>jpg|png|gif|svg)$/',
            $name,
            $matches
        );
        if (Arr::has($matches, 'hash') & Arr::has($matches, 'dimensions')) {
            if (in_array($matches['dimensions'], (array)config('facepalm.allowedDimensions'))) {
                /** @var Image $image */
                $image = Image::where('name', $matches['hash'])->first();
                if ($image) {
                    $image->generateSize($matches['dimensions'], $matches['modifier']);
                    return redirect(
                        rtrim($request->getUri(), '/'),
                        302,
                        ['Cache-Control' => 'no-store, no-cache, must-revalidate']
                    );
                }
            }
        }
        abort(404);
    }
}