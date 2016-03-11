<?php

namespace Facepalm\Generators\Commands;

use App\Models\CurrencyRate;
use Carbon\Carbon;
use Facepalm\Models\Role;
use Facepalm\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Hash;

class SuperuserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facepalm:superuser {user} {password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create superuser';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $this->comment(PHP_EOL . 'Creating user ' . $this->argument('user') . PHP_EOL);
        $user = new User();
        $user->email = $this->argument('user');
        $user->password = Hash::make($this->argument('password'));
        $user->status = 1;
        $user->role()->associate(Role::find(1));
        $user->save();
    }
}
