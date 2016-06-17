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
    get: function() {
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
            $.getScript("https://maps.googleapis.com/maps/api/js?libraries=places&sensor=false", function () {
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
        toolbar: 'styleselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image table media | visualblocks code',

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
    addContentCss: function(css, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        if(typeof this.options[selector].content_css == 'string') {
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
        var _this = this;
        var options = this.getOptions();
        var editorPromises = [];

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

    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGguanMiLCJGYWNlcGFsbUNNUy5qcyIsIlNlcnZpY2VMb2NhdG9yLmpzIiwidXRpbGl0eS5qcyIsIlVJL0Ryb3B6b25lTWFuYWdlci5qcyIsIlVJL0Zvcm0uanMiLCJVSS9Hb29nbGVNYXAuanMiLCJVSS9MZWZ0TWVudS5qcyIsIlVJL0xpc3QuanMiLCJVSS9VSS5qcyIsIlVJL1VwbG9hZGFibGVzTGlzdC5qcyIsImV4dGVuZGVkL3VzZXJzLmpzIiwid3lzaXd5Zy9EZWZhdWx0VGlueU1jZU9wdGlvbnMuanMiLCJ3eXNpd3lnL1d5c2l3eWcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDck9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIEF1dGhNYW5hZ2VyKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5BdXRoTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKCcubG9naW4tZm9ybSBmb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQucG9zdCgkKHRoaXMpLmF0dHIoJ2FjdGlvbicpLCAkKHRoaXMpLnNlcmlhbGl6ZSgpLCAnanNvbicpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS51c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gJy9jbXMvJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnNoYWtlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7dGl0bGU6ICcnLCBtZXNzYWdlOiByZXNwb25zZS5lcnJvcnNbaV19KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RvZG86INC/0LXRgNC10LTQtdC70LDRgtGMINCy0YvQstC+0LQg0YLQtdC60YHRgtCwINC+0YjQuNCx0LrQuCEg0JvQvtC60LDQu9C40LfQsNGG0LjRjyFcblxuICAgICAgICAgICAgICAgICAgICAkLmdyb3dsLmVycm9yKHt0aXRsZTogJycsIG1lc3NhZ2U6ICfQndC10LLQtdGA0L3Ri9C1INC70L7Qs9C40L0g0LjQu9C4INC/0LDRgNC+0LvRjCd9KTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2hha2UoKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhyZXNwb25zZS5yZXNwb25zZUpTT04pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiAkKCcubG9naW4tZm9ybSBmb3JtJykubGVuZ3RoID09IDA7XG4gICAgfSxcblxuICAgIHNoYWtlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoJy5sb2dpbi1mb3JtJykuYWRkQ2xhc3MoJ3NoYWtlJyk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmxvZ2luLWZvcm0nKS5yZW1vdmVDbGFzcygnc2hha2UnKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxufTsiLCJfLm1peGluKHMuZXhwb3J0cygpKTtcbkRyb3B6b25lLmF1dG9EaXNjb3ZlciA9IGZhbHNlO1xuXG5cbi8qKlxuICpcbiAqIEByZXR1cm5zIHtGYWNlcGFsbUNNU3wqfVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEZhY2VwYWxtQ01TKCkge1xuXG4gICAgaWYgKGFyZ3VtZW50cy5jYWxsZWUuX3NpbmdsZXRvbkluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBhcmd1bWVudHMuY2FsbGVlLl9zaW5nbGV0b25JbnN0YW5jZTtcbiAgICB9XG5cbiAgICBhcmd1bWVudHMuY2FsbGVlLl9zaW5nbGV0b25JbnN0YW5jZSA9IHRoaXM7XG59XG5cblxuRmFjZXBhbG1DTVMucHJvdG90eXBlID0ge1xuICAgIGNzcmZUb2tlbjogJycsXG4gICAgYmFzZVVybDogbnVsbCxcbiAgICBzZXJ2aWNlTG9jYXRvcjogbnVsbCxcbiAgICBldmVudEhhbmRsZXJzOiB7fSxcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge0ZhY2VwYWxtQ01TfVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXphdGlvblxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZhY2VwYWxtQ01TfVxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5maXJlKCdiZWZvcmVJbml0Jyk7XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlTG9jYXRvciA9IG5ldyBTZXJ2aWNlTG9jYXRvcih0aGlzKTtcbiAgICAgICAgdGhpcy5iYXNlVXJsID0gJCgnYm9keScpLmRhdGEoJ2Jhc2UtdXJsJyk7XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlKCdXeXNpd3lnTWFuYWdlcicpOyAvL2luaXQgbWFuYWdlclxuXG4gICAgICAgIHRoaXMuZmlyZSgnYWZ0ZXJJbml0Jyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBVSSBhbmQgb3RoZXIgc2VydmljZXMsIGFmdGVyIGRvbSByZWFkeVxuICAgICAqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuZmlyZSgnYmVmb3JlU3RhcnQnKTtcblxuICAgICAgICAgICAgaWYgKF90aGlzLnNlcnZpY2UoJ0F1dGhNYW5hZ2VyJykuaW5pdCgpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuaW5pdFNlc3Npb25LZWVwQWxpdmUoKTtcblxuICAgICAgICAgICAgICAgIF90aGlzLnNlcnZpY2UoJ1VJJykuaW5pdCgpO1xuICAgICAgICAgICAgICAgIF90aGlzLnNlcnZpY2UoJ1d5c2l3eWdNYW5hZ2VyJykuaW5pdEFsbCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpcy5maXJlKCdhZnRlclN0YXJ0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc2VydmljZSBmcm9tIFNlcnZpY2UgTG9jYXRvclxuICAgICAqXG4gICAgICogQHBhcmFtIHNlcnZpY2VOYW1lXG4gICAgICogQHBhcmFtIHBhcmFtXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgc2VydmljZTogZnVuY3Rpb24gKHNlcnZpY2VOYW1lLCBwYXJhbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlTG9jYXRvci5nZXQoc2VydmljZU5hbWUsIHBhcmFtKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaXJlIGV2ZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnROYW1lXG4gICAgICovXG4gICAgZmlyZTogZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICBjb25zb2xlLmluZm8oZXZlbnROYW1lKTtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5tYXAoZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciByZWdpc3RyYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudE5hbWVcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGluZyB0aW1lclxuICAgICAqL1xuICAgIGluaXRTZXNzaW9uS2VlcEFsaXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZ2V0KCcuLycsIHsncGluZyc6ICdwaW5nJ30pO1xuICAgICAgICB9LCAxMjAwMDApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBwYXlsb2FkIG9iamVjdCBmb3IgYWpheCByZXF1ZXN0c1xuICAgICAqIEBwYXJhbSBwYXRoXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgYnVpbGRQYXlsb2FkOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKHt9LnNldFdpdGhQYXRoKHBhdGgsIHZhbHVlKSwgdGhpcy5nZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGF5bG9hZFxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGRvUmVxdWVzdDogZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuICQucG9zdCh0aGlzLmJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBDU1JGIHRva2VuIG9iamVjdCB7X3Rva2VuOid4eHgnfVxuICAgICAqIEByZXR1cm5zIHt7X3Rva2VuOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIGdldENzcmZUb2tlblBhcmFtZXRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuY3NyZlRva2VuKSB7XG4gICAgICAgICAgICB0aGlzLnNldENzcmZUb2tlbigkKCdpbnB1dDpoaWRkZW5bbmFtZT1fdG9rZW5dJykudmFsKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7J190b2tlbic6IHRoaXMuY3NyZlRva2VufTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IENTUkYgdG9rZW4gdmFsdWVcbiAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRDc3JmVG9rZW46IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmNzcmZUb2tlbiA9IHZhbHVlO1xuICAgIH1cblxufTtcblxuIiwiZnVuY3Rpb24gU2VydmljZUxvY2F0b3IoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblNlcnZpY2VMb2NhdG9yLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgc2VydmljZXNNYXA6IHt9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiAoY2xhc3NOYW1lLCBwYXJhbSkge1xuICAgICAgICBpZiAoIXRoaXMuc2VydmljZXNNYXBbY2xhc3NOYW1lXSkge1xuICAgICAgICAgICAgaWYgKHdpbmRvd1tjbGFzc05hbWVdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlc01hcFtjbGFzc05hbWVdID0gbmV3IHdpbmRvd1tjbGFzc05hbWVdKHRoaXMuYXBwLCBwYXJhbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcItCd0LXQuNC30LLQtdGB0YLQvdGL0Lkg0LrQu9Cw0YHRgTogXCIgKyBjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VzTWFwW2NsYXNzTmFtZV07XG4gICAgfSxcblxufTtcblxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMTQuMTIuMTUuXG4gKi9cblxuLyoqXG4gKiBAbWV0aG9kIHNldFdpdGhQYXRoXG4gKiBTZXRzIHRoZSBuZXN0ZWQgcHJvcGVydHkgb2Ygb2JqZWN0XG4gKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnc2V0V2l0aFBhdGgnLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkgeyAvKiBNYWtlcyBicmVha2Zhc3QsIHNvbHZlcyB3b3JsZCBwZWFjZSwgdGFrZXMgb3V0IHRyYXNoICovXG4gICAgICAgIGlmICh0eXBlb2YgIHBhdGggPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHBhdGggPSBwYXRoLnNwbGl0KCcuJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjdXIgPSB0aGlzO1xuICAgICAgICB2YXIgZmllbGRzID0gcGF0aDtcbiAgICAgICAgZmllbGRzID0gZmllbGRzLmZpbHRlcihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgIT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgICBmaWVsZHMubWFwKGZ1bmN0aW9uIChmaWVsZCwgaW5kZXgpIHtcbiAgICAgICAgICAgIGN1cltmaWVsZF0gPSBjdXJbZmllbGRdIHx8IChpbmRleCA9PSBmaWVsZHMubGVuZ3RoIC0gMSA/ICh2YWx1ZSB8fCB7fSkgOiB7fSk7XG4gICAgICAgICAgICBjdXIgPSBjdXJbZmllbGRdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG59KTtcblxuLyoqXG4gKlxuICogQHBhcmFtIG1zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gZGVsYXkobXMpIHtcbiAgICB2YXIgZCA9ICQuRGVmZXJyZWQoKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5yZXNvbHZlKCk7XG4gICAgfSwgbXMpO1xuICAgIHJldHVybiBkLnByb21pc2UoKTtcbn1cblxuXG4vKipcbiAqXG4gKi9cbmlmICghU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCkge1xuICAgIFN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgc3ViamVjdFN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBwb3NpdGlvbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHBvc2l0aW9uKSB8fCBNYXRoLmZsb29yKHBvc2l0aW9uKSAhPT0gcG9zaXRpb24gfHwgcG9zaXRpb24gPiBzdWJqZWN0U3RyaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBzdWJqZWN0U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBwb3NpdGlvbiAtPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICAgICAgICB2YXIgbGFzdEluZGV4ID0gc3ViamVjdFN0cmluZy5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pO1xuICAgICAgICByZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xuICAgIH07XG59XG5cbi8qKlxuICpcbiAqL1xuaWYgKCFTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGgpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyaW5nLnByb3RvdHlwZSwgJ3N0YXJ0c1dpdGgnLCB7XG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCAwO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikgPT09IHBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgfSk7XG59IiwiZnVuY3Rpb24gRHJvcHpvbmVNYW5hZ2VyKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5Ecm9wem9uZU1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHRlbXBsYXRlSW1hZ2UgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNpbWFnZS1wcmV2aWV3LXRlbXBsYXRlJykuaHRtbCgpXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGVtcGxhdGVGaWxlID0gdHdpZyh7XG4gICAgICAgICAgICBkYXRhOiAkKCcjZmlsZS1wcmV2aWV3LXRlbXBsYXRlJykuaHRtbCgpXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoXCIuZHJvcHpvbmVcIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZHJvcHpvbmUkID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpc011bHRpcGxlID0gZHJvcHpvbmUkLmRhdGEoJ211bHRpcGxlJykgPT0gXCIxXCI7XG4gICAgICAgICAgICAkKHRoaXMpLmRyb3B6b25lKHtcbiAgICAgICAgICAgICAgICBwYXJhbGxlbFVwbG9hZHM6IDMsXG4gICAgICAgICAgICAgICAgYWRkUmVtb3ZlTGlua3M6IHRydWUsXG4gICAgICAgICAgICAgICAgdXBsb2FkTXVsdGlwbGU6IGlzTXVsdGlwbGUsXG4gICAgICAgICAgICAgICAgY3JlYXRlSW1hZ2VUaHVtYm5haWxzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtYXhGaWxlczogaXNNdWx0aXBsZSA/IG51bGwgOiAxLFxuICAgICAgICAgICAgICAgIHBhcmFtTmFtZTogJCh0aGlzKS5kYXRhKCdpbnB1dC1uYW1lJyksXG4gICAgICAgICAgICAgICAgY2xpY2thYmxlOiAkKHRoaXMpLmZpbmQoXCIuZHotbWVzc2FnZVwiKVswXSxcbiAgICAgICAgICAgICAgICBhY2NlcHRlZEZpbGVzOiBkcm9wem9uZSQuZGF0YSgndHlwZScpID09ICdpbWFnZScgPyAnaW1hZ2UvKicgOiBudWxsLFxuICAgICAgICAgICAgICAgIHVybDogX3RoaXMuYXBwLmJhc2VVcmwgKyBcIi8/X3Rva2VuPVwiICsgX3RoaXMuYXBwLmdldENzcmZUb2tlblBhcmFtZXRlcigpLl90b2tlbiArIGRyb3B6b25lJC5kYXRhKCdwYXJhbWV0ZXJzJyksXG5cbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZmlsZSwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTXVsdGlwbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lJC5wcmV2KCkuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHJvcHpvbmUkLmRhdGEoJ3R5cGUnKSA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcm9wem9uZSQucHJldigpLmZpbmQoJy5pbWFnZVtkYXRhLWlkPScgKyByZXNwb25zZVtpXS5pbWFnZS5pZCArICddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lJC5wcmV2KCkuYXBwZW5kKHRlbXBsYXRlSW1hZ2UucmVuZGVyKHJlc3BvbnNlW2ldKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZHJvcHpvbmUkLnByZXYoKS5maW5kKCcuZmlsZVtkYXRhLWlkPScgKyByZXNwb25zZVtpXS5maWxlLmlkICsgJ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5hcHBlbmQodGVtcGxhdGVGaWxlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZmlsZSwgZXJyb3JNZXNzYWdlLCB4aHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAvL3RvZG86INC90L7RgNC80LDQu9GM0L3QviDQvtCx0YDQsNCx0LDRgtGL0LLQsNGC0Ywg0Lgg0L/QvtC60LDQt9GL0LLQsNGC0Ywg0L7RiNC40LHQutC4XG4gICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQntGI0LjQsdC60LAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ9Cd0LUg0YPQtNCw0LXRgtGB0Y8g0LfQsNCz0YDRg9C30LjRgtGMINGE0LDQudC7INC90LAg0YHQtdGA0LLQtdGALiDQndC10LLQtdGA0L3Ri9C5INGE0L7RgNC80LDRgiDQuNC70Lgg0YHQu9C40YjQutC+0Lwg0LHQvtC70YzRiNC+0Lkg0YDQsNC30LzQtdGALicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogNzAwMFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcblxuXG4gICAgfSxcblxuXG59OyIsImZ1bmN0aW9uIEZvcm0oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkZvcm0ucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0U2F2ZSgpO1xuICAgICAgICB0aGlzLmluaXREYXRlcGlja2VyKCk7XG4gICAgfSxcblxuICAgIGluaXRTYXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuZm9ybS1idXR0b25zIGJ1dHRvbi5zYXZlLWJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmb3JtRGF0YSA9ICQoJy5tYWluLWNtcy1mb3JtJykuc2VyaWFsaXplKCk7XG4gICAgICAgICAgICB2YXIgY3JlYXRlTW9kZSA9ICQoJy5jbXMtbW9kdWxlLWZvcm0tcGFnZScpLmRhdGEoJ2NyZWF0ZS1tb2RlJyk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVSScpLnRvZ2dsZVNwaW5uZXIodHJ1ZSk7XG4gICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVGb3JtQnV0dG9ucyhmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIE1pbmltdW0gZGVsYXkgdG8gYXZvaWQgdW5wbGVhc2FudCBibGlua2luZ1xuICAgICAgICAgICAgJC53aGVuKFxuICAgICAgICAgICAgICAgICQucG9zdChfdGhpcy5hcHAuYmFzZVVybCArICcvJywgZm9ybURhdGEpLFxuICAgICAgICAgICAgICAgIGRlbGF5KGNyZWF0ZU1vZGUgPyAxMDAgOiA1MDApXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHJlc3VsdFswXTtcbiAgICAgICAgICAgICAgICBpZiAoY3JlYXRlTW9kZSAmJiBwYXJzZUludChyZXNwb25zZSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBfLnJ0cmltKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsICcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmwuZW5kc1dpdGgoJy9jcmVhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gXy5zdHJMZWZ0QmFjayh1cmwsICcvJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHVybCArICcvJyArIHJlc3BvbnNlICsgJy8nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wubm90aWNlKHt0aXRsZTogJycsIG1lc3NhZ2U6IFwiQ9C+0YXRgNCw0L3QtdC90L5cIn0pO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVTcGlubmVyKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VJJykudG9nZ2xlRm9ybUJ1dHRvbnModHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgaW5pdERhdGVwaWNrZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy90b2RvOiDQv9C+0LTRg9C80LDRgtGMLCDQvdCw0YHRh9C10YIgbGl2ZT9cbiAgICAgICAgJCgnLmRhdGVwaWNrZXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAkKHRoaXMpWzBdLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnZGFyay10aGVtZScsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWScsXG4gICAgICAgICAgICAgICAgZmlyc3REYXk6IDEsXG4gICAgICAgICAgICAgICAgc2hvd1RpbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGkxOG46IHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNNb250aDogJ9Cf0YDQtdC00YvQtNGD0YnQuNC5INC80LXRgdGP0YYnLFxuICAgICAgICAgICAgICAgICAgICBuZXh0TW9udGg6ICfQodC70LXQtNGD0Y7RidC40Lkg0LzQtdGB0Y/RhicsXG4gICAgICAgICAgICAgICAgICAgIG1vbnRoczogWyfQr9C90LLQsNGA0YwnLCAn0KTQtdCy0YDQsNC70YwnLCAn0JzQsNGA0YInLCAn0JDQv9GA0LXQu9GMJywgJ9Cc0LDQuScsICfQmNGO0L3RjCcsICfQmNGO0LvRjCcsICfQkNCy0LPRg9GB0YInLCAn0KHQtdC90YLRj9Cx0YDRjCcsICfQntC60YLRj9Cx0YDRjCcsICfQndC+0Y/QsdGA0YwnLCAn0JTQtdC60LDQsdGA0YwnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXM6IFsn0JLQvtGB0LrRgNC10YHQtdC90YzQtScsICfQn9C+0L3QtdC00LXQu9GM0L3QuNC6JywgJ9CS0YLQvtGA0L3QuNC6JywgJ9Ch0YDQtdC00LAnLCAn0KfQtdGC0LLQtdGA0LMnLCAn0J/Rj9GC0L3QuNGG0LAnLCAn0KHRg9Cx0LHQvtGC0LAnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXNTaG9ydDogWyfQktGBJywgJ9Cf0L0nLCAn0JLRgicsICfQodGAJywgJ9Cn0YInLCAn0J/RgicsICfQodCxJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaXMoJy5kYXRldGltZScpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWSBISDptbScsXG4gICAgICAgICAgICAgICAgICAgIHNob3dUaW1lOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzaG93U2Vjb25kczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHVzZTI0aG91cjogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ldyBQaWthZGF5KG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnLmRhdGVwaWNrZXIgKyAuY2xlYXItZGF0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykucHJldigpLnZhbCgnJyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07IiwiZnVuY3Rpb24gR29vZ2xlTWFwKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5Hb29nbGVNYXAucHJvdG90eXBlID0ge1xuICAgIGluaXRNYXBzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICgkKCcubWFwLmdvb2dsZVtkYXRhLWxhdF1bZGF0YS1sbmddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAkLmdldFNjcmlwdChcImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9saWJyYXJpZXM9cGxhY2VzJnNlbnNvcj1mYWxzZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmZpcmUoJ2FmdGVyR29vZ2xlTWFwc0FwaUxvYWQnKTtcbiAgICAgICAgICAgICAgICAkKCcubWFwW2RhdGEtbGF0XVtkYXRhLWxuZ10nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9iamVjdExhdCA9IHBhcnNlRmxvYXQoJCh0aGlzKS5kYXRhKCdsYXQnKSksXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RMbmcgPSBwYXJzZUZsb2F0KCQodGhpcykuZGF0YSgnbG5nJykpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWFwT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcFR5cGVDb250cm9sOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVldFZpZXdDb250cm9sOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbHdoZWVsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHpvb206IDIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXI6IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob2JqZWN0TGF0LCBvYmplY3RMbmcpXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3RMYXQgJiYgb2JqZWN0TG5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBPcHRpb25zLnpvb20gPSAxMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgbWFwRWxlbWVudCA9ICQodGhpcylbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKG1hcEVsZW1lbnQsIG1hcE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvYmplY3RMYXQsIG9iamVjdExuZyksXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXA6IG1hcFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKG1hcEVsZW1lbnQpLmNsb3Nlc3QoJy5sYXQtbG5nLWNvbnRhaW5lcicpLmZpbmQoXCJbZGF0YS1sYXRsbmctZmllbGQ9bGF0XVwiKS52YWwoZXZlbnQubGF0TG5nLmxhdCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgJChtYXBFbGVtZW50KS5jbG9zZXN0KCcubGF0LWxuZy1jb250YWluZXInKS5maW5kKFwiW2RhdGEtbGF0bG5nLWZpZWxkPWxuZ11cIikudmFsKGV2ZW50LmxhdExuZy5sbmcoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihldmVudC5sYXRMbmcpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIHNlYXJjaCBib3ggYW5kIGxpbmsgaXQgdG8gdGhlIFVJIGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWMtaW5wdXQnKTtcblxuICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5vbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUud2hpY2ggPT0gMTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlYXJjaEJveCA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuU2VhcmNoQm94KGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmNvbnRyb2xzW2dvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbi5UT1BfTEVGVF0ucHVzaChpbnB1dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFwLmFkZExpc3RlbmVyKCdib3VuZHNfY2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEJveC5zZXRCb3VuZHMobWFwLmdldEJvdW5kcygpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmtlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoQm94LmFkZExpc3RlbmVyKCdwbGFjZXNfY2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwbGFjZXMgPSBzZWFyY2hCb3guZ2V0UGxhY2VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxhY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBib3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBsYWNlID0gcGxhY2VzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsYWNlLmdlb21ldHJ5LnZpZXdwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgZ2VvY29kZXMgaGF2ZSB2aWV3cG9ydC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzLnVuaW9uKHBsYWNlLmdlb21ldHJ5LnZpZXdwb3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3VuZHMuZXh0ZW5kKHBsYWNlLmdlb21ldHJ5LmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwLmZpdEJvdW5kcyhib3VuZHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5maXJlKCdhZnRlck1hcHNJbml0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuIiwiZnVuY3Rpb24gTGVmdE1lbnUoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxlZnRNZW51LnByb3RvdHlwZSA9IHtcbiAgICBpbml0TWFpbk1lbnU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcubWFpbi1tZW51IC5sZWZ0LXBhbmVsOm5vdCguY29sbGFwc2VkKSwgLm1haW4tbWVudSAucmlnaHQtcGFuZWwnKS5tQ3VzdG9tU2Nyb2xsYmFyKHtcbiAgICAgICAgICAgIHRoZW1lOiBcImxpZ2h0LTJcIixcbiAgICAgICAgICAgIGF1dG9FeHBhbmRTY3JvbGxiYXI6IHRydWUsXG4gICAgICAgICAgICBzY3JvbGxJbmVydGlhOiA0MDAsXG4gICAgICAgICAgICBtb3VzZVdoZWVsOiB7XG4gICAgICAgICAgICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFja3M6IHtcbiAgICAgICAgICAgICAgICBvblNjcm9sbDogZnVuY3Rpb24gKHEsIHExKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29udGVudCBzY3JvbGxlZC4uLlwiLCBxLCBxMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdG9kbzog0L/RgNC40Log0LvQutC40LrQtSDQv9C+INC80LXQvdGOIC0g0LfQsNC/0L7QvNC40L3QsNGC0Ywg0LIg0LvQvtC60LDQuy3RgdGC0L7RgNCw0LTQttC1INGB0LrRgNC+0LvQu9Ci0L7Qvywg0Lgg0L/QvtGC0L7QvCDQv9GA0Lgg0LjQvdC40YbQuNCw0LvQuNC30LDRhtC40LggLSDRgdGA0LDQt9GDINGB0LrRgNC+0LvQu9C40YLRjCDQvdCwINC90LXQs9C+LlxuICAgICAgICAgICAgLy8gdG9kbzog0J/RgNC4INC30LDQs9GA0YPQt9C60LUg0YHRgtGA0LDQvdC40YbRiyAtINC+0LHQvdGD0LvRj9GC0Ywg0Y3RgtC+INC30L3QsNGH0LXQvdC40LUg0LIg0LvQvtC60LDQu9GB0YLQvtGA0LDQtNC20LVcbiAgICAgICAgICAgIC8vIHRvZG86INC10YHQu9C4INC10YHRgtGMINCy0YvQtNC10LvQtdC90L3Ri9C5INC/0YPQvdC60YIsINCwINGB0L7RhdGA0LDQvdC10L3QvdC+0LPQviDQt9C90LDRh9C10L3QuNGPINC90LXRgiwg0YLQviDQstGL0YfQuNGB0LvRj9GC0Ywg0LXQs9C+INC/0YDQuNC80LXRgNC90L4g0Lgg0YHQtdGA0L7Qu9C70LjRgtGMINGC0YPQtNCwXG4gICAgICAgICAgICAvLyB0b2RvOiDQsCDQstC+0L7QsdGJ0LUsINC/0LXRgNC10LTQtdC70LDRgtGMINCy0YHQtSDQvdCwINCw0Y/QutGBLCDRgdGD0LrQsFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiIsImZ1bmN0aW9uIExpc3QoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxpc3QucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIHNlbGVjdG9yczoge1xuICAgICAgICAnc3RhdHVzJzogWycuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLnN0YXR1cycsICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLnN0YXR1cyddLFxuICAgICAgICAnZGVsZXRlJzogWycuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLmRlbGV0ZScsICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLmRlbGV0ZSddLFxuICAgICAgICAnYWRkJzogJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uYWRkJyxcbiAgICAgICAgJ2FkZFJvb3QnOiAnLmFkZC1uZXctdHJlZS1pdGVtJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0QnV0dG9ucygpO1xuICAgICAgICB0aGlzLmluaXRTb3J0YWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXRCdXR0b25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5pdFN0YXR1c0J1dHRvbigpO1xuICAgICAgICB0aGlzLmluaXREZWxldGVCdXR0b24oKTtcbiAgICAgICAgdGhpcy5pbml0QWRkQnV0dG9uKCk7XG4gICAgICAgIHRoaXMuaW5pdEFkZFRvUm9vdEJ1dHRvbigpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBzdGF0dXNcbiAgICAgKi9cbiAgICBpbml0U3RhdHVzQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIF90aGlzLnNlbGVjdG9ycy5zdGF0dXMuam9pbignLCcpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaWQgPSBfdGhpcy5nZXRJdGVtSWQoYnRuJCk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBfdGhpcy5nZXRJdGVtTW9kZWwoYnRuJCk7XG4gICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBfdGhpcy5nZXRJdGVtQ29udGFpbmVyKGJ0biQpO1xuXG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWyd0b2dnbGUnLCBtb2RlbCwgaWQsICdzdGF0dXMnXSwgMSk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQudG9nZ2xlQ2xhc3MoJ2luYWN0aXZlJywgIXJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgb2JqZWN0XG4gICAgICovXG4gICAgaW5pdERlbGV0ZUJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhfdGhpcy5zZWxlY3RvcnMuZGVsZXRlKTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLmRlbGV0ZS5qb2luKCcsJyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdTdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgIHZhciBpZCA9IF90aGlzLmdldEl0ZW1JZChidG4kKTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBfdGhpcy5nZXRJdGVtTW9kZWwoYnRuJCk7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gX3RoaXMuZ2V0SXRlbUNvbnRhaW5lcihidG4kKTtcblxuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpO1xuXG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZFxuICAgICAqL1xuICAgIGluaXRBZGRCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLmFkZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGlkID0gX3RoaXMuZ2V0SXRlbUlkKGJ0biQpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gX3RoaXMuZ2V0SXRlbU1vZGVsKGJ0biQpO1xuICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gX3RoaXMuZ2V0SXRlbUNvbnRhaW5lcihidG4kKTtcblxuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnY3JlYXRlJywgbW9kZWwsIF90aGlzLmdlbmVyYXRlUmFuZG9tSWRTdHJpbmcoKSwgJ3BhcmVudF9pZCddLCBpZCk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gYnRuJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5maW5kKCdzY3JpcHRbZGF0YS10ZW1wbGF0ZS1uYW1lPVwiZW1wdHktdHJlZS1lbGVtZW50XCJdJykuaHRtbCgpO1xuICAgICAgICAgICAgICAgIGl0ZW1Db250YWluZXIkLmZpbmQoJz51bCcpLmFwcGVuZChfdGhpcy5jcmVhdGVOZXdFbGVtZW50KHRlbXBsYXRlLCByZXN1bHQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgb2JqZWN0IHRvIHRoZSB0cmVlIHJvb3RcbiAgICAgKi9cbiAgICBpbml0QWRkVG9Sb290QnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIF90aGlzLnNlbGVjdG9ycy5hZGRSb290LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBidG4kLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpO1xuICAgICAgICAgICAgdmFyIGlkID0gcGFyc2VJbnQoaXRlbUNvbnRhaW5lciQuZGF0YSgndHJlZS1yb290JykpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gaXRlbUNvbnRhaW5lciQuZGF0YSgnbW9kZWwnKTtcblxuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnY3JlYXRlJywgbW9kZWwsIF90aGlzLmdlbmVyYXRlUmFuZG9tSWRTdHJpbmcoKSwgJ3BhcmVudF9pZCddLCBpZCk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gYnRuJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5maW5kKCdzY3JpcHRbZGF0YS10ZW1wbGF0ZS1uYW1lPVwiZW1wdHktdHJlZS1lbGVtZW50XCJdJykuaHRtbCgpO1xuICAgICAgICAgICAgICAgIGl0ZW1Db250YWluZXIkLmZpbmQoJ3VsOmZpcnN0JykuYXBwZW5kKF90aGlzLmNyZWF0ZU5ld0VsZW1lbnQodGVtcGxhdGUsIHJlc3VsdCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXRTb3J0YWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBmdW5jdGlvbiBpbml0U29ydGFibGVFbmdpbmUoZWwsIGhhbmRsZU5hbWUsIGdyb3VwTmFtZSkge1xuICAgICAgICAgICAgdmFyIHNvcnRhYmxlID0gU29ydGFibGUuY3JlYXRlKGVsLCB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgIGdyb3VwOiBncm91cE5hbWUsXG4gICAgICAgICAgICAgICAgaGFuZGxlOiBoYW5kbGVOYW1lLFxuICAgICAgICAgICAgICAgIG9uQWRkOiBmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCkge1xuICAgICAgICAgICAgICAgICAgICBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25UcmVlU29ydChldnQsIHNvcnRhYmxlKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSAkKGV2dC50YXJnZXQpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgICAgICAgICB2YXIgcGFyZW50SWQgPSAkKGV2dC50YXJnZXQpLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICB2YXIgb3JkZXJBcnJheSA9IHNvcnRhYmxlLnRvQXJyYXkoKS5maWx0ZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsID49IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7c2F2ZToge319LCBfdGhpcy5hcHAuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddW21vZGVsXSA9IHt9OyAvLyBvYmplY3QsIG5vdCBhbiBhcnJheS4gT3RoZXJ3aXNlIGl0IHdpbGwgY3JlYXRlIDAuLmlkIGVtcHR5IGVsZW1lbnRzXG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIG9yZGVyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpZiAob3JkZXJBcnJheS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bbW9kZWxdW29yZGVyQXJyYXlbaV1dID0geydzaG93X29yZGVyJzogcGFyc2VJbnQoaSkgKyAxLCAncGFyZW50X2lkJzogcGFyZW50SWR9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRyZWVzXG4gICAgICAgICQoJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCcpLmVhY2goZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHZhciBwbGFpbiA9ICQodGhpcykuZGF0YSgncGxhaW4nKSA9PT0gMTtcbiAgICAgICAgICAgIHZhciB0cmVlTmFtZSA9ICd0cmVlXycgKyBpO1xuICAgICAgICAgICAgJCh0aGlzKS5maW5kKChwbGFpbiA/ICc+JyA6ICcnKSArICd1bCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGluaXRTb3J0YWJsZUVuZ2luZSgkKHRoaXMpWzBdLCAnLmlkJywgdHJlZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIExpc3RzXG4gICAgICAgICQoJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudFtkYXRhLXNvcnRhYmxlPVwidHJ1ZVwiXSB0Ym9keScpLmVhY2goZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHZhciBsaXN0TmFtZSA9ICdsaXN0XycgKyBpO1xuICAgICAgICAgICAgaW5pdFNvcnRhYmxlRW5naW5lKCQodGhpcylbMF0sICcuY29sdW1uLWlkJywgbGlzdE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBcbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCRcbiAgICAgKiBAcmV0dXJucyB7KnxIVE1MRWxlbWVudHxudWxsfVxuICAgICAqL1xuICAgIGdldEl0ZW1Db250YWluZXI6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgcmV0dXJuIGVsJC5jbG9zZXN0KCdbZGF0YS1pZF0nKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBnZXRJdGVtSWQ6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SXRlbUNvbnRhaW5lcihlbCQpLmRhdGEoJ2lkJyk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWwkXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZ2V0SXRlbU1vZGVsOiBmdW5jdGlvbiAoZWwkKSB7XG4gICAgICAgIHJldHVybiBlbCQuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgnbW9kZWwnKTtcbiAgICB9LFxuXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZW5lcmF0ZVJhbmRvbUlkU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnJUNSRUFURV8nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDgpICsgJyUnO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHJlc3VsdFxuICAgICAqIEByZXR1cm5zIHsqfGpRdWVyeX1cbiAgICAgKi9cbiAgICBjcmVhdGVOZXdFbGVtZW50OiBmdW5jdGlvbiAodGVtcGxhdGUsIHJlc3VsdCkge1xuICAgICAgICB2YXIgbmV3SXRlbSQgPSAkKHRlbXBsYXRlLnJlcGxhY2UobmV3IFJlZ0V4cCgnJUNSRUFURV8lJywgJ2cnKSwgcmVzdWx0KSkuYXR0cignZGF0YS1pZCcsIHJlc3VsdCk7XG4gICAgICAgIG5ld0l0ZW0kLmZpbmQoJy5pZCcpLnRleHQocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ld0l0ZW0kO1xuICAgIH1cbn07IiwiZnVuY3Rpb24gVUkoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblVJLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgdXNlck1lbnU6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5pdFVzZXJNZW51KCk7XG4gICAgICAgIHRoaXMuaW5pdEhyZWZCdXR0b25zKCk7XG4gICAgICAgIHRoaXMuaW5pdFN0YXJ0dXBOb3RpZmljYXRpb25zKCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0dvb2dsZU1hcCcpLmluaXRNYXBzKCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0xlZnRNZW51JykuaW5pdE1haW5NZW51KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0xpc3QnKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0Zvcm0nKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0Ryb3B6b25lTWFuYWdlcicpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBpbml0U3RhcnR1cE5vdGlmaWNhdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQoJy5jbXMtbW9kdWxlLWZvcm0tcGFnZScpLmRhdGEoJ2p1c3QtY3JlYXRlZCcpKSB7XG4gICAgICAgICAgICAkLmdyb3dsLm5vdGljZSh7dGl0bGU6ICcnLCBtZXNzYWdlOiBcItCe0LHRitC10LrRgiDRgdC+0LfQtNCw0L1cIn0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXRVc2VyTWVudTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXItaWNvbicpKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXJNZW51ID0gbmV3IERyb3Aoe1xuICAgICAgICAgICAgICAgIG9wZW5PbjogJ2NsaWNrJyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbSByaWdodCcsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlci1pY29uJyksXG4gICAgICAgICAgICAgICAgY29udGVudDogJCgnLnVzZXItZHJvcGRvd24tY29udGFpbmVyJykuaHRtbCgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0SHJlZkJ1dHRvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2J1dHRvbltocmVmXScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZVNwaW5uZXI6IGZ1bmN0aW9uIChzaG93KSB7XG4gICAgICAgICQoJyNzcGlubmVyJykudG9nZ2xlQ2xhc3MoJ3Nob3cnLCBzaG93KTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlRm9ybUJ1dHRvbnM6IGZ1bmN0aW9uIChlbmFibGUpIHtcbiAgICAgICAgJCgnLmZvcm0tYnV0dG9ucyBidXR0b24nKS5wcm9wKCdkaXNhYmxlZCcsICFlbmFibGUpO1xuICAgIH1cblxufSIsImZ1bmN0aW9uIFVwbG9hZGFibGVzTGlzdChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuVXBsb2FkYWJsZXNMaXN0LnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgWydpbWFnZScsICdmaWxlJ10uZm9yRWFjaChmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgICAgIF90aGlzLmluaXREZWxldGVCdXR0b24obW9kZWwpO1xuXG4gICAgICAgICAgICAkKCcuJyArIG1vZGVsICsgJ3MtbGlzdCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChtb2RlbCA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmluaXRGYW5jeWJveCgkKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMuaW5pdFNvcnRhYmxlKCQodGhpcylbMF0sIG1vZGVsKVxuXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIGluaXREZWxldGVCdXR0b246IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLicgKyBtb2RlbCArICdzLWxpc3QgLicgKyBtb2RlbCArICcgLmRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdTdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQkID0gJCh0aGlzKS5jbG9zZXN0KCcuJyArIG1vZGVsKTtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBlbGVtZW50JC5kYXRhKCdpZCcpO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpO1xuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQkLmZhZGVPdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdFNvcnRhYmxlOiBmdW5jdGlvbiAoZWwsIG1vZGVsKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZShlbCwge1xuICAgICAgICAgICAgYW5pbWF0aW9uOiAyMDAsXG4gICAgICAgICAgICBoYW5kbGU6IG1vZGVsID09ICdmaWxlJyA/IFwiLmljb25cIiA6IG51bGwsXG4gICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcmRlckFycmF5ID0gc29ydGFibGUudG9BcnJheSgpO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ3NhdmUnLCBtb2RlbF0sIHt9KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIG9yZGVyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyQXJyYXkuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF1bb3JkZXJBcnJheVtpXV0gPSB7J3Nob3dfb3JkZXInOiBwYXJzZUludChpKSArIDF9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRGYW5jeWJveDogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICBlbCQuZmluZCgnLmltYWdlID4gYScpLmZhbmN5Ym94KHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEsXG4gICAgICAgICAgICBvcGVuRWZmZWN0OiAnZWxhc3RpYycsXG4gICAgICAgICAgICBoZWxwZXJzOiB7XG4gICAgICAgICAgICAgICAgb3ZlcmxheToge1xuICAgICAgICAgICAgICAgICAgICBsb2NrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogJ3JnYmEoMCwwLDAsMC41KSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMDQuMDQuMTYuXG4gKi9cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJCgndHJbZGF0YS1yb3ctZm9yLWZpZWxkPVwiYWNsXCJdJykubGVuZ3RoKSB7XG4gICAgICAgICQoJ1tkYXRhLXJvdy1mb3ItZmllbGQ9XCJyb2xlLm5hbWVcIl0gc2VsZWN0Jykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLnZhbCgpID09IDEpIHtcbiAgICAgICAgICAgICAgICAkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5oaWRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLnNob3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgfVxufSk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMTcuMDYuMTYuXG4gKi9cbmZ1bmN0aW9uIGdldERlZmF1bHRUaW55TWNlT3B0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50X2NzczogJy9hc3NldHMvZmFjZXBhbG0vY3NzL2NvbnRlbnQuY3NzJyxcbiAgICAgICAgbGFuZ3VhZ2U6ICdydScsXG4gICAgICAgIG1lbnViYXI6IGZhbHNlLFxuICAgICAgICBzdGF0dXNiYXI6IGZhbHNlLFxuICAgICAgICBzdHlsZV9mb3JtYXRzOiBbXG4gICAgICAgICAgICB7dGl0bGU6ICfQntCx0YvRh9C90YvQuSDRgtC10LrRgdGCJywgYmxvY2s6ICdwJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQl9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gyJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQn9C+0LTQt9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gzJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQktGA0LXQt9C60LAnLCBibG9jazogJ2Jsb2NrcXVvdGUnfSxcbiAgICAgICAgICAgIC8vIHsgdGl0bGU6ICdUYWJsZSByb3cgMScsIHNlbGVjdG9yOiAndHInLCBjbGFzc2VzOiAndGFibGVyb3cxJyB9XG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gZXh0ZW5kZWRfdmFsaWRfZWxlbWVudHM6ICdpbWdbY2xhc3M9bXljbGFzc3whc3JjfGJvcmRlcjowfGFsdHx0aXRsZXx3aWR0aHxoZWlnaHR8c3R5bGVdJyxcbiAgICAgICAgLy8gaW52YWxpZF9lbGVtZW50czogJ3N0cm9uZyxiLGVtLGknLFxuXG4gICAgICAgIHBsdWdpbnM6IFsnZml4ZWR0b29sYmFyJywgJ2F1dG9yZXNpemUnLCAnY29kZW1pcnJvcicsICdsaW5rJywgJ2F1dG9saW5rJywgJ21lZGlhJywgJ25vbmVkaXRhYmxlJywgJ3Bhc3RlJywgJ3RhYmxlJywgJ3Zpc3VhbGJsb2NrcyddLFxuICAgICAgICB0b29sYmFyOiAnc3R5bGVzZWxlY3QgfCBib2xkIGl0YWxpYyB8IGFsaWdubGVmdCBhbGlnbmNlbnRlciBhbGlnbnJpZ2h0IHwgYnVsbGlzdCBudW1saXN0IG91dGRlbnQgaW5kZW50IHwgbGluayBpbWFnZSB0YWJsZSBtZWRpYSB8IHZpc3VhbGJsb2NrcyBjb2RlJyxcblxuICAgICAgICBtZWRpYV9wb3N0ZXI6IGZhbHNlLFxuICAgICAgICBtZWRpYV9kaW1lbnNpb25zOiBmYWxzZSxcblxuICAgICAgICB0YWJsZV9hcHBlYXJhbmNlX29wdGlvbnM6IGZhbHNlLFxuICAgICAgICB0YWJsZV9hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9jZWxsX2FkdnRhYjogZmFsc2UsXG4gICAgICAgIHRhYmxlX3Jvd19hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9kZWZhdWx0X2F0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnZGVmYXVsdC10YWJsZSdcbiAgICAgICAgfSxcbiAgICAgICAgdGFibGVfY2xhc3NfbGlzdDogW1xuICAgICAgICAgICAge3RpdGxlOiAnRGVmYXVsdCcsIHZhbHVlOiAnZGVmYXVsdC10YWJsZSd9LFxuICAgICAgICBdLFxuXG4gICAgICAgIGNvZGVtaXJyb3I6IHtcbiAgICAgICAgICAgIGluZGVudE9uSW5pdDogdHJ1ZSxcbiAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICAgIHN0eWxlQWN0aXZlTGluZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGhlbWU6ICdtb25va2FpJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNzc0ZpbGVzOiBbXG4gICAgICAgICAgICAgICAgJ3RoZW1lL21vbm9rYWkuY3NzJ1xuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgfTtcbn0iLCJmdW5jdGlvbiBXeXNpd3lnTWFuYWdlcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLnNldE9wdGlvbnMoKTsgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgIHRoaXMub3B0aW9uc1t0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3JdID0gZ2V0RGVmYXVsdFRpbnlNY2VPcHRpb25zKCk7XG59XG5cbld5c2l3eWdNYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjogJ3RleHRhcmVhW2RhdGEtd3lzaXd5Z10nLFxuICAgIG9wdGlvbnM6IHt9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIHNldE9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0gPSAkLmV4dGVuZCh0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY3NzXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgYWRkQ29udGVudENzczogZnVuY3Rpb24oY3NzLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYodHlwZW9mIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPSBbdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2Nzc107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2NzcyA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MuY29uY2F0KGNzcylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGx1Z2luTmFtZVxuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFkZFBsdWdpbjogZnVuY3Rpb24gKHBsdWdpbk5hbWUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMgPSB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgYXBwZW5kVG9vbGJhcjogZnVuY3Rpb24gKGJ1dHRvbnMsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAoIWJ1dHRvbnMuc3RhcnRzV2l0aCgnICcpKSB7XG4gICAgICAgICAgICBidXR0b25zID0gJyAnICsgYnV0dG9ucztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIgKz0gYnV0dG9ucztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnV0dG9uc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIHByZXBlbmRUb29sYmFyOiBmdW5jdGlvbiAoYnV0dG9ucywgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIGlmICghYnV0dG9ucy5lbmRzV2l0aCgnICcpKSB7XG4gICAgICAgICAgICBidXR0b25zID0gYnV0dG9ucyArICcgJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIgPSBidXR0b25zICsgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS50b29sYmFyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtXeXNpd3lnTWFuYWdlci5vcHRpb25zfHt9fVxuICAgICAqL1xuICAgIGdldE9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXRBbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLmdldE9wdGlvbnMoKTtcbiAgICAgICAgdmFyIGVkaXRvclByb21pc2VzID0gW107XG5cbiAgICAgICAgX3RoaXMuYXBwLmZpcmUoJ2JlZm9yZUFsbFd5c2l3eWdJbml0Jyk7XG4gICAgICAgIGZvciAodmFyIHNlbGVjdG9yIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KHNlbGVjdG9yKSkge1xuXG4gICAgICAgICAgICAgICAgJChzZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnNbc2VsZWN0b3JdLnNldHVwID0gZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDRg9Cx0YDQsNGC0Ywg0LPQu9C+0LHQsNC70YzQvdGL0LkgdGlueW1jZSwg0Lgg0LTQtdGA0LPQsNGC0Ywg0LrQvtC90LrRgNC10YLQvdGL0Lkg0YDQtdC00LDQutGC0L7RgFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKCdpbml0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS50aW55bWNlKG9wdGlvbnNbc2VsZWN0b3JdKTtcblxuICAgICAgICAgICAgICAgICAgICBlZGl0b3JQcm9taXNlcy5wdXNoKGQucHJvbWlzZSgpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICQud2hlbi5hcHBseSgkLCBlZGl0b3JQcm9taXNlcykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYWZ0ZXJBbGxXeXNpd3lnSW5pdCcpO1xuICAgICAgICB9KTtcblxuICAgIH1cbn07XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
