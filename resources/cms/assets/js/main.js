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
    //load underscore.string
    _.mixin(s.exports());

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
    $(document).on('click', '.cms-module-list-content button.delete', function () {
        if (confirm('Sure?')) {
            var $tr = $(this).closest('tr[data-id]');
            var id = $tr.data('id');
            var model = $(this).closest('table[data-model]').data('model');
            var payload = _.extend({}.setWithPath(['delete', model, id], 1), getCsrfTokenParameter());
            $.post('./', payload, 'json').done(function (result) {
                $tr.fadeOut('fast', function () {
                    $(this).remove()
                });
            });
        }
        return false;
    });

    if ($('.cms-module-form-page').data('just-created')) {
        $.growl.notice({title: '', message: "Объект создан"});
    }

    $(document).on('click', '.form-buttons button.save-button', function () {
        var formData = $('.main-cms-form').serialize();
        var createMode = $('.cms-module-form-page').data('create-mode');

        toggleSpinner(true);
        toggleFormButtons(false);

        // Minimum delay to avoid unpleasant blinking
        $.when($.post('./', formData), delay(createMode ? 100 : 500)).then(function (result) {
            var response = result[0];
            if (createMode && parseInt(response) > 0) {
                var url = _.rtrim(document.location.href, '/');
                if (url.endsWith('/create')) {
                    url = _.strLeftBack(url, '/');
                }
                document.location.href = url + '/' + response + '/';
            } else {
                $.growl.notice({title: '', message: "Cохранено"});
                toggleSpinner(false);
                toggleFormButtons(true);
            }
        });


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
    $(document).on('click', '.files-list .file .delete', function () {
        if (confirm('Sure?')) {
            var $file = $(this).closest('.file');
            var id = $file.data('id');
            var model = 'file';
            var payload = _.extend({}.setWithPath(['delete', model, id], 1), getCsrfTokenParameter());
            $.post('./', payload, 'json').done(function (result) {
                $file.fadeOut(function () {
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
                $.post('./', payload, 'json');
            },
        });

    });
    $('.files-list').each(function () {
        var sortable = Sortable.create($(this)[0], {
            animation: 200,
            handle: ".icon",
            scroll: true,
            onUpdate: function (/**Event*/evt) {
                var orderArray = sortable.toArray();
                var model = 'file';
                var payload = _.extend({save: {file: {}}}, getCsrfTokenParameter());
                for (var i in orderArray) {
                    payload['save']['file'][orderArray[i]] = {'show_order': parseInt(i) + 1};
                }
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
            clickable: $(this).find("button.dz-message")[0],
            uploadMultiple: isMultiple,
            addRemoveLinks: true,
            createImageThumbnails: false,
            acceptedFiles: $dropzone.data('type') == 'image' ? 'image/*' : null,
            success: function (file, response) {
                this.removeFile(file);
                if (!isMultiple) {
                    $dropzone.prev().empty();
                }
                for (var i in response) {
                    if ($dropzone.data('type') == 'image') {
                        if (!$('.images-list .image[data-id=' + response[i].image.id + ']').length) {
                            $dropzone.prev().append(templateImage.render(response[i]))
                        }
                    } else {
                        if (!$('.files-list .file[data-id=' + response[i].file.id + ']').length) {
                            $dropzone.prev().append(templateFile.render(response[i]))
                        }
                    }
                }
            },
            error: function (file, errorMessage, xhr) {
                this.removeFile(file);
                //todo: нормально обрабатывать и показывать ошибки
                $.growl.error({
                    title: 'Ошибка',
                    message: 'Не удается загрузить файл на сервер. Неверный формат или слишком большой размер.',
                    duration: 7000
                });
            }
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



