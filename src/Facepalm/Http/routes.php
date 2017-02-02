<?php

Route::group(['middleware' => ['web']], function () {

// cms
    Route::any('/media/files/{hash}/{name?}', 'DownloadFileController@handle');
    Route::any('/media/images/{path}/{name}', 'AutoResizeController@handle')->where('path', '(.*)');

    Route::get('/cms/login', 'AuthController@get');
    Route::post('/cms/login', 'AuthController@login');
    Route::get('/cms/logout', 'AuthController@logout')->middleware([Facepalm\Http\Middleware\Authenticate::class]);


    Route::any('/cms/{group?}/{module?}/{params?}', 'CmsController@handle')->where(
        'params',
        '(.*)'
    )->middleware([Facepalm\Http\Middleware\Authenticate::class, Facepalm\Http\Middleware\PingPong::class]);
});
