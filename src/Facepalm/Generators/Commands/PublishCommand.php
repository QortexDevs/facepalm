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
    protected $signature = 'facepalm:publish';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publishes Facepalm static';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $this->call('vendor:publish', ['--provider' => 'Facepalm\Providers\AppServiceProvider']);

        $this->call('migrate');

        @mkdir('public/media/', 0755, true);
        @mkdir('public/assets/', 0755, true);
        `cd public/assets/ && ln -s ../../vendor/xpundel/facepalm/build/ facepalm && cd ../../`;
    }
}
