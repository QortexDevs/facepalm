<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTableFacepalm extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table)
            {
                if (!Schema::hasColumn('users', 'parent_id')) {
                    $table->integer('parent_id')->nullable();
                }
                if (!Schema::hasColumn('users', 'status')) {
                    $table->integer('status')->nullable();
                }
                if (!Schema::hasColumn('users', 'show_order')) {
                    $table->integer('show_order')->nullable();
                }
                if (!Schema::hasColumn('users', 'name')) {
                    $table->string('name')->nullable();
                } else {
                    $table->string('name')->nullable()->change();
                }
                if (!Schema::hasColumn('users', 'email')) {
                    $table->string('email')->unique()->nullable();
                }
                if (!Schema::hasColumn('users', 'password')) {
                    $table->string('password', 60)->nullable();
                }
                if (!Schema::hasColumn('users', 'role_id')) {
                    $table->integer('role_id', false, true)->nullable();
                    $table->foreign('role_id')->references('id')->on('roles');
                }
                if (!Schema::hasColumn('users', 'acl')) {
                    $table->text('acl')->nullable();
                }
            });
        } else {
            Schema::create('users', function (Blueprint $table) {
                $table->increments('id');
                $table->integer('parent_id')->nullable();
                $table->integer('status')->nullable();
                $table->integer('show_order')->nullable();
                $table->string('name')->nullable();
                $table->string('email')->unique()->nullable();
                $table->string('password', 60)->nullable();
                $table->integer('role_id', false, true)->nullable();
                $table->foreign('role_id')->references('id')->on('roles');
                $table->text('acl')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        }
    }


    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('users');
    }
}
