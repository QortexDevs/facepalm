<?php

namespace Facepalm\Generators\Commands;

use App\Models\CurrencyRate;
use Carbon\Carbon;
use Facepalm\Cms\Config\Config;
use Facepalm\Models\Role;
use Facepalm\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class InstallCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facepalm:install';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Install facepalm parts and directories';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $this->call('vendor:publish', ['--provider' => 'Facepalm\Providers\AppServiceProvider']);
        //todo: publish cms configs
        $this->call('migrate');
        //todo: ask superuser

        $email = $this->ask('Enter superuser email:');
        $password = $this->secret('Password for superuser');

        $this->call('facepalm:superuser', ['user' => $email, 'password' => $password]);
//            php artisan facepalm:superuser xpundel@gmail.com 1

        @mkdir('public/media/', 0755, true);
        @mkdir('public/assets/', 0755, true);
        `cd public/assets/ && ln -s ../../vendor/xpundel/facepalm/build/ facepalm && cd ../../`;
    }
}
