<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTextItemsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('text_items', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('parent_id')->nullable();
            $table->integer('status')->nullable();
            $table->integer('show_order')->nullable();
            $table->integer('bind_id')->nullable();
            $table->string('bind_type')->nullable();
            $table->string('group')->nullable();
            $table->string('languageCode')->nullable();
            $table->string('stringValue')->nullable();
            $table->text('textBody')->nullable();
            $table->timestamps();
            $table->index('bind_type');
            $table->index('bind_id');
            $table->index('group');
            $table->index('stringValue');
            $table->index('languageCode');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('text_items');
    }
}
