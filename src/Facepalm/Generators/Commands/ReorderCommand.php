<?php

namespace Facepalm\Generators\Commands;

use App\Models\CurrencyRate;
use Carbon\Carbon;
use Facepalm\Models\Image;
use Facepalm\Models\Language;
use Facepalm\Models\ModelFactory;
use Facepalm\Models\Role;
use Facepalm\Models\TranslatableStringValue;
use Facepalm\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ReorderCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facepalm:reorder {model} {orderby}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reorder objects by field';


    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        DB::statement('SET @pos := 0');
        $affected = DB::update('UPDATE ' . Str::plural(Str::snake(class_basename($this->argument('model')))) . ' SET show_order = ( SELECT @pos := @pos + 1 ) ORDER BY ' . $this->argument('orderby') . ';');
        $this->comment('Updated rows: ' . $affected);
    }
}
