<?php

namespace Facepalm\Generators;

class MigrationCreator extends \Illuminate\Database\Migrations\MigrationCreator
{
    public function stubPath()
    {
        return __DIR__.'/stubs/migrations';
    }
}
