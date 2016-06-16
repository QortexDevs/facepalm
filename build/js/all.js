var FacepalmCMS = {

    defaultWysiwygSelector: 'textarea[data-wysiwyg]',
    wysiwygOptions: {},
    callbacks: {
        init: [],
        load: [],
    },

    init: function () {
        this.setWysiwygOptions({});
        this.callbacks.init.map(function(callback) {callback()})
    },

    setWysiwygOptions: function (options, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        this.wysiwygOptions[selector] = options;
    },

    getWysiwygOptions: function () {
        return this.wysiwygOptions;
    },

    onInit: function (callback) {
        this.callbacks.init.push(callback);
    }
};
function Auth() {

}

Auth.prototype = {
    init: function () {
        var _this = this;
        $('.login-form form').on('submit', function () {
            $.post($(this).attr('action'), $(this).serialize(), 'json').done(function (response) {
                if (response.user) {
                    document.location.href = '/cms/';
                } else {
                    _this.shake();
                    if (response.errors) {
                        for (var i in response.errors) {
                            $.growl.error({title: '', message: response.errors[i]});
                        }
                    }
                }
            }).error(function (response) {
                //todo: переделать вывод текста ошибки! Локализация!

                $.growl.error({title: '', message: 'Неверные логин или пароль'});
                _this.shake();
                //console.log(response.responseJSON);
            });
            return false;
        })

        return $('.login-form form').length == 0;
    },

    shake: function () {
        $('.login-form').addClass('shake');
        setTimeout(function () {
            $('.login-form').removeClass('shake');
        }, 1000);
    }
};

