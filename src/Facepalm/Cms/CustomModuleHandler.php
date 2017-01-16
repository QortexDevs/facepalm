<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 16.01.17
 * Time: 12:01
 */

namespace Facepalm\Cms;


interface CustomModuleHandler
{
    
    public function processParameters($params);

    public function render($renderer);

    public function setMode($action, $objectId);

}