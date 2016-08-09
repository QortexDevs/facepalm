function AuthManager(app) {
    this.app = app;
}

AuthManager.prototype = {
    app: null,

    init: function () {
        var _this = this;
        $('.login-form form').on('submit', function () {
            $.post($(this).attr('action'), $(this).serialize(), 'json')
                .done(function (response) {
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
                })
                .fail(function (response) {
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
_.mixin(s.exports());
Dropzone.autoDiscover = false;


/**
 *
 * @returns {FacepalmCMS|*}
 * @constructor
 */
function FacepalmCMS() {

    if (arguments.callee._singletonInstance) {
        return arguments.callee._singletonInstance;
    }

    arguments.callee._singletonInstance = this;
}


FacepalmCMS.prototype = {
    csrfToken: '',
    baseUrl: null,
    serviceLocator: null,
    eventHandlers: {},


    /**
     *
     * @returns {FacepalmCMS}
     */
    get: function () {
        return this;
    },

    /**
     * Initialization
     *
     * @returns {FacepalmCMS}
     */
    init: function () {
        this.fire('beforeInit');

        this.serviceLocator = new ServiceLocator(this);
        this.baseUrl = $('body').data('base-url');

        this.service('WysiwygManager'); //init manager

        this.fire('afterInit');
        return this;
    },

    /**
     * Start UI and other services, after dom ready
     */
    start: function () {
        var _this = this;
        $(function () {
            _this.fire('beforeStart');

            if (_this.service('AuthManager').init()) {
                _this.initSessionKeepAlive();

                _this.service('UI').init();
                _this.service('WysiwygManager').initAll();
            }

            _this.fire('afterStart');
        });
    },

    /**
     * Get service from Service Locator
     *
     * @param serviceName
     * @param param
     * @returns {*}
     */
    service: function (serviceName, param) {
        return this.serviceLocator.get(serviceName, param)
    },

    /**
     * Fire event
     *
     * @param eventName
     */
    fire: function (eventName) {
        console.info(eventName);
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName].map(function (callback) {
                callback();
            })
        }
    },

    /**
     * Event handler registration
     *
     * @param eventName
     * @param callback
     */
    on: function (eventName, callback) {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(callback);
    },

    /**
     * Ping timer
     */
    initSessionKeepAlive: function () {
        setInterval(function () {
            $.get('./', {'ping': 'ping'});
        }, 120000);
    },

    /**
     * Build payload object for ajax requests
     * @param path
     * @param value
     */
    buildPayload: function (path, value) {
        return _.extend({}.setWithPath(path, value), this.getCsrfTokenParameter());
    },


    /**
     *
     * @param payload
     * @returns {*}
     */
    doRequest: function (payload) {
        return $.post(this.baseUrl + '/', payload, 'json');
    },

    /**
     * Get CSRF token object {_token:'xxx'}
     * @returns {{_token: string}}
     */
    getCsrfTokenParameter: function () {
        if (!this.csrfToken) {
            this.setCsrfToken($('input:hidden[name=_token]').val());
        }
        return {'_token': this.csrfToken};
    },

    /**
     * Set CSRF token value
     * @param value
     */
    setCsrfToken: function (value) {
        this.csrfToken = value;
        return this;
    },

    setBaseUrl: function (value) {
        this.baseUrl = value;
        return this;
    }

};
function ServiceLocator(app) {
    this.app = app;
}

ServiceLocator.prototype = {
    app: null,
    servicesMap: {},

    get: function (className, param) {
        if (!this.servicesMap[className]) {
            if (window[className]) {
                this.servicesMap[className] = new window[className](this.app, param);
            } else {
                throw new Error("Неизвестный класс: " + className);
            }
        }
        return this.servicesMap[className];
    },

};
/**
 * Created by xpundel on 14.12.15.
 */

/**
 * @method setWithPath
 * Sets the nested property of object
 */
Object.defineProperty(Object.prototype, 'setWithPath', {
    value: function (path, value) { /* Makes breakfast, solves world peace, takes out trash */
        if (path && value) {
            if (typeof  path == 'string') {
                path = path.split('.');
            }
            if (!(path instanceof Array)) {
                return;
            }
            var cur = this;
            var fields = path;
            fields = fields.filter(function (value) {
                return typeof value != 'undefined' && value;
            });
            fields.map(function (field, index) {
                cur[field] = cur[field] || (index == fields.length - 1 ? (value || {}) : {});
                cur = cur[field];
            });
        }

        return this;
    },
    writable: false,
    configurable: false,
    enumerable: false
});

/**
 *
 * @param ms
 * @returns {*}
 */
function delay(ms) {
    var d = $.Deferred();
    setTimeout(function () {
        d.resolve();
    }, ms);
    return d.promise();
}

/**
 *
 * @param str
 * @returns {*}
 */
function getQueryParameters(str) {
    return (str || document.location.search).replace(/(^\?)/, '').split("&").map(function (n) {
        return n = n.split("="), this[n[0]] = n[1], this
    }.bind({}))[0];
}

/**
 *
 */
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

/**
 *
 */
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (searchString, position) {
            position = position || 0;
            return this.lastIndexOf(searchString, position) === position;
        }
    });
}
/**
 * Created by xpundel on 17.06.16.
 */
function getDefaultTinyMceOptions() {
    return {
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
        toolbar: 'styleselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image table media | visualblocks code | fp:image fp:gallery',

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
}
function GalleryModule(app) {
    this.app = app;
}

GalleryModule.prototype = {
    app: null,
    editor: null,
    BUTTON_GALLERY: 'BUTTON_GALLERY',
    BUTTON_IMAGE: 'BUTTON_IMAGE',
    windowParams: {
        BUTTON_GALLERY: {
            title: 'Галерея',
            width: 630,
            height: 400
        },
        BUTTON_IMAGE: {
            title: 'Картинка',
            width: 430,
            height: 200
        }
    },

    register: function () {
        var _this = this;

        tinymce.PluginManager.add('gallery', function (editor, url) {
            // Add a button that opens a window
            editor.addButton('fp:gallery', {
                text: null,
                icon: 'gallery-button',
                title: 'Галерея',
                disabledStateSelector : '.type-image',
                onclick: function () {
                    _this.onButtonClick(editor, _this.BUTTON_GALLERY);
                }
            });

            editor.addButton('fp:image', {
                text: null,
                icon: 'image-button',
                title: 'Картинка',
                disabledStateSelector : '.type-gallery',
                onclick: function () {
                    _this.onButtonClick(editor, _this.BUTTON_IMAGE);
                }
            });

        });

    },

    onButtonClick: function (editor, type) {
        var _this = this;
        var baseUrl = $('body').data('base-url');

        var win = editor.windowManager.open({
            title: _this.windowParams[type].title,
            width: _this.windowParams[type].width,
            height: _this.windowParams[type].height,
            buttons: [
                {
                    text: 'Ok', subtype: 'primary', onclick: function () {
                    var doc = document.querySelectorAll('.mce-container-body>iframe')[0];
                    doc.contentWindow.submit();
                    win.close();
                }
                },
                {text: 'Cancel', onclick: 'close'}
            ],
            url: '/assets/facepalm/include/templates/galleryDialog.html?_token=' + _this.app.getCsrfTokenParameter()._token + '&baseUrl=' + baseUrl + '&type=' + type,
        });
    },

    initWindow: function (editor) {
        this.editor = editor;

        $('.mce-gallery-plugin-body').addClass((getQueryParameters().type == 'BUTTON_GALLERY' ? 'type-gallery' : 'type-image'));

        $('.dropzone').data('multiple', getQueryParameters().type === 'BUTTON_GALLERY' ? 1 : 0);

        var currentNode$ = $(this.editor.selection.getNode());
        if (currentNode$.is('.galleryPlaceholder[data-images]')) {
            $('.images-list').append($(currentNode$.html()))
        }

        this.app.service('UploadablesList').init();
        this.app.service('DropzoneManager').init();
    },

    submit: function () {
        "use strict";

        // Submit HTML to TinyMCE:

        var imagesIds = [];
        var imagesHtml = '';
        $('.images-list .image[data-id]').map(function () {
            imagesIds.push($(this).data("id"));
            imagesHtml += $(this)[0].outerHTML;
        });

        var typeClassName = (getQueryParameters().type == 'BUTTON_GALLERY' ? 'type-gallery' : 'type-image');

        this.editor.insertContent('<div class="mceNonEditable galleryPlaceholder ' + typeClassName + '" data-images="' + imagesIds + '">' + imagesHtml + '</div>');
    }

};
function WysiwygManager(app) {
    this.app = app;
    this.setOptions(); // set default options
    this.options[this.defaultWysiwygSelector] = getDefaultTinyMceOptions();
}

WysiwygManager.prototype = {
    app: null,
    defaultWysiwygSelector: 'textarea[data-wysiwyg]',
    options: {},

    /**
     *
     * @param options
     * @param selector
     */
    setOptions: function (options, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        if (!options) options = {};
        this.options[selector] = $.extend(this.options[selector], options);
    },

    /**
     *
     * @param css
     * @param selector
     */
    addContentCss: function (css, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        if (typeof this.options[selector].content_css == 'string') {
            this.options[selector].content_css = [this.options[selector].content_css];
        }
        this.options[selector].content_css = this.options[selector].content_css.concat(css)
    },

    /**
     *
     * @param pluginName
     * @param selector
     */
    addPlugin: function (pluginName, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        this.options[selector].plugins = this.options[selector].plugins.concat(pluginName);
    },

    /**
     *
     * @param buttons
     * @param selector
     */
    appendToolbar: function (buttons, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        if (!buttons.startsWith(' ')) {
            buttons = ' ' + buttons;
        }
        this.options[selector].toolbar += buttons;
    },

    /**
     *
     * @param remove
     * @param selector
     */
    removeFromToolbar: function (remove, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;

        this.options[selector].toolbar = this.options[selector].toolbar.replace(remove, '');
    },

    /**
     *
     * @param buttons
     * @param selector
     */
    prependToolbar: function (buttons, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        if (!buttons.endsWith(' ')) {
            buttons = buttons + ' ';
        }
        this.options[selector].toolbar = buttons + this.options[selector].toolbar;
    },

    /**
     *
     * @returns {WysiwygManager.options|{}}
     */
    getOptions: function () {
        return this.options;
    },


    /**
     *
     */
    initAll: function () {
        var editorPromises = [];
        var _this = this;

        _this.initCustomModules();
        var options = this.getOptions();

        _this.app.fire('beforeAllWysiwygInit');
        for (var selector in options) {
            if (options.hasOwnProperty(selector)) {

                $(selector).each(function () {
                    var d = $.Deferred();

                    options[selector].setup = function (editor) {
                        editor.on('change', function () {
                            //todo: убрать глобальный tinymce, и дергать конкретный редактор
                            tinymce.triggerSave();
                        });
                        editor.on('init', function () {
                            d.resolve();
                        });
                    };

                    $(this).tinymce(options[selector]);

                    editorPromises.push(d.promise());
                });
            }
        }

        $.when.apply($, editorPromises).then(function () {
            _this.app.fire('afterAllWysiwygInit');
        });
    },

    initCustomModules: function () {
        this.app.service('GalleryModule').register();
        this.addPlugin(['gallery']);
    }
};
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
function DropzoneManager(app) {
    this.app = app;
}

DropzoneManager.prototype = {
    app: null,

    init: function () {
        var _this = this;
        var templateImage = twig({
            data: $('#image-preview-template').html()
        });
        var templateFile = twig({
            data: $('#file-preview-template').html()
        });

        $(".dropzone").each(function () {
            var dropzone$ = $(this);
            var isMultiple = dropzone$.data('multiple') == "1";
            try {
                $(this).dropzone({
                    parallelUploads: 3,
                    addRemoveLinks: true,
                    uploadMultiple: isMultiple,
                    createImageThumbnails: false,
                    maxFiles: isMultiple ? null : 1,
                    paramName: $(this).data('input-name'),
                    clickable: $(this).find(".dz-message")[0],
                    acceptedFiles: dropzone$.data('type') == 'image' ? 'image/*' : null,
                    url: _this.app.baseUrl + "/?_token=" + _this.app.getCsrfTokenParameter()._token + dropzone$.data('parameters'),

                    success: function (file, response) {
                        this.removeFile(file);
                        if (!isMultiple) {
                            dropzone$.prev().empty();
                        }
                        for (var i in response) {
                            if (dropzone$.data('type') == 'image') {
                                if (!dropzone$.prev().find('.image[data-id=' + response[i].image.id + ']').length) {
                                    dropzone$.prev().append(templateImage.render(response[i]))
                                    _this.app.service('UploadablesList').initFancybox(dropzone$.prev());
                                }
                            } else {
                                if (!dropzone$.prev().find('.file[data-id=' + response[i].file.id + ']').length) {
                                    dropzone$.prev().append(templateFile.render(response[i]))
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
            } catch (e) {
                console.info(e);
            }
        })


    },


};
function Form(app) {
    this.app = app;
}

Form.prototype = {
    app: null,

    init: function () {
        this.initSave();
        this.initDatepicker();
    },

    initSave: function () {
        var _this = this;
        $(document).on('click', '.form-buttons button.save-button', function () {
            var formData = $('.main-cms-form').serialize();
            var createMode = $('.cms-module-form-page').data('create-mode');

            _this.app.service('UI').toggleSpinner(true);
            _this.app.service('UI').toggleFormButtons(false);

            // Minimum delay to avoid unpleasant blinking
            $.when(
                $.post(_this.app.baseUrl + '/', formData),
                delay(createMode ? 100 : 500)
            ).then(function (result) {
                var response = result[0];
                if (createMode && parseInt(response) > 0) {
                    var url = _.rtrim(document.location.href, '/');
                    if (url.endsWith('/create')) {
                        url = _.strLeftBack(url, '/');
                    }
                    document.location.href = url + '/' + response + '/';
                } else {
                    $.growl.notice({title: '', message: "Cохранено"});
                    _this.app.service('UI').toggleSpinner(false);
                    _this.app.service('UI').toggleFormButtons(true);
                }
            });

            return false;
        });

    },

    initDatepicker: function () {
        //todo: подумать, насчет live?
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

            new Pikaday(options);
        });
        $('.datepicker + .clear-date').on('click', function () {
            $(this).prev().val('');
        });
    }
};
function GoogleMap(app) {
    this.app = app;
}

GoogleMap.prototype = {
    initMaps: function () {
        var _this = this;
        if ($('.map.google[data-lat][data-lng]').length) {
            $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyBF9wNWgC16iCHmTloWEl5Y7sARDSyqRUE&libraries=places&sensor=false", function () {
                _this.app.fire('afterGoogleMapsApiLoad');
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

                _this.app.fire('afterMapsInit');
            });
        }
    }
}
function LeftMenu(app) {
    this.app = app;
}

LeftMenu.prototype = {
    initMainMenu: function() {
        $('.main-menu .left-panel:not(.collapsed), .main-menu .right-panel').mCustomScrollbar({
            theme: "light-2",
            autoExpandScrollbar: true,
            scrollInertia: 400,
            mouseWheel: {
                preventDefault: true
            },
            callbacks: {
                onScroll: function (q, q1) {
                    // console.log("Content scrolled...", q, q1);
                }
            }
            // todo: прик лкике по меню - запоминать в локал-сторадже скроллТоп, и потом при инициализации - сразу скроллить на него.
            // todo: При загрузке страницы - обнулять это значение в локалсторадже
            // todo: если есть выделенный пункт, а сохраненного значения нет, то вычислять его примерно и сероллить туда
            // todo: а вообще, переделать все на аякс, сука
        });
    }
}
function List(app) {
    this.app = app;
}

List.prototype = {
    app: null,

    selectors: {
        'status': ['.cms-module-list-content button.status', '.cms-module-tree-content button.status'],
        'delete': ['.cms-module-list-content button.delete', '.cms-module-tree-content button.delete'],
        'add': '.cms-module-tree-content button.add',
        'addRoot': '.add-new-tree-item'
    },

    /**
     *
     */
    init: function () {
        this.initButtons();
        this.initSortable();
    },

    /**
     *
     */
    initButtons: function () {
        this.initStatusButton();
        this.initDeleteButton();
        this.initAddButton();
        this.initAddToRootButton();
    },


    /**
     * Toggle status
     */
    initStatusButton: function () {
        var _this = this;
        $(document).on('click', _this.selectors.status.join(','), function () {
            var btn$ = $(this);
            var id = _this.getItemId(btn$);
            var model = _this.getItemModel(btn$);
            var itemContainer$ = _this.getItemContainer(btn$);

            var payload = _this.app.buildPayload(['toggle', model, id, 'status'], 1);

            _this.app.doRequest(payload).done(function (result) {
                itemContainer$.toggleClass('inactive', !result);
            });

            return false;
        });
    },


    /**
     * Delete object
     */
    initDeleteButton: function () {
        var _this = this;
        // console.log(_this.selectors.delete);
        $(document).on('click', _this.selectors.delete.join(','), function () {
            if (confirm('Sure?')) {
                var btn$ = $(this);
                var id = _this.getItemId(btn$);
                var model = _this.getItemModel(btn$);
                var itemContainer$ = _this.getItemContainer(btn$);

                var payload = _this.app.buildPayload(['delete', model, id], 1);

                _this.app.doRequest(payload).done(function () {
                    itemContainer$.fadeOut('fast', function () {
                        $(this).remove()
                    });
                });
            }
            return false;
        });
    },


    /**
     * Add child
     */
    initAddButton: function () {
        var _this = this;
        $(document).on('click', _this.selectors.add, function () {
            var btn$ = $(this);
            var id = _this.getItemId(btn$);
            var model = _this.getItemModel(btn$);
            var itemContainer$ = _this.getItemContainer(btn$);

            var payload = _this.app.buildPayload(['create', model, _this.generateRandomIdString(), 'parent_id'], id);

            _this.app.doRequest(payload).done(function (result) {
                var template = btn$.closest('[data-model]').find('script[data-template-name="empty-tree-element"]').html();
                itemContainer$.find('>ul').append(_this.createNewElement(template, result));
            });
            return false;
        });
    },


    /**
     * Add object to the tree root
     */
    initAddToRootButton: function () {
        var _this = this;
        $(document).on('click', _this.selectors.addRoot, function () {
            var btn$ = $(this);
            var itemContainer$ = btn$.closest('[data-model]');
            var id = parseInt(itemContainer$.data('tree-root'));
            var model = itemContainer$.data('model');

            var payload = _this.app.buildPayload(['create', model, _this.generateRandomIdString(), 'parent_id'], id);

            _this.app.doRequest(payload).done(function (result) {
                var template = btn$.closest('[data-model]').find('script[data-template-name="empty-tree-element"]').html();
                itemContainer$.find('ul:first').append(_this.createNewElement(template, result));
            });
            return false;
        });
    },

    /**
     *
     */
    initSortable: function () {
        var _this = this;
        function initSortableEngine(el, handleName, groupName) {
            var sortable = Sortable.create(el, {
                scroll: true,
                animation: 200,
                group: groupName,
                handle: handleName,
                onAdd: function (/**Event*/evt) {
                    onTreeSort(evt, sortable);
                },
                onUpdate: function (/**Event*/evt) {
                    onTreeSort(evt, sortable);
                }
            });
        }
        function onTreeSort(evt, sortable) {
            var model = $(evt.target).closest('[data-model]').data('model');
            var parentId = $(evt.target).data('id');
            var orderArray = sortable.toArray().filter(function (el) {
                return el >= 0
            });
            var payload = _.extend({save: {}}, _this.app.getCsrfTokenParameter());
            payload['save'][model] = {}; // object, not an array. Otherwise it will create 0..id empty elements
            for (var i in orderArray) {
                if (orderArray.hasOwnProperty(i)) {
                    payload['save'][model][orderArray[i]] = {'show_order': parseInt(i) + 1, 'parent_id': parentId};
                }
            }

            _this.app.doRequest(payload);
        }

        // Trees
        $('.cms-module-tree-content').each(function (i) {
            var plain = $(this).data('plain') === 1;
            var treeName = 'tree_' + i;
            $(this).find((plain ? '>' : '') + 'ul').each(function () {
                initSortableEngine($(this)[0], '.id', treeName);
            });
        });

        // Lists
        $('.cms-module-list-content[data-sortable="true"] tbody').each(function (i) {
            var listName = 'list_' + i;
            initSortableEngine($(this)[0], '.column-id', listName);
        });

    },

    
    /**
     *
     * @param el$
     * @returns {*|HTMLElement|null}
     */
    getItemContainer: function (el$) {
        return el$.closest('[data-id]');
    },


    /**
     *
     * @param el$
     * @returns {*}
     */
    getItemId: function (el$) {
        return this.getItemContainer(el$).data('id');
    },


    /**
     *
     * @param el$
     * @returns {*}
     */
    getItemModel: function (el$) {
        return el$.closest('[data-model]').data('model');
    },



    /**
     *
     * @returns {string}
     */
    generateRandomIdString: function () {
        return '%CREATE_' + Math.random().toString(36).substring(2, 8) + '%';
    },


    /**
     *
     * @param template
     * @param result
     * @returns {*|jQuery}
     */
    createNewElement: function (template, result) {
        var newItem$ = $(template.replace(new RegExp('%CREATE_%', 'g'), result)).attr('data-id', result);
        newItem$.find('.id').text(result);
        return newItem$;
    }
};
function UI(app) {
    this.app = app;
}

UI.prototype = {
    app: null,
    userMenu: null,

    init: function () {
        this.initUserMenu();
        this.initHrefButtons();
        this.initStartupNotifications();
        this.app.service('GoogleMap').initMaps();
        this.app.service('LeftMenu').initMainMenu();
        this.app.service('List').init();
        this.app.service('Form').init();
        this.app.service('DropzoneManager').init();
        this.app.service('UploadablesList').init();
        this.app.service('VideosList').init();
    },

    initStartupNotifications: function () {
        if ($('.cms-module-form-page').data('just-created')) {
            $.growl.notice({title: '', message: "Объект создан"});
        }
    },

    initUserMenu: function () {
        if (document.querySelector('.user-icon')) {
            this.userMenu = new Drop({
                openOn: 'click',
                position: 'bottom right',
                target: document.querySelector('.user-icon'),
                content: $('.user-dropdown-container').html()
            });
        }
    },

    initHrefButtons: function () {
        $(document).on('click', 'button[href]', function () {
            document.location.href = $(this).attr('href');
            return false;
        });
    },

    toggleSpinner: function (show) {
        $('#spinner').toggleClass('show', show);
    },

    toggleFormButtons: function (enable) {
        $('.form-buttons button').prop('disabled', !enable);
    }

}
function UploadablesList(app) {
    this.app = app;
}

UploadablesList.prototype = {
    app: null,

    init: function () {
        var _this = this;

        ['image', 'file'].forEach(function (model) {
            _this.initDeleteButton(model);

            $('.' + model + 's-list').each(function () {
                if (model == 'image') {
                    _this.initFancybox($(this));
                }
                _this.initSortable($(this)[0], model)

            });


        })
    },

    initDeleteButton: function (model) {
        var _this = this;
        $(document).on('click', '.' + model + 's-list .' + model + ' .delete', function () {
            if (confirm('Sure?')) {
                var element$ = $(this).closest('.' + model);
                var id = element$.data('id');
                var payload = _this.app.buildPayload(['delete', model, id], 1);
                _this.app.doRequest(payload).done(function () {
                    element$.fadeOut(function () {
                        $(this).remove();
                    });
                });
                return false;
            }
        });
    },

    initSortable: function (el, model) {
        var _this = this;
        var sortable = Sortable.create(el, {
            animation: 200,
            handle: model == 'file' ? ".icon" : null,
            scroll: true,
            onUpdate: function () {
                var orderArray = sortable.toArray();
                var payload = _this.app.buildPayload(['save', model], {});
                for (var i in orderArray) {
                    if (orderArray.hasOwnProperty(i)) {
                        payload['save'][model][orderArray[i]] = {'show_order': parseInt(i) + 1};
                    }
                }

                _this.app.doRequest(payload);
            }
        });
    },

    initFancybox: function (el$) {
        el$.find('.image > a').fancybox({
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
    }


};
function VideosList(app) {
    this.app = app;
}

VideosList.prototype = {
    app: null,

    init: function () {
        var _this = this;

        var templateImage = twig({
            data: $('#image-preview-template').html()
        });

        $(document).on('click', '.cms-button[data-add-video]', function () {
            $.fancybox.open(twig({data: $('#insert-video-template').html()}).render({
                inputName: $(this).data('input-name')
            }));
        });
        $(document).on('click', '.insert-video-dialog button', function () {
            var dialog$ = $(this).closest('.insert-video-dialog');
            var textarea$ = dialog$.find('textarea');
            var payload = _this.app.buildPayload();
            payload[textarea$.attr('name')] = textarea$.val();
            payload['multiple'] = true;

            dialog$.addClass('processing');
            textarea$.attr('disabled', true).css('background', '#eee');

            _this.app.doRequest(payload).done(function (response) {
                var button = $('.cms-button[data-add-video][data-input-name="' + textarea$.attr('name') + '"]');
                for (var i in response) {
                    if (!button.prevAll('.images-list:first').find('.image[data-id=' + response[i].image.id + ']').length) {
                        button.prevAll('.images-list:first').append(templateImage.render(response[i]))
                        _this.app.service('UploadablesList').initFancybox(button.prevAll('.images-list:first'));
                    }
                }
                $.fancybox.close();
            });
        })
    }

};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGguanMiLCJGYWNlcGFsbUNNUy5qcyIsIlNlcnZpY2VMb2NhdG9yLmpzIiwidXRpbGl0eS5qcyIsInd5c2l3eWcvRGVmYXVsdFRpbnlNY2VPcHRpb25zLmpzIiwid3lzaXd5Zy9HYWxsZXJ5TW9kdWxlLmpzIiwid3lzaXd5Zy9XeXNpd3lnLmpzIiwiZXh0ZW5kZWQvdXNlcnMuanMiLCJVSS9Ecm9wem9uZU1hbmFnZXIuanMiLCJVSS9Gb3JtLmpzIiwiVUkvR29vZ2xlTWFwLmpzIiwiVUkvTGVmdE1lbnUuanMiLCJVSS9MaXN0LmpzIiwiVUkvVUkuanMiLCJVSS9VcGxvYWRhYmxlc0xpc3QuanMiLCJVSS9WaWRlb3NMaXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDck9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBBdXRoTWFuYWdlcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuQXV0aE1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJCgnLmxvZ2luLWZvcm0gZm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLnBvc3QoJCh0aGlzKS5hdHRyKCdhY3Rpb24nKSwgJCh0aGlzKS5zZXJpYWxpemUoKSwgJ2pzb24nKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UudXNlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9ICcvY21zLyc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zaGFrZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe3RpdGxlOiAnJywgbWVzc2FnZTogcmVzcG9uc2UuZXJyb3JzW2ldfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDQv9C10YDQtdC00LXQu9Cw0YLRjCDQstGL0LLQvtC0INGC0LXQutGB0YLQsCDQvtGI0LjQsdC60LghINCb0L7QutCw0LvQuNC30LDRhtC40Y8hXG5cbiAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7dGl0bGU6ICcnLCBtZXNzYWdlOiAn0J3QtdCy0LXRgNC90YvQtSDQu9C+0LPQuNC9INC40LvQuCDQv9Cw0YDQvtC70YwnfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNoYWtlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2UucmVzcG9uc2VKU09OKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gJCgnLmxvZ2luLWZvcm0gZm9ybScpLmxlbmd0aCA9PSAwO1xuICAgIH0sXG5cbiAgICBzaGFrZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcubG9naW4tZm9ybScpLmFkZENsYXNzKCdzaGFrZScpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5sb2dpbi1mb3JtJykucmVtb3ZlQ2xhc3MoJ3NoYWtlJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cbn07IiwiXy5taXhpbihzLmV4cG9ydHMoKSk7XG5Ecm9wem9uZS5hdXRvRGlzY292ZXIgPSBmYWxzZTtcblxuXG4vKipcbiAqXG4gKiBAcmV0dXJucyB7RmFjZXBhbG1DTVN8Kn1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBGYWNlcGFsbUNNUygpIHtcblxuICAgIGlmIChhcmd1bWVudHMuY2FsbGVlLl9zaW5nbGV0b25JbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gYXJndW1lbnRzLmNhbGxlZS5fc2luZ2xldG9uSW5zdGFuY2U7XG4gICAgfVxuXG4gICAgYXJndW1lbnRzLmNhbGxlZS5fc2luZ2xldG9uSW5zdGFuY2UgPSB0aGlzO1xufVxuXG5cbkZhY2VwYWxtQ01TLnByb3RvdHlwZSA9IHtcbiAgICBjc3JmVG9rZW46ICcnLFxuICAgIGJhc2VVcmw6IG51bGwsXG4gICAgc2VydmljZUxvY2F0b3I6IG51bGwsXG4gICAgZXZlbnRIYW5kbGVyczoge30sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZhY2VwYWxtQ01TfVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6YXRpb25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGYWNlcGFsbUNNU31cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmlyZSgnYmVmb3JlSW5pdCcpO1xuXG4gICAgICAgIHRoaXMuc2VydmljZUxvY2F0b3IgPSBuZXcgU2VydmljZUxvY2F0b3IodGhpcyk7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9ICQoJ2JvZHknKS5kYXRhKCdiYXNlLXVybCcpO1xuXG4gICAgICAgIHRoaXMuc2VydmljZSgnV3lzaXd5Z01hbmFnZXInKTsgLy9pbml0IG1hbmFnZXJcblxuICAgICAgICB0aGlzLmZpcmUoJ2FmdGVySW5pdCcpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgVUkgYW5kIG90aGVyIHNlcnZpY2VzLCBhZnRlciBkb20gcmVhZHlcbiAgICAgKi9cbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmZpcmUoJ2JlZm9yZVN0YXJ0Jyk7XG5cbiAgICAgICAgICAgIGlmIChfdGhpcy5zZXJ2aWNlKCdBdXRoTWFuYWdlcicpLmluaXQoKSkge1xuICAgICAgICAgICAgICAgIF90aGlzLmluaXRTZXNzaW9uS2VlcEFsaXZlKCk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5zZXJ2aWNlKCdVSScpLmluaXQoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXJ2aWNlKCdXeXNpd3lnTWFuYWdlcicpLmluaXRBbGwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMuZmlyZSgnYWZ0ZXJTdGFydCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHNlcnZpY2UgZnJvbSBTZXJ2aWNlIExvY2F0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBzZXJ2aWNlTmFtZVxuICAgICAqIEBwYXJhbSBwYXJhbVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIHNlcnZpY2U6IGZ1bmN0aW9uIChzZXJ2aWNlTmFtZSwgcGFyYW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZUxvY2F0b3IuZ2V0KHNlcnZpY2VOYW1lLCBwYXJhbSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmlyZSBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50TmFtZVxuICAgICAqL1xuICAgIGZpcmU6IGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgY29uc29sZS5pbmZvKGV2ZW50TmFtZSk7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ubWFwKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnROYW1lXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBpbmcgdGltZXJcbiAgICAgKi9cbiAgICBpbml0U2Vzc2lvbktlZXBBbGl2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmdldCgnLi8nLCB7J3BpbmcnOiAncGluZyd9KTtcbiAgICAgICAgfSwgMTIwMDAwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQnVpbGQgcGF5bG9hZCBvYmplY3QgZm9yIGFqYXggcmVxdWVzdHNcbiAgICAgKiBAcGFyYW0gcGF0aFxuICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAqL1xuICAgIGJ1aWxkUGF5bG9hZDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBfLmV4dGVuZCh7fS5zZXRXaXRoUGF0aChwYXRoLCB2YWx1ZSksIHRoaXMuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHBheWxvYWRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBkb1JlcXVlc3Q6IGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiAkLnBvc3QodGhpcy5iYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgQ1NSRiB0b2tlbiBvYmplY3Qge190b2tlbjoneHh4J31cbiAgICAgKiBAcmV0dXJucyB7e190b2tlbjogc3RyaW5nfX1cbiAgICAgKi9cbiAgICBnZXRDc3JmVG9rZW5QYXJhbWV0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNzcmZUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5zZXRDc3JmVG9rZW4oJCgnaW5wdXQ6aGlkZGVuW25hbWU9X3Rva2VuXScpLnZhbCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geydfdG9rZW4nOiB0aGlzLmNzcmZUb2tlbn07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBDU1JGIHRva2VuIHZhbHVlXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgc2V0Q3NyZlRva2VuOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5jc3JmVG9rZW4gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHNldEJhc2VVcmw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmJhc2VVcmwgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59O1xuXG4iLCJmdW5jdGlvbiBTZXJ2aWNlTG9jYXRvcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuU2VydmljZUxvY2F0b3IucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcbiAgICBzZXJ2aWNlc01hcDoge30sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChjbGFzc05hbWUsIHBhcmFtKSB7XG4gICAgICAgIGlmICghdGhpcy5zZXJ2aWNlc01hcFtjbGFzc05hbWVdKSB7XG4gICAgICAgICAgICBpZiAod2luZG93W2NsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VzTWFwW2NsYXNzTmFtZV0gPSBuZXcgd2luZG93W2NsYXNzTmFtZV0odGhpcy5hcHAsIHBhcmFtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwi0J3QtdC40LfQstC10YHRgtC90YvQuSDQutC70LDRgdGBOiBcIiArIGNsYXNzTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZXNNYXBbY2xhc3NOYW1lXTtcbiAgICB9LFxuXG59O1xuXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgeHB1bmRlbCBvbiAxNC4xMi4xNS5cbiAqL1xuXG4vKipcbiAqIEBtZXRob2Qgc2V0V2l0aFBhdGhcbiAqIFNldHMgdGhlIG5lc3RlZCBwcm9wZXJ0eSBvZiBvYmplY3RcbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdzZXRXaXRoUGF0aCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7IC8qIE1ha2VzIGJyZWFrZmFzdCwgc29sdmVzIHdvcmxkIHBlYWNlLCB0YWtlcyBvdXQgdHJhc2ggKi9cbiAgICAgICAgaWYgKHBhdGggJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgIHBhdGggPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zcGxpdCgnLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjdXIgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGZpZWxkcyA9IHBhdGg7XG4gICAgICAgICAgICBmaWVsZHMgPSBmaWVsZHMuZmlsdGVyKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgIT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZWxkcy5tYXAoZnVuY3Rpb24gKGZpZWxkLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGN1cltmaWVsZF0gPSBjdXJbZmllbGRdIHx8IChpbmRleCA9PSBmaWVsZHMubGVuZ3RoIC0gMSA/ICh2YWx1ZSB8fCB7fSkgOiB7fSk7XG4gICAgICAgICAgICAgICAgY3VyID0gY3VyW2ZpZWxkXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxufSk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBtc1xuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGRlbGF5KG1zKSB7XG4gICAgdmFyIGQgPSAkLkRlZmVycmVkKCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQucmVzb2x2ZSgpO1xuICAgIH0sIG1zKTtcbiAgICByZXR1cm4gZC5wcm9taXNlKCk7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBzdHJcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBnZXRRdWVyeVBhcmFtZXRlcnMoc3RyKSB7XG4gICAgcmV0dXJuIChzdHIgfHwgZG9jdW1lbnQubG9jYXRpb24uc2VhcmNoKS5yZXBsYWNlKC8oXlxcPykvLCAnJykuc3BsaXQoXCImXCIpLm1hcChmdW5jdGlvbiAobikge1xuICAgICAgICByZXR1cm4gbiA9IG4uc3BsaXQoXCI9XCIpLCB0aGlzW25bMF1dID0gblsxXSwgdGhpc1xuICAgIH0uYmluZCh7fSkpWzBdO1xufVxuXG4vKipcbiAqXG4gKi9cbmlmICghU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCkge1xuICAgIFN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgc3ViamVjdFN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBwb3NpdGlvbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHBvc2l0aW9uKSB8fCBNYXRoLmZsb29yKHBvc2l0aW9uKSAhPT0gcG9zaXRpb24gfHwgcG9zaXRpb24gPiBzdWJqZWN0U3RyaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBzdWJqZWN0U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBwb3NpdGlvbiAtPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICAgICAgICB2YXIgbGFzdEluZGV4ID0gc3ViamVjdFN0cmluZy5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pO1xuICAgICAgICByZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xuICAgIH07XG59XG5cbi8qKlxuICpcbiAqL1xuaWYgKCFTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGgpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyaW5nLnByb3RvdHlwZSwgJ3N0YXJ0c1dpdGgnLCB7XG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCAwO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikgPT09IHBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgfSk7XG59IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMTcuMDYuMTYuXG4gKi9cbmZ1bmN0aW9uIGdldERlZmF1bHRUaW55TWNlT3B0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50X2NzczogJy9hc3NldHMvZmFjZXBhbG0vY3NzL2NvbnRlbnQuY3NzJyxcbiAgICAgICAgbGFuZ3VhZ2U6ICdydScsXG4gICAgICAgIG1lbnViYXI6IGZhbHNlLFxuICAgICAgICBzdGF0dXNiYXI6IGZhbHNlLFxuICAgICAgICBzdHlsZV9mb3JtYXRzOiBbXG4gICAgICAgICAgICB7dGl0bGU6ICfQntCx0YvRh9C90YvQuSDRgtC10LrRgdGCJywgYmxvY2s6ICdwJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQl9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gyJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQn9C+0LTQt9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gzJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQktGA0LXQt9C60LAnLCBibG9jazogJ2Jsb2NrcXVvdGUnfSxcbiAgICAgICAgICAgIC8vIHsgdGl0bGU6ICdUYWJsZSByb3cgMScsIHNlbGVjdG9yOiAndHInLCBjbGFzc2VzOiAndGFibGVyb3cxJyB9XG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gZXh0ZW5kZWRfdmFsaWRfZWxlbWVudHM6ICdpbWdbY2xhc3M9bXljbGFzc3whc3JjfGJvcmRlcjowfGFsdHx0aXRsZXx3aWR0aHxoZWlnaHR8c3R5bGVdJyxcbiAgICAgICAgLy8gaW52YWxpZF9lbGVtZW50czogJ3N0cm9uZyxiLGVtLGknLFxuXG4gICAgICAgIHBsdWdpbnM6IFsnZml4ZWR0b29sYmFyJywgJ2F1dG9yZXNpemUnLCAnY29kZW1pcnJvcicsICdsaW5rJywgJ2F1dG9saW5rJywgJ21lZGlhJywgJ25vbmVkaXRhYmxlJywgJ3Bhc3RlJywgJ3RhYmxlJywgJ3Zpc3VhbGJsb2NrcyddLFxuICAgICAgICB0b29sYmFyOiAnc3R5bGVzZWxlY3QgfCBib2xkIGl0YWxpYyB8IGFsaWdubGVmdCBhbGlnbmNlbnRlciBhbGlnbnJpZ2h0IHwgYnVsbGlzdCBudW1saXN0IG91dGRlbnQgaW5kZW50IHwgbGluayBpbWFnZSB0YWJsZSBtZWRpYSB8IHZpc3VhbGJsb2NrcyBjb2RlIHwgZnA6aW1hZ2UgZnA6Z2FsbGVyeScsXG5cbiAgICAgICAgbWVkaWFfcG9zdGVyOiBmYWxzZSxcbiAgICAgICAgbWVkaWFfZGltZW5zaW9uczogZmFsc2UsXG5cbiAgICAgICAgdGFibGVfYXBwZWFyYW5jZV9vcHRpb25zOiBmYWxzZSxcbiAgICAgICAgdGFibGVfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfY2VsbF9hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9yb3dfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfZGVmYXVsdF9hdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2RlZmF1bHQtdGFibGUnXG4gICAgICAgIH0sXG4gICAgICAgIHRhYmxlX2NsYXNzX2xpc3Q6IFtcbiAgICAgICAgICAgIHt0aXRsZTogJ0RlZmF1bHQnLCB2YWx1ZTogJ2RlZmF1bHQtdGFibGUnfSxcbiAgICAgICAgXSxcblxuICAgICAgICBjb2RlbWlycm9yOiB7XG4gICAgICAgICAgICBpbmRlbnRPbkluaXQ6IHRydWUsXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICBzdHlsZUFjdGl2ZUxpbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnbW9ub2thaSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjc3NGaWxlczogW1xuICAgICAgICAgICAgICAgICd0aGVtZS9tb25va2FpLmNzcydcbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIH07XG59IiwiZnVuY3Rpb24gR2FsbGVyeU1vZHVsZShhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuR2FsbGVyeU1vZHVsZS5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIGVkaXRvcjogbnVsbCxcbiAgICBCVVRUT05fR0FMTEVSWTogJ0JVVFRPTl9HQUxMRVJZJyxcbiAgICBCVVRUT05fSU1BR0U6ICdCVVRUT05fSU1BR0UnLFxuICAgIHdpbmRvd1BhcmFtczoge1xuICAgICAgICBCVVRUT05fR0FMTEVSWToge1xuICAgICAgICAgICAgdGl0bGU6ICfQk9Cw0LvQtdGA0LXRjycsXG4gICAgICAgICAgICB3aWR0aDogNjMwLFxuICAgICAgICAgICAgaGVpZ2h0OiA0MDBcbiAgICAgICAgfSxcbiAgICAgICAgQlVUVE9OX0lNQUdFOiB7XG4gICAgICAgICAgICB0aXRsZTogJ9Ca0LDRgNGC0LjQvdC60LAnLFxuICAgICAgICAgICAgd2lkdGg6IDQzMCxcbiAgICAgICAgICAgIGhlaWdodDogMjAwXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdnYWxsZXJ5JywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG4gICAgICAgICAgICAvLyBBZGQgYSBidXR0b24gdGhhdCBvcGVucyBhIHdpbmRvd1xuICAgICAgICAgICAgZWRpdG9yLmFkZEJ1dHRvbignZnA6Z2FsbGVyeScsIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgIGljb246ICdnYWxsZXJ5LWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfQk9Cw0LvQtdGA0LXRjycsXG4gICAgICAgICAgICAgICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yIDogJy50eXBlLWltYWdlJyxcbiAgICAgICAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm9uQnV0dG9uQ2xpY2soZWRpdG9yLCBfdGhpcy5CVVRUT05fR0FMTEVSWSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVkaXRvci5hZGRCdXR0b24oJ2ZwOmltYWdlJywge1xuICAgICAgICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgaWNvbjogJ2ltYWdlLWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfQmtCw0YDRgtC40L3QutCwJyxcbiAgICAgICAgICAgICAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3IgOiAnLnR5cGUtZ2FsbGVyeScsXG4gICAgICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkJ1dHRvbkNsaWNrKGVkaXRvciwgX3RoaXMuQlVUVE9OX0lNQUdFKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBvbkJ1dHRvbkNsaWNrOiBmdW5jdGlvbiAoZWRpdG9yLCB0eXBlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBiYXNlVXJsID0gJCgnYm9keScpLmRhdGEoJ2Jhc2UtdXJsJyk7XG5cbiAgICAgICAgdmFyIHdpbiA9IGVkaXRvci53aW5kb3dNYW5hZ2VyLm9wZW4oe1xuICAgICAgICAgICAgdGl0bGU6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS50aXRsZSxcbiAgICAgICAgICAgIHdpZHRoOiBfdGhpcy53aW5kb3dQYXJhbXNbdHlwZV0ud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS5oZWlnaHQsXG4gICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnT2snLCBzdWJ0eXBlOiAncHJpbWFyeScsIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvYyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tY2UtY29udGFpbmVyLWJvZHk+aWZyYW1lJylbMF07XG4gICAgICAgICAgICAgICAgICAgIGRvYy5jb250ZW50V2luZG93LnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB3aW4uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCcsIG9uY2xpY2s6ICdjbG9zZSd9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdXJsOiAnL2Fzc2V0cy9mYWNlcGFsbS9pbmNsdWRlL3RlbXBsYXRlcy9nYWxsZXJ5RGlhbG9nLmh0bWw/X3Rva2VuPScgKyBfdGhpcy5hcHAuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkuX3Rva2VuICsgJyZiYXNlVXJsPScgKyBiYXNlVXJsICsgJyZ0eXBlPScgKyB0eXBlLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdFdpbmRvdzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcblxuICAgICAgICAkKCcubWNlLWdhbGxlcnktcGx1Z2luLWJvZHknKS5hZGRDbGFzcygoZ2V0UXVlcnlQYXJhbWV0ZXJzKCkudHlwZSA9PSAnQlVUVE9OX0dBTExFUlknID8gJ3R5cGUtZ2FsbGVyeScgOiAndHlwZS1pbWFnZScpKTtcblxuICAgICAgICAkKCcuZHJvcHpvbmUnKS5kYXRhKCdtdWx0aXBsZScsIGdldFF1ZXJ5UGFyYW1ldGVycygpLnR5cGUgPT09ICdCVVRUT05fR0FMTEVSWScgPyAxIDogMCk7XG5cbiAgICAgICAgdmFyIGN1cnJlbnROb2RlJCA9ICQodGhpcy5lZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSk7XG4gICAgICAgIGlmIChjdXJyZW50Tm9kZSQuaXMoJy5nYWxsZXJ5UGxhY2Vob2xkZXJbZGF0YS1pbWFnZXNdJykpIHtcbiAgICAgICAgICAgICQoJy5pbWFnZXMtbGlzdCcpLmFwcGVuZCgkKGN1cnJlbnROb2RlJC5odG1sKCkpKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdEcm9wem9uZU1hbmFnZXInKS5pbml0KCk7XG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBTdWJtaXQgSFRNTCB0byBUaW55TUNFOlxuXG4gICAgICAgIHZhciBpbWFnZXNJZHMgPSBbXTtcbiAgICAgICAgdmFyIGltYWdlc0h0bWwgPSAnJztcbiAgICAgICAgJCgnLmltYWdlcy1saXN0IC5pbWFnZVtkYXRhLWlkXScpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpbWFnZXNJZHMucHVzaCgkKHRoaXMpLmRhdGEoXCJpZFwiKSk7XG4gICAgICAgICAgICBpbWFnZXNIdG1sICs9ICQodGhpcylbMF0ub3V0ZXJIVE1MO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdHlwZUNsYXNzTmFtZSA9IChnZXRRdWVyeVBhcmFtZXRlcnMoKS50eXBlID09ICdCVVRUT05fR0FMTEVSWScgPyAndHlwZS1nYWxsZXJ5JyA6ICd0eXBlLWltYWdlJyk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuaW5zZXJ0Q29udGVudCgnPGRpdiBjbGFzcz1cIm1jZU5vbkVkaXRhYmxlIGdhbGxlcnlQbGFjZWhvbGRlciAnICsgdHlwZUNsYXNzTmFtZSArICdcIiBkYXRhLWltYWdlcz1cIicgKyBpbWFnZXNJZHMgKyAnXCI+JyArIGltYWdlc0h0bWwgKyAnPC9kaXY+Jyk7XG4gICAgfVxuXG59O1xuIiwiZnVuY3Rpb24gV3lzaXd5Z01hbmFnZXIoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5zZXRPcHRpb25zKCk7IC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICB0aGlzLm9wdGlvbnNbdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yXSA9IGdldERlZmF1bHRUaW55TWNlT3B0aW9ucygpO1xufVxuXG5XeXNpd3lnTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIGRlZmF1bHRXeXNpd3lnU2VsZWN0b3I6ICd0ZXh0YXJlYVtkYXRhLXd5c2l3eWddJyxcbiAgICBvcHRpb25zOiB7fSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICBzZXRPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9ucywgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdID0gJC5leHRlbmQodGhpcy5vcHRpb25zW3NlbGVjdG9yXSwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGNzc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFkZENvbnRlbnRDc3M6IGZ1bmN0aW9uIChjc3MsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPSBbdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2Nzc107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2NzcyA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MuY29uY2F0KGNzcylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGx1Z2luTmFtZVxuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFkZFBsdWdpbjogZnVuY3Rpb24gKHBsdWdpbk5hbWUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMgPSB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgYXBwZW5kVG9vbGJhcjogZnVuY3Rpb24gKGJ1dHRvbnMsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAoIWJ1dHRvbnMuc3RhcnRzV2l0aCgnICcpKSB7XG4gICAgICAgICAgICBidXR0b25zID0gJyAnICsgYnV0dG9ucztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIgKz0gYnV0dG9ucztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVtb3ZlXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgcmVtb3ZlRnJvbVRvb2xiYXI6IGZ1bmN0aW9uIChyZW1vdmUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuXG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhciA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhci5yZXBsYWNlKHJlbW92ZSwgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgcHJlcGVuZFRvb2xiYXI6IGZ1bmN0aW9uIChidXR0b25zLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYgKCFidXR0b25zLmVuZHNXaXRoKCcgJykpIHtcbiAgICAgICAgICAgIGJ1dHRvbnMgPSBidXR0b25zICsgJyAnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhciA9IGJ1dHRvbnMgKyB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge1d5c2l3eWdNYW5hZ2VyLm9wdGlvbnN8e319XG4gICAgICovXG4gICAgZ2V0T3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdEFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZWRpdG9yUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBfdGhpcy5pbml0Q3VzdG9tTW9kdWxlcygpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuZ2V0T3B0aW9ucygpO1xuXG4gICAgICAgIF90aGlzLmFwcC5maXJlKCdiZWZvcmVBbGxXeXNpd3lnSW5pdCcpO1xuICAgICAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcblxuICAgICAgICAgICAgICAgICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zW3NlbGVjdG9yXS5zZXR1cCA9IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdG9kbzog0YPQsdGA0LDRgtGMINCz0LvQvtCx0LDQu9GM0L3Ri9C5IHRpbnltY2UsINC4INC00LXRgNCz0LDRgtGMINC60L7QvdC60YDQtdGC0L3Ri9C5INGA0LXQtNCw0LrRgtC+0YBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbignaW5pdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykudGlueW1jZShvcHRpb25zW3NlbGVjdG9yXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yUHJvbWlzZXMucHVzaChkLnByb21pc2UoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAkLndoZW4uYXBwbHkoJCwgZWRpdG9yUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuYXBwLmZpcmUoJ2FmdGVyQWxsV3lzaXd5Z0luaXQnKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRDdXN0b21Nb2R1bGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0dhbGxlcnlNb2R1bGUnKS5yZWdpc3RlcigpO1xuICAgICAgICB0aGlzLmFkZFBsdWdpbihbJ2dhbGxlcnknXSk7XG4gICAgfVxufTtcbiIsIi8qKlxuICogQ3JlYXRlZCBieSB4cHVuZGVsIG9uIDA0LjA0LjE2LlxuICovXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLmxlbmd0aCkge1xuICAgICAgICAkKCdbZGF0YS1yb3ctZm9yLWZpZWxkPVwicm9sZS5uYW1lXCJdIHNlbGVjdCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgJCgndHJbZGF0YS1yb3ctZm9yLWZpZWxkPVwiYWNsXCJdJykuaGlkZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5zaG93KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgIH1cbn0pOyIsImZ1bmN0aW9uIERyb3B6b25lTWFuYWdlcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuRHJvcHpvbmVNYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciB0ZW1wbGF0ZUltYWdlID0gdHdpZyh7XG4gICAgICAgICAgICBkYXRhOiAkKCcjaW1hZ2UtcHJldmlldy10ZW1wbGF0ZScpLmh0bWwoKVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHRlbXBsYXRlRmlsZSA9IHR3aWcoe1xuICAgICAgICAgICAgZGF0YTogJCgnI2ZpbGUtcHJldmlldy10ZW1wbGF0ZScpLmh0bWwoKVxuICAgICAgICB9KTtcblxuICAgICAgICAkKFwiLmRyb3B6b25lXCIpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGRyb3B6b25lJCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaXNNdWx0aXBsZSA9IGRyb3B6b25lJC5kYXRhKCdtdWx0aXBsZScpID09IFwiMVwiO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmRyb3B6b25lKHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYWxsZWxVcGxvYWRzOiAzLFxuICAgICAgICAgICAgICAgICAgICBhZGRSZW1vdmVMaW5rczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdXBsb2FkTXVsdGlwbGU6IGlzTXVsdGlwbGUsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZUltYWdlVGh1bWJuYWlsczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1heEZpbGVzOiBpc011bHRpcGxlID8gbnVsbCA6IDEsXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtTmFtZTogJCh0aGlzKS5kYXRhKCdpbnB1dC1uYW1lJyksXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrYWJsZTogJCh0aGlzKS5maW5kKFwiLmR6LW1lc3NhZ2VcIilbMF0sXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdGVkRmlsZXM6IGRyb3B6b25lJC5kYXRhKCd0eXBlJykgPT0gJ2ltYWdlJyA/ICdpbWFnZS8qJyA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHVybDogX3RoaXMuYXBwLmJhc2VVcmwgKyBcIi8/X3Rva2VuPVwiICsgX3RoaXMuYXBwLmdldENzcmZUb2tlblBhcmFtZXRlcigpLl90b2tlbiArIGRyb3B6b25lJC5kYXRhKCdwYXJhbWV0ZXJzJyksXG5cbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGZpbGUsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTXVsdGlwbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSQucHJldigpLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRyb3B6b25lJC5kYXRhKCd0eXBlJykgPT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRyb3B6b25lJC5wcmV2KCkuZmluZCgnLmltYWdlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmltYWdlLmlkICsgJ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lJC5wcmV2KCkuYXBwZW5kKHRlbXBsYXRlSW1hZ2UucmVuZGVyKHJlc3BvbnNlW2ldKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVcGxvYWRhYmxlc0xpc3QnKS5pbml0RmFuY3lib3goZHJvcHpvbmUkLnByZXYoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWRyb3B6b25lJC5wcmV2KCkuZmluZCgnLmZpbGVbZGF0YS1pZD0nICsgcmVzcG9uc2VbaV0uZmlsZS5pZCArICddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSQucHJldigpLmFwcGVuZCh0ZW1wbGF0ZUZpbGUucmVuZGVyKHJlc3BvbnNlW2ldKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGZpbGUsIGVycm9yTWVzc2FnZSwgeGhyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUZpbGUoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3RvZG86INC90L7RgNC80LDQu9GM0L3QviDQvtCx0YDQsNCx0LDRgtGL0LLQsNGC0Ywg0Lgg0L/QvtC60LDQt9GL0LLQsNGC0Ywg0L7RiNC40LHQutC4XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmdyb3dsLmVycm9yKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ9Ce0YjQuNCx0LrQsCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ9Cd0LUg0YPQtNCw0LXRgtGB0Y8g0LfQsNCz0YDRg9C30LjRgtGMINGE0LDQudC7INC90LAg0YHQtdGA0LLQtdGALiDQndC10LLQtdGA0L3Ri9C5INGE0L7RgNC80LDRgiDQuNC70Lgg0YHQu9C40YjQutC+0Lwg0LHQvtC70YzRiNC+0Lkg0YDQsNC30LzQtdGALicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDcwMDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG5cbiAgICB9LFxuXG5cbn07IiwiZnVuY3Rpb24gRm9ybShhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuRm9ybS5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmluaXRTYXZlKCk7XG4gICAgICAgIHRoaXMuaW5pdERhdGVwaWNrZXIoKTtcbiAgICB9LFxuXG4gICAgaW5pdFNhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5mb3JtLWJ1dHRvbnMgYnV0dG9uLnNhdmUtYnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZvcm1EYXRhID0gJCgnLm1haW4tY21zLWZvcm0nKS5zZXJpYWxpemUoKTtcbiAgICAgICAgICAgIHZhciBjcmVhdGVNb2RlID0gJCgnLmNtcy1tb2R1bGUtZm9ybS1wYWdlJykuZGF0YSgnY3JlYXRlLW1vZGUnKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VJJykudG9nZ2xlU3Bpbm5lcih0cnVlKTtcbiAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVSScpLnRvZ2dsZUZvcm1CdXR0b25zKGZhbHNlKTtcblxuICAgICAgICAgICAgLy8gTWluaW11bSBkZWxheSB0byBhdm9pZCB1bnBsZWFzYW50IGJsaW5raW5nXG4gICAgICAgICAgICAkLndoZW4oXG4gICAgICAgICAgICAgICAgJC5wb3N0KF90aGlzLmFwcC5iYXNlVXJsICsgJy8nLCBmb3JtRGF0YSksXG4gICAgICAgICAgICAgICAgZGVsYXkoY3JlYXRlTW9kZSA/IDEwMCA6IDUwMClcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgICAgIGlmIChjcmVhdGVNb2RlICYmIHBhcnNlSW50KHJlc3BvbnNlKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IF8ucnRyaW0oZG9jdW1lbnQubG9jYXRpb24uaHJlZiwgJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVybC5lbmRzV2l0aCgnL2NyZWF0ZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSBfLnN0ckxlZnRCYWNrKHVybCwgJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gdXJsICsgJy8nICsgcmVzcG9uc2UgKyAnLyc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5ub3RpY2Uoe3RpdGxlOiAnJywgbWVzc2FnZTogXCJD0L7RhdGA0LDQvdC10L3QvlwifSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVSScpLnRvZ2dsZVNwaW5uZXIoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVGb3JtQnV0dG9ucyh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBpbml0RGF0ZXBpY2tlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAvL3RvZG86INC/0L7QtNGD0LzQsNGC0YwsINC90LDRgdGH0LXRgiBsaXZlP1xuICAgICAgICAkKCcuZGF0ZXBpY2tlcicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICQodGhpcylbMF0sXG4gICAgICAgICAgICAgICAgdGhlbWU6ICdkYXJrLXRoZW1lJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdERC5NTS5ZWVlZJyxcbiAgICAgICAgICAgICAgICBmaXJzdERheTogMSxcbiAgICAgICAgICAgICAgICBzaG93VGltZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgaTE4bjoge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c01vbnRoOiAn0J/RgNC10LTRi9C00YPRidC40Lkg0LzQtdGB0Y/RhicsXG4gICAgICAgICAgICAgICAgICAgIG5leHRNb250aDogJ9Ch0LvQtdC00YPRjtGJ0LjQuSDQvNC10YHRj9GGJyxcbiAgICAgICAgICAgICAgICAgICAgbW9udGhzOiBbJ9Cv0L3QstCw0YDRjCcsICfQpNC10LLRgNCw0LvRjCcsICfQnNCw0YDRgicsICfQkNC/0YDQtdC70YwnLCAn0JzQsNC5JywgJ9CY0Y7QvdGMJywgJ9CY0Y7Qu9GMJywgJ9CQ0LLQs9GD0YHRgicsICfQodC10L3RgtGP0LHRgNGMJywgJ9Ce0LrRgtGP0LHRgNGMJywgJ9Cd0L7Rj9Cx0YDRjCcsICfQlNC10LrQsNCx0YDRjCddLFxuICAgICAgICAgICAgICAgICAgICB3ZWVrZGF5czogWyfQktC+0YHQutGA0LXRgdC10L3RjNC1JywgJ9Cf0L7QvdC10LTQtdC70YzQvdC40LonLCAn0JLRgtC+0YDQvdC40LonLCAn0KHRgNC10LTQsCcsICfQp9C10YLQstC10YDQsycsICfQn9GP0YLQvdC40YbQsCcsICfQodGD0LHQsdC+0YLQsCddLFxuICAgICAgICAgICAgICAgICAgICB3ZWVrZGF5c1Nob3J0OiBbJ9CS0YEnLCAn0J/QvScsICfQktGCJywgJ9Ch0YAnLCAn0KfRgicsICfQn9GCJywgJ9Ch0LEnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS5pcygnLmRhdGV0aW1lJykpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gXy5leHRlbmQob3B0aW9ucywge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6ICdERC5NTS5ZWVlZIEhIOm1tJyxcbiAgICAgICAgICAgICAgICAgICAgc2hvd1RpbWU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNob3dTZWNvbmRzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdXNlMjRob3VyOiB0cnVlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmV3IFBpa2FkYXkob3B0aW9ucyk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCcuZGF0ZXBpY2tlciArIC5jbGVhci1kYXRlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5wcmV2KCkudmFsKCcnKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTsiLCJmdW5jdGlvbiBHb29nbGVNYXAoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkdvb2dsZU1hcC5wcm90b3R5cGUgPSB7XG4gICAgaW5pdE1hcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCQoJy5tYXAuZ29vZ2xlW2RhdGEtbGF0XVtkYXRhLWxuZ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICQuZ2V0U2NyaXB0KFwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCRjl3TldnQzE2aUNIbVRsb1dFbDVZN3NBUkRTeXFSVUUmbGlicmFyaWVzPXBsYWNlcyZzZW5zb3I9ZmFsc2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5maXJlKCdhZnRlckdvb2dsZU1hcHNBcGlMb2FkJyk7XG4gICAgICAgICAgICAgICAgJCgnLm1hcFtkYXRhLWxhdF1bZGF0YS1sbmddJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3RMYXQgPSBwYXJzZUZsb2F0KCQodGhpcykuZGF0YSgnbGF0JykpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0TG5nID0gcGFyc2VGbG9hdCgkKHRoaXMpLmRhdGEoJ2xuZycpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBUeXBlQ29udHJvbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlZXRWaWV3Q29udHJvbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGx3aGVlbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB6b29tOiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9iamVjdExhdCwgb2JqZWN0TG5nKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0TGF0ICYmIG9iamVjdExuZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwT3B0aW9ucy56b29tID0gMTI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcEVsZW1lbnQgPSAkKHRoaXMpWzBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChtYXBFbGVtZW50LCBtYXBPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob2JqZWN0TGF0LCBvYmplY3RMbmcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwOiBtYXBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCBcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChtYXBFbGVtZW50KS5jbG9zZXN0KCcubGF0LWxuZy1jb250YWluZXInKS5maW5kKFwiW2RhdGEtbGF0bG5nLWZpZWxkPWxhdF1cIikudmFsKGV2ZW50LmxhdExuZy5sYXQoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICQobWFwRWxlbWVudCkuY2xvc2VzdCgnLmxhdC1sbmctY29udGFpbmVyJykuZmluZChcIltkYXRhLWxhdGxuZy1maWVsZD1sbmddXCIpLnZhbChldmVudC5sYXRMbmcubG5nKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24oZXZlbnQubGF0TG5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBzZWFyY2ggYm94IGFuZCBsaW5rIGl0IHRvIHRoZSBVSSBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFjLWlucHV0Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkub24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLndoaWNoID09IDEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWFyY2hCb3ggPSBuZXcgZ29vZ2xlLm1hcHMucGxhY2VzLlNlYXJjaEJveChpbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5jb250cm9sc1tnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb24uVE9QX0xFRlRdLnB1c2goaW5wdXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIG1hcC5hZGRMaXN0ZW5lcignYm91bmRzX2NoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hCb3guc2V0Qm91bmRzKG1hcC5nZXRCb3VuZHMoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXJzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaEJveC5hZGRMaXN0ZW5lcigncGxhY2VzX2NoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGxhY2VzID0gc2VhcmNoQm94LmdldFBsYWNlcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsYWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwbGFjZSA9IHBsYWNlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbGFjZS5nZW9tZXRyeS52aWV3cG9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGdlb2NvZGVzIGhhdmUgdmlld3BvcnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdW5kcy51bmlvbihwbGFjZS5nZW9tZXRyeS52aWV3cG9ydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzLmV4dGVuZChwbGFjZS5nZW9tZXRyeS5sb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5maXRCb3VuZHMoYm91bmRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYWZ0ZXJNYXBzSW5pdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbiIsImZ1bmN0aW9uIExlZnRNZW51KGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5MZWZ0TWVudS5wcm90b3R5cGUgPSB7XG4gICAgaW5pdE1haW5NZW51OiBmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLm1haW4tbWVudSAubGVmdC1wYW5lbDpub3QoLmNvbGxhcHNlZCksIC5tYWluLW1lbnUgLnJpZ2h0LXBhbmVsJykubUN1c3RvbVNjcm9sbGJhcih7XG4gICAgICAgICAgICB0aGVtZTogXCJsaWdodC0yXCIsXG4gICAgICAgICAgICBhdXRvRXhwYW5kU2Nyb2xsYmFyOiB0cnVlLFxuICAgICAgICAgICAgc2Nyb2xsSW5lcnRpYTogNDAwLFxuICAgICAgICAgICAgbW91c2VXaGVlbDoge1xuICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2tzOiB7XG4gICAgICAgICAgICAgICAgb25TY3JvbGw6IGZ1bmN0aW9uIChxLCBxMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbnRlbnQgc2Nyb2xsZWQuLi5cIiwgcSwgcTEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHRvZG86INC/0YDQuNC6INC70LrQuNC60LUg0L/QviDQvNC10L3RjiAtINC30LDQv9C+0LzQuNC90LDRgtGMINCyINC70L7QutCw0Lst0YHRgtC+0YDQsNC00LbQtSDRgdC60YDQvtC70LvQotC+0L8sINC4INC/0L7RgtC+0Lwg0L/RgNC4INC40L3QuNGG0LjQsNC70LjQt9Cw0YbQuNC4IC0g0YHRgNCw0LfRgyDRgdC60YDQvtC70LvQuNGC0Ywg0L3QsCDQvdC10LPQvi5cbiAgICAgICAgICAgIC8vIHRvZG86INCf0YDQuCDQt9Cw0LPRgNGD0LfQutC1INGB0YLRgNCw0L3QuNGG0YsgLSDQvtCx0L3Rg9C70Y/RgtGMINGN0YLQviDQt9C90LDRh9C10L3QuNC1INCyINC70L7QutCw0LvRgdGC0L7RgNCw0LTQttC1XG4gICAgICAgICAgICAvLyB0b2RvOiDQtdGB0LvQuCDQtdGB0YLRjCDQstGL0LTQtdC70LXQvdC90YvQuSDQv9GD0L3QutGCLCDQsCDRgdC+0YXRgNCw0L3QtdC90L3QvtCz0L4g0LfQvdCw0YfQtdC90LjRjyDQvdC10YIsINGC0L4g0LLRi9GH0LjRgdC70Y/RgtGMINC10LPQviDQv9GA0LjQvNC10YDQvdC+INC4INGB0LXRgNC+0LvQu9C40YLRjCDRgtGD0LTQsFxuICAgICAgICAgICAgLy8gdG9kbzog0LAg0LLQvtC+0LHRidC1LCDQv9C10YDQtdC00LXQu9Cw0YLRjCDQstGB0LUg0L3QsCDQsNGP0LrRgSwg0YHRg9C60LBcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4iLCJmdW5jdGlvbiBMaXN0KGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5MaXN0LnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBzZWxlY3RvcnM6IHtcbiAgICAgICAgJ3N0YXR1cyc6IFsnLmNtcy1tb2R1bGUtbGlzdC1jb250ZW50IGJ1dHRvbi5zdGF0dXMnLCAnLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50IGJ1dHRvbi5zdGF0dXMnXSxcbiAgICAgICAgJ2RlbGV0ZSc6IFsnLmNtcy1tb2R1bGUtbGlzdC1jb250ZW50IGJ1dHRvbi5kZWxldGUnLCAnLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50IGJ1dHRvbi5kZWxldGUnXSxcbiAgICAgICAgJ2FkZCc6ICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLmFkZCcsXG4gICAgICAgICdhZGRSb290JzogJy5hZGQtbmV3LXRyZWUtaXRlbSdcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5pdEJ1dHRvbnMoKTtcbiAgICAgICAgdGhpcy5pbml0U29ydGFibGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBpbml0QnV0dG9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmluaXRTdGF0dXNCdXR0b24oKTtcbiAgICAgICAgdGhpcy5pbml0RGVsZXRlQnV0dG9uKCk7XG4gICAgICAgIHRoaXMuaW5pdEFkZEJ1dHRvbigpO1xuICAgICAgICB0aGlzLmluaXRBZGRUb1Jvb3RCdXR0b24oKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgc3RhdHVzXG4gICAgICovXG4gICAgaW5pdFN0YXR1c0J1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuc3RhdHVzLmpvaW4oJywnKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGlkID0gX3RoaXMuZ2V0SXRlbUlkKGJ0biQpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gX3RoaXMuZ2V0SXRlbU1vZGVsKGJ0biQpO1xuICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gX3RoaXMuZ2V0SXRlbUNvbnRhaW5lcihidG4kKTtcblxuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsndG9nZ2xlJywgbW9kZWwsIGlkLCAnc3RhdHVzJ10sIDEpO1xuXG4gICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGl0ZW1Db250YWluZXIkLnRvZ2dsZUNsYXNzKCdpbmFjdGl2ZScsICFyZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogRGVsZXRlIG9iamVjdFxuICAgICAqL1xuICAgIGluaXREZWxldGVCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgLy8gY29uc29sZS5sb2coX3RoaXMuc2VsZWN0b3JzLmRlbGV0ZSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIF90aGlzLnNlbGVjdG9ycy5kZWxldGUuam9pbignLCcpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlybSgnU3VyZT8nKSkge1xuICAgICAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBfdGhpcy5nZXRJdGVtSWQoYnRuJCk7XG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gX3RoaXMuZ2V0SXRlbU1vZGVsKGJ0biQpO1xuICAgICAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IF90aGlzLmdldEl0ZW1Db250YWluZXIoYnRuJCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydkZWxldGUnLCBtb2RlbCwgaWRdLCAxKTtcblxuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1Db250YWluZXIkLmZhZGVPdXQoJ2Zhc3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hpbGRcbiAgICAgKi9cbiAgICBpbml0QWRkQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIF90aGlzLnNlbGVjdG9ycy5hZGQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpZCA9IF90aGlzLmdldEl0ZW1JZChidG4kKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IF90aGlzLmdldEl0ZW1Db250YWluZXIoYnRuJCk7XG5cbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2NyZWF0ZScsIG1vZGVsLCBfdGhpcy5nZW5lcmF0ZVJhbmRvbUlkU3RyaW5nKCksICdwYXJlbnRfaWQnXSwgaWQpO1xuXG4gICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IGJ0biQuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZmluZCgnc2NyaXB0W2RhdGEtdGVtcGxhdGUtbmFtZT1cImVtcHR5LXRyZWUtZWxlbWVudFwiXScpLmh0bWwoKTtcbiAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5maW5kKCc+dWwnKS5hcHBlbmQoX3RoaXMuY3JlYXRlTmV3RWxlbWVudCh0ZW1wbGF0ZSwgcmVzdWx0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQWRkIG9iamVjdCB0byB0aGUgdHJlZSByb290XG4gICAgICovXG4gICAgaW5pdEFkZFRvUm9vdEJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuYWRkUm9vdCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gYnRuJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKTtcbiAgICAgICAgICAgIHZhciBpZCA9IHBhcnNlSW50KGl0ZW1Db250YWluZXIkLmRhdGEoJ3RyZWUtcm9vdCcpKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IGl0ZW1Db250YWluZXIkLmRhdGEoJ21vZGVsJyk7XG5cbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2NyZWF0ZScsIG1vZGVsLCBfdGhpcy5nZW5lcmF0ZVJhbmRvbUlkU3RyaW5nKCksICdwYXJlbnRfaWQnXSwgaWQpO1xuXG4gICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IGJ0biQuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZmluZCgnc2NyaXB0W2RhdGEtdGVtcGxhdGUtbmFtZT1cImVtcHR5LXRyZWUtZWxlbWVudFwiXScpLmh0bWwoKTtcbiAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5maW5kKCd1bDpmaXJzdCcpLmFwcGVuZChfdGhpcy5jcmVhdGVOZXdFbGVtZW50KHRlbXBsYXRlLCByZXN1bHQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBpbml0U29ydGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgZnVuY3Rpb24gaW5pdFNvcnRhYmxlRW5naW5lKGVsLCBoYW5kbGVOYW1lLCBncm91cE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZShlbCwge1xuICAgICAgICAgICAgICAgIHNjcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb246IDIwMCxcbiAgICAgICAgICAgICAgICBncm91cDogZ3JvdXBOYW1lLFxuICAgICAgICAgICAgICAgIGhhbmRsZTogaGFuZGxlTmFtZSxcbiAgICAgICAgICAgICAgICBvbkFkZDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25UcmVlU29ydChldnQsIHNvcnRhYmxlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCkge1xuICAgICAgICAgICAgICAgICAgICBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSkge1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gJChldnQudGFyZ2V0KS5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCdtb2RlbCcpO1xuICAgICAgICAgICAgdmFyIHBhcmVudElkID0gJChldnQudGFyZ2V0KS5kYXRhKCdpZCcpO1xuICAgICAgICAgICAgdmFyIG9yZGVyQXJyYXkgPSBzb3J0YWJsZS50b0FycmF5KCkuZmlsdGVyKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbCA+PSAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe3NhdmU6IHt9fSwgX3RoaXMuYXBwLmdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF0gPSB7fTsgLy8gb2JqZWN0LCBub3QgYW4gYXJyYXkuIE90aGVyd2lzZSBpdCB3aWxsIGNyZWF0ZSAwLi5pZCBlbXB0eSBlbGVtZW50c1xuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcmRlckFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKG9yZGVyQXJyYXkuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddW21vZGVsXVtvcmRlckFycmF5W2ldXSA9IHsnc2hvd19vcmRlcic6IHBhcnNlSW50KGkpICsgMSwgJ3BhcmVudF9pZCc6IHBhcmVudElkfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUcmVlc1xuICAgICAgICAkKCcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQnKS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgcGxhaW4gPSAkKHRoaXMpLmRhdGEoJ3BsYWluJykgPT09IDE7XG4gICAgICAgICAgICB2YXIgdHJlZU5hbWUgPSAndHJlZV8nICsgaTtcbiAgICAgICAgICAgICQodGhpcykuZmluZCgocGxhaW4gPyAnPicgOiAnJykgKyAndWwnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpbml0U29ydGFibGVFbmdpbmUoJCh0aGlzKVswXSwgJy5pZCcsIHRyZWVOYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMaXN0c1xuICAgICAgICAkKCcuY21zLW1vZHVsZS1saXN0LWNvbnRlbnRbZGF0YS1zb3J0YWJsZT1cInRydWVcIl0gdGJvZHknKS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgbGlzdE5hbWUgPSAnbGlzdF8nICsgaTtcbiAgICAgICAgICAgIGluaXRTb3J0YWJsZUVuZ2luZSgkKHRoaXMpWzBdLCAnLmNvbHVtbi1pZCcsIGxpc3ROYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWwkXG4gICAgICogQHJldHVybnMgeyp8SFRNTEVsZW1lbnR8bnVsbH1cbiAgICAgKi9cbiAgICBnZXRJdGVtQ29udGFpbmVyOiBmdW5jdGlvbiAoZWwkKSB7XG4gICAgICAgIHJldHVybiBlbCQuY2xvc2VzdCgnW2RhdGEtaWRdJyk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWwkXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZ2V0SXRlbUlkOiBmdW5jdGlvbiAoZWwkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEl0ZW1Db250YWluZXIoZWwkKS5kYXRhKCdpZCcpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsJFxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGdldEl0ZW1Nb2RlbDogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICByZXR1cm4gZWwkLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgfSxcblxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2VuZXJhdGVSYW5kb21JZFN0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJyVDUkVBVEVfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA4KSArICclJztcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSByZXN1bHRcbiAgICAgKiBAcmV0dXJucyB7KnxqUXVlcnl9XG4gICAgICovXG4gICAgY3JlYXRlTmV3RWxlbWVudDogZnVuY3Rpb24gKHRlbXBsYXRlLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIG5ld0l0ZW0kID0gJCh0ZW1wbGF0ZS5yZXBsYWNlKG5ldyBSZWdFeHAoJyVDUkVBVEVfJScsICdnJyksIHJlc3VsdCkpLmF0dHIoJ2RhdGEtaWQnLCByZXN1bHQpO1xuICAgICAgICBuZXdJdGVtJC5maW5kKCcuaWQnKS50ZXh0KHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXdJdGVtJDtcbiAgICB9XG59OyIsImZ1bmN0aW9uIFVJKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5VSS5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIHVzZXJNZW51OiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmluaXRVc2VyTWVudSgpO1xuICAgICAgICB0aGlzLmluaXRIcmVmQnV0dG9ucygpO1xuICAgICAgICB0aGlzLmluaXRTdGFydHVwTm90aWZpY2F0aW9ucygpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdHb29nbGVNYXAnKS5pbml0TWFwcygpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdMZWZ0TWVudScpLmluaXRNYWluTWVudSgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdMaXN0JykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdGb3JtJykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdEcm9wem9uZU1hbmFnZXInKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ1VwbG9hZGFibGVzTGlzdCcpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVmlkZW9zTGlzdCcpLmluaXQoKTtcbiAgICB9LFxuXG4gICAgaW5pdFN0YXJ0dXBOb3RpZmljYXRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkKCcuY21zLW1vZHVsZS1mb3JtLXBhZ2UnKS5kYXRhKCdqdXN0LWNyZWF0ZWQnKSkge1xuICAgICAgICAgICAgJC5ncm93bC5ub3RpY2Uoe3RpdGxlOiAnJywgbWVzc2FnZTogXCLQntCx0YrQtdC60YIg0YHQvtC30LTQsNC9XCJ9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0VXNlck1lbnU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy51c2VyLWljb24nKSkge1xuICAgICAgICAgICAgdGhpcy51c2VyTWVudSA9IG5ldyBEcm9wKHtcbiAgICAgICAgICAgICAgICBvcGVuT246ICdjbGljaycsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdib3R0b20gcmlnaHQnLFxuICAgICAgICAgICAgICAgIHRhcmdldDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXItaWNvbicpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICQoJy51c2VyLWRyb3Bkb3duLWNvbnRhaW5lcicpLmh0bWwoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdEhyZWZCdXR0b25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdidXR0b25baHJlZl0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gJCh0aGlzKS5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB0b2dnbGVTcGlubmVyOiBmdW5jdGlvbiAoc2hvdykge1xuICAgICAgICAkKCcjc3Bpbm5lcicpLnRvZ2dsZUNsYXNzKCdzaG93Jywgc2hvdyk7XG4gICAgfSxcblxuICAgIHRvZ2dsZUZvcm1CdXR0b25zOiBmdW5jdGlvbiAoZW5hYmxlKSB7XG4gICAgICAgICQoJy5mb3JtLWJ1dHRvbnMgYnV0dG9uJykucHJvcCgnZGlzYWJsZWQnLCAhZW5hYmxlKTtcbiAgICB9XG5cbn0iLCJmdW5jdGlvbiBVcGxvYWRhYmxlc0xpc3QoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblVwbG9hZGFibGVzTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIFsnaW1hZ2UnLCAnZmlsZSddLmZvckVhY2goZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgICAgICBfdGhpcy5pbml0RGVsZXRlQnV0dG9uKG1vZGVsKTtcblxuICAgICAgICAgICAgJCgnLicgKyBtb2RlbCArICdzLWxpc3QnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwgPT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbml0RmFuY3lib3goJCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLmluaXRTb3J0YWJsZSgkKHRoaXMpWzBdLCBtb2RlbClcblxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBpbml0RGVsZXRlQnV0dG9uOiBmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy4nICsgbW9kZWwgKyAncy1saXN0IC4nICsgbW9kZWwgKyAnIC5kZWxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlybSgnU3VyZT8nKSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50JCA9ICQodGhpcykuY2xvc2VzdCgnLicgKyBtb2RlbCk7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gZWxlbWVudCQuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydkZWxldGUnLCBtb2RlbCwgaWRdLCAxKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50JC5mYWRlT3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRTb3J0YWJsZTogZnVuY3Rpb24gKGVsLCBtb2RlbCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoZWwsIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgaGFuZGxlOiBtb2RlbCA9PSAnZmlsZScgPyBcIi5pY29uXCIgOiBudWxsLFxuICAgICAgICAgICAgc2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JkZXJBcnJheSA9IHNvcnRhYmxlLnRvQXJyYXkoKTtcbiAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydzYXZlJywgbW9kZWxdLCB7fSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcmRlckFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmRlckFycmF5Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bbW9kZWxdW29yZGVyQXJyYXlbaV1dID0geydzaG93X29yZGVyJzogcGFyc2VJbnQoaSkgKyAxfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0RmFuY3lib3g6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgZWwkLmZpbmQoJy5pbWFnZSA+IGEnKS5mYW5jeWJveCh7XG4gICAgICAgICAgICBwYWRkaW5nOiAxLFxuICAgICAgICAgICAgb3BlbkVmZmVjdDogJ2VsYXN0aWMnLFxuICAgICAgICAgICAgaGVscGVyczoge1xuICAgICAgICAgICAgICAgIG92ZXJsYXk6IHtcbiAgICAgICAgICAgICAgICAgICAgbG9ja2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFja2dyb3VuZCc6ICdyZ2JhKDAsMCwwLDAuNSknXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG59OyIsImZ1bmN0aW9uIFZpZGVvc0xpc3QoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblZpZGVvc0xpc3QucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB2YXIgdGVtcGxhdGVJbWFnZSA9IHR3aWcoe1xuICAgICAgICAgICAgZGF0YTogJCgnI2ltYWdlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jbXMtYnV0dG9uW2RhdGEtYWRkLXZpZGVvXScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZmFuY3lib3gub3Blbih0d2lnKHtkYXRhOiAkKCcjaW5zZXJ0LXZpZGVvLXRlbXBsYXRlJykuaHRtbCgpfSkucmVuZGVyKHtcbiAgICAgICAgICAgICAgICBpbnB1dE5hbWU6ICQodGhpcykuZGF0YSgnaW5wdXQtbmFtZScpXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmluc2VydC12aWRlby1kaWFsb2cgYnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGRpYWxvZyQgPSAkKHRoaXMpLmNsb3Nlc3QoJy5pbnNlcnQtdmlkZW8tZGlhbG9nJyk7XG4gICAgICAgICAgICB2YXIgdGV4dGFyZWEkID0gZGlhbG9nJC5maW5kKCd0ZXh0YXJlYScpO1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKCk7XG4gICAgICAgICAgICBwYXlsb2FkW3RleHRhcmVhJC5hdHRyKCduYW1lJyldID0gdGV4dGFyZWEkLnZhbCgpO1xuICAgICAgICAgICAgcGF5bG9hZFsnbXVsdGlwbGUnXSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRpYWxvZyQuYWRkQ2xhc3MoJ3Byb2Nlc3NpbmcnKTtcbiAgICAgICAgICAgIHRleHRhcmVhJC5hdHRyKCdkaXNhYmxlZCcsIHRydWUpLmNzcygnYmFja2dyb3VuZCcsICcjZWVlJyk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnV0dG9uID0gJCgnLmNtcy1idXR0b25bZGF0YS1hZGQtdmlkZW9dW2RhdGEtaW5wdXQtbmFtZT1cIicgKyB0ZXh0YXJlYSQuYXR0cignbmFtZScpICsgJ1wiXScpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFidXR0b24ucHJldkFsbCgnLmltYWdlcy1saXN0OmZpcnN0JykuZmluZCgnLmltYWdlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmltYWdlLmlkICsgJ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5wcmV2QWxsKCcuaW1hZ2VzLWxpc3Q6Zmlyc3QnKS5hcHBlbmQodGVtcGxhdGVJbWFnZS5yZW5kZXIocmVzcG9uc2VbaV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VwbG9hZGFibGVzTGlzdCcpLmluaXRGYW5jeWJveChidXR0b24ucHJldkFsbCgnLmltYWdlcy1saXN0OmZpcnN0JykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZmFuY3lib3guY2xvc2UoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxufTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
