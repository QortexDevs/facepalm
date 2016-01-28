<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateImagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('images', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('parent_id');
            $table->integer('status');
            $table->integer('show_order');
            $table->integer('bind_id');
            $table->string('bind_type');
            $table->string('group');
            $table->string('name');
            $table->integer('width');
            $table->integer('height');
            $table->integer('original_width');
            $table->integer('original_height');
            $table->string('ext');
            $table->string('original_name');
            $table->timestamps();
            $table->unique('name');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('images');
    }
}