$(document).ready(function () {
    Dropzone.autoDiscover = false;

    FacepalmCMS.init();


    if ((new Auth()).init()) {
        if(document.querySelector('.user-icon')) {
            drop = new Drop({
                target: document.querySelector('.user-icon'),
                content: $('.user-dropdown-container').html(),
                position: 'bottom right',
                openOn: 'click'
            });
        }

        //load underscore.string
        var baseUrl = $('body').data('base-url');
        _.mixin(s.exports());

        InitWysiwyg();

        // Session keep-alive
        setInterval(function () {
            $.get('./', {'ping': 'ping'});
        }, 120000);


        if ($('.map.google[data-lat][data-lng]').length) {

            $.getScript("https://maps.googleapis.com/maps/api/js?libraries=places&sensor=false", function () {
                $('.map[data-lat][data-lng]').each(function () {
                    var objectLat = parseFloat($(this).data('lat')),
                        objectLng = parseFloat($(this).data('lng'));
                    var mapOptions = {
                        mapTypeControl: false,
                        streetViewControl: false,
                        scrollwheel: false,
                        zoom: 2,
                        center: new google.maps.LatLng(objectLat, objectLng)
                    };
                    if (objectLat && objectLng) {
                        mapOptions.zoom = 12;
                    }
                    var mapElement = $(this)[0];
                    var map = new google.maps.Map(mapElement, mapOptions);
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(objectLat, objectLng),
                        map: map
                    });

                    google.maps.event.addListener(map, "click", function (event) {
                        $(mapElement).closest('.lat-lng-container').find("[data-latlng-field=lat]").val(event.latLng.lat())
                        $(mapElement).closest('.lat-lng-container').find("[data-latlng-field=lng]").val(event.latLng.lng())
                        marker.setPosition(event.latLng);
                    });

                    // Create the search box and link it to the UI element.
                    var input = document.getElementById('pac-input');

                    $(input).on('keypress', function (e) {
                        if (e.which == 13) {
                            return false;
                        }
                    })

                    var searchBox = new google.maps.places.SearchBox(input);
                    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

                    map.addListener('bounds_changed', function () {
                        searchBox.setBounds(map.getBounds());
                    });

                    var markers = [];
                    searchBox.addListener('places_changed', function () {
                        var places = searchBox.getPlaces();
                        if (places.length) {
                            var bounds = new google.maps.LatLngBounds();
                            var place = places[0]
                            if (place.geometry.viewport) {
                                // Only geocodes have viewport.
                                bounds.union(place.geometry.viewport);
                            } else {
                                bounds.extend(place.geometry.location);
                            }
                            map.fitBounds(bounds);
                        }
                    });

                });
            });
        }


        $('.main-menu .left-panel:not(.collapsed), .main-menu .right-panel').mCustomScrollbar({
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
            var id = parseInt($(this).closest('[data-model]').data('tree-root'));
            var model = $(this).closest('[data-model]').data('model');
            var rnd = Math.random().toString(36).substring(2, 8);
            var payload = _.extend({}.setWithPath(['create', model, '%CREATE_' + rnd + '%', 'parent_id'], id), getCsrfTokenParameter());
            // console.log(payload);
            // payload['create'][model]['%CREATE_' + rnd + '%']['parent_id'] = 0
            // console.log(payload);
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
            var plain = $(this).data('plain') === 1;
            var treeName = 'tree_' + i;
            $(this).find((plain ? '>' : '') + 'ul').each(function () {
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

        $('.cms-module-list-content[data-sortable="true"] tbody').each(function (i) {
            var listName = 'list_' + i;
            var sortable = Sortable.create($(this)[0], {
                animation: 200,
                handle: ".column-id",
                scroll: true,
                group: listName,
                onUpdate: function (/**Event*/evt) {
                    onTreeSort(evt, sortable);
                },
            });
        });

        initDropZone();


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


function initDropZone() {
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
/**
 * Created by xpundel on 14.12.15.
 */

/**
 * @method setWithPath
 * Sets the nested property of object
 */
Object.defineProperty(Object.prototype, 'setWithPath', {
    value: function (path, value) { /* Makes breakfast, solves world peace, takes out trash */
        if (typeof  path == 'string') {
            path = path.split('.');
        }
        if (!(path instanceof Array)) {
            return;
        }
        var cur = this;
        var fields = path;
        fields.map(function (field, index) {
            cur[field] = cur[field] || (index == fields.length - 1 ? (value || {}) : {});
            cur = cur[field];
        });

        return this;
    },
    writable: false,
    configurable: false,
    enumerable: false
});

function delay(ms) {
    var d = $.Deferred();
    setTimeout(function () {
        d.resolve();
    }, ms);
    return d.promise();
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}
function InitWysiwyg() {
    var defaultOptions = {
        content_css: '/assets/facepalm/css/content.css',
        language: 'ru',
        menubar: false,
        statusbar: false,
        fixed_toolbar_container: true,
        style_formats: [
            {title: 'Обычный текст', block: 'p'},
            {title: 'Заголовок', block: 'h2'},
            {title: 'Подзаголовок', block: 'h3'},
            {title: 'Врезка', block: 'blockquote'},
            // { title: 'Table row 1', selector: 'tr', classes: 'tablerow1' }
        ],

        // extended_valid_elements: 'img[class=myclass|!src|border:0|alt|title|width|height|style]',
        // invalid_elements: 'strong,b,em,i',

        plugins: ['autoresize', 'codemirror', 'link', 'autolink', 'media', 'noneditable', 'paste', 'table', 'visualblocks'],
        toolbar: 'styleselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image table media | visualblocks code',

        images_upload_url: 'postAcceptor.php',
        images_upload_base_path: '/some/basepath',
        images_upload_credentials: true,
        image_caption: true,

        media_poster: false,
        media_dimensions: false,

        table_appearance_options: false,
        table_advtab: false,
        table_cell_advtab: false,
        table_row_advtab: false,
        table_default_attributes: {
            class: 'default-table'
        },
        table_class_list: [
            {title: 'Default', value: 'default-table'},
        ],

        setup: function (editor) {
            editor.on('change', function () {
                tinymce.triggerSave();
            });
        },

        codemirror: {
            indentOnInit: true,
            config: {
                styleActiveLine: false,
                theme: 'monokai'
            },
            cssFiles: [
                'theme/monokai.css'
            ]
        }
    };
    var options = FacepalmCMS.getWysiwygOptions();
    for (var selector in options) {
        if (options.hasOwnProperty(selector)) {
            var currentOptions = $.extend(defaultOptions, options[selector]);
            if (currentOptions.content_css_add) {
                if (typeof currentOptions.content_css == 'string') {
                    currentOptions.content_css = [currentOptions.content_css];
                }
                currentOptions.content_css = currentOptions.content_css.concat(currentOptions.content_css_add)
            }
            if (currentOptions.pluginsAdd) {
                currentOptions.plugins = currentOptions.plugins.concat(currentOptions.pluginsAdd);
            }
            if (currentOptions.toolbarAdd) {
                currentOptions.toolbar += currentOptions.toolbarAdd;
            }
            $(selector).tinymce(currentOptions);
        }
    }

}
/**
 * Created by xpundel on 04.04.16.
 */
$(document).ready(function () {
    if ($('tr[data-row-for-field="acl"]').length) {
        $('[data-row-for-field="role.name"] select').on('change', function () {
            if ($(this).val() == 1) {
                $('tr[data-row-for-field="acl"]').hide();
            } else {
                $('tr[data-row-for-field="acl"]').show();
            }
        }).trigger('change');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkZhY2VwYWxtQ01TLmpzIiwiYXV0aC5qcyIsIm1haW4uanMiLCJ1dGlsaXR5LmpzIiwid3lzaXd5Zy5qcyIsImV4dGVuZGVkL3VzZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIEZhY2VwYWxtQ01TID0ge1xuXG4gICAgZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjogJ3RleHRhcmVhW2RhdGEtd3lzaXd5Z10nLFxuICAgIHd5c2l3eWdPcHRpb25zOiB7fSxcbiAgICBjYWxsYmFja3M6IHtcbiAgICAgICAgaW5pdDogW10sXG4gICAgICAgIGxvYWQ6IFtdLFxuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2V0V3lzaXd5Z09wdGlvbnMoe30pO1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5pbml0Lm1hcChmdW5jdGlvbihjYWxsYmFjaykge2NhbGxiYWNrKCl9KVxuICAgIH0sXG5cbiAgICBzZXRXeXNpd3lnT3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbnMsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICB0aGlzLnd5c2l3eWdPcHRpb25zW3NlbGVjdG9yXSA9IG9wdGlvbnM7XG4gICAgfSxcblxuICAgIGdldFd5c2l3eWdPcHRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnd5c2l3eWdPcHRpb25zO1xuICAgIH0sXG5cbiAgICBvbkluaXQ6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcy5pbml0LnB1c2goY2FsbGJhY2spO1xuICAgIH1cbn07IiwiZnVuY3Rpb24gQXV0aCgpIHtcblxufVxuXG5BdXRoLnByb3RvdHlwZSA9IHtcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoJy5sb2dpbi1mb3JtIGZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5wb3N0KCQodGhpcykuYXR0cignYWN0aW9uJyksICQodGhpcykuc2VyaWFsaXplKCksICdqc29uJykuZG9uZShmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UudXNlcikge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gJy9jbXMvJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zaGFrZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHJlc3BvbnNlLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe3RpdGxlOiAnJywgbWVzc2FnZTogcmVzcG9uc2UuZXJyb3JzW2ldfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5lcnJvcihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAvL3RvZG86INC/0LXRgNC10LTQtdC70LDRgtGMINCy0YvQstC+0LQg0YLQtdC60YHRgtCwINC+0YjQuNCx0LrQuCEg0JvQvtC60LDQu9C40LfQsNGG0LjRjyFcblxuICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe3RpdGxlOiAnJywgbWVzc2FnZTogJ9Cd0LXQstC10YDQvdGL0LUg0LvQvtCz0LjQvSDQuNC70Lgg0L/QsNGA0L7Qu9GMJ30pO1xuICAgICAgICAgICAgICAgIF90aGlzLnNoYWtlKCk7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhyZXNwb25zZS5yZXNwb25zZUpTT04pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuICQoJy5sb2dpbi1mb3JtIGZvcm0nKS5sZW5ndGggPT0gMDtcbiAgICB9LFxuXG4gICAgc2hha2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCgnLmxvZ2luLWZvcm0nKS5hZGRDbGFzcygnc2hha2UnKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcubG9naW4tZm9ybScpLnJlbW92ZUNsYXNzKCdzaGFrZScpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG59OyIsIlxuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgIERyb3B6b25lLmF1dG9EaXNjb3ZlciA9IGZhbHNlO1xuXG4gICAgRmFjZXBhbG1DTVMuaW5pdCgpO1xuXG5cbiAgICBpZiAoKG5ldyBBdXRoKCkpLmluaXQoKSkge1xuICAgICAgICBpZihkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlci1pY29uJykpIHtcbiAgICAgICAgICAgIGRyb3AgPSBuZXcgRHJvcCh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlci1pY29uJyksXG4gICAgICAgICAgICAgICAgY29udGVudDogJCgnLnVzZXItZHJvcGRvd24tY29udGFpbmVyJykuaHRtbCgpLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYm90dG9tIHJpZ2h0JyxcbiAgICAgICAgICAgICAgICBvcGVuT246ICdjbGljaydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9sb2FkIHVuZGVyc2NvcmUuc3RyaW5nXG4gICAgICAgIHZhciBiYXNlVXJsID0gJCgnYm9keScpLmRhdGEoJ2Jhc2UtdXJsJyk7XG4gICAgICAgIF8ubWl4aW4ocy5leHBvcnRzKCkpO1xuXG4gICAgICAgIEluaXRXeXNpd3lnKCk7XG5cbiAgICAgICAgLy8gU2Vzc2lvbiBrZWVwLWFsaXZlXG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZ2V0KCcuLycsIHsncGluZyc6ICdwaW5nJ30pO1xuICAgICAgICB9LCAxMjAwMDApO1xuXG5cbiAgICAgICAgaWYgKCQoJy5tYXAuZ29vZ2xlW2RhdGEtbGF0XVtkYXRhLWxuZ10nKS5sZW5ndGgpIHtcblxuICAgICAgICAgICAgJC5nZXRTY3JpcHQoXCJodHRwczovL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanM/bGlicmFyaWVzPXBsYWNlcyZzZW5zb3I9ZmFsc2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQoJy5tYXBbZGF0YS1sYXRdW2RhdGEtbG5nXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0TGF0ID0gcGFyc2VGbG9hdCgkKHRoaXMpLmRhdGEoJ2xhdCcpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdExuZyA9IHBhcnNlRmxvYXQoJCh0aGlzKS5kYXRhKCdsbmcnKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwVHlwZUNvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWV0Vmlld0NvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvYmplY3RMYXQsIG9iamVjdExuZylcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdExhdCAmJiBvYmplY3RMbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcE9wdGlvbnMuem9vbSA9IDEyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBFbGVtZW50ID0gJCh0aGlzKVswXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobWFwRWxlbWVudCwgbWFwT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9iamVjdExhdCwgb2JqZWN0TG5nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQobWFwRWxlbWVudCkuY2xvc2VzdCgnLmxhdC1sbmctY29udGFpbmVyJykuZmluZChcIltkYXRhLWxhdGxuZy1maWVsZD1sYXRdXCIpLnZhbChldmVudC5sYXRMbmcubGF0KCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAkKG1hcEVsZW1lbnQpLmNsb3Nlc3QoJy5sYXQtbG5nLWNvbnRhaW5lcicpLmZpbmQoXCJbZGF0YS1sYXRsbmctZmllbGQ9bG5nXVwiKS52YWwoZXZlbnQubGF0TG5nLmxuZygpKVxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKGV2ZW50LmxhdExuZyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgc2VhcmNoIGJveCBhbmQgbGluayBpdCB0byB0aGUgVUkgZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhYy1pbnB1dCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm9uKCdrZXlwcmVzcycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS53aGljaCA9PSAxMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VhcmNoQm94ID0gbmV3IGdvb2dsZS5tYXBzLnBsYWNlcy5TZWFyY2hCb3goaW5wdXQpO1xuICAgICAgICAgICAgICAgICAgICBtYXAuY29udHJvbHNbZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uLlRPUF9MRUZUXS5wdXNoKGlucHV0KTtcblxuICAgICAgICAgICAgICAgICAgICBtYXAuYWRkTGlzdGVuZXIoJ2JvdW5kc19jaGFuZ2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoQm94LnNldEJvdW5kcyhtYXAuZ2V0Qm91bmRzKCkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbWFya2VycyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBzZWFyY2hCb3guYWRkTGlzdGVuZXIoJ3BsYWNlc19jaGFuZ2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBsYWNlcyA9IHNlYXJjaEJveC5nZXRQbGFjZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbGFjZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGxhY2UgPSBwbGFjZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxhY2UuZ2VvbWV0cnkudmlld3BvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25seSBnZW9jb2RlcyBoYXZlIHZpZXdwb3J0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3VuZHMudW5pb24ocGxhY2UuZ2VvbWV0cnkudmlld3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdW5kcy5leHRlbmQocGxhY2UuZ2VvbWV0cnkubG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAuZml0Qm91bmRzKGJvdW5kcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgJCgnLm1haW4tbWVudSAubGVmdC1wYW5lbDpub3QoLmNvbGxhcHNlZCksIC5tYWluLW1lbnUgLnJpZ2h0LXBhbmVsJykubUN1c3RvbVNjcm9sbGJhcih7XG4gICAgICAgICAgICB0aGVtZTogXCJsaWdodC0yXCIsXG4gICAgICAgICAgICBhdXRvRXhwYW5kU2Nyb2xsYmFyOiB0cnVlLFxuICAgICAgICAgICAgc2Nyb2xsSW5lcnRpYTogNDAwLFxuICAgICAgICAgICAgbW91c2VXaGVlbDoge1xuICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2tzOiB7XG4gICAgICAgICAgICAgICAgb25TY3JvbGw6IGZ1bmN0aW9uIChxLCBxMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNvbnRlbnQgc2Nyb2xsZWQuLi5cIiwgcSwgcTEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRvZG86INC/0YDQuNC6INC70LrQuNC60LUg0L/QviDQvNC10L3RjiAtINC30LDQv9C+0LzQuNC90LDRgtGMINCyINC70L7QutCw0Lst0YHRgtC+0YDQsNC00LbQtSDRgdC60YDQvtC70LvQotC+0L8sINC4INC/0L7RgtC+0Lwg0L/RgNC4INC40L3QuNGG0LjQsNC70LjQt9Cw0YbQuNC4IC0g0YHRgNCw0LfRgyDRgdC60YDQvtC70LvQuNGC0Ywg0L3QsCDQvdC10LPQvi5cbiAgICAgICAgICAgIC8vIHRvZG86INCf0YDQuCDQt9Cw0LPRgNGD0LfQutC1INGB0YLRgNCw0L3QuNGG0YsgLSDQvtCx0L3Rg9C70Y/RgtGMINGN0YLQviDQt9C90LDRh9C10L3QuNC1INCyINC70L7QutCw0LvRgdGC0L7RgNCw0LTQttC1XG4gICAgICAgICAgICAvLyB0b2RvOiDQtdGB0LvQuCDQtdGB0YLRjCDQstGL0LTQtdC70LXQvdC90YvQuSDQv9GD0L3QutGCLCDQsCDRgdC+0YXRgNCw0L3QtdC90L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjyDQvdC10YIsINGC0L4g0LLRi9GH0LjRgdC70Y/RgtGMINC10LPQviDQv9GA0LjQvNC10YDQvdC+INC4INGB0LXRgNC+0LvQu9C40YLRjCDRgtGD0LTQsFxuICAgICAgICAgICAgLy8gdG9kbzog0LAg0LLQvtC+0LHRidC1LCDQv9C10YDQtdC00LXQu9Cw0YLRjCDQstGB0LUg0L3QsCDQsNGP0LrRgSwg0YHRg9C60LBcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudCBidXR0b24uc3RhdHVzLCAuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLnN0YXR1cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciAkdHIgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLWlkXScpO1xuICAgICAgICAgICAgdmFyIGlkID0gJHRyLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF8uZXh0ZW5kKHt9LnNldFdpdGhQYXRoKFsndG9nZ2xlJywgbW9kZWwsIGlkLCAnc3RhdHVzJ10sIDEpLCBnZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICAkLnBvc3QoYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAkdHIudG9nZ2xlQ2xhc3MoJ2luYWN0aXZlJywgIXJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLmRlbGV0ZSwgLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50IGJ1dHRvbi5kZWxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlybSgnU3VyZT8nKSkge1xuICAgICAgICAgICAgICAgIHZhciAkdHIgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLWlkXScpO1xuICAgICAgICAgICAgICAgIHZhciBpZCA9ICR0ci5kYXRhKCdpZCcpO1xuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgnbW9kZWwnKTtcbiAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF8uZXh0ZW5kKHt9LnNldFdpdGhQYXRoKFsnZGVsZXRlJywgbW9kZWwsIGlkXSwgMSksIGdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgICAgICAkLnBvc3QoYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgJHRyLmZhZGVPdXQoJ2Zhc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uYWRkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5maW5kKCdzY3JpcHRbZGF0YS10ZW1wbGF0ZS1uYW1lPVwiZW1wdHktdHJlZS1lbGVtZW50XCJdJykuaHRtbCgpO1xuICAgICAgICAgICAgdmFyICR0ciA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtaWRdJyk7XG4gICAgICAgICAgICB2YXIgaWQgPSAkdHIuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgnbW9kZWwnKTtcbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe30uc2V0V2l0aFBhdGgoWydjcmVhdGUnLCBtb2RlbCwgJyVDUkVBVEVfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA4KSArICclJywgJ3BhcmVudF9pZCddLCBpZCksIGdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgICQucG9zdChiYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpLmRvbmUoZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdJdGVtJCA9ICQodGVtcGxhdGUucmVwbGFjZShuZXcgUmVnRXhwKCclQ1JFQVRFXyUnLCAnZycpLCByZXN1bHQpKS5hdHRyKCdkYXRhLWlkJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBuZXdJdGVtJC5maW5kKCcuaWQnKS50ZXh0KHJlc3VsdClcbiAgICAgICAgICAgICAgICAkdHIuZmluZCgnPnVsJykuYXBwZW5kKG5ld0l0ZW0kKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5hZGQtbmV3LXRyZWUtaXRlbScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZmluZCgnc2NyaXB0W2RhdGEtdGVtcGxhdGUtbmFtZT1cImVtcHR5LXRyZWUtZWxlbWVudFwiXScpLmh0bWwoKTtcbiAgICAgICAgICAgIHZhciAkdHIgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpO1xuICAgICAgICAgICAgdmFyIGlkID0gcGFyc2VJbnQoJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCd0cmVlLXJvb3QnKSk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgICAgICAgICB2YXIgcm5kID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDgpO1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7fS5zZXRXaXRoUGF0aChbJ2NyZWF0ZScsIG1vZGVsLCAnJUNSRUFURV8nICsgcm5kICsgJyUnLCAncGFyZW50X2lkJ10sIGlkKSwgZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocGF5bG9hZCk7XG4gICAgICAgICAgICAvLyBwYXlsb2FkWydjcmVhdGUnXVttb2RlbF1bJyVDUkVBVEVfJyArIHJuZCArICclJ11bJ3BhcmVudF9pZCddID0gMFxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocGF5bG9hZCk7XG4gICAgICAgICAgICAkLnBvc3QoYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3SXRlbSQgPSAkKHRlbXBsYXRlLnJlcGxhY2UobmV3IFJlZ0V4cCgnJUNSRUFURV8lJywgJ2cnKSwgcmVzdWx0KSkuYXR0cignZGF0YS1pZCcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgbmV3SXRlbSQuZmluZCgnLmlkJykudGV4dChyZXN1bHQpXG4gICAgICAgICAgICAgICAgJHRyLmZpbmQoJ3VsOmZpcnN0JykuYXBwZW5kKG5ld0l0ZW0kKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoJCgnLmNtcy1tb2R1bGUtZm9ybS1wYWdlJykuZGF0YSgnanVzdC1jcmVhdGVkJykpIHtcbiAgICAgICAgICAgICQuZ3Jvd2wubm90aWNlKHt0aXRsZTogJycsIG1lc3NhZ2U6IFwi0J7QsdGK0LXQutGCINGB0L7Qt9C00LDQvVwifSk7XG4gICAgICAgIH1cblxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmZvcm0tYnV0dG9ucyBidXR0b24uc2F2ZS1idXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZm9ybURhdGEgPSAkKCcubWFpbi1jbXMtZm9ybScpLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgICAgdmFyIGNyZWF0ZU1vZGUgPSAkKCcuY21zLW1vZHVsZS1mb3JtLXBhZ2UnKS5kYXRhKCdjcmVhdGUtbW9kZScpO1xuXG4gICAgICAgICAgICB0b2dnbGVTcGlubmVyKHRydWUpO1xuICAgICAgICAgICAgdG9nZ2xlRm9ybUJ1dHRvbnMoZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyBNaW5pbXVtIGRlbGF5IHRvIGF2b2lkIHVucGxlYXNhbnQgYmxpbmtpbmdcbiAgICAgICAgICAgICQud2hlbigkLnBvc3QoYmFzZVVybCArICcvJywgZm9ybURhdGEpLCBkZWxheShjcmVhdGVNb2RlID8gMTAwIDogNTAwKSkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgICAgIGlmIChjcmVhdGVNb2RlICYmIHBhcnNlSW50KHJlc3BvbnNlKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IF8ucnRyaW0oZG9jdW1lbnQubG9jYXRpb24uaHJlZiwgJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVybC5lbmRzV2l0aCgnL2NyZWF0ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSBfLnN0ckxlZnRCYWNrKHVybCwgJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gdXJsICsgJy8nICsgcmVzcG9uc2UgKyAnLyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5ub3RpY2Uoe3RpdGxlOiAnJywgbWVzc2FnZTogXCJD0L7RhdGA0LDQvdC10L3QvlwifSk7XG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZVNwaW5uZXIoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB0b2dnbGVGb3JtQnV0dG9ucyh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuYWRkLW5ldy1pdGVtJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9ICQodGhpcykuZGF0YSgnYmFzZS11cmwnKSArICcvY3JlYXRlLyc7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgJCgnLmRhdGVwaWNrZXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAkKHRoaXMpWzBdLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnZGFyay10aGVtZScsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWScsXG4gICAgICAgICAgICAgICAgZmlyc3REYXk6IDEsXG4gICAgICAgICAgICAgICAgc2hvd1RpbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGkxOG46IHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNNb250aDogJ9Cf0YDQtdC00YvQtNGD0YnQuNC5INC80LXRgdGP0YYnLFxuICAgICAgICAgICAgICAgICAgICBuZXh0TW9udGg6ICfQodC70LXQtNGD0Y7RidC40Lkg0LzQtdGB0Y/RhicsXG4gICAgICAgICAgICAgICAgICAgIG1vbnRoczogWyfQr9C90LLQsNGA0YwnLCAn0KTQtdCy0YDQsNC70YwnLCAn0JzQsNGA0YInLCAn0JDQv9GA0LXQu9GMJywgJ9Cc0LDQuScsICfQmNGO0L3RjCcsICfQmNGO0LvRjCcsICfQkNCy0LPRg9GB0YInLCAn0KHQtdC90YLRj9Cx0YDRjCcsICfQntC60YLRj9Cx0YDRjCcsICfQndC+0Y/QsdGA0YwnLCAn0JTQtdC60LDQsdGA0YwnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXM6IFsn0JLQvtGB0LrRgNC10YHQtdC90YzQtScsICfQn9C+0L3QtdC00LXQu9GM0L3QuNC6JywgJ9CS0YLQvtGA0L3QuNC6JywgJ9Ch0YDQtdC00LAnLCAn0KfQtdGC0LLQtdGA0LMnLCAn0J/Rj9GC0L3QuNGG0LAnLCAn0KHRg9Cx0LHQvtGC0LAnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXNTaG9ydDogWyfQktGBJywgJ9Cf0L0nLCAn0JLRgicsICfQodGAJywgJ9Cn0YInLCAn0J/RgicsICfQodCxJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaXMoJy5kYXRldGltZScpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWSBISDptbScsXG4gICAgICAgICAgICAgICAgICAgIHNob3dUaW1lOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzaG93U2Vjb25kczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHVzZTI0aG91cjogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwaWNrZXIgPSBuZXcgUGlrYWRheShvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5kYXRlcGlja2VyICsgLmNsZWFyLWRhdGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKHRoaXMpLnByZXYoKS52YWwoJycpO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdGVtcGxhdGVJbWFnZSA9IHR3aWcoe1xuICAgICAgICAgICAgZGF0YTogJCgnI2ltYWdlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0ZW1wbGF0ZUZpbGUgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNmaWxlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmltYWdlcy1saXN0IC5pbWFnZSAuZGVsZXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1N1cmU/JykpIHtcbiAgICAgICAgICAgICAgICB2YXIgJGltYWdlID0gJCh0aGlzKS5jbG9zZXN0KCcuaW1hZ2UnKTtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSAkaW1hZ2UuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSAnaW1hZ2UnO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe30uc2V0V2l0aFBhdGgoWydkZWxldGUnLCBtb2RlbCwgaWRdLCAxKSwgZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgICAgICAgICAgICAgICQucG9zdChiYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpLmRvbmUoZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAkaW1hZ2UuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuZmlsZXMtbGlzdCAuZmlsZSAuZGVsZXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1N1cmU/JykpIHtcbiAgICAgICAgICAgICAgICB2YXIgJGZpbGUgPSAkKHRoaXMpLmNsb3Nlc3QoJy5maWxlJyk7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gJGZpbGUuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSAnZmlsZSc7XG4gICAgICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7fS5zZXRXaXRoUGF0aChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpLCBnZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICAgICAgJC5wb3N0KGJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJykuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICRmaWxlLmZhZGVPdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuaW1hZ2VzLWxpc3QnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykuZmluZCgnLmltYWdlID4gYScpLmZhbmN5Ym94KHtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAxLFxuICAgICAgICAgICAgICAgIG9wZW5FZmZlY3Q6ICdlbGFzdGljJyxcbiAgICAgICAgICAgICAgICBoZWxwZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2tlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYmFja2dyb3VuZCc6ICdyZ2JhKDAsMCwwLDAuNSknXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZSgkKHRoaXMpWzBdLCB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiAyMDAsXG4gICAgICAgICAgICAgICAgc2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3JkZXJBcnJheSA9IHNvcnRhYmxlLnRvQXJyYXkoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gJ2ltYWdlJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7c2F2ZToge2ltYWdlOiB7fX19LCBnZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3JkZXJBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddWydpbWFnZSddW29yZGVyQXJyYXlbaV1dID0geydzaG93X29yZGVyJzogcGFyc2VJbnQoaSkgKyAxfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkLnBvc3QoYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5maWxlcy1saXN0JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoJCh0aGlzKVswXSwge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgIGhhbmRsZTogXCIuaWNvblwiLFxuICAgICAgICAgICAgICAgIHNjcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yZGVyQXJyYXkgPSBzb3J0YWJsZS50b0FycmF5KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9ICdmaWxlJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7c2F2ZToge2ZpbGU6IHt9fX0sIGdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcmRlckFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bJ2ZpbGUnXVtvcmRlckFycmF5W2ldXSA9IHsnc2hvd19vcmRlcic6IHBhcnNlSW50KGkpICsgMX07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJC5wb3N0KGJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBvblRyZWVTb3J0ID0gZnVuY3Rpb24gKGV2dCwgc29ydGFibGUpIHtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9ICQoZXZ0LnRhcmdldCkuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgnbW9kZWwnKTtcbiAgICAgICAgICAgIHZhciBwYXJlbnRJZCA9ICQoZXZ0LnRhcmdldCkuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgIHZhciBvcmRlckFycmF5ID0gc29ydGFibGUudG9BcnJheSgpLmZpbHRlcihmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwgPj0gMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF8uZXh0ZW5kKHtzYXZlOiB7fX0sIGdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF0gPSB7fTsgLy8gb2JqZWN0LCBub3QgYW4gYXJyYXkuIE90aGVyd2lzZSBpdCB3aWxsIGNyZWF0ZSAwLi5pZCBlbXB0eSBlbGVtZW50c1xuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcmRlckFycmF5KSB7XG4gICAgICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddW21vZGVsXVtvcmRlckFycmF5W2ldXSA9IHsnc2hvd19vcmRlcic6IHBhcnNlSW50KGkpICsgMSwgJ3BhcmVudF9pZCc6IHBhcmVudElkfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQucG9zdChiYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpO1xuICAgICAgICB9O1xuXG4gICAgICAgICQoJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCcpLmVhY2goZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHZhciBwbGFpbiA9ICQodGhpcykuZGF0YSgncGxhaW4nKSA9PT0gMTtcbiAgICAgICAgICAgIHZhciB0cmVlTmFtZSA9ICd0cmVlXycgKyBpO1xuICAgICAgICAgICAgJCh0aGlzKS5maW5kKChwbGFpbiA/ICc+JyA6ICcnKSArICd1bCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZSgkKHRoaXMpWzBdLCB7XG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgICAgICBoYW5kbGU6IFwiLmlkXCIsXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IHRyZWVOYW1lLFxuICAgICAgICAgICAgICAgICAgICBvbkFkZDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb25UcmVlU29ydChldnQsIHNvcnRhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAkKCcuY21zLW1vZHVsZS1saXN0LWNvbnRlbnRbZGF0YS1zb3J0YWJsZT1cInRydWVcIl0gdGJvZHknKS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgbGlzdE5hbWUgPSAnbGlzdF8nICsgaTtcbiAgICAgICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZSgkKHRoaXMpWzBdLCB7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiAyMDAsXG4gICAgICAgICAgICAgICAgaGFuZGxlOiBcIi5jb2x1bW4taWRcIixcbiAgICAgICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgZ3JvdXA6IGxpc3ROYW1lLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCkge1xuICAgICAgICAgICAgICAgICAgICBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5pdERyb3Bab25lKCk7XG5cblxuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiB0b2dnbGVTcGlubmVyKHNob3cpIHtcbiAgICAkKCcjc3Bpbm5lcicpLnRvZ2dsZUNsYXNzKCdzaG93Jywgc2hvdyk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZUZvcm1CdXR0b25zKGVuYWJsZSkge1xuICAgICQoJy5mb3JtLWJ1dHRvbnMgYnV0dG9uJykucHJvcCgnZGlzYWJsZWQnLCAhZW5hYmxlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkge1xuICAgIHJldHVybiB7J190b2tlbic6ICQoJ2lucHV0OmhpZGRlbltuYW1lPV90b2tlbl0nKS52YWwoKX07XG59XG5cblxuZnVuY3Rpb24gaW5pdERyb3Bab25lKCkge1xuICAgICQoXCIuZHJvcHpvbmVcIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkZHJvcHpvbmUgPSAkKHRoaXMpO1xuICAgICAgICB2YXIgaXNNdWx0aXBsZSA9ICRkcm9wem9uZS5kYXRhKCdtdWx0aXBsZScpID09IFwiMVwiO1xuICAgICAgICAkKHRoaXMpLmRyb3B6b25lKHtcbiAgICAgICAgICAgIHVybDogYmFzZVVybCArIFwiLz9fdG9rZW49XCIgKyAkKCdpbnB1dDpoaWRkZW5bbmFtZT1fdG9rZW5dJykudmFsKCkgKyAkZHJvcHpvbmUuZGF0YSgncGFyYW1ldGVycycpLFxuICAgICAgICAgICAgcGFyYW1OYW1lOiAkKHRoaXMpLmRhdGEoJ2lucHV0LW5hbWUnKSxcbiAgICAgICAgICAgIHBhcmFsbGVsVXBsb2FkczogMyxcbiAgICAgICAgICAgIG1heEZpbGVzOiBpc011bHRpcGxlID8gbnVsbCA6IDEsXG4gICAgICAgICAgICBjbGlja2FibGU6ICQodGhpcykuZmluZChcImJ1dHRvbi5kei1tZXNzYWdlXCIpWzBdLFxuICAgICAgICAgICAgdXBsb2FkTXVsdGlwbGU6IGlzTXVsdGlwbGUsXG4gICAgICAgICAgICBhZGRSZW1vdmVMaW5rczogdHJ1ZSxcbiAgICAgICAgICAgIGNyZWF0ZUltYWdlVGh1bWJuYWlsczogZmFsc2UsXG4gICAgICAgICAgICBhY2NlcHRlZEZpbGVzOiAkZHJvcHpvbmUuZGF0YSgndHlwZScpID09ICdpbWFnZScgPyAnaW1hZ2UvKicgOiBudWxsLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGZpbGUsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgIGlmICghaXNNdWx0aXBsZSkge1xuICAgICAgICAgICAgICAgICAgICAkZHJvcHpvbmUucHJldigpLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRkcm9wem9uZS5kYXRhKCd0eXBlJykgPT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkKCcuaW1hZ2VzLWxpc3QgLmltYWdlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmltYWdlLmlkICsgJ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZHJvcHpvbmUucHJldigpLmFwcGVuZCh0ZW1wbGF0ZUltYWdlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQoJy5maWxlcy1saXN0IC5maWxlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmZpbGUuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkcm9wem9uZS5wcmV2KCkuYXBwZW5kKHRlbXBsYXRlRmlsZS5yZW5kZXIocmVzcG9uc2VbaV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZmlsZSwgZXJyb3JNZXNzYWdlLCB4aHIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgLy90b2RvOiDQvdC+0YDQvNCw0LvRjNC90L4g0L7QsdGA0LDQsdCw0YLRi9Cy0LDRgtGMINC4INC/0L7QutCw0LfRi9Cy0LDRgtGMINC+0YjQuNCx0LrQuFxuICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ9Ce0YjQuNCx0LrQsCcsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfQndC1INGD0LTQsNC10YLRgdGPINC30LDQs9GA0YPQt9C40YLRjCDRhNCw0LnQuyDQvdCwINGB0LXRgNCy0LXRgC4g0J3QtdCy0LXRgNC90YvQuSDRhNC+0YDQvNCw0YIg0LjQu9C4INGB0LvQuNGI0LrQvtC8INCx0L7Qu9GM0YjQvtC5INGA0LDQt9C80LXRgC4nLFxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogNzAwMFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxufVxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMTQuMTIuMTUuXG4gKi9cblxuLyoqXG4gKiBAbWV0aG9kIHNldFdpdGhQYXRoXG4gKiBTZXRzIHRoZSBuZXN0ZWQgcHJvcGVydHkgb2Ygb2JqZWN0XG4gKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnc2V0V2l0aFBhdGgnLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkgeyAvKiBNYWtlcyBicmVha2Zhc3QsIHNvbHZlcyB3b3JsZCBwZWFjZSwgdGFrZXMgb3V0IHRyYXNoICovXG4gICAgICAgIGlmICh0eXBlb2YgIHBhdGggPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoLnNwbGl0KCcuJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjdXIgPSB0aGlzO1xuICAgICAgICB2YXIgZmllbGRzID0gcGF0aDtcbiAgICAgICAgZmllbGRzLm1hcChmdW5jdGlvbiAoZmllbGQsIGluZGV4KSB7XG4gICAgICAgICAgICBjdXJbZmllbGRdID0gY3VyW2ZpZWxkXSB8fCAoaW5kZXggPT0gZmllbGRzLmxlbmd0aCAtIDEgPyAodmFsdWUgfHwge30pIDoge30pO1xuICAgICAgICAgICAgY3VyID0gY3VyW2ZpZWxkXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxufSk7XG5cbmZ1bmN0aW9uIGRlbGF5KG1zKSB7XG4gICAgdmFyIGQgPSAkLkRlZmVycmVkKCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQucmVzb2x2ZSgpO1xuICAgIH0sIG1zKTtcbiAgICByZXR1cm4gZC5wcm9taXNlKCk7XG59XG5cbmlmICghU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCkge1xuICAgIFN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgIHZhciBzdWJqZWN0U3RyaW5nID0gdGhpcy50b1N0cmluZygpO1xuICAgICAgICBpZiAodHlwZW9mIHBvc2l0aW9uICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocG9zaXRpb24pIHx8IE1hdGguZmxvb3IocG9zaXRpb24pICE9PSBwb3NpdGlvbiB8fCBwb3NpdGlvbiA+IHN1YmplY3RTdHJpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHBvc2l0aW9uIC09IHNlYXJjaFN0cmluZy5sZW5ndGg7XG4gICAgICAgIHZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG4gICAgICAgIHJldHVybiBsYXN0SW5kZXggIT09IC0xICYmIGxhc3RJbmRleCA9PT0gcG9zaXRpb247XG4gICAgfTtcbn0iLCJmdW5jdGlvbiBJbml0V3lzaXd5ZygpIHtcbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgICAgIGNvbnRlbnRfY3NzOiAnL2Fzc2V0cy9mYWNlcGFsbS9jc3MvY29udGVudC5jc3MnLFxuICAgICAgICBsYW5ndWFnZTogJ3J1JyxcbiAgICAgICAgbWVudWJhcjogZmFsc2UsXG4gICAgICAgIHN0YXR1c2JhcjogZmFsc2UsXG4gICAgICAgIGZpeGVkX3Rvb2xiYXJfY29udGFpbmVyOiB0cnVlLFxuICAgICAgICBzdHlsZV9mb3JtYXRzOiBbXG4gICAgICAgICAgICB7dGl0bGU6ICfQntCx0YvRh9C90YvQuSDRgtC10LrRgdGCJywgYmxvY2s6ICdwJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQl9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gyJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQn9C+0LTQt9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gzJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQktGA0LXQt9C60LAnLCBibG9jazogJ2Jsb2NrcXVvdGUnfSxcbiAgICAgICAgICAgIC8vIHsgdGl0bGU6ICdUYWJsZSByb3cgMScsIHNlbGVjdG9yOiAndHInLCBjbGFzc2VzOiAndGFibGVyb3cxJyB9XG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gZXh0ZW5kZWRfdmFsaWRfZWxlbWVudHM6ICdpbWdbY2xhc3M9bXljbGFzc3whc3JjfGJvcmRlcjowfGFsdHx0aXRsZXx3aWR0aHxoZWlnaHR8c3R5bGVdJyxcbiAgICAgICAgLy8gaW52YWxpZF9lbGVtZW50czogJ3N0cm9uZyxiLGVtLGknLFxuXG4gICAgICAgIHBsdWdpbnM6IFsnYXV0b3Jlc2l6ZScsICdjb2RlbWlycm9yJywgJ2xpbmsnLCAnYXV0b2xpbmsnLCAnbWVkaWEnLCAnbm9uZWRpdGFibGUnLCAncGFzdGUnLCAndGFibGUnLCAndmlzdWFsYmxvY2tzJ10sXG4gICAgICAgIHRvb2xiYXI6ICdzdHlsZXNlbGVjdCB8IGJvbGQgaXRhbGljIHwgYWxpZ25sZWZ0IGFsaWduY2VudGVyIGFsaWducmlnaHQgfCBidWxsaXN0IG51bWxpc3Qgb3V0ZGVudCBpbmRlbnQgfCBsaW5rIGltYWdlIHRhYmxlIG1lZGlhIHwgdmlzdWFsYmxvY2tzIGNvZGUnLFxuXG4gICAgICAgIGltYWdlc191cGxvYWRfdXJsOiAncG9zdEFjY2VwdG9yLnBocCcsXG4gICAgICAgIGltYWdlc191cGxvYWRfYmFzZV9wYXRoOiAnL3NvbWUvYmFzZXBhdGgnLFxuICAgICAgICBpbWFnZXNfdXBsb2FkX2NyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICBpbWFnZV9jYXB0aW9uOiB0cnVlLFxuXG4gICAgICAgIG1lZGlhX3Bvc3RlcjogZmFsc2UsXG4gICAgICAgIG1lZGlhX2RpbWVuc2lvbnM6IGZhbHNlLFxuXG4gICAgICAgIHRhYmxlX2FwcGVhcmFuY2Vfb3B0aW9uczogZmFsc2UsXG4gICAgICAgIHRhYmxlX2FkdnRhYjogZmFsc2UsXG4gICAgICAgIHRhYmxlX2NlbGxfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfcm93X2FkdnRhYjogZmFsc2UsXG4gICAgICAgIHRhYmxlX2RlZmF1bHRfYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICdkZWZhdWx0LXRhYmxlJ1xuICAgICAgICB9LFxuICAgICAgICB0YWJsZV9jbGFzc19saXN0OiBbXG4gICAgICAgICAgICB7dGl0bGU6ICdEZWZhdWx0JywgdmFsdWU6ICdkZWZhdWx0LXRhYmxlJ30sXG4gICAgICAgIF0sXG5cbiAgICAgICAgc2V0dXA6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgIGVkaXRvci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNvZGVtaXJyb3I6IHtcbiAgICAgICAgICAgIGluZGVudE9uSW5pdDogdHJ1ZSxcbiAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICAgIHN0eWxlQWN0aXZlTGluZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGhlbWU6ICdtb25va2FpJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNzc0ZpbGVzOiBbXG4gICAgICAgICAgICAgICAgJ3RoZW1lL21vbm9rYWkuY3NzJ1xuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgb3B0aW9ucyA9IEZhY2VwYWxtQ01TLmdldFd5c2l3eWdPcHRpb25zKCk7XG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50T3B0aW9ucyA9ICQuZXh0ZW5kKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zW3NlbGVjdG9yXSk7XG4gICAgICAgICAgICBpZiAoY3VycmVudE9wdGlvbnMuY29udGVudF9jc3NfYWRkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50T3B0aW9ucy5jb250ZW50X2NzcyA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50T3B0aW9ucy5jb250ZW50X2NzcyA9IFtjdXJyZW50T3B0aW9ucy5jb250ZW50X2Nzc107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1cnJlbnRPcHRpb25zLmNvbnRlbnRfY3NzID0gY3VycmVudE9wdGlvbnMuY29udGVudF9jc3MuY29uY2F0KGN1cnJlbnRPcHRpb25zLmNvbnRlbnRfY3NzX2FkZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjdXJyZW50T3B0aW9ucy5wbHVnaW5zQWRkKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE9wdGlvbnMucGx1Z2lucyA9IGN1cnJlbnRPcHRpb25zLnBsdWdpbnMuY29uY2F0KGN1cnJlbnRPcHRpb25zLnBsdWdpbnNBZGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJlbnRPcHRpb25zLnRvb2xiYXJBZGQpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50T3B0aW9ucy50b29sYmFyICs9IGN1cnJlbnRPcHRpb25zLnRvb2xiYXJBZGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKHNlbGVjdG9yKS50aW55bWNlKGN1cnJlbnRPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgeHB1bmRlbCBvbiAwNC4wNC4xNi5cbiAqL1xuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5sZW5ndGgpIHtcbiAgICAgICAgJCgnW2RhdGEtcm93LWZvci1maWVsZD1cInJvbGUubmFtZVwiXSBzZWxlY3QnKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgPT0gMSkge1xuICAgICAgICAgICAgICAgICQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLmhpZGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCgndHJbZGF0YS1yb3ctZm9yLWZpZWxkPVwiYWNsXCJdJykuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICB9XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
