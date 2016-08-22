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

class AddCmsModuleCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facepalm:addcmsmodule {path} {title} {icon?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add new empty cms module. TODO: переделать!';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        // todo: переделать в соответствии с новой структурой конфигов

//        $config = (new Config())->load();
//        $cmsJson = $config->all();
//        $path = explode('/', trim($this->argument('path'), '/'));
//        // add new root module
//        if (!Arr::has($cmsJson['structure'], $path[0])) {
//            $cmsJson['structure'][$path[0]] = [
//                "title" => $this->argument('title'),
//                "icon" => $this->argument('icon')
//            ];
//        }
//        if (count($path) == 2) {
//            if (!Arr::has($cmsJson['structure'][$path[0]], 'sections')) {
//                $cmsJson['structure'][$path[0]]['sections'] = [];
//            }
//            if (!Arr::has($cmsJson['structure'][$path[0]]['sections'], $path[1])) {
//                $cmsJson['structure'][$path[0]]['sections'][$path[1]] = [
//                    "title" => $this->argument('title'),
//                ];
//            }
//        }
//
//        file_put_contents(
//            $config->getConfigPath() . Config::DEFAULT_CONFIG_NAME,
//            json_encode($cmsJson, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
//        );
//
//        if (!is_dir($config->getConfigPath() . 'modules' . DIRECTORY_SEPARATOR . $path[0])) {
//            mkdir($config->getConfigPath() . 'modules' . DIRECTORY_SEPARATOR . $path[0]);
//        }
//
//        if (count($path) == 2) {
//            $configName = $config->getConfigPath() . 'modules' . DIRECTORY_SEPARATOR . $path[0] . DIRECTORY_SEPARATOR . $path[1] . '.json';
//            if (!is_file($configName)) {
//                $jsonNew = json_decode('{ "model": "", "strings": { "accusative": "", "title": "", "editTitle": "" }, "titles": { "name": "Название", "status": "Активность" }, "list": { "columns": { "name": { "translatable": true } } }, "form": { "fields": { "name": { "translatable": true }, "status": { "type": "boolean" } } } }');
//                file_put_contents(
//                    $configName,
//                    json_encode($jsonNew, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
//                );
//            }
//        }

    }
}
