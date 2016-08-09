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

                    objectLat = isNaN(objectLat) ? 0 : objectLat;
                    objectLng = isNaN(objectLng) ? 0 : objectLng;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGguanMiLCJGYWNlcGFsbUNNUy5qcyIsIlNlcnZpY2VMb2NhdG9yLmpzIiwidXRpbGl0eS5qcyIsIlVJL0Ryb3B6b25lTWFuYWdlci5qcyIsIlVJL0Zvcm0uanMiLCJVSS9Hb29nbGVNYXAuanMiLCJVSS9MZWZ0TWVudS5qcyIsIlVJL0xpc3QuanMiLCJVSS9VSS5qcyIsIlVJL1VwbG9hZGFibGVzTGlzdC5qcyIsIlVJL1ZpZGVvc0xpc3QuanMiLCJleHRlbmRlZC91c2Vycy5qcyIsInd5c2l3eWcvRGVmYXVsdFRpbnlNY2VPcHRpb25zLmpzIiwid3lzaXd5Zy9HYWxsZXJ5TW9kdWxlLmpzIiwid3lzaXd5Zy9XeXNpd3lnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIEF1dGhNYW5hZ2VyKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5BdXRoTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKCcubG9naW4tZm9ybSBmb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQucG9zdCgkKHRoaXMpLmF0dHIoJ2FjdGlvbicpLCAkKHRoaXMpLnNlcmlhbGl6ZSgpLCAnanNvbicpXG4gICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS51c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gJy9jbXMvJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnNoYWtlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7dGl0bGU6ICcnLCBtZXNzYWdlOiByZXNwb25zZS5lcnJvcnNbaV19KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAvL3RvZG86INC/0LXRgNC10LTQtdC70LDRgtGMINCy0YvQstC+0LQg0YLQtdC60YHRgtCwINC+0YjQuNCx0LrQuCEg0JvQvtC60LDQu9C40LfQsNGG0LjRjyFcblxuICAgICAgICAgICAgICAgICAgICAkLmdyb3dsLmVycm9yKHt0aXRsZTogJycsIG1lc3NhZ2U6ICfQndC10LLQtdGA0L3Ri9C1INC70L7Qs9C40L0g0LjQu9C4INC/0LDRgNC+0LvRjCd9KTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2hha2UoKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhyZXNwb25zZS5yZXNwb25zZUpTT04pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiAkKCcubG9naW4tZm9ybSBmb3JtJykubGVuZ3RoID09IDA7XG4gICAgfSxcblxuICAgIHNoYWtlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoJy5sb2dpbi1mb3JtJykuYWRkQ2xhc3MoJ3NoYWtlJyk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmxvZ2luLWZvcm0nKS5yZW1vdmVDbGFzcygnc2hha2UnKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxufTsiLCJfLm1peGluKHMuZXhwb3J0cygpKTtcbkRyb3B6b25lLmF1dG9EaXNjb3ZlciA9IGZhbHNlO1xuXG5cbi8qKlxuICpcbiAqIEByZXR1cm5zIHtGYWNlcGFsbUNNU3wqfVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEZhY2VwYWxtQ01TKCkge1xuXG4gICAgaWYgKGFyZ3VtZW50cy5jYWxsZWUuX3NpbmdsZXRvbkluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBhcmd1bWVudHMuY2FsbGVlLl9zaW5nbGV0b25JbnN0YW5jZTtcbiAgICB9XG5cbiAgICBhcmd1bWVudHMuY2FsbGVlLl9zaW5nbGV0b25JbnN0YW5jZSA9IHRoaXM7XG59XG5cblxuRmFjZXBhbG1DTVMucHJvdG90eXBlID0ge1xuICAgIGNzcmZUb2tlbjogJycsXG4gICAgYmFzZVVybDogbnVsbCxcbiAgICBzZXJ2aWNlTG9jYXRvcjogbnVsbCxcbiAgICBldmVudEhhbmRsZXJzOiB7fSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RmFjZXBhbG1DTVN9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXphdGlvblxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZhY2VwYWxtQ01TfVxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5maXJlKCdiZWZvcmVJbml0Jyk7XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlTG9jYXRvciA9IG5ldyBTZXJ2aWNlTG9jYXRvcih0aGlzKTtcbiAgICAgICAgdGhpcy5iYXNlVXJsID0gJCgnYm9keScpLmRhdGEoJ2Jhc2UtdXJsJyk7XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlKCdXeXNpd3lnTWFuYWdlcicpOyAvL2luaXQgbWFuYWdlclxuXG4gICAgICAgIHRoaXMuZmlyZSgnYWZ0ZXJJbml0Jyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBVSSBhbmQgb3RoZXIgc2VydmljZXMsIGFmdGVyIGRvbSByZWFkeVxuICAgICAqL1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuZmlyZSgnYmVmb3JlU3RhcnQnKTtcblxuICAgICAgICAgICAgaWYgKF90aGlzLnNlcnZpY2UoJ0F1dGhNYW5hZ2VyJykuaW5pdCgpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuaW5pdFNlc3Npb25LZWVwQWxpdmUoKTtcblxuICAgICAgICAgICAgICAgIF90aGlzLnNlcnZpY2UoJ1VJJykuaW5pdCgpO1xuICAgICAgICAgICAgICAgIF90aGlzLnNlcnZpY2UoJ1d5c2l3eWdNYW5hZ2VyJykuaW5pdEFsbCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpcy5maXJlKCdhZnRlclN0YXJ0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgc2VydmljZSBmcm9tIFNlcnZpY2UgTG9jYXRvclxuICAgICAqXG4gICAgICogQHBhcmFtIHNlcnZpY2VOYW1lXG4gICAgICogQHBhcmFtIHBhcmFtXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgc2VydmljZTogZnVuY3Rpb24gKHNlcnZpY2VOYW1lLCBwYXJhbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlTG9jYXRvci5nZXQoc2VydmljZU5hbWUsIHBhcmFtKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaXJlIGV2ZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnROYW1lXG4gICAgICovXG4gICAgZmlyZTogZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICBjb25zb2xlLmluZm8oZXZlbnROYW1lKTtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5tYXAoZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlciByZWdpc3RyYXRpb25cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudE5hbWVcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGluZyB0aW1lclxuICAgICAqL1xuICAgIGluaXRTZXNzaW9uS2VlcEFsaXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZ2V0KCcuLycsIHsncGluZyc6ICdwaW5nJ30pO1xuICAgICAgICB9LCAxMjAwMDApO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCBwYXlsb2FkIG9iamVjdCBmb3IgYWpheCByZXF1ZXN0c1xuICAgICAqIEBwYXJhbSBwYXRoXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgYnVpbGRQYXlsb2FkOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIF8uZXh0ZW5kKHt9LnNldFdpdGhQYXRoKHBhdGgsIHZhbHVlKSwgdGhpcy5nZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGF5bG9hZFxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGRvUmVxdWVzdDogZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuICQucG9zdCh0aGlzLmJhc2VVcmwgKyAnLycsIHBheWxvYWQsICdqc29uJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBDU1JGIHRva2VuIG9iamVjdCB7X3Rva2VuOid4eHgnfVxuICAgICAqIEByZXR1cm5zIHt7X3Rva2VuOiBzdHJpbmd9fVxuICAgICAqL1xuICAgIGdldENzcmZUb2tlblBhcmFtZXRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXRoaXMuY3NyZlRva2VuKSB7XG4gICAgICAgICAgICB0aGlzLnNldENzcmZUb2tlbigkKCdpbnB1dDpoaWRkZW5bbmFtZT1fdG9rZW5dJykudmFsKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7J190b2tlbic6IHRoaXMuY3NyZlRva2VufTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IENTUkYgdG9rZW4gdmFsdWVcbiAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRDc3JmVG9rZW46IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmNzcmZUb2tlbiA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgc2V0QmFzZVVybDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn07XG5cbiIsImZ1bmN0aW9uIFNlcnZpY2VMb2NhdG9yKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5TZXJ2aWNlTG9jYXRvci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIHNlcnZpY2VzTWFwOiB7fSxcblxuICAgIGdldDogZnVuY3Rpb24gKGNsYXNzTmFtZSwgcGFyYW0pIHtcbiAgICAgICAgaWYgKCF0aGlzLnNlcnZpY2VzTWFwW2NsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3dbY2xhc3NOYW1lXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VydmljZXNNYXBbY2xhc3NOYW1lXSA9IG5ldyB3aW5kb3dbY2xhc3NOYW1lXSh0aGlzLmFwcCwgcGFyYW0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCLQndC10LjQt9Cy0LXRgdGC0L3Ri9C5INC60LvQsNGB0YE6IFwiICsgY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zZXJ2aWNlc01hcFtjbGFzc05hbWVdO1xuICAgIH0sXG5cbn07XG5cbiIsIi8qKlxuICogQ3JlYXRlZCBieSB4cHVuZGVsIG9uIDE0LjEyLjE1LlxuICovXG5cbi8qKlxuICogQG1ldGhvZCBzZXRXaXRoUGF0aFxuICogU2V0cyB0aGUgbmVzdGVkIHByb3BlcnR5IG9mIG9iamVjdFxuICovXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LnByb3RvdHlwZSwgJ3NldFdpdGhQYXRoJywge1xuICAgIHZhbHVlOiBmdW5jdGlvbiAocGF0aCwgdmFsdWUpIHsgLyogTWFrZXMgYnJlYWtmYXN0LCBzb2x2ZXMgd29ybGQgcGVhY2UsIHRha2VzIG91dCB0cmFzaCAqL1xuICAgICAgICBpZiAocGF0aCAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiAgcGF0aCA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnNwbGl0KCcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIShwYXRoIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGN1ciA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgZmllbGRzID0gcGF0aDtcbiAgICAgICAgICAgIGZpZWxkcyA9IGZpZWxkcy5maWx0ZXIoZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSAhPSAndW5kZWZpbmVkJyAmJiB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZmllbGRzLm1hcChmdW5jdGlvbiAoZmllbGQsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgY3VyW2ZpZWxkXSA9IGN1cltmaWVsZF0gfHwgKGluZGV4ID09IGZpZWxkcy5sZW5ndGggLSAxID8gKHZhbHVlIHx8IHt9KSA6IHt9KTtcbiAgICAgICAgICAgICAgICBjdXIgPSBjdXJbZmllbGRdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG59KTtcblxuLyoqXG4gKlxuICogQHBhcmFtIG1zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gZGVsYXkobXMpIHtcbiAgICB2YXIgZCA9ICQuRGVmZXJyZWQoKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5yZXNvbHZlKCk7XG4gICAgfSwgbXMpO1xuICAgIHJldHVybiBkLnByb21pc2UoKTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHN0clxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGdldFF1ZXJ5UGFyYW1ldGVycyhzdHIpIHtcbiAgICByZXR1cm4gKHN0ciB8fCBkb2N1bWVudC5sb2NhdGlvbi5zZWFyY2gpLnJlcGxhY2UoLyheXFw/KS8sICcnKS5zcGxpdChcIiZcIikubWFwKGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHJldHVybiBuID0gbi5zcGxpdChcIj1cIiksIHRoaXNbblswXV0gPSBuWzFdLCB0aGlzXG4gICAgfS5iaW5kKHt9KSlbMF07XG59XG5cbi8qKlxuICpcbiAqL1xuaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKSB7XG4gICAgU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCA9IGZ1bmN0aW9uIChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgIHZhciBzdWJqZWN0U3RyaW5nID0gdGhpcy50b1N0cmluZygpO1xuICAgICAgICBpZiAodHlwZW9mIHBvc2l0aW9uICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocG9zaXRpb24pIHx8IE1hdGguZmxvb3IocG9zaXRpb24pICE9PSBwb3NpdGlvbiB8fCBwb3NpdGlvbiA+IHN1YmplY3RTdHJpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHBvc2l0aW9uIC09IHNlYXJjaFN0cmluZy5sZW5ndGg7XG4gICAgICAgIHZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG4gICAgICAgIHJldHVybiBsYXN0SW5kZXggIT09IC0xICYmIGxhc3RJbmRleCA9PT0gcG9zaXRpb247XG4gICAgfTtcbn1cblxuLyoqXG4gKlxuICovXG5pZiAoIVN0cmluZy5wcm90b3R5cGUuc3RhcnRzV2l0aCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJpbmcucHJvdG90eXBlLCAnc3RhcnRzV2l0aCcsIHtcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8IDA7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0SW5kZXhPZihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSA9PT0gcG9zaXRpb247XG4gICAgICAgIH1cbiAgICB9KTtcbn0iLCJmdW5jdGlvbiBEcm9wem9uZU1hbmFnZXIoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkRyb3B6b25lTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdGVtcGxhdGVJbWFnZSA9IHR3aWcoe1xuICAgICAgICAgICAgZGF0YTogJCgnI2ltYWdlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0ZW1wbGF0ZUZpbGUgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNmaWxlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChcIi5kcm9wem9uZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkcm9wem9uZSQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGlzTXVsdGlwbGUgPSBkcm9wem9uZSQuZGF0YSgnbXVsdGlwbGUnKSA9PSBcIjFcIjtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kcm9wem9uZSh7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFsbGVsVXBsb2FkczogMyxcbiAgICAgICAgICAgICAgICAgICAgYWRkUmVtb3ZlTGlua3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZE11bHRpcGxlOiBpc011bHRpcGxlLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVJbWFnZVRodW1ibmFpbHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtYXhGaWxlczogaXNNdWx0aXBsZSA/IG51bGwgOiAxLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbU5hbWU6ICQodGhpcykuZGF0YSgnaW5wdXQtbmFtZScpLFxuICAgICAgICAgICAgICAgICAgICBjbGlja2FibGU6ICQodGhpcykuZmluZChcIi5kei1tZXNzYWdlXCIpWzBdLFxuICAgICAgICAgICAgICAgICAgICBhY2NlcHRlZEZpbGVzOiBkcm9wem9uZSQuZGF0YSgndHlwZScpID09ICdpbWFnZScgPyAnaW1hZ2UvKicgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IF90aGlzLmFwcC5iYXNlVXJsICsgXCIvP190b2tlbj1cIiArIF90aGlzLmFwcC5nZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKS5fdG9rZW4gKyBkcm9wem9uZSQuZGF0YSgncGFyYW1ldGVycycpLFxuXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChmaWxlLCByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc011bHRpcGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcm9wem9uZSQuZGF0YSgndHlwZScpID09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcm9wem9uZSQucHJldigpLmZpbmQoJy5pbWFnZVtkYXRhLWlkPScgKyByZXNwb25zZVtpXS5pbWFnZS5pZCArICddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSQucHJldigpLmFwcGVuZCh0ZW1wbGF0ZUltYWdlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdEZhbmN5Ym94KGRyb3B6b25lJC5wcmV2KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcm9wem9uZSQucHJldigpLmZpbmQoJy5maWxlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmZpbGUuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5hcHBlbmQodGVtcGxhdGVGaWxlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChmaWxlLCBlcnJvck1lc3NhZ2UsIHhocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDQvdC+0YDQvNCw0LvRjNC90L4g0L7QsdGA0LDQsdCw0YLRi9Cy0LDRgtGMINC4INC/0L7QutCw0LfRi9Cy0LDRgtGMINC+0YjQuNCx0LrQuFxuICAgICAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQntGI0LjQsdC60LAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfQndC1INGD0LTQsNC10YLRgdGPINC30LDQs9GA0YPQt9C40YLRjCDRhNCw0LnQuyDQvdCwINGB0LXRgNCy0LXRgC4g0J3QtdCy0LXRgNC90YvQuSDRhNC+0YDQvNCw0YIg0LjQu9C4INGB0LvQuNGI0LrQvtC8INCx0L7Qu9GM0YjQvtC5INGA0LDQt9C80LXRgC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA3MDAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuXG4gICAgfSxcblxuXG59OyIsImZ1bmN0aW9uIEZvcm0oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkZvcm0ucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0U2F2ZSgpO1xuICAgICAgICB0aGlzLmluaXREYXRlcGlja2VyKCk7XG4gICAgfSxcblxuICAgIGluaXRTYXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuZm9ybS1idXR0b25zIGJ1dHRvbi5zYXZlLWJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmb3JtRGF0YSA9ICQoJy5tYWluLWNtcy1mb3JtJykuc2VyaWFsaXplKCk7XG4gICAgICAgICAgICB2YXIgY3JlYXRlTW9kZSA9ICQoJy5jbXMtbW9kdWxlLWZvcm0tcGFnZScpLmRhdGEoJ2NyZWF0ZS1tb2RlJyk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVSScpLnRvZ2dsZVNwaW5uZXIodHJ1ZSk7XG4gICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVGb3JtQnV0dG9ucyhmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIE1pbmltdW0gZGVsYXkgdG8gYXZvaWQgdW5wbGVhc2FudCBibGlua2luZ1xuICAgICAgICAgICAgJC53aGVuKFxuICAgICAgICAgICAgICAgICQucG9zdChfdGhpcy5hcHAuYmFzZVVybCArICcvJywgZm9ybURhdGEpLFxuICAgICAgICAgICAgICAgIGRlbGF5KGNyZWF0ZU1vZGUgPyAxMDAgOiA1MDApXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IHJlc3VsdFswXTtcbiAgICAgICAgICAgICAgICBpZiAoY3JlYXRlTW9kZSAmJiBwYXJzZUludChyZXNwb25zZSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBfLnJ0cmltKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsICcvJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmwuZW5kc1dpdGgoJy9jcmVhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gXy5zdHJMZWZ0QmFjayh1cmwsICcvJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHVybCArICcvJyArIHJlc3BvbnNlICsgJy8nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wubm90aWNlKHt0aXRsZTogJycsIG1lc3NhZ2U6IFwiQ9C+0YXRgNCw0L3QtdC90L5cIn0pO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVTcGlubmVyKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VJJykudG9nZ2xlRm9ybUJ1dHRvbnModHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgaW5pdERhdGVwaWNrZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy90b2RvOiDQv9C+0LTRg9C80LDRgtGMLCDQvdCw0YHRh9C10YIgbGl2ZT9cbiAgICAgICAgJCgnLmRhdGVwaWNrZXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAkKHRoaXMpWzBdLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnZGFyay10aGVtZScsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWScsXG4gICAgICAgICAgICAgICAgZmlyc3REYXk6IDEsXG4gICAgICAgICAgICAgICAgc2hvd1RpbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGkxOG46IHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNNb250aDogJ9Cf0YDQtdC00YvQtNGD0YnQuNC5INC80LXRgdGP0YYnLFxuICAgICAgICAgICAgICAgICAgICBuZXh0TW9udGg6ICfQodC70LXQtNGD0Y7RidC40Lkg0LzQtdGB0Y/RhicsXG4gICAgICAgICAgICAgICAgICAgIG1vbnRoczogWyfQr9C90LLQsNGA0YwnLCAn0KTQtdCy0YDQsNC70YwnLCAn0JzQsNGA0YInLCAn0JDQv9GA0LXQu9GMJywgJ9Cc0LDQuScsICfQmNGO0L3RjCcsICfQmNGO0LvRjCcsICfQkNCy0LPRg9GB0YInLCAn0KHQtdC90YLRj9Cx0YDRjCcsICfQntC60YLRj9Cx0YDRjCcsICfQndC+0Y/QsdGA0YwnLCAn0JTQtdC60LDQsdGA0YwnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXM6IFsn0JLQvtGB0LrRgNC10YHQtdC90YzQtScsICfQn9C+0L3QtdC00LXQu9GM0L3QuNC6JywgJ9CS0YLQvtGA0L3QuNC6JywgJ9Ch0YDQtdC00LAnLCAn0KfQtdGC0LLQtdGA0LMnLCAn0J/Rj9GC0L3QuNGG0LAnLCAn0KHRg9Cx0LHQvtGC0LAnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXNTaG9ydDogWyfQktGBJywgJ9Cf0L0nLCAn0JLRgicsICfQodGAJywgJ9Cn0YInLCAn0J/RgicsICfQodCxJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaXMoJy5kYXRldGltZScpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWSBISDptbScsXG4gICAgICAgICAgICAgICAgICAgIHNob3dUaW1lOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzaG93U2Vjb25kczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHVzZTI0aG91cjogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ldyBQaWthZGF5KG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnLmRhdGVwaWNrZXIgKyAuY2xlYXItZGF0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykucHJldigpLnZhbCgnJyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07IiwiZnVuY3Rpb24gR29vZ2xlTWFwKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5Hb29nbGVNYXAucHJvdG90eXBlID0ge1xuICAgIGluaXRNYXBzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICgkKCcubWFwLmdvb2dsZVtkYXRhLWxhdF1bZGF0YS1sbmddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAkLmdldFNjcmlwdChcImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5QkY5d05XZ0MxNmlDSG1UbG9XRWw1WTdzQVJEU3lxUlVFJmxpYnJhcmllcz1wbGFjZXMmc2Vuc29yPWZhbHNlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYWZ0ZXJHb29nbGVNYXBzQXBpTG9hZCcpO1xuICAgICAgICAgICAgICAgICQoJy5tYXBbZGF0YS1sYXRdW2RhdGEtbG5nXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0TGF0ID0gcGFyc2VGbG9hdCgkKHRoaXMpLmRhdGEoJ2xhdCcpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdExuZyA9IHBhcnNlRmxvYXQoJCh0aGlzKS5kYXRhKCdsbmcnKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0TGF0ID0gaXNOYU4ob2JqZWN0TGF0KSA/IDAgOiBvYmplY3RMYXQ7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdExuZyA9IGlzTmFOKG9iamVjdExuZykgPyAwIDogb2JqZWN0TG5nO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwVHlwZUNvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWV0Vmlld0NvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvYmplY3RMYXQsIG9iamVjdExuZylcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdExhdCAmJiBvYmplY3RMbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcE9wdGlvbnMuem9vbSA9IDEyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBFbGVtZW50ID0gJCh0aGlzKVswXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobWFwRWxlbWVudCwgbWFwT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9iamVjdExhdCwgb2JqZWN0TG5nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQobWFwRWxlbWVudCkuY2xvc2VzdCgnLmxhdC1sbmctY29udGFpbmVyJykuZmluZChcIltkYXRhLWxhdGxuZy1maWVsZD1sYXRdXCIpLnZhbChldmVudC5sYXRMbmcubGF0KCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAkKG1hcEVsZW1lbnQpLmNsb3Nlc3QoJy5sYXQtbG5nLWNvbnRhaW5lcicpLmZpbmQoXCJbZGF0YS1sYXRsbmctZmllbGQ9bG5nXVwiKS52YWwoZXZlbnQubGF0TG5nLmxuZygpKVxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKGV2ZW50LmxhdExuZyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgc2VhcmNoIGJveCBhbmQgbGluayBpdCB0byB0aGUgVUkgZWxlbWVudC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BhYy1pbnB1dCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm9uKCdrZXlwcmVzcycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS53aGljaCA9PSAxMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VhcmNoQm94ID0gbmV3IGdvb2dsZS5tYXBzLnBsYWNlcy5TZWFyY2hCb3goaW5wdXQpO1xuICAgICAgICAgICAgICAgICAgICBtYXAuY29udHJvbHNbZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uLlRPUF9MRUZUXS5wdXNoKGlucHV0KTtcblxuICAgICAgICAgICAgICAgICAgICBtYXAuYWRkTGlzdGVuZXIoJ2JvdW5kc19jaGFuZ2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoQm94LnNldEJvdW5kcyhtYXAuZ2V0Qm91bmRzKCkpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgbWFya2VycyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBzZWFyY2hCb3guYWRkTGlzdGVuZXIoJ3BsYWNlc19jaGFuZ2VkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBsYWNlcyA9IHNlYXJjaEJveC5nZXRQbGFjZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbGFjZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJvdW5kcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmdCb3VuZHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGxhY2UgPSBwbGFjZXNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxhY2UuZ2VvbWV0cnkudmlld3BvcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25seSBnZW9jb2RlcyBoYXZlIHZpZXdwb3J0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3VuZHMudW5pb24ocGxhY2UuZ2VvbWV0cnkudmlld3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdW5kcy5leHRlbmQocGxhY2UuZ2VvbWV0cnkubG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXAuZml0Qm91bmRzKGJvdW5kcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmZpcmUoJ2FmdGVyTWFwc0luaXQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4iLCJmdW5jdGlvbiBMZWZ0TWVudShhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuTGVmdE1lbnUucHJvdG90eXBlID0ge1xuICAgIGluaXRNYWluTWVudTogZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy5tYWluLW1lbnUgLmxlZnQtcGFuZWw6bm90KC5jb2xsYXBzZWQpLCAubWFpbi1tZW51IC5yaWdodC1wYW5lbCcpLm1DdXN0b21TY3JvbGxiYXIoe1xuICAgICAgICAgICAgdGhlbWU6IFwibGlnaHQtMlwiLFxuICAgICAgICAgICAgYXV0b0V4cGFuZFNjcm9sbGJhcjogdHJ1ZSxcbiAgICAgICAgICAgIHNjcm9sbEluZXJ0aWE6IDQwMCxcbiAgICAgICAgICAgIG1vdXNlV2hlZWw6IHtcbiAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhbGxiYWNrczoge1xuICAgICAgICAgICAgICAgIG9uU2Nyb2xsOiBmdW5jdGlvbiAocSwgcTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb250ZW50IHNjcm9sbGVkLi4uXCIsIHEsIHExKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0b2RvOiDQv9GA0LjQuiDQu9C60LjQutC1INC/0L4g0LzQtdC90Y4gLSDQt9Cw0L/QvtC80LjQvdCw0YLRjCDQsiDQu9C+0LrQsNC7LdGB0YLQvtGA0LDQtNC20LUg0YHQutGA0L7Qu9C70KLQvtC/LCDQuCDQv9C+0YLQvtC8INC/0YDQuCDQuNC90LjRhtC40LDQu9C40LfQsNGG0LjQuCAtINGB0YDQsNC30YMg0YHQutGA0L7Qu9C70LjRgtGMINC90LAg0L3QtdCz0L4uXG4gICAgICAgICAgICAvLyB0b2RvOiDQn9GA0Lgg0LfQsNCz0YDRg9C30LrQtSDRgdGC0YDQsNC90LjRhtGLIC0g0L7QsdC90YPQu9GP0YLRjCDRjdGC0L4g0LfQvdCw0YfQtdC90LjQtSDQsiDQu9C+0LrQsNC70YHRgtC+0YDQsNC00LbQtVxuICAgICAgICAgICAgLy8gdG9kbzog0LXRgdC70Lgg0LXRgdGC0Ywg0LLRi9C00LXQu9C10L3QvdGL0Lkg0L/Rg9C90LrRgiwg0LAg0YHQvtGF0YDQsNC90LXQvdC90L7Qs9C+INC30L3QsNGH0LXQvdC40Y8g0L3QtdGCLCDRgtC+INCy0YvRh9C40YHQu9GP0YLRjCDQtdCz0L4g0L/RgNC40LzQtdGA0L3QviDQuCDRgdC10YDQvtC70LvQuNGC0Ywg0YLRg9C00LBcbiAgICAgICAgICAgIC8vIHRvZG86INCwINCy0L7QvtCx0YnQtSwg0L/QtdGA0LXQtNC10LvQsNGC0Ywg0LLRgdC1INC90LAg0LDRj9C60YEsINGB0YPQutCwXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIiwiZnVuY3Rpb24gTGlzdChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICAgICdzdGF0dXMnOiBbJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudCBidXR0b24uc3RhdHVzJywgJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uc3RhdHVzJ10sXG4gICAgICAgICdkZWxldGUnOiBbJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudCBidXR0b24uZGVsZXRlJywgJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uZGVsZXRlJ10sXG4gICAgICAgICdhZGQnOiAnLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50IGJ1dHRvbi5hZGQnLFxuICAgICAgICAnYWRkUm9vdCc6ICcuYWRkLW5ldy10cmVlLWl0ZW0nXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmluaXRCdXR0b25zKCk7XG4gICAgICAgIHRoaXMuaW5pdFNvcnRhYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdEJ1dHRvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0U3RhdHVzQnV0dG9uKCk7XG4gICAgICAgIHRoaXMuaW5pdERlbGV0ZUJ1dHRvbigpO1xuICAgICAgICB0aGlzLmluaXRBZGRCdXR0b24oKTtcbiAgICAgICAgdGhpcy5pbml0QWRkVG9Sb290QnV0dG9uKCk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXR1c1xuICAgICAqL1xuICAgIGluaXRTdGF0dXNCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLnN0YXR1cy5qb2luKCcsJyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpZCA9IF90aGlzLmdldEl0ZW1JZChidG4kKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IF90aGlzLmdldEl0ZW1Db250YWluZXIoYnRuJCk7XG5cbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ3RvZ2dsZScsIG1vZGVsLCBpZCwgJ3N0YXR1cyddLCAxKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC50b2dnbGVDbGFzcygnaW5hY3RpdmUnLCAhcmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBvYmplY3RcbiAgICAgKi9cbiAgICBpbml0RGVsZXRlQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKF90aGlzLnNlbGVjdG9ycy5kZWxldGUpO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuZGVsZXRlLmpvaW4oJywnKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1N1cmU/JykpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gX3RoaXMuZ2V0SXRlbUlkKGJ0biQpO1xuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBfdGhpcy5nZXRJdGVtQ29udGFpbmVyKGJ0biQpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnZGVsZXRlJywgbW9kZWwsIGlkXSwgMSk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQWRkIGNoaWxkXG4gICAgICovXG4gICAgaW5pdEFkZEJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuYWRkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaWQgPSBfdGhpcy5nZXRJdGVtSWQoYnRuJCk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBfdGhpcy5nZXRJdGVtTW9kZWwoYnRuJCk7XG4gICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBfdGhpcy5nZXRJdGVtQ29udGFpbmVyKGJ0biQpO1xuXG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydjcmVhdGUnLCBtb2RlbCwgX3RoaXMuZ2VuZXJhdGVSYW5kb21JZFN0cmluZygpLCAncGFyZW50X2lkJ10sIGlkKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBidG4kLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmZpbmQoJ3NjcmlwdFtkYXRhLXRlbXBsYXRlLW5hbWU9XCJlbXB0eS10cmVlLWVsZW1lbnRcIl0nKS5odG1sKCk7XG4gICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQuZmluZCgnPnVsJykuYXBwZW5kKF90aGlzLmNyZWF0ZU5ld0VsZW1lbnQodGVtcGxhdGUsIHJlc3VsdCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBvYmplY3QgdG8gdGhlIHRyZWUgcm9vdFxuICAgICAqL1xuICAgIGluaXRBZGRUb1Jvb3RCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLmFkZFJvb3QsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IGJ0biQuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJyk7XG4gICAgICAgICAgICB2YXIgaWQgPSBwYXJzZUludChpdGVtQ29udGFpbmVyJC5kYXRhKCd0cmVlLXJvb3QnKSk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBpdGVtQ29udGFpbmVyJC5kYXRhKCdtb2RlbCcpO1xuXG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydjcmVhdGUnLCBtb2RlbCwgX3RoaXMuZ2VuZXJhdGVSYW5kb21JZFN0cmluZygpLCAncGFyZW50X2lkJ10sIGlkKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBidG4kLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmZpbmQoJ3NjcmlwdFtkYXRhLXRlbXBsYXRlLW5hbWU9XCJlbXB0eS10cmVlLWVsZW1lbnRcIl0nKS5odG1sKCk7XG4gICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQuZmluZCgndWw6Zmlyc3QnKS5hcHBlbmQoX3RoaXMuY3JlYXRlTmV3RWxlbWVudCh0ZW1wbGF0ZSwgcmVzdWx0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdFNvcnRhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGZ1bmN0aW9uIGluaXRTb3J0YWJsZUVuZ2luZShlbCwgaGFuZGxlTmFtZSwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoZWwsIHtcbiAgICAgICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiAyMDAsXG4gICAgICAgICAgICAgICAgZ3JvdXA6IGdyb3VwTmFtZSxcbiAgICAgICAgICAgICAgICBoYW5kbGU6IGhhbmRsZU5hbWUsXG4gICAgICAgICAgICAgICAgb25BZGQ6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25UcmVlU29ydChldnQsIHNvcnRhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpIHtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9ICQoZXZ0LnRhcmdldCkuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgnbW9kZWwnKTtcbiAgICAgICAgICAgIHZhciBwYXJlbnRJZCA9ICQoZXZ0LnRhcmdldCkuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgIHZhciBvcmRlckFycmF5ID0gc29ydGFibGUudG9BcnJheSgpLmZpbHRlcihmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwgPj0gMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF8uZXh0ZW5kKHtzYXZlOiB7fX0sIF90aGlzLmFwcC5nZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bbW9kZWxdID0ge307IC8vIG9iamVjdCwgbm90IGFuIGFycmF5LiBPdGhlcndpc2UgaXQgd2lsbCBjcmVhdGUgMC4uaWQgZW1wdHkgZWxlbWVudHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3JkZXJBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChvcmRlckFycmF5Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF1bb3JkZXJBcnJheVtpXV0gPSB7J3Nob3dfb3JkZXInOiBwYXJzZUludChpKSArIDEsICdwYXJlbnRfaWQnOiBwYXJlbnRJZH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHJlZXNcbiAgICAgICAgJCgnLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50JykuZWFjaChmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgdmFyIHBsYWluID0gJCh0aGlzKS5kYXRhKCdwbGFpbicpID09PSAxO1xuICAgICAgICAgICAgdmFyIHRyZWVOYW1lID0gJ3RyZWVfJyArIGk7XG4gICAgICAgICAgICAkKHRoaXMpLmZpbmQoKHBsYWluID8gJz4nIDogJycpICsgJ3VsJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaW5pdFNvcnRhYmxlRW5naW5lKCQodGhpcylbMF0sICcuaWQnLCB0cmVlTmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTGlzdHNcbiAgICAgICAgJCgnLmNtcy1tb2R1bGUtbGlzdC1jb250ZW50W2RhdGEtc29ydGFibGU9XCJ0cnVlXCJdIHRib2R5JykuZWFjaChmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgdmFyIGxpc3ROYW1lID0gJ2xpc3RfJyArIGk7XG4gICAgICAgICAgICBpbml0U29ydGFibGVFbmdpbmUoJCh0aGlzKVswXSwgJy5jb2x1bW4taWQnLCBsaXN0TmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIFxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsJFxuICAgICAqIEByZXR1cm5zIHsqfEhUTUxFbGVtZW50fG51bGx9XG4gICAgICovXG4gICAgZ2V0SXRlbUNvbnRhaW5lcjogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICByZXR1cm4gZWwkLmNsb3Nlc3QoJ1tkYXRhLWlkXScpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsJFxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGdldEl0ZW1JZDogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRJdGVtQ29udGFpbmVyKGVsJCkuZGF0YSgnaWQnKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBnZXRJdGVtTW9kZWw6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgcmV0dXJuIGVsJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCdtb2RlbCcpO1xuICAgIH0sXG5cblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdlbmVyYXRlUmFuZG9tSWRTdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICclQ1JFQVRFXycgKyBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgOCkgKyAnJSc7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGVtcGxhdGVcbiAgICAgKiBAcGFyYW0gcmVzdWx0XG4gICAgICogQHJldHVybnMgeyp8alF1ZXJ5fVxuICAgICAqL1xuICAgIGNyZWF0ZU5ld0VsZW1lbnQ6IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgcmVzdWx0KSB7XG4gICAgICAgIHZhciBuZXdJdGVtJCA9ICQodGVtcGxhdGUucmVwbGFjZShuZXcgUmVnRXhwKCclQ1JFQVRFXyUnLCAnZycpLCByZXN1bHQpKS5hdHRyKCdkYXRhLWlkJywgcmVzdWx0KTtcbiAgICAgICAgbmV3SXRlbSQuZmluZCgnLmlkJykudGV4dChyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3SXRlbSQ7XG4gICAgfVxufTsiLCJmdW5jdGlvbiBVSShhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuVUkucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcbiAgICB1c2VyTWVudTogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0VXNlck1lbnUoKTtcbiAgICAgICAgdGhpcy5pbml0SHJlZkJ1dHRvbnMoKTtcbiAgICAgICAgdGhpcy5pbml0U3RhcnR1cE5vdGlmaWNhdGlvbnMoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnR29vZ2xlTWFwJykuaW5pdE1hcHMoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnTGVmdE1lbnUnKS5pbml0TWFpbk1lbnUoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnTGlzdCcpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnRm9ybScpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnRHJvcHpvbmVNYW5hZ2VyJykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdVcGxvYWRhYmxlc0xpc3QnKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ1ZpZGVvc0xpc3QnKS5pbml0KCk7XG4gICAgfSxcblxuICAgIGluaXRTdGFydHVwTm90aWZpY2F0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoJCgnLmNtcy1tb2R1bGUtZm9ybS1wYWdlJykuZGF0YSgnanVzdC1jcmVhdGVkJykpIHtcbiAgICAgICAgICAgICQuZ3Jvd2wubm90aWNlKHt0aXRsZTogJycsIG1lc3NhZ2U6IFwi0J7QsdGK0LXQutGCINGB0L7Qt9C00LDQvVwifSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdFVzZXJNZW51OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlci1pY29uJykpIHtcbiAgICAgICAgICAgIHRoaXMudXNlck1lbnUgPSBuZXcgRHJvcCh7XG4gICAgICAgICAgICAgICAgb3Blbk9uOiAnY2xpY2snLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYm90dG9tIHJpZ2h0JyxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy51c2VyLWljb24nKSxcbiAgICAgICAgICAgICAgICBjb250ZW50OiAkKCcudXNlci1kcm9wZG93bi1jb250YWluZXInKS5odG1sKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXRIcmVmQnV0dG9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYnV0dG9uW2hyZWZdJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9ICQodGhpcykuYXR0cignaHJlZicpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlU3Bpbm5lcjogZnVuY3Rpb24gKHNob3cpIHtcbiAgICAgICAgJCgnI3NwaW5uZXInKS50b2dnbGVDbGFzcygnc2hvdycsIHNob3cpO1xuICAgIH0sXG5cbiAgICB0b2dnbGVGb3JtQnV0dG9uczogZnVuY3Rpb24gKGVuYWJsZSkge1xuICAgICAgICAkKCcuZm9ybS1idXR0b25zIGJ1dHRvbicpLnByb3AoJ2Rpc2FibGVkJywgIWVuYWJsZSk7XG4gICAgfVxuXG59IiwiZnVuY3Rpb24gVXBsb2FkYWJsZXNMaXN0KGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5VcGxvYWRhYmxlc0xpc3QucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBbJ2ltYWdlJywgJ2ZpbGUnXS5mb3JFYWNoKGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgX3RoaXMuaW5pdERlbGV0ZUJ1dHRvbihtb2RlbCk7XG5cbiAgICAgICAgICAgICQoJy4nICsgbW9kZWwgKyAncy1saXN0JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsID09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuaW5pdEZhbmN5Ym94KCQodGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy5pbml0U29ydGFibGUoJCh0aGlzKVswXSwgbW9kZWwpXG5cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgaW5pdERlbGV0ZUJ1dHRvbjogZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuJyArIG1vZGVsICsgJ3MtbGlzdCAuJyArIG1vZGVsICsgJyAuZGVsZXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1N1cmU/JykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxlbWVudCQgPSAkKHRoaXMpLmNsb3Nlc3QoJy4nICsgbW9kZWwpO1xuICAgICAgICAgICAgICAgIHZhciBpZCA9IGVsZW1lbnQkLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnZGVsZXRlJywgbW9kZWwsIGlkXSwgMSk7XG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCQuZmFkZU91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0U29ydGFibGU6IGZ1bmN0aW9uIChlbCwgbW9kZWwpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHNvcnRhYmxlID0gU29ydGFibGUuY3JlYXRlKGVsLCB7XG4gICAgICAgICAgICBhbmltYXRpb246IDIwMCxcbiAgICAgICAgICAgIGhhbmRsZTogbW9kZWwgPT0gJ2ZpbGUnID8gXCIuaWNvblwiIDogbnVsbCxcbiAgICAgICAgICAgIHNjcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9yZGVyQXJyYXkgPSBzb3J0YWJsZS50b0FycmF5KCk7XG4gICAgICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnc2F2ZScsIG1vZGVsXSwge30pO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3JkZXJBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3JkZXJBcnJheS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddW21vZGVsXVtvcmRlckFycmF5W2ldXSA9IHsnc2hvd19vcmRlcic6IHBhcnNlSW50KGkpICsgMX07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdEZhbmN5Ym94OiBmdW5jdGlvbiAoZWwkKSB7XG4gICAgICAgIGVsJC5maW5kKCcuaW1hZ2UgPiBhJykuZmFuY3lib3goe1xuICAgICAgICAgICAgcGFkZGluZzogMSxcbiAgICAgICAgICAgIG9wZW5FZmZlY3Q6ICdlbGFzdGljJyxcbiAgICAgICAgICAgIGhlbHBlcnM6IHtcbiAgICAgICAgICAgICAgICBvdmVybGF5OiB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2tlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGNzczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiAncmdiYSgwLDAsMCwwLjUpJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxufTsiLCJmdW5jdGlvbiBWaWRlb3NMaXN0KGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5WaWRlb3NMaXN0LnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHRlbXBsYXRlSW1hZ2UgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNpbWFnZS1wcmV2aWV3LXRlbXBsYXRlJykuaHRtbCgpXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY21zLWJ1dHRvbltkYXRhLWFkZC12aWRlb10nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmZhbmN5Ym94Lm9wZW4odHdpZyh7ZGF0YTogJCgnI2luc2VydC12aWRlby10ZW1wbGF0ZScpLmh0bWwoKX0pLnJlbmRlcih7XG4gICAgICAgICAgICAgICAgaW5wdXROYW1lOiAkKHRoaXMpLmRhdGEoJ2lucHV0LW5hbWUnKVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5pbnNlcnQtdmlkZW8tZGlhbG9nIGJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkaWFsb2ckID0gJCh0aGlzKS5jbG9zZXN0KCcuaW5zZXJ0LXZpZGVvLWRpYWxvZycpO1xuICAgICAgICAgICAgdmFyIHRleHRhcmVhJCA9IGRpYWxvZyQuZmluZCgndGV4dGFyZWEnKTtcbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZCgpO1xuICAgICAgICAgICAgcGF5bG9hZFt0ZXh0YXJlYSQuYXR0cignbmFtZScpXSA9IHRleHRhcmVhJC52YWwoKTtcbiAgICAgICAgICAgIHBheWxvYWRbJ211bHRpcGxlJ10gPSB0cnVlO1xuXG4gICAgICAgICAgICBkaWFsb2ckLmFkZENsYXNzKCdwcm9jZXNzaW5nJyk7XG4gICAgICAgICAgICB0ZXh0YXJlYSQuYXR0cignZGlzYWJsZWQnLCB0cnVlKS5jc3MoJ2JhY2tncm91bmQnLCAnI2VlZScpO1xuXG4gICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbiA9ICQoJy5jbXMtYnV0dG9uW2RhdGEtYWRkLXZpZGVvXVtkYXRhLWlucHV0LW5hbWU9XCInICsgdGV4dGFyZWEkLmF0dHIoJ25hbWUnKSArICdcIl0nKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYnV0dG9uLnByZXZBbGwoJy5pbWFnZXMtbGlzdDpmaXJzdCcpLmZpbmQoJy5pbWFnZVtkYXRhLWlkPScgKyByZXNwb25zZVtpXS5pbWFnZS5pZCArICddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b24ucHJldkFsbCgnLmltYWdlcy1saXN0OmZpcnN0JykuYXBwZW5kKHRlbXBsYXRlSW1hZ2UucmVuZGVyKHJlc3BvbnNlW2ldKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVcGxvYWRhYmxlc0xpc3QnKS5pbml0RmFuY3lib3goYnV0dG9uLnByZXZBbGwoJy5pbWFnZXMtbGlzdDpmaXJzdCcpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkLmZhbmN5Ym94LmNsb3NlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbn07IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMDQuMDQuMTYuXG4gKi9cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoJCgndHJbZGF0YS1yb3ctZm9yLWZpZWxkPVwiYWNsXCJdJykubGVuZ3RoKSB7XG4gICAgICAgICQoJ1tkYXRhLXJvdy1mb3ItZmllbGQ9XCJyb2xlLm5hbWVcIl0gc2VsZWN0Jykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLnZhbCgpID09IDEpIHtcbiAgICAgICAgICAgICAgICAkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5oaWRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLnNob3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgfVxufSk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMTcuMDYuMTYuXG4gKi9cbmZ1bmN0aW9uIGdldERlZmF1bHRUaW55TWNlT3B0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50X2NzczogJy9hc3NldHMvZmFjZXBhbG0vY3NzL2NvbnRlbnQuY3NzJyxcbiAgICAgICAgbGFuZ3VhZ2U6ICdydScsXG4gICAgICAgIG1lbnViYXI6IGZhbHNlLFxuICAgICAgICBzdGF0dXNiYXI6IGZhbHNlLFxuICAgICAgICBzdHlsZV9mb3JtYXRzOiBbXG4gICAgICAgICAgICB7dGl0bGU6ICfQntCx0YvRh9C90YvQuSDRgtC10LrRgdGCJywgYmxvY2s6ICdwJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQl9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gyJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQn9C+0LTQt9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gzJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQktGA0LXQt9C60LAnLCBibG9jazogJ2Jsb2NrcXVvdGUnfSxcbiAgICAgICAgICAgIC8vIHsgdGl0bGU6ICdUYWJsZSByb3cgMScsIHNlbGVjdG9yOiAndHInLCBjbGFzc2VzOiAndGFibGVyb3cxJyB9XG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gZXh0ZW5kZWRfdmFsaWRfZWxlbWVudHM6ICdpbWdbY2xhc3M9bXljbGFzc3whc3JjfGJvcmRlcjowfGFsdHx0aXRsZXx3aWR0aHxoZWlnaHR8c3R5bGVdJyxcbiAgICAgICAgLy8gaW52YWxpZF9lbGVtZW50czogJ3N0cm9uZyxiLGVtLGknLFxuXG4gICAgICAgIHBsdWdpbnM6IFsnZml4ZWR0b29sYmFyJywgJ2F1dG9yZXNpemUnLCAnY29kZW1pcnJvcicsICdsaW5rJywgJ2F1dG9saW5rJywgJ21lZGlhJywgJ25vbmVkaXRhYmxlJywgJ3Bhc3RlJywgJ3RhYmxlJywgJ3Zpc3VhbGJsb2NrcyddLFxuICAgICAgICB0b29sYmFyOiAnc3R5bGVzZWxlY3QgfCBib2xkIGl0YWxpYyB8IGFsaWdubGVmdCBhbGlnbmNlbnRlciBhbGlnbnJpZ2h0IHwgYnVsbGlzdCBudW1saXN0IG91dGRlbnQgaW5kZW50IHwgbGluayBpbWFnZSB0YWJsZSBtZWRpYSB8IHZpc3VhbGJsb2NrcyBjb2RlIHwgZnA6aW1hZ2UgZnA6Z2FsbGVyeScsXG5cbiAgICAgICAgbWVkaWFfcG9zdGVyOiBmYWxzZSxcbiAgICAgICAgbWVkaWFfZGltZW5zaW9uczogZmFsc2UsXG5cbiAgICAgICAgdGFibGVfYXBwZWFyYW5jZV9vcHRpb25zOiBmYWxzZSxcbiAgICAgICAgdGFibGVfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfY2VsbF9hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9yb3dfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfZGVmYXVsdF9hdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2RlZmF1bHQtdGFibGUnXG4gICAgICAgIH0sXG4gICAgICAgIHRhYmxlX2NsYXNzX2xpc3Q6IFtcbiAgICAgICAgICAgIHt0aXRsZTogJ0RlZmF1bHQnLCB2YWx1ZTogJ2RlZmF1bHQtdGFibGUnfSxcbiAgICAgICAgXSxcblxuICAgICAgICBjb2RlbWlycm9yOiB7XG4gICAgICAgICAgICBpbmRlbnRPbkluaXQ6IHRydWUsXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICBzdHlsZUFjdGl2ZUxpbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnbW9ub2thaSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjc3NGaWxlczogW1xuICAgICAgICAgICAgICAgICd0aGVtZS9tb25va2FpLmNzcydcbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIH07XG59IiwiZnVuY3Rpb24gR2FsbGVyeU1vZHVsZShhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuR2FsbGVyeU1vZHVsZS5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIGVkaXRvcjogbnVsbCxcbiAgICBCVVRUT05fR0FMTEVSWTogJ0JVVFRPTl9HQUxMRVJZJyxcbiAgICBCVVRUT05fSU1BR0U6ICdCVVRUT05fSU1BR0UnLFxuICAgIHdpbmRvd1BhcmFtczoge1xuICAgICAgICBCVVRUT05fR0FMTEVSWToge1xuICAgICAgICAgICAgdGl0bGU6ICfQk9Cw0LvQtdGA0LXRjycsXG4gICAgICAgICAgICB3aWR0aDogNjMwLFxuICAgICAgICAgICAgaGVpZ2h0OiA0MDBcbiAgICAgICAgfSxcbiAgICAgICAgQlVUVE9OX0lNQUdFOiB7XG4gICAgICAgICAgICB0aXRsZTogJ9Ca0LDRgNGC0LjQvdC60LAnLFxuICAgICAgICAgICAgd2lkdGg6IDQzMCxcbiAgICAgICAgICAgIGhlaWdodDogMjAwXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdnYWxsZXJ5JywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG4gICAgICAgICAgICAvLyBBZGQgYSBidXR0b24gdGhhdCBvcGVucyBhIHdpbmRvd1xuICAgICAgICAgICAgZWRpdG9yLmFkZEJ1dHRvbignZnA6Z2FsbGVyeScsIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgIGljb246ICdnYWxsZXJ5LWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfQk9Cw0LvQtdGA0LXRjycsXG4gICAgICAgICAgICAgICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yIDogJy50eXBlLWltYWdlJyxcbiAgICAgICAgICAgICAgICBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm9uQnV0dG9uQ2xpY2soZWRpdG9yLCBfdGhpcy5CVVRUT05fR0FMTEVSWSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVkaXRvci5hZGRCdXR0b24oJ2ZwOmltYWdlJywge1xuICAgICAgICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgaWNvbjogJ2ltYWdlLWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfQmtCw0YDRgtC40L3QutCwJyxcbiAgICAgICAgICAgICAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3IgOiAnLnR5cGUtZ2FsbGVyeScsXG4gICAgICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkJ1dHRvbkNsaWNrKGVkaXRvciwgX3RoaXMuQlVUVE9OX0lNQUdFKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBvbkJ1dHRvbkNsaWNrOiBmdW5jdGlvbiAoZWRpdG9yLCB0eXBlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBiYXNlVXJsID0gJCgnYm9keScpLmRhdGEoJ2Jhc2UtdXJsJyk7XG5cbiAgICAgICAgdmFyIHdpbiA9IGVkaXRvci53aW5kb3dNYW5hZ2VyLm9wZW4oe1xuICAgICAgICAgICAgdGl0bGU6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS50aXRsZSxcbiAgICAgICAgICAgIHdpZHRoOiBfdGhpcy53aW5kb3dQYXJhbXNbdHlwZV0ud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS5oZWlnaHQsXG4gICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnT2snLCBzdWJ0eXBlOiAncHJpbWFyeScsIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvYyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tY2UtY29udGFpbmVyLWJvZHk+aWZyYW1lJylbMF07XG4gICAgICAgICAgICAgICAgICAgIGRvYy5jb250ZW50V2luZG93LnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB3aW4uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCcsIG9uY2xpY2s6ICdjbG9zZSd9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdXJsOiAnL2Fzc2V0cy9mYWNlcGFsbS9pbmNsdWRlL3RlbXBsYXRlcy9nYWxsZXJ5RGlhbG9nLmh0bWw/X3Rva2VuPScgKyBfdGhpcy5hcHAuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkuX3Rva2VuICsgJyZiYXNlVXJsPScgKyBiYXNlVXJsICsgJyZ0eXBlPScgKyB0eXBlLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdFdpbmRvdzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcblxuICAgICAgICAkKCcubWNlLWdhbGxlcnktcGx1Z2luLWJvZHknKS5hZGRDbGFzcygoZ2V0UXVlcnlQYXJhbWV0ZXJzKCkudHlwZSA9PSAnQlVUVE9OX0dBTExFUlknID8gJ3R5cGUtZ2FsbGVyeScgOiAndHlwZS1pbWFnZScpKTtcblxuICAgICAgICAkKCcuZHJvcHpvbmUnKS5kYXRhKCdtdWx0aXBsZScsIGdldFF1ZXJ5UGFyYW1ldGVycygpLnR5cGUgPT09ICdCVVRUT05fR0FMTEVSWScgPyAxIDogMCk7XG5cbiAgICAgICAgdmFyIGN1cnJlbnROb2RlJCA9ICQodGhpcy5lZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSk7XG4gICAgICAgIGlmIChjdXJyZW50Tm9kZSQuaXMoJy5nYWxsZXJ5UGxhY2Vob2xkZXJbZGF0YS1pbWFnZXNdJykpIHtcbiAgICAgICAgICAgICQoJy5pbWFnZXMtbGlzdCcpLmFwcGVuZCgkKGN1cnJlbnROb2RlJC5odG1sKCkpKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdEcm9wem9uZU1hbmFnZXInKS5pbml0KCk7XG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBTdWJtaXQgSFRNTCB0byBUaW55TUNFOlxuXG4gICAgICAgIHZhciBpbWFnZXNJZHMgPSBbXTtcbiAgICAgICAgdmFyIGltYWdlc0h0bWwgPSAnJztcbiAgICAgICAgJCgnLmltYWdlcy1saXN0IC5pbWFnZVtkYXRhLWlkXScpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpbWFnZXNJZHMucHVzaCgkKHRoaXMpLmRhdGEoXCJpZFwiKSk7XG4gICAgICAgICAgICBpbWFnZXNIdG1sICs9ICQodGhpcylbMF0ub3V0ZXJIVE1MO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdHlwZUNsYXNzTmFtZSA9IChnZXRRdWVyeVBhcmFtZXRlcnMoKS50eXBlID09ICdCVVRUT05fR0FMTEVSWScgPyAndHlwZS1nYWxsZXJ5JyA6ICd0eXBlLWltYWdlJyk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuaW5zZXJ0Q29udGVudCgnPGRpdiBjbGFzcz1cIm1jZU5vbkVkaXRhYmxlIGdhbGxlcnlQbGFjZWhvbGRlciAnICsgdHlwZUNsYXNzTmFtZSArICdcIiBkYXRhLWltYWdlcz1cIicgKyBpbWFnZXNJZHMgKyAnXCI+JyArIGltYWdlc0h0bWwgKyAnPC9kaXY+Jyk7XG4gICAgfVxuXG59O1xuIiwiZnVuY3Rpb24gV3lzaXd5Z01hbmFnZXIoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5zZXRPcHRpb25zKCk7IC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICB0aGlzLm9wdGlvbnNbdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yXSA9IGdldERlZmF1bHRUaW55TWNlT3B0aW9ucygpO1xufVxuXG5XeXNpd3lnTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIGRlZmF1bHRXeXNpd3lnU2VsZWN0b3I6ICd0ZXh0YXJlYVtkYXRhLXd5c2l3eWddJyxcbiAgICBvcHRpb25zOiB7fSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICBzZXRPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9ucywgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdID0gJC5leHRlbmQodGhpcy5vcHRpb25zW3NlbGVjdG9yXSwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGNzc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFkZENvbnRlbnRDc3M6IGZ1bmN0aW9uIChjc3MsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPSBbdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2Nzc107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2NzcyA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MuY29uY2F0KGNzcylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGx1Z2luTmFtZVxuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFkZFBsdWdpbjogZnVuY3Rpb24gKHBsdWdpbk5hbWUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMgPSB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgYXBwZW5kVG9vbGJhcjogZnVuY3Rpb24gKGJ1dHRvbnMsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAoIWJ1dHRvbnMuc3RhcnRzV2l0aCgnICcpKSB7XG4gICAgICAgICAgICBidXR0b25zID0gJyAnICsgYnV0dG9ucztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIgKz0gYnV0dG9ucztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVtb3ZlXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgcmVtb3ZlRnJvbVRvb2xiYXI6IGZ1bmN0aW9uIChyZW1vdmUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuXG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhciA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhci5yZXBsYWNlKHJlbW92ZSwgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgcHJlcGVuZFRvb2xiYXI6IGZ1bmN0aW9uIChidXR0b25zLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYgKCFidXR0b25zLmVuZHNXaXRoKCcgJykpIHtcbiAgICAgICAgICAgIGJ1dHRvbnMgPSBidXR0b25zICsgJyAnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhciA9IGJ1dHRvbnMgKyB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge1d5c2l3eWdNYW5hZ2VyLm9wdGlvbnN8e319XG4gICAgICovXG4gICAgZ2V0T3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdEFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZWRpdG9yUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBfdGhpcy5pbml0Q3VzdG9tTW9kdWxlcygpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuZ2V0T3B0aW9ucygpO1xuXG4gICAgICAgIF90aGlzLmFwcC5maXJlKCdiZWZvcmVBbGxXeXNpd3lnSW5pdCcpO1xuICAgICAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcblxuICAgICAgICAgICAgICAgICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zW3NlbGVjdG9yXS5zZXR1cCA9IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdG9kbzog0YPQsdGA0LDRgtGMINCz0LvQvtCx0LDQu9GM0L3Ri9C5IHRpbnltY2UsINC4INC00LXRgNCz0LDRgtGMINC60L7QvdC60YDQtdGC0L3Ri9C5INGA0LXQtNCw0LrRgtC+0YBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbignaW5pdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykudGlueW1jZShvcHRpb25zW3NlbGVjdG9yXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yUHJvbWlzZXMucHVzaChkLnByb21pc2UoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAkLndoZW4uYXBwbHkoJCwgZWRpdG9yUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX3RoaXMuYXBwLmZpcmUoJ2FmdGVyQWxsV3lzaXd5Z0luaXQnKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRDdXN0b21Nb2R1bGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0dhbGxlcnlNb2R1bGUnKS5yZWdpc3RlcigpO1xuICAgICAgICB0aGlzLmFkZFBsdWdpbihbJ2dhbGxlcnknXSk7XG4gICAgfVxufTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
