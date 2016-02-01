<?php


Route::get('/', function () {
    return view('welcome');
});

// cms
Route::any('/media/files/{hash}/{name?}', 'Cms\CmsController@downloadFile');
Route::any('/media/images/{path}/{name}', 'Cms\CmsController@autoResizeImage')->where('path', '(.*)');
Route::any('/cms/{group?}/{module?}/{params?}', 'Cms\CmsController@module')->where('params', '(.*)');

// default route
Route::any('/{params?}', 'DefaultController@display')->where('params', '(.*)');
