/**
 * Created by xpundel on 02.03.15.
 */

//= ../../../bower_components/jquery/dist/jquery.js
//= ../../../bower_components/underscore/underscore.js
//= ../../../bower_components/underscore.string/dist/underscore.string.js
//= ../../../bower_components/moment/moment.js
//= ../../../bower_components/pikaday-time/pikaday.js
//= ../../../bower_components/growl/javascripts/jquery.growl.js
//= ../../../bower_components/dropzone/dist/dropzone.js
//= ../../../bower_components/twig.js/twig.js
//= ../../../bower_components/Sortable/Sortable.js
//= ../../../bower_components/fancybox/source/jquery.fancybox.pack.js
//= ../../../bower_components/codemirror/lib/codemirror.js
//= ../../../bower_components/codemirror/mode/xml/xml.js
//= ../../../bower_components/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js
//= ../../../bower_components/tether/dist/js/tether.js
//= ../../../bower_components/tether-drop/dist/js/drop.js

//= ../nonBowerPackages/redactor/redactor/redactor.js
//= ../nonBowerPackages/redactor/langs/ru.js
//= ../nonBowerPackages/redactor/plugins/video.js
//= ../nonBowerPackages/redactor/plugins/fontcolor.js
//= ../nonBowerPackages/redactor/plugins/table.js
//= ../nonBowerPackages/redactor/plugins/fontsize.js
//= ../nonBowerPackages/redactor/plugins/fullscreen.js


$(document).ready(function () {

    if ((new Auth()).init()) {
        drop = new Drop({
            target: document.querySelector('.user-icon'),
            content: $('.user-dropdown-container').html(),
            position: 'bottom right',
            openOn: 'click'
        });

        //load underscore.string
        var baseUrl = $('body').data('base-url');
        _.mixin(s.exports());

        InitWysiwyg();

        // Session keep-alive
        setInterval(function () {
            $.get('./', {'ping': 'ping'});
        }, 120000);

        $('.main-menu .right-panel').mCustomScrollbar({
            theme: "light-2",
            autoExpandScrollbar: true,
            scrollInertia: 400,
            mouseWheel: {
                preventDefault: true
            },
            callbacks: {
                onScroll: function (q, q1) {
                    console.log("Content scrolled...", q, q1);
                }
            }
            // todo: прик лкике по меню - запоминать в локал-сторадже скроллТоп, и потом при инициализации - сразу скроллить на него.
            // todo: При загрузке страницы - обнулять это значение в локалсторадже
            // todo: если есть выделенный пункт, а сохраненного значения нет, то вычислять его примерно и сероллить туда
            // todo: а вообще, переделать все на аякс, сука
        });

        $(document).on('click', '.cms-module-list-content button.status, .cms-module-tree-content button.status', function () {
            var $tr = $(this).closest('[data-id]');
            var id = $tr.data('id');
            var model = $(this).closest('[data-model]').data('model');
            var payload = _.extend({}.setWithPath(['toggle', model, id, 'status'], 1), getCsrfTokenParameter());
            $.post(baseUrl + '/', payload, 'json').done(function (result) {
                $tr.toggleClass('inactive', !result);
            });
            return false;
        });
        $(document).on('click', '.cms-module-list-content button.delete, .cms-module-tree-content button.delete', function () {
            if (confirm('Sure?')) {
                var $tr = $(this).closest('[data-id]');
                var id = $tr.data('id');
                var model = $(this).closest('[data-model]').data('model');
                var payload = _.extend({}.setWithPath(['delete', model, id], 1), getCsrfTokenParameter());
                $.post(baseUrl + '/', payload, 'json').done(function (result) {
                    $tr.fadeOut('fast', function () {
                        $(this).remove()
                    });
                });
            }
            return false;
        });
        $(document).on('click', '.cms-module-tree-content button.add', function () {
            var template = $(this).closest('[data-model]').find('script[data-template-name="empty-tree-element"]').html();
            var $tr = $(this).closest('[data-id]');
            var id = $tr.data('id');
            var model = $(this).closest('[data-model]').data('model');
            var payload = _.extend({}.setWithPath(['create', model, '%CREATE_' + Math.random().toString(36).substring(2, 8) + '%', 'parent_id'], id), getCsrfTokenParameter());
            $.post(baseUrl + '/', payload, 'json').done(function (result) {
                var newItem$ = $(template.replace(new RegExp('%CREATE_%', 'g'), result)).attr('data-id', result);
                newItem$.find('.id').text(result)
                $tr.find('>ul').append(newItem$);
            });
            return false;
        });
        $(document).on('click', '.add-new-tree-item', function () {
            var template = $(this).closest('[data-model]').find('script[data-template-name="empty-tree-element"]').html();
            var $tr = $(this).closest('[data-model]');
            var id = 0;
            var model = $(this).closest('[data-model]').data('model');
            var rnd = Math.random().toString(36).substring(2, 8);
            var payload = _.extend({}.setWithPath(['create', model, '%CREATE_' + rnd + '%', 'parent_id'], id), getCsrfTokenParameter());
            payload['create'][model]['%CREATE_' + rnd + '%']['parent_id'] = 0
            $.post(baseUrl + '/', payload, 'json').done(function (result) {
                var newItem$ = $(template.replace(new RegExp('%CREATE_%', 'g'), result)).attr('data-id', result);
                newItem$.find('.id').text(result)
                $tr.find('ul:first').append(newItem$);
            });
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
            $.when($.post(baseUrl + '/', formData), delay(createMode ? 100 : 500)).then(function (result) {
                var response = result[0];
                if (createMode && parseInt(response) > 0) {
                    var url = _.rtrim(document.location.href, '/');
                    if (url.endsWith('/create')) {
                        url = _.strLeftBack(url, '/');
                    }
                    document.location.href = url + '/' + response + '/?justCreated=1';
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
                $.post(baseUrl + '/', payload, 'json').done(function (result) {
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
                $.post(baseUrl + '/', payload, 'json').done(function (result) {
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
                    $.post(baseUrl + '/', payload, 'json');
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
                    $.post(baseUrl + '/', payload, 'json');
                },
            });

        });

        var onTreeSort = function (evt, sortable) {
            var model = $(evt.target).closest('[data-model]').data('model');
            var parentId = $(evt.target).data('id');
            var orderArray = sortable.toArray().filter(function (el) {
                return el >= 0
            });
            var payload = _.extend({save: {}}, getCsrfTokenParameter());
            payload['save'][model] = {}; // object, not an array. Otherwise it will create 0..id empty elements
            for (var i in orderArray) {
                payload['save'][model][orderArray[i]] = {'show_order': parseInt(i) + 1, 'parent_id': parentId};
            }
            $.post(baseUrl + '/', payload, 'json');
        };

        $('.cms-module-tree-content').each(function (i) {
            var treeName = 'tree_' + i;
            console.log(treeName);
            $(this).find('ul').each(function () {
                var sortable = Sortable.create($(this)[0], {
                    animation: 200,
                    handle: ".id",
                    scroll: true,
                    group: treeName,
                    onAdd: function (/**Event*/evt) {
                        onTreeSort(evt, sortable);
                    },
                    onUpdate: function (/**Event*/evt) {
                        onTreeSort(evt, sortable);
                    },
                });
            });
        });


        $(".dropzone").each(function () {
            var $dropzone = $(this);
            var isMultiple = $dropzone.data('multiple') == "1";
            $(this).dropzone({
                url: baseUrl + "/?_token=" + $('input:hidden[name=_token]').val() + $dropzone.data('parameters'),
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
    }
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



