<?php


// cms
Route::any('/media/files/{hash}/{name?}', 'MainController@downloadFile');
Route::any('/media/images/{path}/{name}', 'MainController@autoResizeImage')->where('path', '(.*)');
Route::any('/cms/{group?}/{module?}/{params?}', 'MainController@displayCmsUI')->where('params', '(.*)');

// default route
//todo: перенести это тоже в facepalmcontroller
Route::any('/{params?}', 'DefaultController@display')->where('params', '(.*)');
