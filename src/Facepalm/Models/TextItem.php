<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models;

use Facepalm\Models\Foundation\BindableEntity;
use Facepalm\Tools\Path;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Mockery\CountValidator\Exception;
use Symfony\Component\HttpFoundation\File\UploadedFile;


/**
 * @property integer bind_id
 * @property integer bind_type
 * @property string group
 * @property string languageCode
 * @property string stringValue
 * @property string textBody
 */
class TextItem extends BindableEntity
{
    protected $fillable = [
        'group',
        'status',
        'languageCode',
        'stringValue',
        'textBody'
    ];

    /**
     * @param Builder $query
     * @param string $group
     * @param string $languageCode
     * @return mixed
     */
    public function scopeOfGroupAndLanguage($query, $group, $languageCode)
    {
        return $query
            ->where('group', $group)
            ->where('languageCode', $languageCode);
    }

    /**
     * @param Builder $query
     * @param string $languageCode
     * @return mixed
     */
    public function scopeOfLanguage($query, $languageCode)
    {
        return $query->where('languageCode', $languageCode);
    }

}