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
        if (path) {
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
                cur[field] = cur[field] || (index == fields.length - 1 ? (typeof value != 'undefined' ? value : {}) : {});
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

    initSave: function (callback) {
        var _this = this;
        $(document).on('click', '.form-buttons button.save-button', function () {
            var formData = $('.main-cms-form').serialize();
            var createMode = $('.cms-module-form-page').data('create-mode');
            var button$ = $(this);

            _this.app.service('UI').toggleSpinner(true);
            _this.app.service('UI').toggleFormButtons(false);

            // Minimum delay to avoid unpleasant blinking
            $.when(
                $.post(_this.app.baseUrl + '/', formData),
                delay(createMode ? 100 : 500)
            ).then(function (result) {
                var response = result[0];
                if (createMode && parseInt(response) > 0) {
                    if (button$.data('action') == 'save-and-return') {
                        document.location.href = _this.app.baseUrl;
                    } else {
                        var url = _.rtrim(document.location.href, '/');
                        if (url.endsWith('/create')) {
                            url = _.strLeftBack(url, '/');
                        }
                        document.location.href = url + '/' + response + '/';
                    }
                } else {
                    $.growl.notice({title: '', message: "Cохранено"});
                    _this.app.service('UI').toggleSpinner(false);
                    _this.app.service('UI').toggleFormButtons(true);

                    if (button$.data('action') == 'save-and-return') {
                        document.location.href = _this.app.baseUrl;
                    }
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

                var shiftKey = false;

                window.onkeydown = function (e) {
                    shiftKey = ((e.keyIdentifier == 'Shift') || (e.shiftKey == true));
                }
                window.onkeyup = function (e) {
                    shiftKey = false;
                }

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
                        if (shiftKey) {
                            $(mapElement).closest('.lat-lng-container').find("[data-latlng-field=lat]").val(event.latLng.lat())
                            $(mapElement).closest('.lat-lng-container').find("[data-latlng-field=lng]").val(event.latLng.lng())
                            marker.setPosition(event.latLng);
                        }
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
    initMainMenu: function () {
        var navHash = $('body').data('navHash');
        var scrollCookieName = 'scroll_' + navHash;
        var initialScroll = 0;
        if (Cookies.get(scrollCookieName)) {
            initialScroll = Cookies.get(scrollCookieName);
            //todo: Сохранять в куку еще и айдишник, проверять, он ли активен, и только тогда скроллить.
            //todo: Иначе высчитывать позицию, куда скроллить
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
                }
            }
        });

        if (initialScroll && $('.main-menu .right-panel li.active').length) {
            $('.main-menu .right-panel').mCustomScrollbar("scrollTo", initialScroll, {
                scrollInertia: 0
            });
        }

        $('.main-menu .right-panel a[href]').on('click', function () {

            var $scrollerOuter = $('.main-menu .right-panel');
            var $dragger = $scrollerOuter.find('.mCSB_dragger');
            var scrollHeight = $scrollerOuter.find('.mCSB_container').height();
            var draggerTop = $dragger.position().top;

            var scrollTop = draggerTop / ($scrollerOuter.height() - $dragger.height()) * (scrollHeight - $scrollerOuter.height());

            Cookies.set(scrollCookieName, scrollTop);
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

                if (id) {
                    var payload = _this.app.buildPayload(['delete', model, id], 1);

                    _this.app.doRequest(payload).done(function () {
                        itemContainer$.fadeOut('fast', function () {
                            $(this).remove()
                        });
                    });
                } else {
                    itemContainer$.fadeOut('fast', function () {
                        $(this).remove()
                    });
                }
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

            console.log(['create', model, _this.generateRandomIdString(), 'parent_id'], id);
            console.log(payload);

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
        relative_urls : false,
        style_formats: [
            {title: 'Обычный текст', block: 'p'},
            {title: 'Заголовок', block: 'h2'},
            {title: 'Подзаголовок', block: 'h3'},
            {title: 'Врезка', block: 'blockquote'},
            // { title: 'Table row 1', selector: 'tr', classes: 'tablerow1' }
        ],
        removeformat: [
            {selector: '*', remove : 'all', split : true, expand : false, block_expand: true, deep : true},
        ],

        // extended_valid_elements: 'img[class=myclass|!src|border:0|alt|title|width|height|style]',
        // invalid_elements: 'strong,b,em,i',

        plugins: ['fixedtoolbar', 'autoresize', 'codemirror', 'link', 'autolink', 'media', 'noneditable', 'paste', 'table', 'visualblocks', 'paste'],
        toolbar: 'styleselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image table media | visualblocks code removeformat | fp:image fp:gallery',

        // paste_as_text: true,

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
                disabledStateSelector: '.type-image',
                onclick: function () {
                    _this.onButtonClick(editor, _this.BUTTON_GALLERY);
                }
            });

            editor.addButton('fp:image', {
                text: null,
                icon: 'image-button',
                title: 'Картинка',
                disabledStateSelector: '.type-gallery',
                onclick: function () {
                    _this.onButtonClick(editor, _this.BUTTON_IMAGE);
                }
            });

            //fix bug with page jumping when clicking first time to image/gallery
            editor.on('init', function () {
                editor.selection.select(editor.getBody(), true); // ed is the editor instance
                editor.selection.collapse(false);
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
            imagesHtml += $(this)[0].outerHTML.replace(/(\.\.\/)+/g, '/');
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

                    var customToolbar = $(this).data('wysiwygToolbar');
                    if (customToolbar) {
                        $(this).tinymce($.extend(options[selector], {'toolbar': customToolbar}));
                    } else {
                        $(this).tinymce(options[selector]);
                    }

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGguanMiLCJGYWNlcGFsbUNNUy5qcyIsIlNlcnZpY2VMb2NhdG9yLmpzIiwidXRpbGl0eS5qcyIsIlVJL0Ryb3B6b25lTWFuYWdlci5qcyIsIlVJL0Zvcm0uanMiLCJVSS9Hb29nbGVNYXAuanMiLCJVSS9MZWZ0TWVudS5qcyIsIlVJL0xpc3QuanMiLCJVSS9VSS5qcyIsIlVJL1VwbG9hZGFibGVzTGlzdC5qcyIsIlVJL1ZpZGVvc0xpc3QuanMiLCJleHRlbmRlZC91c2Vycy5qcyIsInd5c2l3eWcvRGVmYXVsdFRpbnlNY2VPcHRpb25zLmpzIiwid3lzaXd5Zy9HYWxsZXJ5TW9kdWxlLmpzIiwid3lzaXd5Zy9XeXNpd3lnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBBdXRoTWFuYWdlcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuQXV0aE1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJCgnLmxvZ2luLWZvcm0gZm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLnBvc3QoJCh0aGlzKS5hdHRyKCdhY3Rpb24nKSwgJCh0aGlzKS5zZXJpYWxpemUoKSwgJ2pzb24nKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UudXNlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9ICcvY21zLyc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zaGFrZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe3RpdGxlOiAnJywgbWVzc2FnZTogcmVzcG9uc2UuZXJyb3JzW2ldfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDQv9C10YDQtdC00LXQu9Cw0YLRjCDQstGL0LLQvtC0INGC0LXQutGB0YLQsCDQvtGI0LjQsdC60LghINCb0L7QutCw0LvQuNC30LDRhtC40Y8hXG5cbiAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7dGl0bGU6ICcnLCBtZXNzYWdlOiAn0J3QtdCy0LXRgNC90YvQtSDQu9C+0LPQuNC9INC40LvQuCDQv9Cw0YDQvtC70YwnfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNoYWtlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2UucmVzcG9uc2VKU09OKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gJCgnLmxvZ2luLWZvcm0gZm9ybScpLmxlbmd0aCA9PSAwO1xuICAgIH0sXG5cbiAgICBzaGFrZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcubG9naW4tZm9ybScpLmFkZENsYXNzKCdzaGFrZScpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5sb2dpbi1mb3JtJykucmVtb3ZlQ2xhc3MoJ3NoYWtlJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cbn07IiwiXy5taXhpbihzLmV4cG9ydHMoKSk7XG5Ecm9wem9uZS5hdXRvRGlzY292ZXIgPSBmYWxzZTtcblxuXG4vKipcbiAqXG4gKiBAcmV0dXJucyB7RmFjZXBhbG1DTVN8Kn1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBGYWNlcGFsbUNNUygpIHtcblxuICAgIGlmIChhcmd1bWVudHMuY2FsbGVlLl9zaW5nbGV0b25JbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gYXJndW1lbnRzLmNhbGxlZS5fc2luZ2xldG9uSW5zdGFuY2U7XG4gICAgfVxuXG4gICAgYXJndW1lbnRzLmNhbGxlZS5fc2luZ2xldG9uSW5zdGFuY2UgPSB0aGlzO1xufVxuXG5cbkZhY2VwYWxtQ01TLnByb3RvdHlwZSA9IHtcbiAgICBjc3JmVG9rZW46ICcnLFxuICAgIGJhc2VVcmw6IG51bGwsXG4gICAgc2VydmljZUxvY2F0b3I6IG51bGwsXG4gICAgZXZlbnRIYW5kbGVyczoge30sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZhY2VwYWxtQ01TfVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6YXRpb25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGYWNlcGFsbUNNU31cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmlyZSgnYmVmb3JlSW5pdCcpO1xuXG4gICAgICAgIHRoaXMuc2VydmljZUxvY2F0b3IgPSBuZXcgU2VydmljZUxvY2F0b3IodGhpcyk7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9ICQoJ2JvZHknKS5kYXRhKCdiYXNlLXVybCcpO1xuXG4gICAgICAgIHRoaXMuc2VydmljZSgnV3lzaXd5Z01hbmFnZXInKTsgLy9pbml0IG1hbmFnZXJcblxuICAgICAgICB0aGlzLmZpcmUoJ2FmdGVySW5pdCcpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgVUkgYW5kIG90aGVyIHNlcnZpY2VzLCBhZnRlciBkb20gcmVhZHlcbiAgICAgKi9cbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmZpcmUoJ2JlZm9yZVN0YXJ0Jyk7XG5cbiAgICAgICAgICAgIGlmIChfdGhpcy5zZXJ2aWNlKCdBdXRoTWFuYWdlcicpLmluaXQoKSkge1xuICAgICAgICAgICAgICAgIF90aGlzLmluaXRTZXNzaW9uS2VlcEFsaXZlKCk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5zZXJ2aWNlKCdVSScpLmluaXQoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXJ2aWNlKCdXeXNpd3lnTWFuYWdlcicpLmluaXRBbGwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMuZmlyZSgnYWZ0ZXJTdGFydCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHNlcnZpY2UgZnJvbSBTZXJ2aWNlIExvY2F0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBzZXJ2aWNlTmFtZVxuICAgICAqIEBwYXJhbSBwYXJhbVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIHNlcnZpY2U6IGZ1bmN0aW9uIChzZXJ2aWNlTmFtZSwgcGFyYW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZUxvY2F0b3IuZ2V0KHNlcnZpY2VOYW1lLCBwYXJhbSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmlyZSBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50TmFtZVxuICAgICAqL1xuICAgIGZpcmU6IGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgY29uc29sZS5pbmZvKGV2ZW50TmFtZSk7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ubWFwKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnROYW1lXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBpbmcgdGltZXJcbiAgICAgKi9cbiAgICBpbml0U2Vzc2lvbktlZXBBbGl2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmdldCgnLi8nLCB7J3BpbmcnOiAncGluZyd9KTtcbiAgICAgICAgfSwgMTIwMDAwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQnVpbGQgcGF5bG9hZCBvYmplY3QgZm9yIGFqYXggcmVxdWVzdHNcbiAgICAgKiBAcGFyYW0gcGF0aFxuICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAqL1xuICAgIGJ1aWxkUGF5bG9hZDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBfLmV4dGVuZCh7fS5zZXRXaXRoUGF0aChwYXRoLCB2YWx1ZSksIHRoaXMuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHBheWxvYWRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBkb1JlcXVlc3Q6IGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiAkLnBvc3QodGhpcy5iYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgQ1NSRiB0b2tlbiBvYmplY3Qge190b2tlbjoneHh4J31cbiAgICAgKiBAcmV0dXJucyB7e190b2tlbjogc3RyaW5nfX1cbiAgICAgKi9cbiAgICBnZXRDc3JmVG9rZW5QYXJhbWV0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNzcmZUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5zZXRDc3JmVG9rZW4oJCgnaW5wdXQ6aGlkZGVuW25hbWU9X3Rva2VuXScpLnZhbCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geydfdG9rZW4nOiB0aGlzLmNzcmZUb2tlbn07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBDU1JGIHRva2VuIHZhbHVlXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgc2V0Q3NyZlRva2VuOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5jc3JmVG9rZW4gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHNldEJhc2VVcmw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmJhc2VVcmwgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59O1xuXG4iLCJmdW5jdGlvbiBTZXJ2aWNlTG9jYXRvcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuU2VydmljZUxvY2F0b3IucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcbiAgICBzZXJ2aWNlc01hcDoge30sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChjbGFzc05hbWUsIHBhcmFtKSB7XG4gICAgICAgIGlmICghdGhpcy5zZXJ2aWNlc01hcFtjbGFzc05hbWVdKSB7XG4gICAgICAgICAgICBpZiAod2luZG93W2NsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VzTWFwW2NsYXNzTmFtZV0gPSBuZXcgd2luZG93W2NsYXNzTmFtZV0odGhpcy5hcHAsIHBhcmFtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwi0J3QtdC40LfQstC10YHRgtC90YvQuSDQutC70LDRgdGBOiBcIiArIGNsYXNzTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZXNNYXBbY2xhc3NOYW1lXTtcbiAgICB9LFxuXG59O1xuXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgeHB1bmRlbCBvbiAxNC4xMi4xNS5cbiAqL1xuXG4vKipcbiAqIEBtZXRob2Qgc2V0V2l0aFBhdGhcbiAqIFNldHMgdGhlIG5lc3RlZCBwcm9wZXJ0eSBvZiBvYmplY3RcbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdzZXRXaXRoUGF0aCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7IC8qIE1ha2VzIGJyZWFrZmFzdCwgc29sdmVzIHdvcmxkIHBlYWNlLCB0YWtlcyBvdXQgdHJhc2ggKi9cbiAgICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgIHBhdGggPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zcGxpdCgnLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjdXIgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGZpZWxkcyA9IHBhdGg7XG4gICAgICAgICAgICBmaWVsZHMgPSBmaWVsZHMuZmlsdGVyKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgIT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZWxkcy5tYXAoZnVuY3Rpb24gKGZpZWxkLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGN1cltmaWVsZF0gPSBjdXJbZmllbGRdIHx8IChpbmRleCA9PSBmaWVsZHMubGVuZ3RoIC0gMSA/ICh0eXBlb2YgdmFsdWUgIT0gJ3VuZGVmaW5lZCcgPyB2YWx1ZSA6IHt9KSA6IHt9KTtcbiAgICAgICAgICAgICAgICBjdXIgPSBjdXJbZmllbGRdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG59KTtcblxuLyoqXG4gKlxuICogQHBhcmFtIG1zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gZGVsYXkobXMpIHtcbiAgICB2YXIgZCA9ICQuRGVmZXJyZWQoKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5yZXNvbHZlKCk7XG4gICAgfSwgbXMpO1xuICAgIHJldHVybiBkLnByb21pc2UoKTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHN0clxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGdldFF1ZXJ5UGFyYW1ldGVycyhzdHIpIHtcbiAgICByZXR1cm4gKHN0ciB8fCBkb2N1bWVudC5sb2NhdGlvbi5zZWFyY2gpLnJlcGxhY2UoLyheXFw/KS8sICcnKS5zcGxpdChcIiZcIikubWFwKGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHJldHVybiBuID0gbi5zcGxpdChcIj1cIiksIHRoaXNbblswXV0gPSBuWzFdLCB0aGlzXG4gICAgfS5iaW5kKHt9KSlbMF07XG59XG5cbi8qKlxuICpcbiAqL1xuaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKSB7XG4gICAgU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCA9IGZ1bmN0aW9uIChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgIHZhciBzdWJqZWN0U3RyaW5nID0gdGhpcy50b1N0cmluZygpO1xuICAgICAgICBpZiAodHlwZW9mIHBvc2l0aW9uICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocG9zaXRpb24pIHx8IE1hdGguZmxvb3IocG9zaXRpb24pICE9PSBwb3NpdGlvbiB8fCBwb3NpdGlvbiA+IHN1YmplY3RTdHJpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHBvc2l0aW9uIC09IHNlYXJjaFN0cmluZy5sZW5ndGg7XG4gICAgICAgIHZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG4gICAgICAgIHJldHVybiBsYXN0SW5kZXggIT09IC0xICYmIGxhc3RJbmRleCA9PT0gcG9zaXRpb247XG4gICAgfTtcbn1cblxuLyoqXG4gKlxuICovXG5pZiAoIVN0cmluZy5wcm90b3R5cGUuc3RhcnRzV2l0aCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJpbmcucHJvdG90eXBlLCAnc3RhcnRzV2l0aCcsIHtcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8IDA7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0SW5kZXhPZihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSA9PT0gcG9zaXRpb247XG4gICAgICAgIH1cbiAgICB9KTtcbn0iLCJmdW5jdGlvbiBEcm9wem9uZU1hbmFnZXIoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkRyb3B6b25lTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdGVtcGxhdGVJbWFnZSA9IHR3aWcoe1xuICAgICAgICAgICAgZGF0YTogJCgnI2ltYWdlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0ZW1wbGF0ZUZpbGUgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNmaWxlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChcIi5kcm9wem9uZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkcm9wem9uZSQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGlzTXVsdGlwbGUgPSBkcm9wem9uZSQuZGF0YSgnbXVsdGlwbGUnKSA9PSBcIjFcIjtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kcm9wem9uZSh7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFsbGVsVXBsb2FkczogMyxcbiAgICAgICAgICAgICAgICAgICAgYWRkUmVtb3ZlTGlua3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZE11bHRpcGxlOiBpc011bHRpcGxlLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVJbWFnZVRodW1ibmFpbHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtYXhGaWxlczogaXNNdWx0aXBsZSA/IG51bGwgOiAxLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbU5hbWU6ICQodGhpcykuZGF0YSgnaW5wdXQtbmFtZScpLFxuICAgICAgICAgICAgICAgICAgICBjbGlja2FibGU6ICQodGhpcykuZmluZChcIi5kei1tZXNzYWdlXCIpWzBdLFxuICAgICAgICAgICAgICAgICAgICBhY2NlcHRlZEZpbGVzOiBkcm9wem9uZSQuZGF0YSgndHlwZScpID09ICdpbWFnZScgPyAnaW1hZ2UvKicgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IF90aGlzLmFwcC5iYXNlVXJsICsgXCIvP190b2tlbj1cIiArIF90aGlzLmFwcC5nZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKS5fdG9rZW4gKyBkcm9wem9uZSQuZGF0YSgncGFyYW1ldGVycycpLFxuXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChmaWxlLCByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc011bHRpcGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcm9wem9uZSQuZGF0YSgndHlwZScpID09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcm9wem9uZSQucHJldigpLmZpbmQoJy5pbWFnZVtkYXRhLWlkPScgKyByZXNwb25zZVtpXS5pbWFnZS5pZCArICddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSQucHJldigpLmFwcGVuZCh0ZW1wbGF0ZUltYWdlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdEZhbmN5Ym94KGRyb3B6b25lJC5wcmV2KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcm9wem9uZSQucHJldigpLmZpbmQoJy5maWxlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmZpbGUuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5hcHBlbmQodGVtcGxhdGVGaWxlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChmaWxlLCBlcnJvck1lc3NhZ2UsIHhocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDQvdC+0YDQvNCw0LvRjNC90L4g0L7QsdGA0LDQsdCw0YLRi9Cy0LDRgtGMINC4INC/0L7QutCw0LfRi9Cy0LDRgtGMINC+0YjQuNCx0LrQuFxuICAgICAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQntGI0LjQsdC60LAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfQndC1INGD0LTQsNC10YLRgdGPINC30LDQs9GA0YPQt9C40YLRjCDRhNCw0LnQuyDQvdCwINGB0LXRgNCy0LXRgC4g0J3QtdCy0LXRgNC90YvQuSDRhNC+0YDQvNCw0YIg0LjQu9C4INGB0LvQuNGI0LrQvtC8INCx0L7Qu9GM0YjQvtC5INGA0LDQt9C80LXRgC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA3MDAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuXG4gICAgfSxcblxuXG59OyIsImZ1bmN0aW9uIEZvcm0oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkZvcm0ucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0U2F2ZSgpO1xuICAgICAgICB0aGlzLmluaXREYXRlcGlja2VyKCk7XG4gICAgfSxcblxuICAgIGluaXRTYXZlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5mb3JtLWJ1dHRvbnMgYnV0dG9uLnNhdmUtYnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZvcm1EYXRhID0gJCgnLm1haW4tY21zLWZvcm0nKS5zZXJpYWxpemUoKTtcbiAgICAgICAgICAgIHZhciBjcmVhdGVNb2RlID0gJCgnLmNtcy1tb2R1bGUtZm9ybS1wYWdlJykuZGF0YSgnY3JlYXRlLW1vZGUnKTtcbiAgICAgICAgICAgIHZhciBidXR0b24kID0gJCh0aGlzKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VJJykudG9nZ2xlU3Bpbm5lcih0cnVlKTtcbiAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVSScpLnRvZ2dsZUZvcm1CdXR0b25zKGZhbHNlKTtcblxuICAgICAgICAgICAgLy8gTWluaW11bSBkZWxheSB0byBhdm9pZCB1bnBsZWFzYW50IGJsaW5raW5nXG4gICAgICAgICAgICAkLndoZW4oXG4gICAgICAgICAgICAgICAgJC5wb3N0KF90aGlzLmFwcC5iYXNlVXJsICsgJy8nLCBmb3JtRGF0YSksXG4gICAgICAgICAgICAgICAgZGVsYXkoY3JlYXRlTW9kZSA/IDEwMCA6IDUwMClcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgICAgIGlmIChjcmVhdGVNb2RlICYmIHBhcnNlSW50KHJlc3BvbnNlKSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1dHRvbiQuZGF0YSgnYWN0aW9uJykgPT0gJ3NhdmUtYW5kLXJldHVybicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSBfdGhpcy5hcHAuYmFzZVVybDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1cmwgPSBfLnJ0cmltKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsICcvJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodXJsLmVuZHNXaXRoKCcvY3JlYXRlJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSBfLnN0ckxlZnRCYWNrKHVybCwgJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSB1cmwgKyAnLycgKyByZXNwb25zZSArICcvJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wubm90aWNlKHt0aXRsZTogJycsIG1lc3NhZ2U6IFwiQ9C+0YXRgNCw0L3QtdC90L5cIn0pO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVTcGlubmVyKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VJJykudG9nZ2xlRm9ybUJ1dHRvbnModHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1dHRvbiQuZGF0YSgnYWN0aW9uJykgPT0gJ3NhdmUtYW5kLXJldHVybicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSBfdGhpcy5hcHAuYmFzZVVybDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIGluaXREYXRlcGlja2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vdG9kbzog0L/QvtC00YPQvNCw0YLRjCwg0L3QsNGB0YfQtdGCIGxpdmU/XG4gICAgICAgICQoJy5kYXRlcGlja2VyJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJCh0aGlzKVswXSxcbiAgICAgICAgICAgICAgICB0aGVtZTogJ2RhcmstdGhlbWUnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ0RELk1NLllZWVknLFxuICAgICAgICAgICAgICAgIGZpcnN0RGF5OiAxLFxuICAgICAgICAgICAgICAgIHNob3dUaW1lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpMThuOiB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzTW9udGg6ICfQn9GA0LXQtNGL0LTRg9GJ0LjQuSDQvNC10YHRj9GGJyxcbiAgICAgICAgICAgICAgICAgICAgbmV4dE1vbnRoOiAn0KHQu9C10LTRg9GO0YnQuNC5INC80LXRgdGP0YYnLFxuICAgICAgICAgICAgICAgICAgICBtb250aHM6IFsn0K/QvdCy0LDRgNGMJywgJ9Ck0LXQstGA0LDQu9GMJywgJ9Cc0LDRgNGCJywgJ9CQ0L/RgNC10LvRjCcsICfQnNCw0LknLCAn0JjRjtC90YwnLCAn0JjRjtC70YwnLCAn0JDQstCz0YPRgdGCJywgJ9Ch0LXQvdGC0Y/QsdGA0YwnLCAn0J7QutGC0Y/QsdGA0YwnLCAn0J3QvtGP0LHRgNGMJywgJ9CU0LXQutCw0LHRgNGMJ10sXG4gICAgICAgICAgICAgICAgICAgIHdlZWtkYXlzOiBbJ9CS0L7RgdC60YDQtdGB0LXQvdGM0LUnLCAn0J/QvtC90LXQtNC10LvRjNC90LjQuicsICfQktGC0L7RgNC90LjQuicsICfQodGA0LXQtNCwJywgJ9Cn0LXRgtCy0LXRgNCzJywgJ9Cf0Y/RgtC90LjRhtCwJywgJ9Ch0YPQsdCx0L7RgtCwJ10sXG4gICAgICAgICAgICAgICAgICAgIHdlZWtkYXlzU2hvcnQ6IFsn0JLRgScsICfQn9C9JywgJ9CS0YInLCAn0KHRgCcsICfQp9GCJywgJ9Cf0YInLCAn0KHQsSddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCcuZGF0ZXRpbWUnKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZChvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdDogJ0RELk1NLllZWVkgSEg6bW0nLFxuICAgICAgICAgICAgICAgICAgICBzaG93VGltZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc2hvd1NlY29uZHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICB1c2UyNGhvdXI6IHRydWVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXcgUGlrYWRheShvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJy5kYXRlcGlja2VyICsgLmNsZWFyLWRhdGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKHRoaXMpLnByZXYoKS52YWwoJycpO1xuICAgICAgICB9KTtcbiAgICB9XG59OyIsImZ1bmN0aW9uIEdvb2dsZU1hcChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuR29vZ2xlTWFwLnByb3RvdHlwZSA9IHtcbiAgICBpbml0TWFwczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoJCgnLm1hcC5nb29nbGVbZGF0YS1sYXRdW2RhdGEtbG5nXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgJC5nZXRTY3JpcHQoXCJodHRwczovL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanM/a2V5PUFJemFTeUJGOXdOV2dDMTZpQ0htVGxvV0VsNVk3c0FSRFN5cVJVRSZsaWJyYXJpZXM9cGxhY2VzJnNlbnNvcj1mYWxzZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmZpcmUoJ2FmdGVyR29vZ2xlTWFwc0FwaUxvYWQnKTtcblxuICAgICAgICAgICAgICAgIHZhciBzaGlmdEtleSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgd2luZG93Lm9ua2V5ZG93biA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0S2V5ID0gKChlLmtleUlkZW50aWZpZXIgPT0gJ1NoaWZ0JykgfHwgKGUuc2hpZnRLZXkgPT0gdHJ1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3aW5kb3cub25rZXl1cCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoaWZ0S2V5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgJCgnLm1hcFtkYXRhLWxhdF1bZGF0YS1sbmddJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvYmplY3RMYXQgPSBwYXJzZUZsb2F0KCQodGhpcykuZGF0YSgnbGF0JykpLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0TG5nID0gcGFyc2VGbG9hdCgkKHRoaXMpLmRhdGEoJ2xuZycpKTtcblxuICAgICAgICAgICAgICAgICAgICBvYmplY3RMYXQgPSBpc05hTihvYmplY3RMYXQpID8gMCA6IG9iamVjdExhdDtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0TG5nID0gaXNOYU4ob2JqZWN0TG5nKSA/IDAgOiBvYmplY3RMbmc7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBUeXBlQ29udHJvbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlZXRWaWV3Q29udHJvbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGx3aGVlbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB6b29tOiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9iamVjdExhdCwgb2JqZWN0TG5nKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0TGF0ICYmIG9iamVjdExuZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwT3B0aW9ucy56b29tID0gMTI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcEVsZW1lbnQgPSAkKHRoaXMpWzBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChtYXBFbGVtZW50LCBtYXBPcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG5ldyBnb29nbGUubWFwcy5MYXRMbmcob2JqZWN0TGF0LCBvYmplY3RMbmcpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwOiBtYXBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCBcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChtYXBFbGVtZW50KS5jbG9zZXN0KCcubGF0LWxuZy1jb250YWluZXInKS5maW5kKFwiW2RhdGEtbGF0bG5nLWZpZWxkPWxhdF1cIikudmFsKGV2ZW50LmxhdExuZy5sYXQoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG1hcEVsZW1lbnQpLmNsb3Nlc3QoJy5sYXQtbG5nLWNvbnRhaW5lcicpLmZpbmQoXCJbZGF0YS1sYXRsbmctZmllbGQ9bG5nXVwiKS52YWwoZXZlbnQubGF0TG5nLmxuZygpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihldmVudC5sYXRMbmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIHNlYXJjaCBib3ggYW5kIGxpbmsgaXQgdG8gdGhlIFVJIGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYWMtaW5wdXQnKTtcblxuICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5vbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUud2hpY2ggPT0gMTMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlYXJjaEJveCA9IG5ldyBnb29nbGUubWFwcy5wbGFjZXMuU2VhcmNoQm94KGlucHV0KTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLmNvbnRyb2xzW2dvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbi5UT1BfTEVGVF0ucHVzaChpbnB1dCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbWFwLmFkZExpc3RlbmVyKCdib3VuZHNfY2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlYXJjaEJveC5zZXRCb3VuZHMobWFwLmdldEJvdW5kcygpKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcmtlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoQm94LmFkZExpc3RlbmVyKCdwbGFjZXNfY2hhbmdlZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwbGFjZXMgPSBzZWFyY2hCb3guZ2V0UGxhY2VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxhY2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBib3VuZHMgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nQm91bmRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBsYWNlID0gcGxhY2VzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsYWNlLmdlb21ldHJ5LnZpZXdwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgZ2VvY29kZXMgaGF2ZSB2aWV3cG9ydC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzLnVuaW9uKHBsYWNlLmdlb21ldHJ5LnZpZXdwb3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3VuZHMuZXh0ZW5kKHBsYWNlLmdlb21ldHJ5LmxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFwLmZpdEJvdW5kcyhib3VuZHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5maXJlKCdhZnRlck1hcHNJbml0Jyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuIiwiZnVuY3Rpb24gTGVmdE1lbnUoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxlZnRNZW51LnByb3RvdHlwZSA9IHtcbiAgICBpbml0TWFpbk1lbnU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5hdkhhc2ggPSAkKCdib2R5JykuZGF0YSgnbmF2SGFzaCcpO1xuICAgICAgICB2YXIgc2Nyb2xsQ29va2llTmFtZSA9ICdzY3JvbGxfJyArIG5hdkhhc2g7XG4gICAgICAgIHZhciBpbml0aWFsU2Nyb2xsID0gMDtcbiAgICAgICAgaWYgKENvb2tpZXMuZ2V0KHNjcm9sbENvb2tpZU5hbWUpKSB7XG4gICAgICAgICAgICBpbml0aWFsU2Nyb2xsID0gQ29va2llcy5nZXQoc2Nyb2xsQ29va2llTmFtZSk7XG4gICAgICAgICAgICAvL3RvZG86INCh0L7RhdGA0LDQvdGP0YLRjCDQsiDQutGD0LrRgyDQtdGJ0LUg0Lgg0LDQudC00LjRiNC90LjQuiwg0L/RgNC+0LLQtdGA0Y/RgtGMLCDQvtC9INC70Lgg0LDQutGC0LjQstC10L0sINC4INGC0L7Qu9GM0LrQviDRgtC+0LPQtNCwINGB0LrRgNC+0LvQu9C40YLRjC5cbiAgICAgICAgICAgIC8vdG9kbzog0JjQvdCw0YfQtSDQstGL0YHRh9C40YLRi9Cy0LDRgtGMINC/0L7Qt9C40YbQuNGOLCDQutGD0LTQsCDRgdC60YDQvtC70LvQuNGC0YxcbiAgICAgICAgfVxuICAgICAgICAkKCcubWFpbi1tZW51IC5sZWZ0LXBhbmVsOm5vdCguY29sbGFwc2VkKSwgLm1haW4tbWVudSAucmlnaHQtcGFuZWwnKS5tQ3VzdG9tU2Nyb2xsYmFyKHtcbiAgICAgICAgICAgIHRoZW1lOiBcImxpZ2h0LTJcIixcbiAgICAgICAgICAgIGF1dG9FeHBhbmRTY3JvbGxiYXI6IHRydWUsXG4gICAgICAgICAgICBzY3JvbGxJbmVydGlhOiA0MDAsXG4gICAgICAgICAgICBtb3VzZVdoZWVsOiB7XG4gICAgICAgICAgICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFja3M6IHtcbiAgICAgICAgICAgICAgICBvblNjcm9sbDogZnVuY3Rpb24gKHEsIHExKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoaW5pdGlhbFNjcm9sbCAmJiAkKCcubWFpbi1tZW51IC5yaWdodC1wYW5lbCBsaS5hY3RpdmUnKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICQoJy5tYWluLW1lbnUgLnJpZ2h0LXBhbmVsJykubUN1c3RvbVNjcm9sbGJhcihcInNjcm9sbFRvXCIsIGluaXRpYWxTY3JvbGwsIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxJbmVydGlhOiAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5tYWluLW1lbnUgLnJpZ2h0LXBhbmVsIGFbaHJlZl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIHZhciAkc2Nyb2xsZXJPdXRlciA9ICQoJy5tYWluLW1lbnUgLnJpZ2h0LXBhbmVsJyk7XG4gICAgICAgICAgICB2YXIgJGRyYWdnZXIgPSAkc2Nyb2xsZXJPdXRlci5maW5kKCcubUNTQl9kcmFnZ2VyJyk7XG4gICAgICAgICAgICB2YXIgc2Nyb2xsSGVpZ2h0ID0gJHNjcm9sbGVyT3V0ZXIuZmluZCgnLm1DU0JfY29udGFpbmVyJykuaGVpZ2h0KCk7XG4gICAgICAgICAgICB2YXIgZHJhZ2dlclRvcCA9ICRkcmFnZ2VyLnBvc2l0aW9uKCkudG9wO1xuXG4gICAgICAgICAgICB2YXIgc2Nyb2xsVG9wID0gZHJhZ2dlclRvcCAvICgkc2Nyb2xsZXJPdXRlci5oZWlnaHQoKSAtICRkcmFnZ2VyLmhlaWdodCgpKSAqIChzY3JvbGxIZWlnaHQgLSAkc2Nyb2xsZXJPdXRlci5oZWlnaHQoKSk7XG5cbiAgICAgICAgICAgIENvb2tpZXMuc2V0KHNjcm9sbENvb2tpZU5hbWUsIHNjcm9sbFRvcCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuIiwiZnVuY3Rpb24gTGlzdChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICAgICdzdGF0dXMnOiBbJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudCBidXR0b24uc3RhdHVzJywgJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uc3RhdHVzJ10sXG4gICAgICAgICdkZWxldGUnOiBbJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudCBidXR0b24uZGVsZXRlJywgJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uZGVsZXRlJ10sXG4gICAgICAgICdhZGQnOiAnLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50IGJ1dHRvbi5hZGQnLFxuICAgICAgICAnYWRkUm9vdCc6ICcuYWRkLW5ldy10cmVlLWl0ZW0nXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmluaXRCdXR0b25zKCk7XG4gICAgICAgIHRoaXMuaW5pdFNvcnRhYmxlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdEJ1dHRvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0U3RhdHVzQnV0dG9uKCk7XG4gICAgICAgIHRoaXMuaW5pdERlbGV0ZUJ1dHRvbigpO1xuICAgICAgICB0aGlzLmluaXRBZGRCdXR0b24oKTtcbiAgICAgICAgdGhpcy5pbml0QWRkVG9Sb290QnV0dG9uKCk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXR1c1xuICAgICAqL1xuICAgIGluaXRTdGF0dXNCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLnN0YXR1cy5qb2luKCcsJyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpZCA9IF90aGlzLmdldEl0ZW1JZChidG4kKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IF90aGlzLmdldEl0ZW1Db250YWluZXIoYnRuJCk7XG5cbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ3RvZ2dsZScsIG1vZGVsLCBpZCwgJ3N0YXR1cyddLCAxKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC50b2dnbGVDbGFzcygnaW5hY3RpdmUnLCAhcmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBvYmplY3RcbiAgICAgKi9cbiAgICBpbml0RGVsZXRlQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKF90aGlzLnNlbGVjdG9ycy5kZWxldGUpO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuZGVsZXRlLmpvaW4oJywnKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1N1cmU/JykpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gX3RoaXMuZ2V0SXRlbUlkKGJ0biQpO1xuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBfdGhpcy5nZXRJdGVtQ29udGFpbmVyKGJ0biQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZFxuICAgICAqL1xuICAgIGluaXRBZGRCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLmFkZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGlkID0gX3RoaXMuZ2V0SXRlbUlkKGJ0biQpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gX3RoaXMuZ2V0SXRlbU1vZGVsKGJ0biQpO1xuICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gX3RoaXMuZ2V0SXRlbUNvbnRhaW5lcihidG4kKTtcblxuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnY3JlYXRlJywgbW9kZWwsIF90aGlzLmdlbmVyYXRlUmFuZG9tSWRTdHJpbmcoKSwgJ3BhcmVudF9pZCddLCBpZCk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gYnRuJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5maW5kKCdzY3JpcHRbZGF0YS10ZW1wbGF0ZS1uYW1lPVwiZW1wdHktdHJlZS1lbGVtZW50XCJdJykuaHRtbCgpO1xuICAgICAgICAgICAgICAgIGl0ZW1Db250YWluZXIkLmZpbmQoJz51bCcpLmFwcGVuZChfdGhpcy5jcmVhdGVOZXdFbGVtZW50KHRlbXBsYXRlLCByZXN1bHQpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgb2JqZWN0IHRvIHRoZSB0cmVlIHJvb3RcbiAgICAgKi9cbiAgICBpbml0QWRkVG9Sb290QnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIF90aGlzLnNlbGVjdG9ycy5hZGRSb290LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBidG4kLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpO1xuICAgICAgICAgICAgdmFyIGlkID0gcGFyc2VJbnQoaXRlbUNvbnRhaW5lciQuZGF0YSgndHJlZS1yb290JykpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gaXRlbUNvbnRhaW5lciQuZGF0YSgnbW9kZWwnKTtcblxuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnY3JlYXRlJywgbW9kZWwsIF90aGlzLmdlbmVyYXRlUmFuZG9tSWRTdHJpbmcoKSwgJ3BhcmVudF9pZCddLCBpZCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFsnY3JlYXRlJywgbW9kZWwsIF90aGlzLmdlbmVyYXRlUmFuZG9tSWRTdHJpbmcoKSwgJ3BhcmVudF9pZCddLCBpZCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwYXlsb2FkKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBidG4kLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmZpbmQoJ3NjcmlwdFtkYXRhLXRlbXBsYXRlLW5hbWU9XCJlbXB0eS10cmVlLWVsZW1lbnRcIl0nKS5odG1sKCk7XG4gICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQuZmluZCgndWw6Zmlyc3QnKS5hcHBlbmQoX3RoaXMuY3JlYXRlTmV3RWxlbWVudCh0ZW1wbGF0ZSwgcmVzdWx0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdFNvcnRhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgZnVuY3Rpb24gaW5pdFNvcnRhYmxlRW5naW5lKGVsLCBoYW5kbGVOYW1lLCBncm91cE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZShlbCwge1xuICAgICAgICAgICAgICAgIHNjcm9sbDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBhbmltYXRpb246IDIwMCxcbiAgICAgICAgICAgICAgICBncm91cDogZ3JvdXBOYW1lLFxuICAgICAgICAgICAgICAgIGhhbmRsZTogaGFuZGxlTmFtZSxcbiAgICAgICAgICAgICAgICBvbkFkZDogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25UcmVlU29ydChldnQsIHNvcnRhYmxlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiBmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCkge1xuICAgICAgICAgICAgICAgICAgICBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gb25UcmVlU29ydChldnQsIHNvcnRhYmxlKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSAkKGV2dC50YXJnZXQpLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmRhdGEoJ21vZGVsJyk7XG4gICAgICAgICAgICB2YXIgcGFyZW50SWQgPSAkKGV2dC50YXJnZXQpLmRhdGEoJ2lkJyk7XG4gICAgICAgICAgICB2YXIgb3JkZXJBcnJheSA9IHNvcnRhYmxlLnRvQXJyYXkoKS5maWx0ZXIoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsID49IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfLmV4dGVuZCh7c2F2ZToge319LCBfdGhpcy5hcHAuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddW21vZGVsXSA9IHt9OyAvLyBvYmplY3QsIG5vdCBhbiBhcnJheS4gT3RoZXJ3aXNlIGl0IHdpbGwgY3JlYXRlIDAuLmlkIGVtcHR5IGVsZW1lbnRzXG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIG9yZGVyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICBpZiAob3JkZXJBcnJheS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bbW9kZWxdW29yZGVyQXJyYXlbaV1dID0geydzaG93X29yZGVyJzogcGFyc2VJbnQoaSkgKyAxLCAncGFyZW50X2lkJzogcGFyZW50SWR9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRyZWVzXG4gICAgICAgICQoJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCcpLmVhY2goZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHZhciBwbGFpbiA9ICQodGhpcykuZGF0YSgncGxhaW4nKSA9PT0gMTtcbiAgICAgICAgICAgIHZhciB0cmVlTmFtZSA9ICd0cmVlXycgKyBpO1xuICAgICAgICAgICAgJCh0aGlzKS5maW5kKChwbGFpbiA/ICc+JyA6ICcnKSArICd1bCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGluaXRTb3J0YWJsZUVuZ2luZSgkKHRoaXMpWzBdLCAnLmlkJywgdHJlZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIExpc3RzXG4gICAgICAgICQoJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudFtkYXRhLXNvcnRhYmxlPVwidHJ1ZVwiXSB0Ym9keScpLmVhY2goZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHZhciBsaXN0TmFtZSA9ICdsaXN0XycgKyBpO1xuICAgICAgICAgICAgaW5pdFNvcnRhYmxlRW5naW5lKCQodGhpcylbMF0sICcuY29sdW1uLWlkJywgbGlzdE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsJFxuICAgICAqIEByZXR1cm5zIHsqfEhUTUxFbGVtZW50fG51bGx9XG4gICAgICovXG4gICAgZ2V0SXRlbUNvbnRhaW5lcjogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICByZXR1cm4gZWwkLmNsb3Nlc3QoJ1tkYXRhLWlkXScpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsJFxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGdldEl0ZW1JZDogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRJdGVtQ29udGFpbmVyKGVsJCkuZGF0YSgnaWQnKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBnZXRJdGVtTW9kZWw6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgcmV0dXJuIGVsJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCdtb2RlbCcpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZW5lcmF0ZVJhbmRvbUlkU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnJUNSRUFURV8nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDgpICsgJyUnO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHJlc3VsdFxuICAgICAqIEByZXR1cm5zIHsqfGpRdWVyeX1cbiAgICAgKi9cbiAgICBjcmVhdGVOZXdFbGVtZW50OiBmdW5jdGlvbiAodGVtcGxhdGUsIHJlc3VsdCkge1xuICAgICAgICB2YXIgbmV3SXRlbSQgPSAkKHRlbXBsYXRlLnJlcGxhY2UobmV3IFJlZ0V4cCgnJUNSRUFURV8lJywgJ2cnKSwgcmVzdWx0KSkuYXR0cignZGF0YS1pZCcsIHJlc3VsdCk7XG4gICAgICAgIG5ld0l0ZW0kLmZpbmQoJy5pZCcpLnRleHQocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ld0l0ZW0kO1xuICAgIH1cbn07IiwiZnVuY3Rpb24gVUkoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblVJLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgdXNlck1lbnU6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5pdFVzZXJNZW51KCk7XG4gICAgICAgIHRoaXMuaW5pdEhyZWZCdXR0b25zKCk7XG4gICAgICAgIHRoaXMuaW5pdFN0YXJ0dXBOb3RpZmljYXRpb25zKCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0dvb2dsZU1hcCcpLmluaXRNYXBzKCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0xlZnRNZW51JykuaW5pdE1haW5NZW51KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0xpc3QnKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0Zvcm0nKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0Ryb3B6b25lTWFuYWdlcicpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdWaWRlb3NMaXN0JykuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBpbml0U3RhcnR1cE5vdGlmaWNhdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQoJy5jbXMtbW9kdWxlLWZvcm0tcGFnZScpLmRhdGEoJ2p1c3QtY3JlYXRlZCcpKSB7XG4gICAgICAgICAgICAkLmdyb3dsLm5vdGljZSh7dGl0bGU6ICcnLCBtZXNzYWdlOiBcItCe0LHRitC10LrRgiDRgdC+0LfQtNCw0L1cIn0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXRVc2VyTWVudTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXItaWNvbicpKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXJNZW51ID0gbmV3IERyb3Aoe1xuICAgICAgICAgICAgICAgIG9wZW5PbjogJ2NsaWNrJyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbSByaWdodCcsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlci1pY29uJyksXG4gICAgICAgICAgICAgICAgY29udGVudDogJCgnLnVzZXItZHJvcGRvd24tY29udGFpbmVyJykuaHRtbCgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0SHJlZkJ1dHRvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2J1dHRvbltocmVmXScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZVNwaW5uZXI6IGZ1bmN0aW9uIChzaG93KSB7XG4gICAgICAgICQoJyNzcGlubmVyJykudG9nZ2xlQ2xhc3MoJ3Nob3cnLCBzaG93KTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlRm9ybUJ1dHRvbnM6IGZ1bmN0aW9uIChlbmFibGUpIHtcbiAgICAgICAgJCgnLmZvcm0tYnV0dG9ucyBidXR0b24nKS5wcm9wKCdkaXNhYmxlZCcsICFlbmFibGUpO1xuICAgIH1cblxufSIsImZ1bmN0aW9uIFVwbG9hZGFibGVzTGlzdChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuVXBsb2FkYWJsZXNMaXN0LnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgWydpbWFnZScsICdmaWxlJ10uZm9yRWFjaChmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgICAgIF90aGlzLmluaXREZWxldGVCdXR0b24obW9kZWwpO1xuXG4gICAgICAgICAgICAkKCcuJyArIG1vZGVsICsgJ3MtbGlzdCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChtb2RlbCA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmluaXRGYW5jeWJveCgkKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMuaW5pdFNvcnRhYmxlKCQodGhpcylbMF0sIG1vZGVsKVxuXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIGluaXREZWxldGVCdXR0b246IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLicgKyBtb2RlbCArICdzLWxpc3QgLicgKyBtb2RlbCArICcgLmRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdTdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQkID0gJCh0aGlzKS5jbG9zZXN0KCcuJyArIG1vZGVsKTtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBlbGVtZW50JC5kYXRhKCdpZCcpO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpO1xuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQkLmZhZGVPdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdFNvcnRhYmxlOiBmdW5jdGlvbiAoZWwsIG1vZGVsKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZShlbCwge1xuICAgICAgICAgICAgYW5pbWF0aW9uOiAyMDAsXG4gICAgICAgICAgICBoYW5kbGU6IG1vZGVsID09ICdmaWxlJyA/IFwiLmljb25cIiA6IG51bGwsXG4gICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcmRlckFycmF5ID0gc29ydGFibGUudG9BcnJheSgpO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ3NhdmUnLCBtb2RlbF0sIHt9KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIG9yZGVyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyQXJyYXkuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF1bb3JkZXJBcnJheVtpXV0gPSB7J3Nob3dfb3JkZXInOiBwYXJzZUludChpKSArIDF9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRGYW5jeWJveDogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICBlbCQuZmluZCgnLmltYWdlID4gYScpLmZhbmN5Ym94KHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEsXG4gICAgICAgICAgICBvcGVuRWZmZWN0OiAnZWxhc3RpYycsXG4gICAgICAgICAgICBoZWxwZXJzOiB7XG4gICAgICAgICAgICAgICAgb3ZlcmxheToge1xuICAgICAgICAgICAgICAgICAgICBsb2NrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogJ3JnYmEoMCwwLDAsMC41KSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbn07IiwiZnVuY3Rpb24gVmlkZW9zTGlzdChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuVmlkZW9zTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHZhciB0ZW1wbGF0ZUltYWdlID0gdHdpZyh7XG4gICAgICAgICAgICBkYXRhOiAkKCcjaW1hZ2UtcHJldmlldy10ZW1wbGF0ZScpLmh0bWwoKVxuICAgICAgICB9KTtcblxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNtcy1idXR0b25bZGF0YS1hZGQtdmlkZW9dJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5mYW5jeWJveC5vcGVuKHR3aWcoe2RhdGE6ICQoJyNpbnNlcnQtdmlkZW8tdGVtcGxhdGUnKS5odG1sKCl9KS5yZW5kZXIoe1xuICAgICAgICAgICAgICAgIGlucHV0TmFtZTogJCh0aGlzKS5kYXRhKCdpbnB1dC1uYW1lJylcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuaW5zZXJ0LXZpZGVvLWRpYWxvZyBidXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZGlhbG9nJCA9ICQodGhpcykuY2xvc2VzdCgnLmluc2VydC12aWRlby1kaWFsb2cnKTtcbiAgICAgICAgICAgIHZhciB0ZXh0YXJlYSQgPSBkaWFsb2ckLmZpbmQoJ3RleHRhcmVhJyk7XG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoKTtcbiAgICAgICAgICAgIHBheWxvYWRbdGV4dGFyZWEkLmF0dHIoJ25hbWUnKV0gPSB0ZXh0YXJlYSQudmFsKCk7XG4gICAgICAgICAgICBwYXlsb2FkWydtdWx0aXBsZSddID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGlhbG9nJC5hZGRDbGFzcygncHJvY2Vzc2luZycpO1xuICAgICAgICAgICAgdGV4dGFyZWEkLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSkuY3NzKCdiYWNrZ3JvdW5kJywgJyNlZWUnKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBidXR0b24gPSAkKCcuY21zLWJ1dHRvbltkYXRhLWFkZC12aWRlb11bZGF0YS1pbnB1dC1uYW1lPVwiJyArIHRleHRhcmVhJC5hdHRyKCduYW1lJykgKyAnXCJdJyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1dHRvbi5wcmV2QWxsKCcuaW1hZ2VzLWxpc3Q6Zmlyc3QnKS5maW5kKCcuaW1hZ2VbZGF0YS1pZD0nICsgcmVzcG9uc2VbaV0uaW1hZ2UuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLnByZXZBbGwoJy5pbWFnZXMtbGlzdDpmaXJzdCcpLmFwcGVuZCh0ZW1wbGF0ZUltYWdlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdEZhbmN5Ym94KGJ1dHRvbi5wcmV2QWxsKCcuaW1hZ2VzLWxpc3Q6Zmlyc3QnKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJC5mYW5jeWJveC5jbG9zZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG59OyIsIi8qKlxuICogQ3JlYXRlZCBieSB4cHVuZGVsIG9uIDA0LjA0LjE2LlxuICovXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLmxlbmd0aCkge1xuICAgICAgICAkKCdbZGF0YS1yb3ctZm9yLWZpZWxkPVwicm9sZS5uYW1lXCJdIHNlbGVjdCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgJCgndHJbZGF0YS1yb3ctZm9yLWZpZWxkPVwiYWNsXCJdJykuaGlkZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5zaG93KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLnRyaWdnZXIoJ2NoYW5nZScpO1xuICAgIH1cbn0pOyIsIi8qKlxuICogQ3JlYXRlZCBieSB4cHVuZGVsIG9uIDE3LjA2LjE2LlxuICovXG5mdW5jdGlvbiBnZXREZWZhdWx0VGlueU1jZU9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29udGVudF9jc3M6ICcvYXNzZXRzL2ZhY2VwYWxtL2Nzcy9jb250ZW50LmNzcycsXG4gICAgICAgIGxhbmd1YWdlOiAncnUnLFxuICAgICAgICBtZW51YmFyOiBmYWxzZSxcbiAgICAgICAgc3RhdHVzYmFyOiBmYWxzZSxcbiAgICAgICAgcmVsYXRpdmVfdXJscyA6IGZhbHNlLFxuICAgICAgICBzdHlsZV9mb3JtYXRzOiBbXG4gICAgICAgICAgICB7dGl0bGU6ICfQntCx0YvRh9C90YvQuSDRgtC10LrRgdGCJywgYmxvY2s6ICdwJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQl9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gyJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQn9C+0LTQt9Cw0LPQvtC70L7QstC+0LonLCBibG9jazogJ2gzJ30sXG4gICAgICAgICAgICB7dGl0bGU6ICfQktGA0LXQt9C60LAnLCBibG9jazogJ2Jsb2NrcXVvdGUnfSxcbiAgICAgICAgICAgIC8vIHsgdGl0bGU6ICdUYWJsZSByb3cgMScsIHNlbGVjdG9yOiAndHInLCBjbGFzc2VzOiAndGFibGVyb3cxJyB9XG4gICAgICAgIF0sXG4gICAgICAgIHJlbW92ZWZvcm1hdDogW1xuICAgICAgICAgICAge3NlbGVjdG9yOiAnKicsIHJlbW92ZSA6ICdhbGwnLCBzcGxpdCA6IHRydWUsIGV4cGFuZCA6IGZhbHNlLCBibG9ja19leHBhbmQ6IHRydWUsIGRlZXAgOiB0cnVlfSxcbiAgICAgICAgXSxcblxuICAgICAgICAvLyBleHRlbmRlZF92YWxpZF9lbGVtZW50czogJ2ltZ1tjbGFzcz1teWNsYXNzfCFzcmN8Ym9yZGVyOjB8YWx0fHRpdGxlfHdpZHRofGhlaWdodHxzdHlsZV0nLFxuICAgICAgICAvLyBpbnZhbGlkX2VsZW1lbnRzOiAnc3Ryb25nLGIsZW0saScsXG5cbiAgICAgICAgcGx1Z2luczogWydmaXhlZHRvb2xiYXInLCAnYXV0b3Jlc2l6ZScsICdjb2RlbWlycm9yJywgJ2xpbmsnLCAnYXV0b2xpbmsnLCAnbWVkaWEnLCAnbm9uZWRpdGFibGUnLCAncGFzdGUnLCAndGFibGUnLCAndmlzdWFsYmxvY2tzJywgJ3Bhc3RlJ10sXG4gICAgICAgIHRvb2xiYXI6ICdzdHlsZXNlbGVjdCB8IGJvbGQgaXRhbGljIHwgYWxpZ25sZWZ0IGFsaWduY2VudGVyIGFsaWducmlnaHQgfCBidWxsaXN0IG51bWxpc3Qgb3V0ZGVudCBpbmRlbnQgfCBsaW5rIGltYWdlIHRhYmxlIG1lZGlhIHwgdmlzdWFsYmxvY2tzIGNvZGUgcmVtb3ZlZm9ybWF0IHwgZnA6aW1hZ2UgZnA6Z2FsbGVyeScsXG5cbiAgICAgICAgLy8gcGFzdGVfYXNfdGV4dDogdHJ1ZSxcblxuICAgICAgICBtZWRpYV9wb3N0ZXI6IGZhbHNlLFxuICAgICAgICBtZWRpYV9kaW1lbnNpb25zOiBmYWxzZSxcblxuICAgICAgICB0YWJsZV9hcHBlYXJhbmNlX29wdGlvbnM6IGZhbHNlLFxuICAgICAgICB0YWJsZV9hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9jZWxsX2FkdnRhYjogZmFsc2UsXG4gICAgICAgIHRhYmxlX3Jvd19hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9kZWZhdWx0X2F0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnZGVmYXVsdC10YWJsZSdcbiAgICAgICAgfSxcbiAgICAgICAgdGFibGVfY2xhc3NfbGlzdDogW1xuICAgICAgICAgICAge3RpdGxlOiAnRGVmYXVsdCcsIHZhbHVlOiAnZGVmYXVsdC10YWJsZSd9LFxuICAgICAgICBdLFxuXG4gICAgICAgIGNvZGVtaXJyb3I6IHtcbiAgICAgICAgICAgIGluZGVudE9uSW5pdDogdHJ1ZSxcbiAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICAgIHN0eWxlQWN0aXZlTGluZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGhlbWU6ICdtb25va2FpJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNzc0ZpbGVzOiBbXG4gICAgICAgICAgICAgICAgJ3RoZW1lL21vbm9rYWkuY3NzJ1xuICAgICAgICAgICAgXVxuICAgICAgICB9XG4gICAgfTtcbn0iLCJmdW5jdGlvbiBHYWxsZXJ5TW9kdWxlKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5HYWxsZXJ5TW9kdWxlLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgZWRpdG9yOiBudWxsLFxuICAgIEJVVFRPTl9HQUxMRVJZOiAnQlVUVE9OX0dBTExFUlknLFxuICAgIEJVVFRPTl9JTUFHRTogJ0JVVFRPTl9JTUFHRScsXG4gICAgd2luZG93UGFyYW1zOiB7XG4gICAgICAgIEJVVFRPTl9HQUxMRVJZOiB7XG4gICAgICAgICAgICB0aXRsZTogJ9CT0LDQu9C10YDQtdGPJyxcbiAgICAgICAgICAgIHdpZHRoOiA2MzAsXG4gICAgICAgICAgICBoZWlnaHQ6IDQwMFxuICAgICAgICB9LFxuICAgICAgICBCVVRUT05fSU1BR0U6IHtcbiAgICAgICAgICAgIHRpdGxlOiAn0JrQsNGA0YLQuNC90LrQsCcsXG4gICAgICAgICAgICB3aWR0aDogNDMwLFxuICAgICAgICAgICAgaGVpZ2h0OiAyMDBcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZWdpc3RlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHRpbnltY2UuUGx1Z2luTWFuYWdlci5hZGQoJ2dhbGxlcnknLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcbiAgICAgICAgICAgIC8vIEFkZCBhIGJ1dHRvbiB0aGF0IG9wZW5zIGEgd2luZG93XG4gICAgICAgICAgICBlZGl0b3IuYWRkQnV0dG9uKCdmcDpnYWxsZXJ5Jywge1xuICAgICAgICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgaWNvbjogJ2dhbGxlcnktYnV0dG9uJyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ9CT0LDQu9C10YDQtdGPJyxcbiAgICAgICAgICAgICAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6ICcudHlwZS1pbWFnZScsXG4gICAgICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkJ1dHRvbkNsaWNrKGVkaXRvciwgX3RoaXMuQlVUVE9OX0dBTExFUlkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlZGl0b3IuYWRkQnV0dG9uKCdmcDppbWFnZScsIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgIGljb246ICdpbWFnZS1idXR0b24nLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAn0JrQsNGA0YLQuNC90LrQsCcsXG4gICAgICAgICAgICAgICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yOiAnLnR5cGUtZ2FsbGVyeScsXG4gICAgICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkJ1dHRvbkNsaWNrKGVkaXRvciwgX3RoaXMuQlVUVE9OX0lNQUdFKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy9maXggYnVnIHdpdGggcGFnZSBqdW1waW5nIHdoZW4gY2xpY2tpbmcgZmlyc3QgdGltZSB0byBpbWFnZS9nYWxsZXJ5XG4gICAgICAgICAgICBlZGl0b3Iub24oJ2luaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5zZWxlY3QoZWRpdG9yLmdldEJvZHkoKSwgdHJ1ZSk7IC8vIGVkIGlzIHRoZSBlZGl0b3IgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uLmNvbGxhcHNlKGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBvbkJ1dHRvbkNsaWNrOiBmdW5jdGlvbiAoZWRpdG9yLCB0eXBlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBiYXNlVXJsID0gJCgnYm9keScpLmRhdGEoJ2Jhc2UtdXJsJyk7XG5cbiAgICAgICAgdmFyIHdpbiA9IGVkaXRvci53aW5kb3dNYW5hZ2VyLm9wZW4oe1xuICAgICAgICAgICAgdGl0bGU6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS50aXRsZSxcbiAgICAgICAgICAgIHdpZHRoOiBfdGhpcy53aW5kb3dQYXJhbXNbdHlwZV0ud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS5oZWlnaHQsXG4gICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnT2snLCBzdWJ0eXBlOiAncHJpbWFyeScsIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvYyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tY2UtY29udGFpbmVyLWJvZHk+aWZyYW1lJylbMF07XG4gICAgICAgICAgICAgICAgICAgIGRvYy5jb250ZW50V2luZG93LnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB3aW4uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCcsIG9uY2xpY2s6ICdjbG9zZSd9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdXJsOiAnL2Fzc2V0cy9mYWNlcGFsbS9pbmNsdWRlL3RlbXBsYXRlcy9nYWxsZXJ5RGlhbG9nLmh0bWw/X3Rva2VuPScgKyBfdGhpcy5hcHAuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkuX3Rva2VuICsgJyZiYXNlVXJsPScgKyBiYXNlVXJsICsgJyZ0eXBlPScgKyB0eXBlLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdFdpbmRvdzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcblxuICAgICAgICAkKCcubWNlLWdhbGxlcnktcGx1Z2luLWJvZHknKS5hZGRDbGFzcygoZ2V0UXVlcnlQYXJhbWV0ZXJzKCkudHlwZSA9PSAnQlVUVE9OX0dBTExFUlknID8gJ3R5cGUtZ2FsbGVyeScgOiAndHlwZS1pbWFnZScpKTtcblxuICAgICAgICAkKCcuZHJvcHpvbmUnKS5kYXRhKCdtdWx0aXBsZScsIGdldFF1ZXJ5UGFyYW1ldGVycygpLnR5cGUgPT09ICdCVVRUT05fR0FMTEVSWScgPyAxIDogMCk7XG5cbiAgICAgICAgdmFyIGN1cnJlbnROb2RlJCA9ICQodGhpcy5lZGl0b3Iuc2VsZWN0aW9uLmdldE5vZGUoKSk7XG4gICAgICAgIGlmIChjdXJyZW50Tm9kZSQuaXMoJy5nYWxsZXJ5UGxhY2Vob2xkZXJbZGF0YS1pbWFnZXNdJykpIHtcbiAgICAgICAgICAgICQoJy5pbWFnZXMtbGlzdCcpLmFwcGVuZCgkKGN1cnJlbnROb2RlJC5odG1sKCkpKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdEcm9wem9uZU1hbmFnZXInKS5pbml0KCk7XG4gICAgfSxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgICAvLyBTdWJtaXQgSFRNTCB0byBUaW55TUNFOlxuXG4gICAgICAgIHZhciBpbWFnZXNJZHMgPSBbXTtcbiAgICAgICAgdmFyIGltYWdlc0h0bWwgPSAnJztcbiAgICAgICAgJCgnLmltYWdlcy1saXN0IC5pbWFnZVtkYXRhLWlkXScpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpbWFnZXNJZHMucHVzaCgkKHRoaXMpLmRhdGEoXCJpZFwiKSk7XG4gICAgICAgICAgICBpbWFnZXNIdG1sICs9ICQodGhpcylbMF0ub3V0ZXJIVE1MLnJlcGxhY2UoLyhcXC5cXC5cXC8pKy9nLCAnLycpO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgdHlwZUNsYXNzTmFtZSA9IChnZXRRdWVyeVBhcmFtZXRlcnMoKS50eXBlID09ICdCVVRUT05fR0FMTEVSWScgPyAndHlwZS1nYWxsZXJ5JyA6ICd0eXBlLWltYWdlJyk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuaW5zZXJ0Q29udGVudCgnPGRpdiBjbGFzcz1cIm1jZU5vbkVkaXRhYmxlIGdhbGxlcnlQbGFjZWhvbGRlciAnICsgdHlwZUNsYXNzTmFtZSArICdcIiBkYXRhLWltYWdlcz1cIicgKyBpbWFnZXNJZHMgKyAnXCI+JyArIGltYWdlc0h0bWwgKyAnPC9kaXY+Jyk7XG4gICAgfVxuXG59O1xuIiwiZnVuY3Rpb24gV3lzaXd5Z01hbmFnZXIoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5zZXRPcHRpb25zKCk7IC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICB0aGlzLm9wdGlvbnNbdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yXSA9IGdldERlZmF1bHRUaW55TWNlT3B0aW9ucygpO1xufVxuXG5XeXNpd3lnTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIGRlZmF1bHRXeXNpd3lnU2VsZWN0b3I6ICd0ZXh0YXJlYVtkYXRhLXd5c2l3eWddJyxcbiAgICBvcHRpb25zOiB7fSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICBzZXRPcHRpb25zOiBmdW5jdGlvbiAob3B0aW9ucywgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdID0gJC5leHRlbmQodGhpcy5vcHRpb25zW3NlbGVjdG9yXSwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGNzc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFkZENvbnRlbnRDc3M6IGZ1bmN0aW9uIChjc3MsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPSBbdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2Nzc107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2NzcyA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MuY29uY2F0KGNzcylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGx1Z2luTmFtZVxuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFkZFBsdWdpbjogZnVuY3Rpb24gKHBsdWdpbk5hbWUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMgPSB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnBsdWdpbnMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgYXBwZW5kVG9vbGJhcjogZnVuY3Rpb24gKGJ1dHRvbnMsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAoIWJ1dHRvbnMuc3RhcnRzV2l0aCgnICcpKSB7XG4gICAgICAgICAgICBidXR0b25zID0gJyAnICsgYnV0dG9ucztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIgKz0gYnV0dG9ucztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVtb3ZlXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgcmVtb3ZlRnJvbVRvb2xiYXI6IGZ1bmN0aW9uIChyZW1vdmUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuXG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhciA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhci5yZXBsYWNlKHJlbW92ZSwgJycpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgcHJlcGVuZFRvb2xiYXI6IGZ1bmN0aW9uIChidXR0b25zLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYgKCFidXR0b25zLmVuZHNXaXRoKCcgJykpIHtcbiAgICAgICAgICAgIGJ1dHRvbnMgPSBidXR0b25zICsgJyAnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhciA9IGJ1dHRvbnMgKyB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge1d5c2l3eWdNYW5hZ2VyLm9wdGlvbnN8e319XG4gICAgICovXG4gICAgZ2V0T3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgaW5pdEFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZWRpdG9yUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBfdGhpcy5pbml0Q3VzdG9tTW9kdWxlcygpO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMuZ2V0T3B0aW9ucygpO1xuXG4gICAgICAgIF90aGlzLmFwcC5maXJlKCdiZWZvcmVBbGxXeXNpd3lnSW5pdCcpO1xuICAgICAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShzZWxlY3RvcikpIHtcblxuICAgICAgICAgICAgICAgICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZCA9ICQuRGVmZXJyZWQoKTtcblxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zW3NlbGVjdG9yXS5zZXR1cCA9IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdG9kbzog0YPQsdGA0LDRgtGMINCz0LvQvtCx0LDQu9GM0L3Ri9C5IHRpbnltY2UsINC4INC00LXRgNCz0LDRgtGMINC60L7QvdC60YDQtdGC0L3Ri9C5INGA0LXQtNCw0LrRgtC+0YBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW55bWNlLnRyaWdnZXJTYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5vbignaW5pdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXN0b21Ub29sYmFyID0gJCh0aGlzKS5kYXRhKCd3eXNpd3lnVG9vbGJhcicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VzdG9tVG9vbGJhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS50aW55bWNlKCQuZXh0ZW5kKG9wdGlvbnNbc2VsZWN0b3JdLCB7J3Rvb2xiYXInOiBjdXN0b21Ub29sYmFyfSkpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS50aW55bWNlKG9wdGlvbnNbc2VsZWN0b3JdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGVkaXRvclByb21pc2VzLnB1c2goZC5wcm9taXNlKCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgJC53aGVuLmFwcGx5KCQsIGVkaXRvclByb21pc2VzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmFwcC5maXJlKCdhZnRlckFsbFd5c2l3eWdJbml0Jyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0Q3VzdG9tTW9kdWxlczogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdHYWxsZXJ5TW9kdWxlJykucmVnaXN0ZXIoKTtcbiAgICAgICAgdGhpcy5hZGRQbHVnaW4oWydnYWxsZXJ5J10pO1xuICAgIH1cbn07XG4iXX0=
