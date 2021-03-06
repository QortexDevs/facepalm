<?php

namespace Facepalm\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;

class Authenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure $next
     * @param  string|null $guard
     * @return mixed
     */
    public function handle($request, Closure $next, $guard = null)
    {
        if (!$guard) {
            $guard = config('auth.defaults.guard');
        }

        $guards = config('facepalm.cmsAuthGuards')
            ? explode(',', config('facepalm.cmsAuthGuards'))
            : [$guard];
        foreach ($guards as $guardIter) {
            if (!Auth::guard($guardIter)->guest()) {
                app('config')['auth.defaults.guard'] = $guardIter;
                return $next($request);
            }
        }

        if ($request->ajax() || $request->wantsJson()) {
            return response('Unauthorized.', 401);
        } else {
            return redirect()->guest('cms/login');
        }

    }
}
