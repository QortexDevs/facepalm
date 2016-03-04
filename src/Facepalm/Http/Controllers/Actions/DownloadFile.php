<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 06.12.15
 * Time: 17:12
 */

namespace Facepalm\Http\Controllers\Actions;

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

class DownloadFile
{
    public function handle(Request $request, $hash, $name = '')
    {
        /** @var File $file */
        $file = File::where('name', $hash)->first();
        if ($file) {
            $fileName = ($name ?: ($file->display_name . '.' . $file->type));
            $guesser = MimeTypeGuesser::getInstance();
            if (strpos($request->server('SERVER_SOFTWARE'), 'nginx') !== false) {
                return response('', 200)
                    ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"')
                    ->header('Content-Type', $guesser->guess($file->getPhysicalPath()))
                    ->header('X-Accel-Redirect', '/_internal_files/' . $file->getRelativePath());
            } else {
                return response()->download(
                    $file->getPhysicalPath(),
                    $fileName,
                    ['Content-Type' => $guesser->guess($file->getPhysicalPath())]
                );
            }
        } else {
            abort(404);
        }
    }
}