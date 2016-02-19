<?php


Route::get('/', function () {
    return view('welcome');
});

// cms
Route::any('/media/files/{hash}/{name?}', 'FacepalmController@downloadFile');
Route::any('/media/images/{path}/{name}', 'FacepalmController@autoResizeImage')->where('path', '(.*)');
Route::any('/cms/{group?}/{module?}/{params?}', 'FacepalmController@displayCmsUI')->where('params', '(.*)');

// default route
//todo: перенести это тоже в facepalmcontroller
Route::any('/{params?}', 'DefaultController@display')->where('params', '(.*)');
