<?php

namespace Facepalm\Generators\Commands;

use Illuminate\Support\Str;

class ModelMakeCommand extends \Illuminate\Foundation\Console\ModelMakeCommand
{
    protected $name = 'facepalm:makemodel';

    public function handle()
    {
        if ($this->argument('name')) {
            $this->input->setArgument('name', Str::ucfirst($this->argument('name')));
        }
        $this->input->setOption('migration', true);

        parent::handle();
    }


    protected function createMigration()
    {
        $table = Str::plural(Str::snake(class_basename($this->argument('name'))));

        $this->call('facepalm:makemigration', [
            'name' => "create_{$table}_table",
            '--create' => $table,
        ]);
    }

    /**
     * @param string $rootNamespace
     * @return string
     */
    protected function getDefaultNamespace($rootNamespace)
    {
        return $rootNamespace . '\Models';
    }


    /**
     * @param string $name
     * @return string
     */
    protected function getPath($name)
    {
        $name = str_replace($this->laravel->getNamespace(), '', $name);

        return $this->laravel['path'] . '/' . str_replace('\\', '/', $name) . '.php';
    }


    /**
     * Get the stub file for the generator.
     *
     * @return string
     */
    protected function getStub()
    {
        return __DIR__ . '/../stubs/model.stub';
    }
}