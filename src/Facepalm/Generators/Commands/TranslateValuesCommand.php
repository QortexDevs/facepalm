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

class TranslateValuesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facepalm:translatevalues {model=TranslatableStringValue} {field=value} {displayName=name}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Translate string values';

    protected $yandexApiKey = 'trnsl.1.1.20160922T173247Z.b3305254cd2226d3.28560b54b81522e3855a06daeaaf8b6c3cd6e45f';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $langs = Language::orderBy('is_default')->get();
        foreach (ModelFactory::all($this->argument('model')) as $value) {
            $hasTranslations = [];
            $noTranslations = [];
            foreach ($langs as $lang) {
                if ($value->string($this->argument('field'), $lang->code)) {
                    $hasTranslations[] = $lang->code;
                } else {
                    $noTranslations[] = $lang->code;
                }
            }

            if ($noTranslations && $hasTranslations) {
                $this->comment(
                    'Translate: ' . $value->{$this->argument('displayName')}
                    . ' from ' . $hasTranslations[0]
                    . ' ("' . $value->string($this->argument('field'), $hasTranslations[0]) . '")'
                );
                foreach ($noTranslations as $langTo) {
                    $url = 'https://translate.yandex.net/api/v1.5/tr.json/translate?lang=' . $hasTranslations[0] . '-' . $langTo . '&key=' . $this->yandexApiKey . '&text='
                        . urlencode($value->string($this->argument('field'), $hasTranslations[0]));
                    $response = json_decode(file_get_contents($url));
                    $this->comment($langTo . ': ' . $response->text[0]);
                    $value->string($this->argument('field'), $langTo, $response->text[0]);

                }
                $value->save();
                $this->comment('');
            }
        }
    }
}
