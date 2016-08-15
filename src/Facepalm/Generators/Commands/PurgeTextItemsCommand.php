<?php

namespace Facepalm\Generators\Commands;

use App\Models\CurrencyRate;
use Carbon\Carbon;
use Facepalm\Models\Image;
use Facepalm\Models\Role;
use Facepalm\Models\TextItem;
use Facepalm\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Debug\Exception\FatalErrorException;

class PurgeTextItemsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facepalm:purgetexts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge unused text items';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $counter = 0;
        $all = TextItem::all();
        foreach ($all as $ti) {
            if ($ti->bind_id && $ti->bind_type) {
                if (!class_exists($ti->bind_type) || !$ti->bind) {
//                    d($ti->bind_type);
                    $counter++;
                    $ti->delete();
                }
            }
        }
        $this->comment('Unbinded texts: ' . $counter);

        $this->comment('');


    }
}
