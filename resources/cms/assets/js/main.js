/**
 * Created by xpundel on 02.03.15.
 */

//= ../../../../bower_components/jquery/dist/jquery.js
//= ../../../../bower_components/underscore/underscore.js
//= ../../../../bower_components/underscore.string/dist/underscore.string.js
//= ../../../../bower_components/moment/moment.js
//= ../../../../bower_components/pikaday-time/pikaday.js
//= ../../../../bower_components/growl/javascripts/jquery.growl.js
//= ../../../../bower_components/dropzone/dist/dropzone.js
//= ../../../../bower_components/twig.js/twig.js
//= ../../../../bower_components/Sortable/Sortable.js
//= ../../../../bower_components/fancybox/source/jquery.fancybox.pack.js

$(document).ready(function () {


    $(document).on('click', '.cms-module-list-content button.status', function () {
        var $tr = $(this).closest('tr[data-id]');
        var id = $tr.data('id');
        var model = $(this).closest('table[data-model]').data('model');
        var payload = _.extend({}.setWithPath(['toggle', model, id, 'status'], 1), getCsrfTokenParameter());
        $.post('./', payload, 'json').done(function (result) {
            $tr.toggleClass('inactive', !result);
        });
        return false;
    });

    $(document).on('click', '.form-buttons button.save-button', function () {
        var formData = $('.main-cms-form').serialize();

        toggleSpinner(true);
        toggleFormButtons(false);

        // Minimum delay to avoid unpleasant blinking
        $.when($.post('./', formData), delay(800)).then(function () {
                $.growl.notice({title: '', message: "Cохранено"});
                toggleSpinner(false);
                toggleFormButtons(true);
            }
        );
        return false;
    });

    $(document).on('click', '.add-new-item', function () {
        document.location.href = $(this).data('base-url') + '/create/';
        return false;
    });


    $('.datepicker').each(function () {
        var options = {
            field: $(this)[0],
            theme: 'dark-theme',
            format: 'DD.MM.YYYY',
            firstDay: 1,
            showTime: false,
            i18n: {
                previousMonth: 'Предыдущий месяц',
                nextMonth: 'Следующий месяц',
                months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
                weekdaysShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
            }
        };
        if ($(this).is('.datetime')) {
            options = _.extend(options, {
                format: 'DD.MM.YYYY HH:mm',
                showTime: true,
                showSeconds: false,
                use24hour: true
            })
        }

        var picker = new Pikaday(options);
    });
    $('.datepicker + .clear-date').on('click', function () {
        $(this).prev().val('');
    });

    Dropzone.autoDiscover = false;
    var templateImage = twig({
        data: $('#image-preview-template').html()
    });
    var templateFile = twig({
        data: $('#file-preview-template').html()
    });


    $(document).on('click', '.images-list .image .delete', function () {
        if (confirm('Sure?')) {
            var $image = $(this).closest('.image');
            var id = $image.data('id');
            var model = 'image';
            var payload = _.extend({}.setWithPath(['delete', model, id], 1), getCsrfTokenParameter());
            $.post('./', payload, 'json').done(function (result) {
                $image.fadeOut(function () {
                    $(this).remove();
                });
            });
            return false;

        }
    });
    $('.images-list').each(function () {
        $(this).find('.image > a').fancybox({
            padding: 1,
            openEffect: 'elastic',
            helpers: {
                overlay: {
                    locked: false,
                    css: {
                        'background': 'rgba(0,0,0,0.5)'
                    }
                }
            }
        });
        var sortable = Sortable.create($(this)[0], {
            animation: 200,
            scroll: true,
            onUpdate: function (/**Event*/evt) {
                var orderArray = sortable.toArray();
                var model = 'image';
                var payload = _.extend({save: {image: {}}}, getCsrfTokenParameter());
                for (var i in orderArray) {
                    payload['save']['image'][orderArray[i]] = {'show_order': parseInt(i) + 1};
                }
                //console.log(payload);
                $.post('./', payload, 'json');
            },
        });

    });

    $(".dropzone").each(function () {
        var $dropzone = $(this);
        var isMultiple = $dropzone.data('multiple') == "1";
        $(this).dropzone({
            url: "./?_token=" + $('input:hidden[name=_token]').val() + $dropzone.data('parameters'),
            paramName: $(this).data('input-name'),
            parallelUploads: 3,
            maxFiles: isMultiple ? null : 1,
            uploadMultiple: isMultiple,
            addRemoveLinks: true,
            createImageThumbnails: false,
            acceptedFiles: $dropzone.data('type') == 'image' ? 'image/*' : null,
            //previewTemplate: '<div class="dz-preview dz-file-preview">' +
            //'<div class="dz-details">' +
            //'<div class="dz-filename"><span data-dz-name></span></div>' +
            //'<div class="dz-size" data-dz-size></div>' +
            //'</div>' +
            //'<div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>' +
            //'</div>',
            success: function (file, response) {
                this.removeFile(file);
                if (!isMultiple) {
                    $dropzone.prev().empty();
                }
                for (var i in response) {
                    if($dropzone.data('type') == 'image') {
                        if (!$('.images-list .image[data-id=' + response[i].image.id + ']').length) {
                            $dropzone.prev().append(templateImage.render(response[i]))
                        }
                    } else {
                        if (!$('.files-list .file[data-id=' + response[i].file.id + ']').length) {
                            $dropzone.prev().append(templateFile.render(response[i]))
                        }
                    }
                }
            }
            //accept: function(file, done) {
            //    if (file.name == "justinbieber.jpg") {
            //        done("Naha, you don't.");
            //    }
            //    else { done(); }
            //}
        });
    })


});

function toggleSpinner(show) {
    $('#spinner').toggleClass('show', show);
}

function toggleFormButtons(enable) {
    $('.form-buttons button').prop('disabled', !enable);
}

function getCsrfTokenParameter() {
    return {'_token': $('input:hidden[name=_token]').val()};
}



