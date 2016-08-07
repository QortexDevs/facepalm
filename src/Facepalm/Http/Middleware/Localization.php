<?php namespace Facepalm\Http\Middleware;

use Closure;
use Facepalm\Models\Language;
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
        $currentLanguage = '';
        $languages = Language::where('status', 1)->orderBy('show_order')->get();
        $request->attributes->add(['languages' => $languages]);

        // Check if requested language exists
        if ($code = $request->$languageCodeParameterName) {
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
        } else {
            $defaultLanguage = $this->getDefaultLang($languages);
            if ($request->method() === 'GET') {
                // Return redirect to default language on GET request
                return redirect('/' . $defaultLanguage->code . '/' . trim($request->path(), '/'));
            } else {
                // Set default locale on another requests
                $request->attributes->add(['currentLanguage' => $defaultLanguage]);
                app()->setLocale($defaultLanguage->code);
            }
        }

        // Unset language parameter from Route params. May be little dirty, but works
        $route = call_user_func($request->getRouteResolver());
        $route->forgetParameter($languageCodeParameterName);

        return $next($request);
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