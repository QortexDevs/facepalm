<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateRolesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('parent_id')->nullable();
            $table->integer('status')->nullable();
            $table->integer('show_order')->nullable();
            $table->string('name')->nullable();
            $table->timestamps();
        });
        DB::table('roles')->insert(
            [
                'name' => 'Суперпользователь',
                'status' => 1,
                'show_order' => 1,
            ]
        );
        DB::table('roles')->insert(
            [
                'name' => 'Администратор',
                'status' => 1,
                'show_order' => 2,
            ]
        );
    }


    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('roles');
    }
}
