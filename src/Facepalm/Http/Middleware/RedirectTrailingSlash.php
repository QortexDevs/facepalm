<?php namespace Facepalm\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;

class RedirectTrailingSlash
{

    /**
     * Check if there is no trailing slash and redirect to slashed-variant
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if ($request->method() === 'GET') {
            $url = $request->getBaseUrl() . $request->getPathInfo();
            if ($url && $url !== '/' && !strstr($url, '/media/') && !preg_match('/.+\/$/', $url)) {
                if (null !== $qs = $request->getQueryString()) {
                    $qs = '?' . $qs;
                }

                // Built-in laravel redirector always trim slash, so we use plain header()
                header('Location:' . $url . '/' . $qs, 301);
                exit;
            }
        }

        return $next($request);
    }

}