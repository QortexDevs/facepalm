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
        style_formats: [
            {title: 'Обычный текст', block: 'p'},
            {title: 'Заголовок', block: 'h2'},
            {title: 'Подзаголовок', block: 'h3'},
            {title: 'Врезка', block: 'blockquote'},
            // { title: 'Table row 1', selector: 'tr', classes: 'tablerow1' }
        ],

        // extended_valid_elements: 'img[class=myclass|!src|border:0|alt|title|width|height|style]',
        // invalid_elements: 'strong,b,em,i',

        plugins: ['fixedtoolbar', 'autoresize', 'codemirror', 'link', 'autolink', 'media', 'noneditable', 'paste', 'table', 'visualblocks'],
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
    var editorPromises = [];
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

            $(selector).each(function () {
                var d = $.Deferred();
                currentOptions.setup = function (editor) {
                    editor.on('change', function () {
                        tinymce.triggerSave();
                    });
                    editor.on('init', function () {
                        d.resolve();
                    });
                };

                $(this).tinymce(currentOptions);

                editorPromises.push(d.promise());
            });
        }
    }

    $.when.apply($, editorPromises).then(function () {
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkZhY2VwYWxtQ01TLmpzIiwiYXV0aC5qcyIsIm1haW4uanMiLCJ1dGlsaXR5LmpzIiwid3lzaXd5Zy5qcyIsImV4dGVuZGVkL3VzZXJzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBGYWNlcGFsbUNNUyA9IHtcblxuICAgIGRlZmF1bHRXeXNpd3lnU2VsZWN0b3I6ICd0ZXh0YXJlYVtkYXRhLXd5c2l3eWddJyxcbiAgICB3eXNpd3lnT3B0aW9uczoge30sXG4gICAgY2FsbGJhY2tzOiB7XG4gICAgICAgIGluaXQ6IFtdLFxuICAgICAgICBsb2FkOiBbXSxcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNldFd5c2l3eWdPcHRpb25zKHt9KTtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MuaW5pdC5tYXAoZnVuY3Rpb24oY2FsbGJhY2spIHtjYWxsYmFjaygpfSlcbiAgICB9LFxuXG4gICAgc2V0V3lzaXd5Z09wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgdGhpcy53eXNpd3lnT3B0aW9uc1tzZWxlY3Rvcl0gPSBvcHRpb25zO1xuICAgIH0sXG5cbiAgICBnZXRXeXNpd3lnT3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy53eXNpd3lnT3B0aW9ucztcbiAgICB9LFxuXG4gICAgb25Jbml0OiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MuaW5pdC5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG59OyIsImZ1bmN0aW9uIEF1dGgoKSB7XG5cbn1cblxuQXV0aC5wcm90b3R5cGUgPSB7XG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKCcubG9naW4tZm9ybSBmb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQucG9zdCgkKHRoaXMpLmF0dHIoJ2FjdGlvbicpLCAkKHRoaXMpLnNlcmlhbGl6ZSgpLCAnanNvbicpLmRvbmUoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9ICcvY21zLyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2hha2UoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmdyb3dsLmVycm9yKHt0aXRsZTogJycsIG1lc3NhZ2U6IHJlc3BvbnNlLmVycm9yc1tpXX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy90b2RvOiDQv9C10YDQtdC00LXQu9Cw0YLRjCDQstGL0LLQvtC0INGC0LXQutGB0YLQsCDQvtGI0LjQsdC60LghINCb0L7QutCw0LvQuNC30LDRhtC40Y8hXG5cbiAgICAgICAgICAgICAgICAkLmdyb3dsLmVycm9yKHt0aXRsZTogJycsIG1lc3NhZ2U6ICfQndC10LLQtdGA0L3Ri9C1INC70L7Qs9C40L0g0LjQu9C4INC/0LDRgNC+0LvRjCd9KTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zaGFrZSgpO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2UucmVzcG9uc2VKU09OKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiAkKCcubG9naW4tZm9ybSBmb3JtJykubGVuZ3RoID09IDA7XG4gICAgfSxcblxuICAgIHNoYWtlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoJy5sb2dpbi1mb3JtJykuYWRkQ2xhc3MoJ3NoYWtlJyk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmxvZ2luLWZvcm0nKS5yZW1vdmVDbGFzcygnc2hha2UnKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxufTsiLCJcbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICBEcm9wem9uZS5hdXRvRGlzY292ZXIgPSBmYWxzZTtcblxuICAgIEZhY2VwYWxtQ01TLmluaXQoKTtcblxuXG4gICAgaWYgKChuZXcgQXV0aCgpKS5pbml0KCkpIHtcbiAgICAgICAgaWYoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXItaWNvbicpKSB7XG4gICAgICAgICAgICBkcm9wID0gbmV3IERyb3Aoe1xuICAgICAgICAgICAgICAgIHRhcmdldDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXItaWNvbicpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICQoJy51c2VyLWRyb3Bkb3duLWNvbnRhaW5lcicpLmh0bWwoKSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbSByaWdodCcsXG4gICAgICAgICAgICAgICAgb3Blbk9uOiAnY2xpY2snXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vbG9hZCB1bmRlcnNjb3JlLnN0cmluZ1xuICAgICAgICB2YXIgYmFzZVVybCA9ICQoJ2JvZHknKS5kYXRhKCdiYXNlLXVybCcpO1xuICAgICAgICBfLm1peGluKHMuZXhwb3J0cygpKTtcblxuICAgICAgICBJbml0V3lzaXd5ZygpO1xuXG4gICAgICAgIC8vIFNlc3Npb24ga2VlcC1hbGl2ZVxuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmdldCgnLi8nLCB7J3BpbmcnOiAncGluZyd9KTtcbiAgICAgICAgfSwgMTIwMDAwKTtcblxuXG4gICAgICAgIGlmICgkKCcubWFwLmdvb2dsZVtkYXRhLWxhdF1bZGF0YS1sbmddJykubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgICQuZ2V0U2NyaXB0KFwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2xpYnJhcmllcz1wbGFjZXMmc2Vuc29yPWZhbHNlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKCcubWFwW2RhdGEtbGF0XVtkYXRhLWxuZ10nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdExhdCA9IHBhcnNlRmxvYXQoJCh0aGlzKS5kYXRhKCdsYXQnKSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RMbmcgPSBwYXJzZUZsb2F0KCQodGhpcykuZGF0YSgnbG5nJykpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWFwT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcFR5cGVDb250cm9sOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVldFZpZXdDb250cm9sOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbHdoZWVsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvb206IDIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXI6IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob2JqZWN0TGF0LCBvYmplY3RMbmcpXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3RMYXQgJiYgb2JqZWN0TG5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBPcHRpb25zLnpvb20gPSAxMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgbWFwRWxlbWVudCA9ICQodGhpcylbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKG1hcEVsZW1lbnQsIG1hcE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvYmplY3RMYXQsIG9iamVjdExuZyksXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXA6IG1hcFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKG1hcEVsZW1lbnQpLmNsb3Nlc3QoJy5sYXQtbG5nLWNvbnRhaW5lcicpLmZpbmQoXCJbZGF0YS1sYXRsbmctZmllbGQ9bGF0XVwiKS52YWwoZXZlbnQubGF0TG5nLmxhdCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgJChtYXBFbGVtZW50KS5jbG9zZXN0KCcubGF0LWxuZy1jb250YWluZXInKS5maW5kKFwiW2RhdGEtbGF0bG5nLWZpZWxkPWxuZ11cIikudmFsKGV2ZW50LmxhdExuZy5sbmcoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihldmVudC5sYXRMbmcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIHNlYXJjaCBib3ggYW5kIGxpbmsgaXQgdG8gdGhlIFVJIGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWMtaW5wdXQnKTtcblxuICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5vbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUud2hpY2ggPT0gMTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlYXJjaEJveCA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuU2VhcmNoQm94KGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmNvbnRyb2xzW2dvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbi5UT1BfTEVGVF0ucHVzaChpbnB1dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFwLmFkZExpc3RlbmVyKCdib3VuZHNfY2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEJveC5zZXRCb3VuZHMobWFwLmdldEJvdW5kcygpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmtlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoQm94LmFkZExpc3RlbmVyKCdwbGFjZXNfY2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwbGFjZXMgPSBzZWFyY2hCb3guZ2V0UGxhY2VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxhY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBib3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBsYWNlID0gcGxhY2VzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsYWNlLmdlb21ldHJ5LnZpZXdwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgZ2VvY29kZXMgaGF2ZSB2aWV3cG9ydC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzLnVuaW9uKHBsYWNlLmdlb21ldHJ5LnZpZXdwb3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3VuZHMuZXh0ZW5kKHBsYWNlLmdlb21ldHJ5LmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwLmZpdEJvdW5kcyhib3VuZHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgICQoJy5tYWluLW1lbnUgLmxlZnQtcGFuZWw6bm90KC5jb2xsYXBzZWQpLCAubWFpbi1tZW51IC5yaWdodC1wYW5lbCcpLm1DdXN0b21TY3JvbGxiYXIoe1xuICAgICAgICAgICAgdGhlbWU6IFwibGlnaHQtMlwiLFxuICAgICAgICAgICAgYXV0b0V4cGFuZFNjcm9sbGJhcjogdHJ1ZSxcbiAgICAgICAgICAgIHNjcm9sbEluZXJ0aWE6IDQwMCxcbiAgICAgICAgICAgIG1vdXNlV2hlZWw6IHtcbiAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrczoge1xuICAgICAgICAgICAgICAgIG9uU2Nyb2xsOiBmdW5jdGlvbiAocSwgcTEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJDb250ZW50IHNjcm9sbGVkLi4uXCIsIHEsIHExKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0b2RvOiDQv9GA0LjQuiDQu9C60LjQutC1INC/0L4g0LzQtdC90Y4gLSDQt9Cw0L/QvtC80LjQvdCw0YLRjCDQsiDQu9C+0LrQsNC7LdGB0YLQvtGA0LDQtNC20LUg0YHQutGA0L7Qu9C70KLQvtC/LCDQuCDQv9C+0YLQvtC8INC/0YDQuCDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuCAtINGB0YDQsNC30YMg0YHQutGA0L7Qu9C70LjRgtGMINC90LAg0L3QtdCz0L4uXG4gICAgICAgICAgICAvLyB0b2RvOiDQn9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDRgdGC0YDQsNC90LjRhtGLIC0g0L7QsdC90YPQu9GP0YLRjCDRjdGC0L4g0LfQvdCw0YfQtdC90LjQtSDQsiDQu9C+0LrQsNC70YHRgtC+0YDQsNC00LbQtVxuICAgICAgICAgICAgLy8gdG9kbzog0LXRgdC70Lgg0LXRgdGC0Ywg0LLRi9C00LXQu9C10L3QvdGL0Lkg0L/Rg9C90LrRgiwg0LAg0YHQvtGF0YDQsNC90LXQvdC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8g0L3QtdGCLCDRgtC+INCy0YvRh9C40YHQu9GP0YLRjCDQtdCz0L4g0L/RgNC40LzQtdGA0L3QviDQuCDRgdC10YDQvtC70LvQuNGC0Ywg0YLRg9C00LBcbiAgICAgICAgICAgIC8vIHRvZG86INCwINCy0L7QvtCx0YnQtSwg0L/QtdGA0LXQtNC10LvQsNGC0Ywg0LLRgdC1INC90LAg0LDRj9C60YEsINGB0YPQutCwXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLnN0YXR1cywgLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50IGJ1dHRvbi5zdGF0dXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgJHRyID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1pZF0nKTtcbiAgICAgICAgICAgIHZhciBpZCA9ICR0ci5kYXRhKCdpZCcpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCdtb2RlbCcpO1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7fS5zZXRXaXRoUGF0aChbJ3RvZ2dsZScsIG1vZGVsLCBpZCwgJ3N0YXR1cyddLCAxKSwgZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgICAgICAgICAgJC5wb3N0KGJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJykuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgJHRyLnRvZ2dsZUNsYXNzKCdpbmFjdGl2ZScsICFyZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNtcy1tb2R1bGUtbGlzdC1jb250ZW50IGJ1dHRvbi5kZWxldGUsIC5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uZGVsZXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1N1cmU/JykpIHtcbiAgICAgICAgICAgICAgICB2YXIgJHRyID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1pZF0nKTtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSAkdHIuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7fS5zZXRXaXRoUGF0aChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpLCBnZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICAgICAgJC5wb3N0KGJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJykuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICR0ci5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLmFkZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZmluZCgnc2NyaXB0W2RhdGEtdGVtcGxhdGUtbmFtZT1cImVtcHR5LXRyZWUtZWxlbWVudFwiXScpLmh0bWwoKTtcbiAgICAgICAgICAgIHZhciAkdHIgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLWlkXScpO1xuICAgICAgICAgICAgdmFyIGlkID0gJHRyLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF8uZXh0ZW5kKHt9LnNldFdpdGhQYXRoKFsnY3JlYXRlJywgbW9kZWwsICclQ1JFQVRFXycgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgOCkgKyAnJScsICdwYXJlbnRfaWQnXSwgaWQpLCBnZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICAkLnBvc3QoYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3SXRlbSQgPSAkKHRlbXBsYXRlLnJlcGxhY2UobmV3IFJlZ0V4cCgnJUNSRUFURV8lJywgJ2cnKSwgcmVzdWx0KSkuYXR0cignZGF0YS1pZCcsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgbmV3SXRlbSQuZmluZCgnLmlkJykudGV4dChyZXN1bHQpXG4gICAgICAgICAgICAgICAgJHRyLmZpbmQoJz51bCcpLmFwcGVuZChuZXdJdGVtJCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuYWRkLW5ldy10cmVlLWl0ZW0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmZpbmQoJ3NjcmlwdFtkYXRhLXRlbXBsYXRlLW5hbWU9XCJlbXB0eS10cmVlLWVsZW1lbnRcIl0nKS5odG1sKCk7XG4gICAgICAgICAgICB2YXIgJHRyID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKTtcbiAgICAgICAgICAgIHZhciBpZCA9IHBhcnNlSW50KCQodGhpcykuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgndHJlZS1yb290JykpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCdtb2RlbCcpO1xuICAgICAgICAgICAgdmFyIHJuZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA4KTtcbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe30uc2V0V2l0aFBhdGgoWydjcmVhdGUnLCBtb2RlbCwgJyVDUkVBVEVfJyArIHJuZCArICclJywgJ3BhcmVudF9pZCddLCBpZCksIGdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHBheWxvYWQpO1xuICAgICAgICAgICAgLy8gcGF5bG9hZFsnY3JlYXRlJ11bbW9kZWxdWyclQ1JFQVRFXycgKyBybmQgKyAnJSddWydwYXJlbnRfaWQnXSA9IDBcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHBheWxvYWQpO1xuICAgICAgICAgICAgJC5wb3N0KGJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJykuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0l0ZW0kID0gJCh0ZW1wbGF0ZS5yZXBsYWNlKG5ldyBSZWdFeHAoJyVDUkVBVEVfJScsICdnJyksIHJlc3VsdCkpLmF0dHIoJ2RhdGEtaWQnLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIG5ld0l0ZW0kLmZpbmQoJy5pZCcpLnRleHQocmVzdWx0KVxuICAgICAgICAgICAgICAgICR0ci5maW5kKCd1bDpmaXJzdCcpLmFwcGVuZChuZXdJdGVtJCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCQoJy5jbXMtbW9kdWxlLWZvcm0tcGFnZScpLmRhdGEoJ2p1c3QtY3JlYXRlZCcpKSB7XG4gICAgICAgICAgICAkLmdyb3dsLm5vdGljZSh7dGl0bGU6ICcnLCBtZXNzYWdlOiBcItCe0LHRitC10LrRgiDRgdC+0LfQtNCw0L1cIn0pO1xuICAgICAgICB9XG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5mb3JtLWJ1dHRvbnMgYnV0dG9uLnNhdmUtYnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZvcm1EYXRhID0gJCgnLm1haW4tY21zLWZvcm0nKS5zZXJpYWxpemUoKTtcbiAgICAgICAgICAgIHZhciBjcmVhdGVNb2RlID0gJCgnLmNtcy1tb2R1bGUtZm9ybS1wYWdlJykuZGF0YSgnY3JlYXRlLW1vZGUnKTtcblxuICAgICAgICAgICAgdG9nZ2xlU3Bpbm5lcih0cnVlKTtcbiAgICAgICAgICAgIHRvZ2dsZUZvcm1CdXR0b25zKGZhbHNlKTtcblxuICAgICAgICAgICAgLy8gTWluaW11bSBkZWxheSB0byBhdm9pZCB1bnBsZWFzYW50IGJsaW5raW5nXG4gICAgICAgICAgICAkLndoZW4oJC5wb3N0KGJhc2VVcmwgKyAnLycsIGZvcm1EYXRhKSwgZGVsYXkoY3JlYXRlTW9kZSA/IDEwMCA6IDUwMCkpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHJlc3VsdFswXTtcbiAgICAgICAgICAgICAgICBpZiAoY3JlYXRlTW9kZSAmJiBwYXJzZUludChyZXNwb25zZSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBfLnJ0cmltKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsICcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmwuZW5kc1dpdGgoJy9jcmVhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gXy5zdHJMZWZ0QmFjayh1cmwsICcvJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHVybCArICcvJyArIHJlc3BvbnNlICsgJy8nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wubm90aWNlKHt0aXRsZTogJycsIG1lc3NhZ2U6IFwiQ9C+0YXRgNCw0L3QtdC90L5cIn0pO1xuICAgICAgICAgICAgICAgICAgICB0b2dnbGVTcGlubmVyKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRm9ybUJ1dHRvbnModHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmFkZC1uZXctaXRlbScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSAkKHRoaXMpLmRhdGEoJ2Jhc2UtdXJsJykgKyAnL2NyZWF0ZS8nO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgICQoJy5kYXRlcGlja2VyJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJCh0aGlzKVswXSxcbiAgICAgICAgICAgICAgICB0aGVtZTogJ2RhcmstdGhlbWUnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ0RELk1NLllZWVknLFxuICAgICAgICAgICAgICAgIGZpcnN0RGF5OiAxLFxuICAgICAgICAgICAgICAgIHNob3dUaW1lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpMThuOiB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzTW9udGg6ICfQn9GA0LXQtNGL0LTRg9GJ0LjQuSDQvNC10YHRj9GGJyxcbiAgICAgICAgICAgICAgICAgICAgbmV4dE1vbnRoOiAn0KHQu9C10LTRg9GO0YnQuNC5INC80LXRgdGP0YYnLFxuICAgICAgICAgICAgICAgICAgICBtb250aHM6IFsn0K/QvdCy0LDRgNGMJywgJ9Ck0LXQstGA0LDQu9GMJywgJ9Cc0LDRgNGCJywgJ9CQ0L/RgNC10LvRjCcsICfQnNCw0LknLCAn0JjRjtC90YwnLCAn0JjRjtC70YwnLCAn0JDQstCz0YPRgdGCJywgJ9Ch0LXQvdGC0Y/QsdGA0YwnLCAn0J7QutGC0Y/QsdGA0YwnLCAn0J3QvtGP0LHRgNGMJywgJ9CU0LXQutCw0LHRgNGMJ10sXG4gICAgICAgICAgICAgICAgICAgIHdlZWtkYXlzOiBbJ9CS0L7RgdC60YDQtdGB0LXQvdGM0LUnLCAn0J/QvtC90LXQtNC10LvRjNC90LjQuicsICfQktGC0L7RgNC90LjQuicsICfQodGA0LXQtNCwJywgJ9Cn0LXRgtCy0LXRgNCzJywgJ9Cf0Y/RgtC90LjRhtCwJywgJ9Ch0YPQsdCx0L7RgtCwJ10sXG4gICAgICAgICAgICAgICAgICAgIHdlZWtkYXlzU2hvcnQ6IFsn0JLRgScsICfQn9C9JywgJ9CS0YInLCAn0KHRgCcsICfQp9GCJywgJ9Cf0YInLCAn0KHQsSddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCcuZGF0ZXRpbWUnKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZChvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdDogJ0RELk1NLllZWVkgSEg6bW0nLFxuICAgICAgICAgICAgICAgICAgICBzaG93VGltZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc2hvd1NlY29uZHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB1c2UyNGhvdXI6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcGlja2VyID0gbmV3IFBpa2FkYXkob3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuZGF0ZXBpY2tlciArIC5jbGVhci1kYXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkudmFsKCcnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlSW1hZ2UgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNpbWFnZS1wcmV2aWV3LXRlbXBsYXRlJykuaHRtbCgpXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGVtcGxhdGVGaWxlID0gdHdpZyh7XG4gICAgICAgICAgICBkYXRhOiAkKCcjZmlsZS1wcmV2aWV3LXRlbXBsYXRlJykuaHRtbCgpXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5pbWFnZXMtbGlzdCAuaW1hZ2UgLmRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdTdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgdmFyICRpbWFnZSA9ICQodGhpcykuY2xvc2VzdCgnLmltYWdlJyk7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gJGltYWdlLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gJ2ltYWdlJztcbiAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF8uZXh0ZW5kKHt9LnNldFdpdGhQYXRoKFsnZGVsZXRlJywgbW9kZWwsIGlkXSwgMSksIGdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgICAgICAkLnBvc3QoYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgJGltYWdlLmZhZGVPdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmZpbGVzLWxpc3QgLmZpbGUgLmRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdTdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgdmFyICRmaWxlID0gJCh0aGlzKS5jbG9zZXN0KCcuZmlsZScpO1xuICAgICAgICAgICAgICAgIHZhciBpZCA9ICRmaWxlLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gJ2ZpbGUnO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe30uc2V0V2l0aFBhdGgoWydkZWxldGUnLCBtb2RlbCwgaWRdLCAxKSwgZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgICAgICAgICAgICAgICQucG9zdChiYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpLmRvbmUoZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAkZmlsZS5mYWRlT3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJCgnLmltYWdlcy1saXN0JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKHRoaXMpLmZpbmQoJy5pbWFnZSA+IGEnKS5mYW5jeWJveCh7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMSxcbiAgICAgICAgICAgICAgICBvcGVuRWZmZWN0OiAnZWxhc3RpYycsXG4gICAgICAgICAgICAgICAgaGVscGVyczoge1xuICAgICAgICAgICAgICAgICAgICBvdmVybGF5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiAncmdiYSgwLDAsMCwwLjUpJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoJCh0aGlzKVswXSwge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgIHNjcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yZGVyQXJyYXkgPSBzb3J0YWJsZS50b0FycmF5KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9ICdpbWFnZSc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe3NhdmU6IHtpbWFnZToge319fSwgZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIG9yZGVyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVsnaW1hZ2UnXVtvcmRlckFycmF5W2ldXSA9IHsnc2hvd19vcmRlcic6IHBhcnNlSW50KGkpICsgMX07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJC5wb3N0KGJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuZmlsZXMtbGlzdCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNvcnRhYmxlID0gU29ydGFibGUuY3JlYXRlKCQodGhpcylbMF0sIHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb246IDIwMCxcbiAgICAgICAgICAgICAgICBoYW5kbGU6IFwiLmljb25cIixcbiAgICAgICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvcmRlckFycmF5ID0gc29ydGFibGUudG9BcnJheSgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSAnZmlsZSc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe3NhdmU6IHtmaWxlOiB7fX19LCBnZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3JkZXJBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddWydmaWxlJ11bb3JkZXJBcnJheVtpXV0gPSB7J3Nob3dfb3JkZXInOiBwYXJzZUludChpKSArIDF9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICQucG9zdChiYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgb25UcmVlU29ydCA9IGZ1bmN0aW9uIChldnQsIHNvcnRhYmxlKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSAkKGV2dC50YXJnZXQpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgICAgICAgICB2YXIgcGFyZW50SWQgPSAkKGV2dC50YXJnZXQpLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICB2YXIgb3JkZXJBcnJheSA9IHNvcnRhYmxlLnRvQXJyYXkoKS5maWx0ZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsID49IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7c2F2ZToge319LCBnZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bbW9kZWxdID0ge307IC8vIG9iamVjdCwgbm90IGFuIGFycmF5LiBPdGhlcndpc2UgaXQgd2lsbCBjcmVhdGUgMC4uaWQgZW1wdHkgZWxlbWVudHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3JkZXJBcnJheSkge1xuICAgICAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF1bb3JkZXJBcnJheVtpXV0gPSB7J3Nob3dfb3JkZXInOiBwYXJzZUludChpKSArIDEsICdwYXJlbnRfaWQnOiBwYXJlbnRJZH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkLnBvc3QoYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKTtcbiAgICAgICAgfTtcblxuICAgICAgICAkKCcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQnKS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgcGxhaW4gPSAkKHRoaXMpLmRhdGEoJ3BsYWluJykgPT09IDE7XG4gICAgICAgICAgICB2YXIgdHJlZU5hbWUgPSAndHJlZV8nICsgaTtcbiAgICAgICAgICAgICQodGhpcykuZmluZCgocGxhaW4gPyAnPicgOiAnJykgKyAndWwnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoJCh0aGlzKVswXSwge1xuICAgICAgICAgICAgICAgICAgICBhbmltYXRpb246IDIwMCxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlOiBcIi5pZFwiLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiB0cmVlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgb25BZGQ6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCgnLmNtcy1tb2R1bGUtbGlzdC1jb250ZW50W2RhdGEtc29ydGFibGU9XCJ0cnVlXCJdIHRib2R5JykuZWFjaChmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgdmFyIGxpc3ROYW1lID0gJ2xpc3RfJyArIGk7XG4gICAgICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoJCh0aGlzKVswXSwge1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgIGhhbmRsZTogXCIuY29sdW1uLWlkXCIsXG4gICAgICAgICAgICAgICAgc2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgIGdyb3VwOiBsaXN0TmFtZSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25UcmVlU29ydChldnQsIHNvcnRhYmxlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoXCIuZHJvcHpvbmVcIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgJGRyb3B6b25lID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpc011bHRpcGxlID0gJGRyb3B6b25lLmRhdGEoJ211bHRpcGxlJykgPT0gXCIxXCI7XG4gICAgICAgICAgICAkKHRoaXMpLmRyb3B6b25lKHtcbiAgICAgICAgICAgICAgICB1cmw6IGJhc2VVcmwgKyBcIi8/X3Rva2VuPVwiICsgJCgnaW5wdXQ6aGlkZGVuW25hbWU9X3Rva2VuXScpLnZhbCgpICsgJGRyb3B6b25lLmRhdGEoJ3BhcmFtZXRlcnMnKSxcbiAgICAgICAgICAgICAgICBwYXJhbU5hbWU6ICQodGhpcykuZGF0YSgnaW5wdXQtbmFtZScpLFxuICAgICAgICAgICAgICAgIHBhcmFsbGVsVXBsb2FkczogMyxcbiAgICAgICAgICAgICAgICBtYXhGaWxlczogaXNNdWx0aXBsZSA/IG51bGwgOiAxLFxuICAgICAgICAgICAgICAgIGNsaWNrYWJsZTogJCh0aGlzKS5maW5kKFwiYnV0dG9uLmR6LW1lc3NhZ2VcIilbMF0sXG4gICAgICAgICAgICAgICAgdXBsb2FkTXVsdGlwbGU6IGlzTXVsdGlwbGUsXG4gICAgICAgICAgICAgICAgYWRkUmVtb3ZlTGlua3M6IHRydWUsXG4gICAgICAgICAgICAgICAgY3JlYXRlSW1hZ2VUaHVtYm5haWxzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBhY2NlcHRlZEZpbGVzOiAkZHJvcHpvbmUuZGF0YSgndHlwZScpID09ICdpbWFnZScgPyAnaW1hZ2UvKicgOiBudWxsLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChmaWxlLCByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNNdWx0aXBsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRyb3B6b25lLnByZXYoKS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkZHJvcHpvbmUuZGF0YSgndHlwZScpID09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQoJy5pbWFnZXMtbGlzdCAuaW1hZ2VbZGF0YS1pZD0nICsgcmVzcG9uc2VbaV0uaW1hZ2UuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZHJvcHpvbmUucHJldigpLmFwcGVuZCh0ZW1wbGF0ZUltYWdlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISQoJy5maWxlcy1saXN0IC5maWxlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmZpbGUuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZHJvcHpvbmUucHJldigpLmFwcGVuZCh0ZW1wbGF0ZUZpbGUucmVuZGVyKHJlc3BvbnNlW2ldKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZmlsZSwgZXJyb3JNZXNzYWdlLCB4aHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAvL3RvZG86INC90L7RgNC80LDQu9GM0L3QviDQvtCx0YDQsNCx0LDRgtGL0LLQsNGC0Ywg0Lgg0L/QvtC60LDQt9GL0LLQsNGC0Ywg0L7RiNC40LHQutC4XG4gICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQntGI0LjQsdC60LAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ9Cd0LUg0YPQtNCw0LXRgtGB0Y8g0LfQsNCz0YDRg9C30LjRgtGMINGE0LDQudC7INC90LAg0YHQtdGA0LLQtdGALiDQndC10LLQtdGA0L3Ri9C5INGE0L7RgNC80LDRgiDQuNC70Lgg0YHQu9C40YjQutC+0Lwg0LHQvtC70YzRiNC+0Lkg0YDQsNC30LzQtdGALicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogNzAwMFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcblxuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiB0b2dnbGVTcGlubmVyKHNob3cpIHtcbiAgICAkKCcjc3Bpbm5lcicpLnRvZ2dsZUNsYXNzKCdzaG93Jywgc2hvdyk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZUZvcm1CdXR0b25zKGVuYWJsZSkge1xuICAgICQoJy5mb3JtLWJ1dHRvbnMgYnV0dG9uJykucHJvcCgnZGlzYWJsZWQnLCAhZW5hYmxlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkge1xuICAgIHJldHVybiB7J190b2tlbic6ICQoJ2lucHV0OmhpZGRlbltuYW1lPV90b2tlbl0nKS52YWwoKX07XG59XG5cbiIsIi8qKlxuICogQ3JlYXRlZCBieSB4cHVuZGVsIG9uIDE0LjEyLjE1LlxuICovXG5cbi8qKlxuICogQG1ldGhvZCBzZXRXaXRoUGF0aFxuICogU2V0cyB0aGUgbmVzdGVkIHByb3BlcnR5IG9mIG9iamVjdFxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ3NldFdpdGhQYXRoJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUpIHsgLyogTWFrZXMgYnJlYWtmYXN0LCBzb2x2ZXMgd29ybGQgcGVhY2UsIHRha2VzIG91dCB0cmFzaCAqL1xuICAgICAgICBpZiAodHlwZW9mICBwYXRoID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBwYXRoID0gcGF0aC5zcGxpdCgnLicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKHBhdGggaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY3VyID0gdGhpcztcbiAgICAgICAgdmFyIGZpZWxkcyA9IHBhdGg7XG4gICAgICAgIGZpZWxkcy5tYXAoZnVuY3Rpb24gKGZpZWxkLCBpbmRleCkge1xuICAgICAgICAgICAgY3VyW2ZpZWxkXSA9IGN1cltmaWVsZF0gfHwgKGluZGV4ID09IGZpZWxkcy5sZW5ndGggLSAxID8gKHZhbHVlIHx8IHt9KSA6IHt9KTtcbiAgICAgICAgICAgIGN1ciA9IGN1cltmaWVsZF07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgd3JpdGFibGU6IGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2Vcbn0pO1xuXG5mdW5jdGlvbiBkZWxheShtcykge1xuICAgIHZhciBkID0gJC5EZWZlcnJlZCgpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkLnJlc29sdmUoKTtcbiAgICB9LCBtcyk7XG4gICAgcmV0dXJuIGQucHJvbWlzZSgpO1xufVxuXG5pZiAoIVN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGgpIHtcbiAgICBTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgc3ViamVjdFN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBwb3NpdGlvbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHBvc2l0aW9uKSB8fCBNYXRoLmZsb29yKHBvc2l0aW9uKSAhPT0gcG9zaXRpb24gfHwgcG9zaXRpb24gPiBzdWJqZWN0U3RyaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBzdWJqZWN0U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBwb3NpdGlvbiAtPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICAgICAgICB2YXIgbGFzdEluZGV4ID0gc3ViamVjdFN0cmluZy5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pO1xuICAgICAgICByZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xuICAgIH07XG59IiwiZnVuY3Rpb24gSW5pdFd5c2l3eWcoKSB7XG5cblxuICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAgICAgY29udGVudF9jc3M6ICcvYXNzZXRzL2ZhY2VwYWxtL2Nzcy9jb250ZW50LmNzcycsXG4gICAgICAgIGxhbmd1YWdlOiAncnUnLFxuICAgICAgICBtZW51YmFyOiBmYWxzZSxcbiAgICAgICAgc3RhdHVzYmFyOiBmYWxzZSxcbiAgICAgICAgc3R5bGVfZm9ybWF0czogW1xuICAgICAgICAgICAge3RpdGxlOiAn0J7QsdGL0YfQvdGL0Lkg0YLQtdC60YHRgicsIGJsb2NrOiAncCd9LFxuICAgICAgICAgICAge3RpdGxlOiAn0JfQsNCz0L7Qu9C+0LLQvtC6JywgYmxvY2s6ICdoMid9LFxuICAgICAgICAgICAge3RpdGxlOiAn0J/QvtC00LfQsNCz0L7Qu9C+0LLQvtC6JywgYmxvY2s6ICdoMyd9LFxuICAgICAgICAgICAge3RpdGxlOiAn0JLRgNC10LfQutCwJywgYmxvY2s6ICdibG9ja3F1b3RlJ30sXG4gICAgICAgICAgICAvLyB7IHRpdGxlOiAnVGFibGUgcm93IDEnLCBzZWxlY3RvcjogJ3RyJywgY2xhc3NlczogJ3RhYmxlcm93MScgfVxuICAgICAgICBdLFxuXG4gICAgICAgIC8vIGV4dGVuZGVkX3ZhbGlkX2VsZW1lbnRzOiAnaW1nW2NsYXNzPW15Y2xhc3N8IXNyY3xib3JkZXI6MHxhbHR8dGl0bGV8d2lkdGh8aGVpZ2h0fHN0eWxlXScsXG4gICAgICAgIC8vIGludmFsaWRfZWxlbWVudHM6ICdzdHJvbmcsYixlbSxpJyxcblxuICAgICAgICBwbHVnaW5zOiBbJ2ZpeGVkdG9vbGJhcicsICdhdXRvcmVzaXplJywgJ2NvZGVtaXJyb3InLCAnbGluaycsICdhdXRvbGluaycsICdtZWRpYScsICdub25lZGl0YWJsZScsICdwYXN0ZScsICd0YWJsZScsICd2aXN1YWxibG9ja3MnXSxcbiAgICAgICAgdG9vbGJhcjogJ3N0eWxlc2VsZWN0IHwgYm9sZCBpdGFsaWMgfCBhbGlnbmxlZnQgYWxpZ25jZW50ZXIgYWxpZ25yaWdodCB8IGJ1bGxpc3QgbnVtbGlzdCBvdXRkZW50IGluZGVudCB8IGxpbmsgaW1hZ2UgdGFibGUgbWVkaWEgfCB2aXN1YWxibG9ja3MgY29kZScsXG5cbiAgICAgICAgaW1hZ2VzX3VwbG9hZF91cmw6ICdwb3N0QWNjZXB0b3IucGhwJyxcbiAgICAgICAgaW1hZ2VzX3VwbG9hZF9iYXNlX3BhdGg6ICcvc29tZS9iYXNlcGF0aCcsXG4gICAgICAgIGltYWdlc191cGxvYWRfY3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgIGltYWdlX2NhcHRpb246IHRydWUsXG5cbiAgICAgICAgbWVkaWFfcG9zdGVyOiBmYWxzZSxcbiAgICAgICAgbWVkaWFfZGltZW5zaW9uczogZmFsc2UsXG5cbiAgICAgICAgdGFibGVfYXBwZWFyYW5jZV9vcHRpb25zOiBmYWxzZSxcbiAgICAgICAgdGFibGVfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfY2VsbF9hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9yb3dfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfZGVmYXVsdF9hdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2RlZmF1bHQtdGFibGUnXG4gICAgICAgIH0sXG4gICAgICAgIHRhYmxlX2NsYXNzX2xpc3Q6IFtcbiAgICAgICAgICAgIHt0aXRsZTogJ0RlZmF1bHQnLCB2YWx1ZTogJ2RlZmF1bHQtdGFibGUnfSxcbiAgICAgICAgXSxcblxuICAgICAgICBjb2RlbWlycm9yOiB7XG4gICAgICAgICAgICBpbmRlbnRPbkluaXQ6IHRydWUsXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICBzdHlsZUFjdGl2ZUxpbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnbW9ub2thaSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjc3NGaWxlczogW1xuICAgICAgICAgICAgICAgICd0aGVtZS9tb25va2FpLmNzcydcbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIG9wdGlvbnMgPSBGYWNlcGFsbUNNUy5nZXRXeXNpd3lnT3B0aW9ucygpO1xuICAgIHZhciBlZGl0b3JQcm9taXNlcyA9IFtdO1xuICAgIGZvciAodmFyIHNlbGVjdG9yIGluIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudE9wdGlvbnMgPSAkLmV4dGVuZChkZWZhdWx0T3B0aW9ucywgb3B0aW9uc1tzZWxlY3Rvcl0pO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudE9wdGlvbnMuY29udGVudF9jc3NfYWRkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50T3B0aW9ucy5jb250ZW50X2NzcyA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50T3B0aW9ucy5jb250ZW50X2NzcyA9IFtjdXJyZW50T3B0aW9ucy5jb250ZW50X2Nzc107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1cnJlbnRPcHRpb25zLmNvbnRlbnRfY3NzID0gY3VycmVudE9wdGlvbnMuY29udGVudF9jc3MuY29uY2F0KGN1cnJlbnRPcHRpb25zLmNvbnRlbnRfY3NzX2FkZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjdXJyZW50T3B0aW9ucy5wbHVnaW5zQWRkKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE9wdGlvbnMucGx1Z2lucyA9IGN1cnJlbnRPcHRpb25zLnBsdWdpbnMuY29uY2F0KGN1cnJlbnRPcHRpb25zLnBsdWdpbnNBZGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJlbnRPcHRpb25zLnRvb2xiYXJBZGQpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50T3B0aW9ucy50b29sYmFyICs9IGN1cnJlbnRPcHRpb25zLnRvb2xiYXJBZGQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRPcHRpb25zLnNldHVwID0gZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbignaW5pdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJCh0aGlzKS50aW55bWNlKGN1cnJlbnRPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIGVkaXRvclByb21pc2VzLnB1c2goZC5wcm9taXNlKCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkLndoZW4uYXBwbHkoJCwgZWRpdG9yUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIH0pO1xufVxuXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgeHB1bmRlbCBvbiAwNC4wNC4xNi5cbiAqL1xuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5sZW5ndGgpIHtcbiAgICAgICAgJCgnW2RhdGEtcm93LWZvci1maWVsZD1cInJvbGUubmFtZVwiXSBzZWxlY3QnKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgPT0gMSkge1xuICAgICAgICAgICAgICAgICQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLmhpZGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCgndHJbZGF0YS1yb3ctZm9yLWZpZWxkPVwiYWNsXCJdJykuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICB9XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
