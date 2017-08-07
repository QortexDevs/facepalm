<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateLanguagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('parent_id')->nullable();
            $table->integer('status')->nullable();
            $table->integer('show_order')->nullable();
            $table->string('code')->nullable();
            $table->string('localeName')->nullable();
            $table->string('name')->nullable();
            $table->boolean('is_default')->nullable();
            $table->timestamps();
        });

        DB::table('languages')->insert(
            [
                'name' => 'Русский',
                'code' => 'ru',
                'localeName' => 'ru_RU.UTF-8',
                'status' => 1,
                'show_order' => 1,
                'is_default' => 1
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
        Schema::drop('languages');
    }
}
