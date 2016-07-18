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
            $table->integer('parent_id')->nullable();
            $table->integer('status')->nullable();
            $table->integer('show_order')->nullable();
            $table->integer('bind_id')->nullable();
            $table->string('bind_type');
            $table->string('group');
            $table->string('name');
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->integer('original_width')->nullable();
            $table->integer('original_height')->nullable();
            $table->string('ext');
            $table->string('original_name');
            $table->string('video_link');
            $table->boolean('is_video');
            $table->text('embed_code');
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
