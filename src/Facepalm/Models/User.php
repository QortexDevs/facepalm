<?php

namespace Facepalm\Models;

use Facepalm\Models\Foundation\BaseEntity;
use Illuminate\Auth\Authenticatable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Support\Facades\Hash;

/**
 * @property array|string password
 * @property array|string email
 * @property array acl
 * @property Role $role
 */
class User extends BaseEntity implements AuthenticatableContract,
    AuthorizableContract,
    CanResetPasswordContract
{
    use Authenticatable, Authorizable, CanResetPassword;

    /**
     * The database table used by the model.
     *
     * @var string
     */
    protected $table = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = ['name', 'email', 'password'];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = ['password', 'remember_token'];


    protected $casts = [
        'status' => 'boolean',
    ];
//    protected $dateFormat = 'd.m.Y H:i:s';

    protected $textFields = ['bio', 'descr'];
    protected $stringFields = ['title'];

    public function role()
    {
        return $this->belongsTo('Facepalm\Models\Role');
    }

    /**
     * @param $password
     */
    protected function setPasswordAttribute($password)
    {
        if ($password !== '') {
            $this->attributes['password'] = Hash::make($password);
        }
    }
}
