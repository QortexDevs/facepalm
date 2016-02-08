<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('files', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('parent_id');
            $table->integer('status');
            $table->integer('show_order');
            $table->integer('bind_id');
            $table->string('bind_type');
            $table->string('group');
            $table->string('name');
            $table->integer('size');
            $table->string('type');
            $table->string('original_name');
            $table->string('display_name');
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
        Schema::drop('files');
    }
}