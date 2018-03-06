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
            $table->string('bind_type')->nullable();
            $table->string('group')->nullable();
            $table->string('name')->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->integer('original_width')->nullable();
            $table->integer('original_height')->nullable();
            $table->string('ext')->nullable();
            $table->string('original_name')->nullable();
            $table->string('video_link')->nullable();
            $table->boolean('is_video')->nullable();
            $table->text('embed_code')->nullable();
            $table->timestamps();
            $table->unique('name');
            $table->index(['bind_id', 'bind_type']);
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
