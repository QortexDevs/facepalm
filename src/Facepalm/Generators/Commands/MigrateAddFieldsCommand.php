<?php

namespace Facepalm\Generators\Commands;


class MigrateAddFieldsCommand extends MigrateMakeCommand
{
    protected $signature = 'facepalm:migration:addfields {table}
            {--path= : The location where the migration file should be created.}';

    public function fire()
    {
        // It's possible for the developer to specify the tables to modify in this
        // schema operation. The developer may also specify if this table needs
        // to be freshly created so we can create the appropriate migrations.

        $table = $this->argument('table');

        $name = 'add_fields_to_' . $table . '_table';

        $create = false;

        // Now we are ready to write the migration out to disk. Once we've written
        // the migration out, we will dump-autoload for the entire framework to
        // make sure that the migrations are registered by the class loaders.
        $this->writeMigration($name, $table, $create);

        $this->composer->dumpAutoloads();
    }


}
