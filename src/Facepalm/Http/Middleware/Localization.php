<?php namespace Facepalm\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Facepalm\Models\Language;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;

class Localization
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
        $languageCodeParameterName = config('facepalm.languageCodeParameterName') ?: 'languageCode';
        $languageSource = config('facepalm.languageSource') ?: 'url';

        $currentLanguage = '';
        $languages = Language::where('status', 1)->orderBy('show_order')->get();
        $request->attributes->add(['languages' => $languages]);

        $code = '';
        if ($languageSource === 'user') {
            if ($request->user()) {
                $code = $request->user()->$languageCodeParameterName;
            }
        } else {
            $code = $request->$languageCodeParameterName;
        }

        // if no cookie in request - try get it from cookie

        // Check if requested language exists
        if ($code) {
            $langFound = $languages->search(function ($item) use ($code) {
                return $item->code === $code;
            });
            if ($langFound !== false) {
                $currentLanguage = $languages[$langFound];
            }
        }

        if ($currentLanguage) {
            $request->attributes->add(['currentLanguage' => $currentLanguage]);
            app()->setLocale($currentLanguage->code);
            Carbon::setLocale($currentLanguage->code);
            setlocale(LC_TIME, $currentLanguage->localeName);
        } else {
            $defaultLanguage = $this->getDefaultLang($languages);
            $langFound = $languages->search(function ($item) use ($request) {
                return $item->code === $request->cookie('language');
            });
            $redirectToLanguage = ($langFound !== false && $languages[$langFound]) ? $languages[$langFound] : $defaultLanguage;

            // todo: config.redirectToDefaultLanguage ?
            if ($languageSource === 'url' && $request->method() === 'GET') {
                // Return redirect to default language on GET request
                if (null !== $qs = $request->getQueryString()) {
                    $qs = '?' . $qs;
                }
                return redirect('/' . $redirectToLanguage->code . '/' . trim($request->path(), '/') . $qs);
            } else {
                // Set default locale on another requests
                $request->attributes->add(['currentLanguage' => $redirectToLanguage]);
                app()->setLocale($redirectToLanguage->code);
                Carbon::setLocale($redirectToLanguage->code);
                setlocale(LC_TIME, $redirectToLanguage->localeName);
            }
        }

        if ($languageSource === 'url') {
            // Unset language parameter from Route params. May be little dirty, but works
            $route = call_user_func($request->getRouteResolver());
            $route->forgetParameter($languageCodeParameterName);
        }
        $response = $next($request);
        if ($currentLanguage && $response instanceof Response) {
            $response->cookie('language', $currentLanguage->code, 2628000);
        }
        return $response;
    }

    /**
     * @param $languages
     * @return mixed
     */
    protected function getDefaultLang($languages)
    {
        $defaultLang = $languages->search(function ($item, $key) {
            return $item->is_default;
        }) ?: 0;
        return $languages[$defaultLang];
    }

}