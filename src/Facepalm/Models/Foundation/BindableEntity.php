<?php
/**
 * Created by PhpStorm.
 * User: xpundel
 * Date: 23.12.15
 * Time: 16:33
 */

namespace Facepalm\Models\Foundation;


abstract class BindableEntity extends AbstractEntity
{
    /**
     * Get all of the owning binded models.
     */
    public function bind()
    {
        return $this->morphTo();
    }

    public function scopeOfGroup($query, $group)
    {
        return $query->where('group', $group);
    }
}