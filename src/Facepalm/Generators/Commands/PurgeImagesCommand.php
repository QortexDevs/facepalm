<?php

namespace Facepalm\Generators\Commands;

use App\Models\CurrencyRate;
use Carbon\Carbon;
use Facepalm\Models\Image;
use Facepalm\Models\Role;
use Facepalm\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PurgeImagesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'facepalm:purgeimages';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Purge unused images';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $images = DB::select("SELECT images.id, images.name, COUNT(text_items.id) as count_ti
                      FROM `images` 
                        LEFT JOIN `text_items` ON `textBody` LIKE CONCAT('%', images.name ,'%')
                      WHERE `images`.`bind_id` IS NULL AND `images`.`bind_type` = '' 
                      GROUP BY images.id
                      HAVING count_ti = 0");

        $this->comment(PHP_EOL . 'Orphaned images in text: ' . count($images));
        foreach ($images as $image) {
            $imageObject = Image::find($image->id);
            $imageObject->delete();
        }

        $counter = 0;
        $allFiles = glob(app()->publicPath() . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . '*/*/*_original.*');
        foreach ($allFiles as $filename) {
            preg_match('/\/([0-9a-h]{32})_original/', $filename, $matches);
            if ($matches && Arr::has($matches, 1)) {
                $image = DB::select("SELECT id FROM images WHERE name=?", [$matches[1]]);
                if (!$image) {
                    $counter++;
//                    unlink($filename);
                    $fileSatellites = glob(app()->publicPath() . DIRECTORY_SEPARATOR . 'media' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . '*/*/' . $matches[1] . '_*.*');
                    if ($fileSatellites) {
                        foreach ($fileSatellites as $fileSatellite) {
                            unlink($fileSatellite);
                        }
                    }

                }
            }
        }
        $this->comment('Orphaned image files: ' . $counter);

        $counter = 0;
        $allImages = Image::all();
        foreach ($allImages as $img) {
            if ($img->bind_id && $img->bind_type && !$img->bind) {
                $counter++;
                $img->delete();
            }
        }
        $this->comment('Unbinded images: ' . $counter);

        $this->comment('');


    }
}
