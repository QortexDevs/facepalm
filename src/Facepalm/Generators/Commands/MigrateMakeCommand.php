<?php

namespace Facepalm\Generators\Commands;

use Facepalm\Generators\MigrationCreator;
use Illuminate\Support\Composer;

class MigrateMakeCommand extends \Illuminate\Database\Console\Migrations\MigrateMakeCommand
{
    protected $signature = 'facepalm:makemigration {name : The name of the migration.}
        {--create= : The table to be created.}
        {--table= : The table to migrate.}
        {--path= : The location where the migration file should be created.}';

    public function __construct(Composer $composer)
    {
        parent::__construct(new MigrationCreator(app('files'), ''), $composer);
    }


}
