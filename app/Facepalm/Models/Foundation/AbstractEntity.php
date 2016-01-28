<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace App\Facepalm\Models\Foundation;


use Illuminate\Database\Eloquent\Model;

/**
 * Class AbstractEntity
 *
 * @package App\Facepalm\Models\Base
 *
 * @property integer id
 * @property integer parent_id
 * @property integer show_order
 * @property boolean status
 * @property string created_at
 * @property string updated_at
 */
abstract class AbstractEntity extends Model
{
}