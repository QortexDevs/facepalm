<?php namespace Facepalm\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;

class PingPong
{

    /**
     * Check if there is no trailing slash and redirect to slashed-variant
     *
     * @param  \Illuminate\Http\Request $request
     * @param  \Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        if ($request->input('ping')) {
            return response('pong');
        }

        return $next($request);
    }

}