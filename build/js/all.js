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
        this.initTabs();
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
    },

    initTabs: function () {
        $('.tabs-container .tab').on('click', function () {
            var container$ = $(this).closest('.tabs-container');
            $(this).addClass('active').siblings().removeClass('active');
            $(this).parent().next().children('.tab-content:eq(' + $(this).prevAll().length + ')').addClass('active').siblings().removeClass('active')
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGguanMiLCJGYWNlcGFsbUNNUy5qcyIsIlNlcnZpY2VMb2NhdG9yLmpzIiwidXRpbGl0eS5qcyIsIlVJL0Ryb3B6b25lTWFuYWdlci5qcyIsIlVJL0Zvcm0uanMiLCJVSS9Hb29nbGVNYXAuanMiLCJVSS9MZWZ0TWVudS5qcyIsIlVJL0xpc3QuanMiLCJVSS9VSS5qcyIsIlVJL1VwbG9hZGFibGVzTGlzdC5qcyIsIlVJL1ZpZGVvc0xpc3QuanMiLCJleHRlbmRlZC91c2Vycy5qcyIsInd5c2l3eWcvRGVmYXVsdFRpbnlNY2VPcHRpb25zLmpzIiwid3lzaXd5Zy9HYWxsZXJ5TW9kdWxlLmpzIiwid3lzaXd5Zy9XeXNpd3lnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBBdXRoTWFuYWdlcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuQXV0aE1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJCgnLmxvZ2luLWZvcm0gZm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLnBvc3QoJCh0aGlzKS5hdHRyKCdhY3Rpb24nKSwgJCh0aGlzKS5zZXJpYWxpemUoKSwgJ2pzb24nKVxuICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UudXNlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9ICcvY21zLyc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5zaGFrZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UuZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe3RpdGxlOiAnJywgbWVzc2FnZTogcmVzcG9uc2UuZXJyb3JzW2ldfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDQv9C10YDQtdC00LXQu9Cw0YLRjCDQstGL0LLQvtC0INGC0LXQutGB0YLQsCDQvtGI0LjQsdC60LghINCb0L7QutCw0LvQuNC30LDRhtC40Y8hXG5cbiAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7dGl0bGU6ICcnLCBtZXNzYWdlOiAn0J3QtdCy0LXRgNC90YvQtSDQu9C+0LPQuNC9INC40LvQuCDQv9Cw0YDQvtC70YwnfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNoYWtlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cocmVzcG9uc2UucmVzcG9uc2VKU09OKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gJCgnLmxvZ2luLWZvcm0gZm9ybScpLmxlbmd0aCA9PSAwO1xuICAgIH0sXG5cbiAgICBzaGFrZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcubG9naW4tZm9ybScpLmFkZENsYXNzKCdzaGFrZScpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5sb2dpbi1mb3JtJykucmVtb3ZlQ2xhc3MoJ3NoYWtlJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cbn07IiwiXy5taXhpbihzLmV4cG9ydHMoKSk7XG5Ecm9wem9uZS5hdXRvRGlzY292ZXIgPSBmYWxzZTtcblxuXG4vKipcbiAqXG4gKiBAcmV0dXJucyB7RmFjZXBhbG1DTVN8Kn1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBGYWNlcGFsbUNNUygpIHtcblxuICAgIGlmIChhcmd1bWVudHMuY2FsbGVlLl9zaW5nbGV0b25JbnN0YW5jZSkge1xuICAgICAgICByZXR1cm4gYXJndW1lbnRzLmNhbGxlZS5fc2luZ2xldG9uSW5zdGFuY2U7XG4gICAgfVxuXG4gICAgYXJndW1lbnRzLmNhbGxlZS5fc2luZ2xldG9uSW5zdGFuY2UgPSB0aGlzO1xufVxuXG5cbkZhY2VwYWxtQ01TLnByb3RvdHlwZSA9IHtcbiAgICBjc3JmVG9rZW46ICcnLFxuICAgIGJhc2VVcmw6IG51bGwsXG4gICAgc2VydmljZUxvY2F0b3I6IG51bGwsXG4gICAgZXZlbnRIYW5kbGVyczoge30sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZhY2VwYWxtQ01TfVxuICAgICAqL1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6YXRpb25cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGYWNlcGFsbUNNU31cbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZmlyZSgnYmVmb3JlSW5pdCcpO1xuXG4gICAgICAgIHRoaXMuc2VydmljZUxvY2F0b3IgPSBuZXcgU2VydmljZUxvY2F0b3IodGhpcyk7XG4gICAgICAgIHRoaXMuYmFzZVVybCA9ICQoJ2JvZHknKS5kYXRhKCdiYXNlLXVybCcpO1xuXG4gICAgICAgIHRoaXMuc2VydmljZSgnV3lzaXd5Z01hbmFnZXInKTsgLy9pbml0IG1hbmFnZXJcblxuICAgICAgICB0aGlzLmZpcmUoJ2FmdGVySW5pdCcpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgVUkgYW5kIG90aGVyIHNlcnZpY2VzLCBhZnRlciBkb20gcmVhZHlcbiAgICAgKi9cbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIF90aGlzLmZpcmUoJ2JlZm9yZVN0YXJ0Jyk7XG5cbiAgICAgICAgICAgIGlmIChfdGhpcy5zZXJ2aWNlKCdBdXRoTWFuYWdlcicpLmluaXQoKSkge1xuICAgICAgICAgICAgICAgIF90aGlzLmluaXRTZXNzaW9uS2VlcEFsaXZlKCk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5zZXJ2aWNlKCdVSScpLmluaXQoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXJ2aWNlKCdXeXNpd3lnTWFuYWdlcicpLmluaXRBbGwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgX3RoaXMuZmlyZSgnYWZ0ZXJTdGFydCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHNlcnZpY2UgZnJvbSBTZXJ2aWNlIExvY2F0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSBzZXJ2aWNlTmFtZVxuICAgICAqIEBwYXJhbSBwYXJhbVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIHNlcnZpY2U6IGZ1bmN0aW9uIChzZXJ2aWNlTmFtZSwgcGFyYW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZUxvY2F0b3IuZ2V0KHNlcnZpY2VOYW1lLCBwYXJhbSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmlyZSBldmVudFxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50TmFtZVxuICAgICAqL1xuICAgIGZpcmU6IGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgY29uc29sZS5pbmZvKGV2ZW50TmFtZSk7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ubWFwKGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgcmVnaXN0cmF0aW9uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnROYW1lXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFBpbmcgdGltZXJcbiAgICAgKi9cbiAgICBpbml0U2Vzc2lvbktlZXBBbGl2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmdldCgnLi8nLCB7J3BpbmcnOiAncGluZyd9KTtcbiAgICAgICAgfSwgMTIwMDAwKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQnVpbGQgcGF5bG9hZCBvYmplY3QgZm9yIGFqYXggcmVxdWVzdHNcbiAgICAgKiBAcGFyYW0gcGF0aFxuICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAqL1xuICAgIGJ1aWxkUGF5bG9hZDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBfLmV4dGVuZCh7fS5zZXRXaXRoUGF0aChwYXRoLCB2YWx1ZSksIHRoaXMuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHBheWxvYWRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBkb1JlcXVlc3Q6IGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiAkLnBvc3QodGhpcy5iYXNlVXJsICsgJy8nLCBwYXlsb2FkLCAnanNvbicpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgQ1NSRiB0b2tlbiBvYmplY3Qge190b2tlbjoneHh4J31cbiAgICAgKiBAcmV0dXJucyB7e190b2tlbjogc3RyaW5nfX1cbiAgICAgKi9cbiAgICBnZXRDc3JmVG9rZW5QYXJhbWV0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNzcmZUb2tlbikge1xuICAgICAgICAgICAgdGhpcy5zZXRDc3JmVG9rZW4oJCgnaW5wdXQ6aGlkZGVuW25hbWU9X3Rva2VuXScpLnZhbCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geydfdG9rZW4nOiB0aGlzLmNzcmZUb2tlbn07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCBDU1JGIHRva2VuIHZhbHVlXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgc2V0Q3NyZlRva2VuOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5jc3JmVG9rZW4gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHNldEJhc2VVcmw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmJhc2VVcmwgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59O1xuXG4iLCJmdW5jdGlvbiBTZXJ2aWNlTG9jYXRvcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuU2VydmljZUxvY2F0b3IucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcbiAgICBzZXJ2aWNlc01hcDoge30sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChjbGFzc05hbWUsIHBhcmFtKSB7XG4gICAgICAgIGlmICghdGhpcy5zZXJ2aWNlc01hcFtjbGFzc05hbWVdKSB7XG4gICAgICAgICAgICBpZiAod2luZG93W2NsYXNzTmFtZV0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZpY2VzTWFwW2NsYXNzTmFtZV0gPSBuZXcgd2luZG93W2NsYXNzTmFtZV0odGhpcy5hcHAsIHBhcmFtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwi0J3QtdC40LfQstC10YHRgtC90YvQuSDQutC70LDRgdGBOiBcIiArIGNsYXNzTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuc2VydmljZXNNYXBbY2xhc3NOYW1lXTtcbiAgICB9LFxuXG59O1xuXG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgeHB1bmRlbCBvbiAxNC4xMi4xNS5cbiAqL1xuXG4vKipcbiAqIEBtZXRob2Qgc2V0V2l0aFBhdGhcbiAqIFNldHMgdGhlIG5lc3RlZCBwcm9wZXJ0eSBvZiBvYmplY3RcbiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5wcm90b3R5cGUsICdzZXRXaXRoUGF0aCcsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gKHBhdGgsIHZhbHVlKSB7IC8qIE1ha2VzIGJyZWFrZmFzdCwgc29sdmVzIHdvcmxkIHBlYWNlLCB0YWtlcyBvdXQgdHJhc2ggKi9cbiAgICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgIHBhdGggPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zcGxpdCgnLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjdXIgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGZpZWxkcyA9IHBhdGg7XG4gICAgICAgICAgICBmaWVsZHMgPSBmaWVsZHMuZmlsdGVyKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgIT0gJ3VuZGVmaW5lZCcgJiYgdmFsdWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGZpZWxkcy5tYXAoZnVuY3Rpb24gKGZpZWxkLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGN1cltmaWVsZF0gPSBjdXJbZmllbGRdIHx8IChpbmRleCA9PSBmaWVsZHMubGVuZ3RoIC0gMSA/ICh0eXBlb2YgdmFsdWUgIT0gJ3VuZGVmaW5lZCcgPyB2YWx1ZSA6IHt9KSA6IHt9KTtcbiAgICAgICAgICAgICAgICBjdXIgPSBjdXJbZmllbGRdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlXG59KTtcblxuLyoqXG4gKlxuICogQHBhcmFtIG1zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gZGVsYXkobXMpIHtcbiAgICB2YXIgZCA9ICQuRGVmZXJyZWQoKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZC5yZXNvbHZlKCk7XG4gICAgfSwgbXMpO1xuICAgIHJldHVybiBkLnByb21pc2UoKTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHN0clxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGdldFF1ZXJ5UGFyYW1ldGVycyhzdHIpIHtcbiAgICByZXR1cm4gKHN0ciB8fCBkb2N1bWVudC5sb2NhdGlvbi5zZWFyY2gpLnJlcGxhY2UoLyheXFw/KS8sICcnKS5zcGxpdChcIiZcIikubWFwKGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHJldHVybiBuID0gbi5zcGxpdChcIj1cIiksIHRoaXNbblswXV0gPSBuWzFdLCB0aGlzXG4gICAgfS5iaW5kKHt9KSlbMF07XG59XG5cbi8qKlxuICpcbiAqL1xuaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKSB7XG4gICAgU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCA9IGZ1bmN0aW9uIChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgIHZhciBzdWJqZWN0U3RyaW5nID0gdGhpcy50b1N0cmluZygpO1xuICAgICAgICBpZiAodHlwZW9mIHBvc2l0aW9uICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocG9zaXRpb24pIHx8IE1hdGguZmxvb3IocG9zaXRpb24pICE9PSBwb3NpdGlvbiB8fCBwb3NpdGlvbiA+IHN1YmplY3RTdHJpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHBvc2l0aW9uIC09IHNlYXJjaFN0cmluZy5sZW5ndGg7XG4gICAgICAgIHZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG4gICAgICAgIHJldHVybiBsYXN0SW5kZXggIT09IC0xICYmIGxhc3RJbmRleCA9PT0gcG9zaXRpb247XG4gICAgfTtcbn1cblxuLyoqXG4gKlxuICovXG5pZiAoIVN0cmluZy5wcm90b3R5cGUuc3RhcnRzV2l0aCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdHJpbmcucHJvdG90eXBlLCAnc3RhcnRzV2l0aCcsIHtcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHBvc2l0aW9uIHx8IDA7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0SW5kZXhPZihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSA9PT0gcG9zaXRpb247XG4gICAgICAgIH1cbiAgICB9KTtcbn0iLCJmdW5jdGlvbiBEcm9wem9uZU1hbmFnZXIoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkRyb3B6b25lTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdGVtcGxhdGVJbWFnZSA9IHR3aWcoe1xuICAgICAgICAgICAgZGF0YTogJCgnI2ltYWdlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0ZW1wbGF0ZUZpbGUgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNmaWxlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChcIi5kcm9wem9uZVwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkcm9wem9uZSQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGlzTXVsdGlwbGUgPSBkcm9wem9uZSQuZGF0YSgnbXVsdGlwbGUnKSA9PSBcIjFcIjtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kcm9wem9uZSh7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFsbGVsVXBsb2FkczogMyxcbiAgICAgICAgICAgICAgICAgICAgYWRkUmVtb3ZlTGlua3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZE11bHRpcGxlOiBpc011bHRpcGxlLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVJbWFnZVRodW1ibmFpbHM6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBtYXhGaWxlczogaXNNdWx0aXBsZSA/IG51bGwgOiAxLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbU5hbWU6ICQodGhpcykuZGF0YSgnaW5wdXQtbmFtZScpLFxuICAgICAgICAgICAgICAgICAgICBjbGlja2FibGU6ICQodGhpcykuZmluZChcIi5kei1tZXNzYWdlXCIpWzBdLFxuICAgICAgICAgICAgICAgICAgICBhY2NlcHRlZEZpbGVzOiBkcm9wem9uZSQuZGF0YSgndHlwZScpID09ICdpbWFnZScgPyAnaW1hZ2UvKicgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IF90aGlzLmFwcC5iYXNlVXJsICsgXCIvP190b2tlbj1cIiArIF90aGlzLmFwcC5nZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKS5fdG9rZW4gKyBkcm9wem9uZSQuZGF0YSgncGFyYW1ldGVycycpLFxuXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChmaWxlLCByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc011bHRpcGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkcm9wem9uZSQuZGF0YSgndHlwZScpID09ICdpbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcm9wem9uZSQucHJldigpLmZpbmQoJy5pbWFnZVtkYXRhLWlkPScgKyByZXNwb25zZVtpXS5pbWFnZS5pZCArICddJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSQucHJldigpLmFwcGVuZCh0ZW1wbGF0ZUltYWdlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdEZhbmN5Ym94KGRyb3B6b25lJC5wcmV2KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFkcm9wem9uZSQucHJldigpLmZpbmQoJy5maWxlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmZpbGUuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5hcHBlbmQodGVtcGxhdGVGaWxlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChmaWxlLCBlcnJvck1lc3NhZ2UsIHhocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVGaWxlKGZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDQvdC+0YDQvNCw0LvRjNC90L4g0L7QsdGA0LDQsdCw0YLRi9Cy0LDRgtGMINC4INC/0L7QutCw0LfRi9Cy0LDRgtGMINC+0YjQuNCx0LrQuFxuICAgICAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5lcnJvcih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICfQntGI0LjQsdC60LAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfQndC1INGD0LTQsNC10YLRgdGPINC30LDQs9GA0YPQt9C40YLRjCDRhNCw0LnQuyDQvdCwINGB0LXRgNCy0LXRgC4g0J3QtdCy0LXRgNC90YvQuSDRhNC+0YDQvNCw0YIg0LjQu9C4INGB0LvQuNGI0LrQvtC8INCx0L7Qu9GM0YjQvtC5INGA0LDQt9C80LXRgC4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA3MDAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuXG4gICAgfSxcblxuXG59OyIsImZ1bmN0aW9uIEZvcm0oYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkZvcm0ucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0U2F2ZSgpO1xuICAgICAgICB0aGlzLmluaXREYXRlcGlja2VyKCk7XG4gICAgICAgIHRoaXMuaW5pdFRhYnMoKTtcbiAgICB9LFxuXG4gICAgaW5pdFNhdmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmZvcm0tYnV0dG9ucyBidXR0b24uc2F2ZS1idXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZm9ybURhdGEgPSAkKCcubWFpbi1jbXMtZm9ybScpLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgICAgdmFyIGNyZWF0ZU1vZGUgPSAkKCcuY21zLW1vZHVsZS1mb3JtLXBhZ2UnKS5kYXRhKCdjcmVhdGUtbW9kZScpO1xuICAgICAgICAgICAgdmFyIGJ1dHRvbiQgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVTcGlubmVyKHRydWUpO1xuICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VJJykudG9nZ2xlRm9ybUJ1dHRvbnMoZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyBNaW5pbXVtIGRlbGF5IHRvIGF2b2lkIHVucGxlYXNhbnQgYmxpbmtpbmdcbiAgICAgICAgICAgICQud2hlbihcbiAgICAgICAgICAgICAgICAkLnBvc3QoX3RoaXMuYXBwLmJhc2VVcmwgKyAnLycsIGZvcm1EYXRhKSxcbiAgICAgICAgICAgICAgICBkZWxheShjcmVhdGVNb2RlID8gMTAwIDogNTAwKVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSByZXN1bHRbMF07XG4gICAgICAgICAgICAgICAgaWYgKGNyZWF0ZU1vZGUgJiYgcGFyc2VJbnQocmVzcG9uc2UpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYnV0dG9uJC5kYXRhKCdhY3Rpb24nKSA9PSAnc2F2ZS1hbmQtcmV0dXJuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IF90aGlzLmFwcC5iYXNlVXJsO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IF8ucnRyaW0oZG9jdW1lbnQubG9jYXRpb24uaHJlZiwgJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cmwuZW5kc1dpdGgoJy9jcmVhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IF8uc3RyTGVmdEJhY2sodXJsLCAnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHVybCArICcvJyArIHJlc3BvbnNlICsgJy8nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5ub3RpY2Uoe3RpdGxlOiAnJywgbWVzc2FnZTogXCJD0L7RhdGA0LDQvdC10L3QvlwifSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVSScpLnRvZ2dsZVNwaW5uZXIoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVGb3JtQnV0dG9ucyh0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnV0dG9uJC5kYXRhKCdhY3Rpb24nKSA9PSAnc2F2ZS1hbmQtcmV0dXJuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IF90aGlzLmFwcC5iYXNlVXJsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgaW5pdERhdGVwaWNrZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy90b2RvOiDQv9C+0LTRg9C80LDRgtGMLCDQvdCw0YHRh9C10YIgbGl2ZT9cbiAgICAgICAgJCgnLmRhdGVwaWNrZXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAkKHRoaXMpWzBdLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnZGFyay10aGVtZScsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWScsXG4gICAgICAgICAgICAgICAgZmlyc3REYXk6IDEsXG4gICAgICAgICAgICAgICAgc2hvd1RpbWU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGkxOG46IHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNNb250aDogJ9Cf0YDQtdC00YvQtNGD0YnQuNC5INC80LXRgdGP0YYnLFxuICAgICAgICAgICAgICAgICAgICBuZXh0TW9udGg6ICfQodC70LXQtNGD0Y7RidC40Lkg0LzQtdGB0Y/RhicsXG4gICAgICAgICAgICAgICAgICAgIG1vbnRoczogWyfQr9C90LLQsNGA0YwnLCAn0KTQtdCy0YDQsNC70YwnLCAn0JzQsNGA0YInLCAn0JDQv9GA0LXQu9GMJywgJ9Cc0LDQuScsICfQmNGO0L3RjCcsICfQmNGO0LvRjCcsICfQkNCy0LPRg9GB0YInLCAn0KHQtdC90YLRj9Cx0YDRjCcsICfQntC60YLRj9Cx0YDRjCcsICfQndC+0Y/QsdGA0YwnLCAn0JTQtdC60LDQsdGA0YwnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXM6IFsn0JLQvtGB0LrRgNC10YHQtdC90YzQtScsICfQn9C+0L3QtdC00LXQu9GM0L3QuNC6JywgJ9CS0YLQvtGA0L3QuNC6JywgJ9Ch0YDQtdC00LAnLCAn0KfQtdGC0LLQtdGA0LMnLCAn0J/Rj9GC0L3QuNGG0LAnLCAn0KHRg9Cx0LHQvtGC0LAnXSxcbiAgICAgICAgICAgICAgICAgICAgd2Vla2RheXNTaG9ydDogWyfQktGBJywgJ9Cf0L0nLCAn0JLRgicsICfQodGAJywgJ9Cn0YInLCAn0J/RgicsICfQodCxJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCQodGhpcykuaXMoJy5kYXRldGltZScpKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiAnREQuTU0uWVlZWSBISDptbScsXG4gICAgICAgICAgICAgICAgICAgIHNob3dUaW1lOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzaG93U2Vjb25kczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHVzZTI0aG91cjogdHJ1ZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5ldyBQaWthZGF5KG9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnLmRhdGVwaWNrZXIgKyAuY2xlYXItZGF0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykucHJldigpLnZhbCgnJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0VGFiczogZnVuY3Rpb24gKCkge1xuICAgICAgICAkKCcudGFicy1jb250YWluZXIgLnRhYicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb250YWluZXIkID0gJCh0aGlzKS5jbG9zZXN0KCcudGFicy1jb250YWluZXInKTtcbiAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2FjdGl2ZScpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5uZXh0KCkuY2hpbGRyZW4oJy50YWItY29udGVudDplcSgnICsgJCh0aGlzKS5wcmV2QWxsKCkubGVuZ3RoICsgJyknKS5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJylcbiAgICAgICAgfSk7XG4gICAgfVxufTsiLCJmdW5jdGlvbiBHb29nbGVNYXAoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkdvb2dsZU1hcC5wcm90b3R5cGUgPSB7XG4gICAgaW5pdE1hcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCQoJy5tYXAuZ29vZ2xlW2RhdGEtbGF0XVtkYXRhLWxuZ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICQuZ2V0U2NyaXB0KFwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCRjl3TldnQzE2aUNIbVRsb1dFbDVZN3NBUkRTeXFSVUUmbGlicmFyaWVzPXBsYWNlcyZzZW5zb3I9ZmFsc2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5maXJlKCdhZnRlckdvb2dsZU1hcHNBcGlMb2FkJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgc2hpZnRLZXkgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEtleSA9ICgoZS5rZXlJZGVudGlmaWVyID09ICdTaGlmdCcpIHx8IChlLnNoaWZ0S2V5ID09IHRydWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2luZG93Lm9ua2V5dXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEtleSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICQoJy5tYXBbZGF0YS1sYXRdW2RhdGEtbG5nXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0TGF0ID0gcGFyc2VGbG9hdCgkKHRoaXMpLmRhdGEoJ2xhdCcpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdExuZyA9IHBhcnNlRmxvYXQoJCh0aGlzKS5kYXRhKCdsbmcnKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0TGF0ID0gaXNOYU4ob2JqZWN0TGF0KSA/IDAgOiBvYmplY3RMYXQ7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdExuZyA9IGlzTmFOKG9iamVjdExuZykgPyAwIDogb2JqZWN0TG5nO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwVHlwZUNvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWV0Vmlld0NvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvYmplY3RMYXQsIG9iamVjdExuZylcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdExhdCAmJiBvYmplY3RMbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcE9wdGlvbnMuem9vbSA9IDEyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBFbGVtZW50ID0gJCh0aGlzKVswXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobWFwRWxlbWVudCwgbWFwT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9iamVjdExhdCwgb2JqZWN0TG5nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobWFwRWxlbWVudCkuY2xvc2VzdCgnLmxhdC1sbmctY29udGFpbmVyJykuZmluZChcIltkYXRhLWxhdGxuZy1maWVsZD1sYXRdXCIpLnZhbChldmVudC5sYXRMbmcubGF0KCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChtYXBFbGVtZW50KS5jbG9zZXN0KCcubGF0LWxuZy1jb250YWluZXInKS5maW5kKFwiW2RhdGEtbGF0bG5nLWZpZWxkPWxuZ11cIikudmFsKGV2ZW50LmxhdExuZy5sbmcoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24oZXZlbnQubGF0TG5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBzZWFyY2ggYm94IGFuZCBsaW5rIGl0IHRvIHRoZSBVSSBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFjLWlucHV0Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkub24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLndoaWNoID09IDEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWFyY2hCb3ggPSBuZXcgZ29vZ2xlLm1hcHMucGxhY2VzLlNlYXJjaEJveChpbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5jb250cm9sc1tnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb24uVE9QX0xFRlRdLnB1c2goaW5wdXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIG1hcC5hZGRMaXN0ZW5lcignYm91bmRzX2NoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hCb3guc2V0Qm91bmRzKG1hcC5nZXRCb3VuZHMoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXJzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaEJveC5hZGRMaXN0ZW5lcigncGxhY2VzX2NoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGxhY2VzID0gc2VhcmNoQm94LmdldFBsYWNlcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsYWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwbGFjZSA9IHBsYWNlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbGFjZS5nZW9tZXRyeS52aWV3cG9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGdlb2NvZGVzIGhhdmUgdmlld3BvcnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdW5kcy51bmlvbihwbGFjZS5nZW9tZXRyeS52aWV3cG9ydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzLmV4dGVuZChwbGFjZS5nZW9tZXRyeS5sb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5maXRCb3VuZHMoYm91bmRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYWZ0ZXJNYXBzSW5pdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbiIsImZ1bmN0aW9uIExlZnRNZW51KGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5MZWZ0TWVudS5wcm90b3R5cGUgPSB7XG4gICAgaW5pdE1haW5NZW51OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuYXZIYXNoID0gJCgnYm9keScpLmRhdGEoJ25hdkhhc2gnKTtcbiAgICAgICAgdmFyIHNjcm9sbENvb2tpZU5hbWUgPSAnc2Nyb2xsXycgKyBuYXZIYXNoO1xuICAgICAgICB2YXIgaW5pdGlhbFNjcm9sbCA9IDA7XG4gICAgICAgIGlmIChDb29raWVzLmdldChzY3JvbGxDb29raWVOYW1lKSkge1xuICAgICAgICAgICAgaW5pdGlhbFNjcm9sbCA9IENvb2tpZXMuZ2V0KHNjcm9sbENvb2tpZU5hbWUpO1xuICAgICAgICAgICAgLy90b2RvOiDQodC+0YXRgNCw0L3Rj9GC0Ywg0LIg0LrRg9C60YMg0LXRidC1INC4INCw0LnQtNC40YjQvdC40LosINC/0YDQvtCy0LXRgNGP0YLRjCwg0L7QvSDQu9C4INCw0LrRgtC40LLQtdC9LCDQuCDRgtC+0LvRjNC60L4g0YLQvtCz0LTQsCDRgdC60YDQvtC70LvQuNGC0YwuXG4gICAgICAgICAgICAvL3RvZG86INCY0L3QsNGH0LUg0LLRi9GB0YfQuNGC0YvQstCw0YLRjCDQv9C+0LfQuNGG0LjRjiwg0LrRg9C00LAg0YHQutGA0L7Qu9C70LjRgtGMXG4gICAgICAgIH1cbiAgICAgICAgJCgnLm1haW4tbWVudSAubGVmdC1wYW5lbDpub3QoLmNvbGxhcHNlZCksIC5tYWluLW1lbnUgLnJpZ2h0LXBhbmVsJykubUN1c3RvbVNjcm9sbGJhcih7XG4gICAgICAgICAgICB0aGVtZTogXCJsaWdodC0yXCIsXG4gICAgICAgICAgICBhdXRvRXhwYW5kU2Nyb2xsYmFyOiB0cnVlLFxuICAgICAgICAgICAgc2Nyb2xsSW5lcnRpYTogNDAwLFxuICAgICAgICAgICAgbW91c2VXaGVlbDoge1xuICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2tzOiB7XG4gICAgICAgICAgICAgICAgb25TY3JvbGw6IGZ1bmN0aW9uIChxLCBxMSkge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGluaXRpYWxTY3JvbGwgJiYgJCgnLm1haW4tbWVudSAucmlnaHQtcGFuZWwgbGkuYWN0aXZlJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAkKCcubWFpbi1tZW51IC5yaWdodC1wYW5lbCcpLm1DdXN0b21TY3JvbGxiYXIoXCJzY3JvbGxUb1wiLCBpbml0aWFsU2Nyb2xsLCB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsSW5lcnRpYTogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcubWFpbi1tZW51IC5yaWdodC1wYW5lbCBhW2hyZWZdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICB2YXIgJHNjcm9sbGVyT3V0ZXIgPSAkKCcubWFpbi1tZW51IC5yaWdodC1wYW5lbCcpO1xuICAgICAgICAgICAgdmFyICRkcmFnZ2VyID0gJHNjcm9sbGVyT3V0ZXIuZmluZCgnLm1DU0JfZHJhZ2dlcicpO1xuICAgICAgICAgICAgdmFyIHNjcm9sbEhlaWdodCA9ICRzY3JvbGxlck91dGVyLmZpbmQoJy5tQ1NCX2NvbnRhaW5lcicpLmhlaWdodCgpO1xuICAgICAgICAgICAgdmFyIGRyYWdnZXJUb3AgPSAkZHJhZ2dlci5wb3NpdGlvbigpLnRvcDtcblxuICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IGRyYWdnZXJUb3AgLyAoJHNjcm9sbGVyT3V0ZXIuaGVpZ2h0KCkgLSAkZHJhZ2dlci5oZWlnaHQoKSkgKiAoc2Nyb2xsSGVpZ2h0IC0gJHNjcm9sbGVyT3V0ZXIuaGVpZ2h0KCkpO1xuXG4gICAgICAgICAgICBDb29raWVzLnNldChzY3JvbGxDb29raWVOYW1lLCBzY3JvbGxUb3ApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiIsImZ1bmN0aW9uIExpc3QoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxpc3QucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIHNlbGVjdG9yczoge1xuICAgICAgICAnc3RhdHVzJzogWycuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLnN0YXR1cycsICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLnN0YXR1cyddLFxuICAgICAgICAnZGVsZXRlJzogWycuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLmRlbGV0ZScsICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLmRlbGV0ZSddLFxuICAgICAgICAnYWRkJzogJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uYWRkJyxcbiAgICAgICAgJ2FkZFJvb3QnOiAnLmFkZC1uZXctdHJlZS1pdGVtJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0QnV0dG9ucygpO1xuICAgICAgICB0aGlzLmluaXRTb3J0YWJsZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXRCdXR0b25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5pdFN0YXR1c0J1dHRvbigpO1xuICAgICAgICB0aGlzLmluaXREZWxldGVCdXR0b24oKTtcbiAgICAgICAgdGhpcy5pbml0QWRkQnV0dG9uKCk7XG4gICAgICAgIHRoaXMuaW5pdEFkZFRvUm9vdEJ1dHRvbigpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIFRvZ2dsZSBzdGF0dXNcbiAgICAgKi9cbiAgICBpbml0U3RhdHVzQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIF90aGlzLnNlbGVjdG9ycy5zdGF0dXMuam9pbignLCcpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaWQgPSBfdGhpcy5nZXRJdGVtSWQoYnRuJCk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBfdGhpcy5nZXRJdGVtTW9kZWwoYnRuJCk7XG4gICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBfdGhpcy5nZXRJdGVtQ29udGFpbmVyKGJ0biQpO1xuXG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWyd0b2dnbGUnLCBtb2RlbCwgaWQsICdzdGF0dXMnXSwgMSk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQudG9nZ2xlQ2xhc3MoJ2luYWN0aXZlJywgIXJlc3VsdCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgb2JqZWN0XG4gICAgICovXG4gICAgaW5pdERlbGV0ZUJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhfdGhpcy5zZWxlY3RvcnMuZGVsZXRlKTtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLmRlbGV0ZS5qb2luKCcsJyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdTdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgICAgIHZhciBpZCA9IF90aGlzLmdldEl0ZW1JZChidG4kKTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWwgPSBfdGhpcy5nZXRJdGVtTW9kZWwoYnRuJCk7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gX3RoaXMuZ2V0SXRlbUNvbnRhaW5lcihidG4kKTtcblxuICAgICAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydkZWxldGUnLCBtb2RlbCwgaWRdLCAxKTtcblxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQuZmFkZU91dCgnZmFzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKiBBZGQgY2hpbGRcbiAgICAgKi9cbiAgICBpbml0QWRkQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIF90aGlzLnNlbGVjdG9ycy5hZGQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpZCA9IF90aGlzLmdldEl0ZW1JZChidG4kKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IF90aGlzLmdldEl0ZW1Db250YWluZXIoYnRuJCk7XG5cbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2NyZWF0ZScsIG1vZGVsLCBfdGhpcy5nZW5lcmF0ZVJhbmRvbUlkU3RyaW5nKCksICdwYXJlbnRfaWQnXSwgaWQpO1xuXG4gICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IGJ0biQuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZmluZCgnc2NyaXB0W2RhdGEtdGVtcGxhdGUtbmFtZT1cImVtcHR5LXRyZWUtZWxlbWVudFwiXScpLmh0bWwoKTtcbiAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5maW5kKCc+dWwnKS5hcHBlbmQoX3RoaXMuY3JlYXRlTmV3RWxlbWVudCh0ZW1wbGF0ZSwgcmVzdWx0KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQWRkIG9iamVjdCB0byB0aGUgdHJlZSByb290XG4gICAgICovXG4gICAgaW5pdEFkZFRvUm9vdEJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuYWRkUm9vdCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gYnRuJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKTtcbiAgICAgICAgICAgIHZhciBpZCA9IHBhcnNlSW50KGl0ZW1Db250YWluZXIkLmRhdGEoJ3RyZWUtcm9vdCcpKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IGl0ZW1Db250YWluZXIkLmRhdGEoJ21vZGVsJyk7XG5cbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2NyZWF0ZScsIG1vZGVsLCBfdGhpcy5nZW5lcmF0ZVJhbmRvbUlkU3RyaW5nKCksICdwYXJlbnRfaWQnXSwgaWQpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhbJ2NyZWF0ZScsIG1vZGVsLCBfdGhpcy5nZW5lcmF0ZVJhbmRvbUlkU3RyaW5nKCksICdwYXJlbnRfaWQnXSwgaWQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocGF5bG9hZCk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gYnRuJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5maW5kKCdzY3JpcHRbZGF0YS10ZW1wbGF0ZS1uYW1lPVwiZW1wdHktdHJlZS1lbGVtZW50XCJdJykuaHRtbCgpO1xuICAgICAgICAgICAgICAgIGl0ZW1Db250YWluZXIkLmZpbmQoJ3VsOmZpcnN0JykuYXBwZW5kKF90aGlzLmNyZWF0ZU5ld0VsZW1lbnQodGVtcGxhdGUsIHJlc3VsdCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXRTb3J0YWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIGZ1bmN0aW9uIGluaXRTb3J0YWJsZUVuZ2luZShlbCwgaGFuZGxlTmFtZSwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoZWwsIHtcbiAgICAgICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiAyMDAsXG4gICAgICAgICAgICAgICAgZ3JvdXA6IGdyb3VwTmFtZSxcbiAgICAgICAgICAgICAgICBoYW5kbGU6IGhhbmRsZU5hbWUsXG4gICAgICAgICAgICAgICAgb25BZGQ6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKC8qKkV2ZW50Ki9ldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25UcmVlU29ydChldnQsIHNvcnRhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSkge1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gJChldnQudGFyZ2V0KS5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCdtb2RlbCcpO1xuICAgICAgICAgICAgdmFyIHBhcmVudElkID0gJChldnQudGFyZ2V0KS5kYXRhKCdpZCcpO1xuICAgICAgICAgICAgdmFyIG9yZGVyQXJyYXkgPSBzb3J0YWJsZS50b0FycmF5KCkuZmlsdGVyKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbCA+PSAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gXy5leHRlbmQoe3NhdmU6IHt9fSwgX3RoaXMuYXBwLmdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF0gPSB7fTsgLy8gb2JqZWN0LCBub3QgYW4gYXJyYXkuIE90aGVyd2lzZSBpdCB3aWxsIGNyZWF0ZSAwLi5pZCBlbXB0eSBlbGVtZW50c1xuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcmRlckFycmF5KSB7XG4gICAgICAgICAgICAgICAgaWYgKG9yZGVyQXJyYXkuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF5bG9hZFsnc2F2ZSddW21vZGVsXVtvcmRlckFycmF5W2ldXSA9IHsnc2hvd19vcmRlcic6IHBhcnNlSW50KGkpICsgMSwgJ3BhcmVudF9pZCc6IHBhcmVudElkfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUcmVlc1xuICAgICAgICAkKCcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQnKS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgcGxhaW4gPSAkKHRoaXMpLmRhdGEoJ3BsYWluJykgPT09IDE7XG4gICAgICAgICAgICB2YXIgdHJlZU5hbWUgPSAndHJlZV8nICsgaTtcbiAgICAgICAgICAgICQodGhpcykuZmluZCgocGxhaW4gPyAnPicgOiAnJykgKyAndWwnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpbml0U29ydGFibGVFbmdpbmUoJCh0aGlzKVswXSwgJy5pZCcsIHRyZWVOYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMaXN0c1xuICAgICAgICAkKCcuY21zLW1vZHVsZS1saXN0LWNvbnRlbnRbZGF0YS1zb3J0YWJsZT1cInRydWVcIl0gdGJvZHknKS5lYWNoKGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICB2YXIgbGlzdE5hbWUgPSAnbGlzdF8nICsgaTtcbiAgICAgICAgICAgIGluaXRTb3J0YWJsZUVuZ2luZSgkKHRoaXMpWzBdLCAnLmNvbHVtbi1pZCcsIGxpc3ROYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCRcbiAgICAgKiBAcmV0dXJucyB7KnxIVE1MRWxlbWVudHxudWxsfVxuICAgICAqL1xuICAgIGdldEl0ZW1Db250YWluZXI6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgcmV0dXJuIGVsJC5jbG9zZXN0KCdbZGF0YS1pZF0nKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBnZXRJdGVtSWQ6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SXRlbUNvbnRhaW5lcihlbCQpLmRhdGEoJ2lkJyk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZWwkXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZ2V0SXRlbU1vZGVsOiBmdW5jdGlvbiAoZWwkKSB7XG4gICAgICAgIHJldHVybiBlbCQuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgnbW9kZWwnKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2VuZXJhdGVSYW5kb21JZFN0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJyVDUkVBVEVfJyArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA4KSArICclJztcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZW1wbGF0ZVxuICAgICAqIEBwYXJhbSByZXN1bHRcbiAgICAgKiBAcmV0dXJucyB7KnxqUXVlcnl9XG4gICAgICovXG4gICAgY3JlYXRlTmV3RWxlbWVudDogZnVuY3Rpb24gKHRlbXBsYXRlLCByZXN1bHQpIHtcbiAgICAgICAgdmFyIG5ld0l0ZW0kID0gJCh0ZW1wbGF0ZS5yZXBsYWNlKG5ldyBSZWdFeHAoJyVDUkVBVEVfJScsICdnJyksIHJlc3VsdCkpLmF0dHIoJ2RhdGEtaWQnLCByZXN1bHQpO1xuICAgICAgICBuZXdJdGVtJC5maW5kKCcuaWQnKS50ZXh0KHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXdJdGVtJDtcbiAgICB9XG59OyIsImZ1bmN0aW9uIFVJKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5VSS5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIHVzZXJNZW51OiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmluaXRVc2VyTWVudSgpO1xuICAgICAgICB0aGlzLmluaXRIcmVmQnV0dG9ucygpO1xuICAgICAgICB0aGlzLmluaXRTdGFydHVwTm90aWZpY2F0aW9ucygpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdHb29nbGVNYXAnKS5pbml0TWFwcygpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdMZWZ0TWVudScpLmluaXRNYWluTWVudSgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdMaXN0JykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdGb3JtJykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdEcm9wem9uZU1hbmFnZXInKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ1VwbG9hZGFibGVzTGlzdCcpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVmlkZW9zTGlzdCcpLmluaXQoKTtcbiAgICB9LFxuXG4gICAgaW5pdFN0YXJ0dXBOb3RpZmljYXRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICgkKCcuY21zLW1vZHVsZS1mb3JtLXBhZ2UnKS5kYXRhKCdqdXN0LWNyZWF0ZWQnKSkge1xuICAgICAgICAgICAgJC5ncm93bC5ub3RpY2Uoe3RpdGxlOiAnJywgbWVzc2FnZTogXCLQntCx0YrQtdC60YIg0YHQvtC30LTQsNC9XCJ9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0VXNlck1lbnU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy51c2VyLWljb24nKSkge1xuICAgICAgICAgICAgdGhpcy51c2VyTWVudSA9IG5ldyBEcm9wKHtcbiAgICAgICAgICAgICAgICBvcGVuT246ICdjbGljaycsXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdib3R0b20gcmlnaHQnLFxuICAgICAgICAgICAgICAgIHRhcmdldDogZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXItaWNvbicpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICQoJy51c2VyLWRyb3Bkb3duLWNvbnRhaW5lcicpLmh0bWwoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdEhyZWZCdXR0b25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdidXR0b25baHJlZl0nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gJCh0aGlzKS5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB0b2dnbGVTcGlubmVyOiBmdW5jdGlvbiAoc2hvdykge1xuICAgICAgICAkKCcjc3Bpbm5lcicpLnRvZ2dsZUNsYXNzKCdzaG93Jywgc2hvdyk7XG4gICAgfSxcblxuICAgIHRvZ2dsZUZvcm1CdXR0b25zOiBmdW5jdGlvbiAoZW5hYmxlKSB7XG4gICAgICAgICQoJy5mb3JtLWJ1dHRvbnMgYnV0dG9uJykucHJvcCgnZGlzYWJsZWQnLCAhZW5hYmxlKTtcbiAgICB9XG5cbn0iLCJmdW5jdGlvbiBVcGxvYWRhYmxlc0xpc3QoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblVwbG9hZGFibGVzTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIFsnaW1hZ2UnLCAnZmlsZSddLmZvckVhY2goZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgICAgICBfdGhpcy5pbml0RGVsZXRlQnV0dG9uKG1vZGVsKTtcblxuICAgICAgICAgICAgJCgnLicgKyBtb2RlbCArICdzLWxpc3QnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwgPT0gJ2ltYWdlJykge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5pbml0RmFuY3lib3goJCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLmluaXRTb3J0YWJsZSgkKHRoaXMpWzBdLCBtb2RlbClcblxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBpbml0RGVsZXRlQnV0dG9uOiBmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy4nICsgbW9kZWwgKyAncy1saXN0IC4nICsgbW9kZWwgKyAnIC5kZWxldGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlybSgnU3VyZT8nKSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50JCA9ICQodGhpcykuY2xvc2VzdCgnLicgKyBtb2RlbCk7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gZWxlbWVudCQuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydkZWxldGUnLCBtb2RlbCwgaWRdLCAxKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpLmRvbmUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50JC5mYWRlT3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRTb3J0YWJsZTogZnVuY3Rpb24gKGVsLCBtb2RlbCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgc29ydGFibGUgPSBTb3J0YWJsZS5jcmVhdGUoZWwsIHtcbiAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgaGFuZGxlOiBtb2RlbCA9PSAnZmlsZScgPyBcIi5pY29uXCIgOiBudWxsLFxuICAgICAgICAgICAgc2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JkZXJBcnJheSA9IHNvcnRhYmxlLnRvQXJyYXkoKTtcbiAgICAgICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydzYXZlJywgbW9kZWxdLCB7fSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBvcmRlckFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcmRlckFycmF5Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bbW9kZWxdW29yZGVyQXJyYXlbaV1dID0geydzaG93X29yZGVyJzogcGFyc2VJbnQoaSkgKyAxfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0RmFuY3lib3g6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgZWwkLmZpbmQoJy5pbWFnZSA+IGEnKS5mYW5jeWJveCh7XG4gICAgICAgICAgICBwYWRkaW5nOiAxLFxuICAgICAgICAgICAgb3BlbkVmZmVjdDogJ2VsYXN0aWMnLFxuICAgICAgICAgICAgaGVscGVyczoge1xuICAgICAgICAgICAgICAgIG92ZXJsYXk6IHtcbiAgICAgICAgICAgICAgICAgICAgbG9ja2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgY3NzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYmFja2dyb3VuZCc6ICdyZ2JhKDAsMCwwLDAuNSknXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG59OyIsImZ1bmN0aW9uIFZpZGVvc0xpc3QoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblZpZGVvc0xpc3QucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB2YXIgdGVtcGxhdGVJbWFnZSA9IHR3aWcoe1xuICAgICAgICAgICAgZGF0YTogJCgnI2ltYWdlLXByZXZpZXctdGVtcGxhdGUnKS5odG1sKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jbXMtYnV0dG9uW2RhdGEtYWRkLXZpZGVvXScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZmFuY3lib3gub3Blbih0d2lnKHtkYXRhOiAkKCcjaW5zZXJ0LXZpZGVvLXRlbXBsYXRlJykuaHRtbCgpfSkucmVuZGVyKHtcbiAgICAgICAgICAgICAgICBpbnB1dE5hbWU6ICQodGhpcykuZGF0YSgnaW5wdXQtbmFtZScpXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmluc2VydC12aWRlby1kaWFsb2cgYnV0dG9uJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGRpYWxvZyQgPSAkKHRoaXMpLmNsb3Nlc3QoJy5pbnNlcnQtdmlkZW8tZGlhbG9nJyk7XG4gICAgICAgICAgICB2YXIgdGV4dGFyZWEkID0gZGlhbG9nJC5maW5kKCd0ZXh0YXJlYScpO1xuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKCk7XG4gICAgICAgICAgICBwYXlsb2FkW3RleHRhcmVhJC5hdHRyKCduYW1lJyldID0gdGV4dGFyZWEkLnZhbCgpO1xuICAgICAgICAgICAgcGF5bG9hZFsnbXVsdGlwbGUnXSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRpYWxvZyQuYWRkQ2xhc3MoJ3Byb2Nlc3NpbmcnKTtcbiAgICAgICAgICAgIHRleHRhcmVhJC5hdHRyKCdkaXNhYmxlZCcsIHRydWUpLmNzcygnYmFja2dyb3VuZCcsICcjZWVlJyk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnV0dG9uID0gJCgnLmNtcy1idXR0b25bZGF0YS1hZGQtdmlkZW9dW2RhdGEtaW5wdXQtbmFtZT1cIicgKyB0ZXh0YXJlYSQuYXR0cignbmFtZScpICsgJ1wiXScpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFidXR0b24ucHJldkFsbCgnLmltYWdlcy1saXN0OmZpcnN0JykuZmluZCgnLmltYWdlW2RhdGEtaWQ9JyArIHJlc3BvbnNlW2ldLmltYWdlLmlkICsgJ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5wcmV2QWxsKCcuaW1hZ2VzLWxpc3Q6Zmlyc3QnKS5hcHBlbmQodGVtcGxhdGVJbWFnZS5yZW5kZXIocmVzcG9uc2VbaV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VwbG9hZGFibGVzTGlzdCcpLmluaXRGYW5jeWJveChidXR0b24ucHJldkFsbCgnLmltYWdlcy1saXN0OmZpcnN0JykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICQuZmFuY3lib3guY2xvc2UoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxufTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgeHB1bmRlbCBvbiAwNC4wNC4xNi5cbiAqL1xuJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24gKCkge1xuICAgIGlmICgkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5sZW5ndGgpIHtcbiAgICAgICAgJCgnW2RhdGEtcm93LWZvci1maWVsZD1cInJvbGUubmFtZVwiXSBzZWxlY3QnKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgPT0gMSkge1xuICAgICAgICAgICAgICAgICQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLmhpZGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJCgndHJbZGF0YS1yb3ctZm9yLWZpZWxkPVwiYWNsXCJdJykuc2hvdygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS50cmlnZ2VyKCdjaGFuZ2UnKTtcbiAgICB9XG59KTsiLCIvKipcbiAqIENyZWF0ZWQgYnkgeHB1bmRlbCBvbiAxNy4wNi4xNi5cbiAqL1xuZnVuY3Rpb24gZ2V0RGVmYXVsdFRpbnlNY2VPcHRpb25zKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnRfY3NzOiAnL2Fzc2V0cy9mYWNlcGFsbS9jc3MvY29udGVudC5jc3MnLFxuICAgICAgICBsYW5ndWFnZTogJ3J1JyxcbiAgICAgICAgbWVudWJhcjogZmFsc2UsXG4gICAgICAgIHN0YXR1c2JhcjogZmFsc2UsXG4gICAgICAgIHJlbGF0aXZlX3VybHMgOiBmYWxzZSxcbiAgICAgICAgc3R5bGVfZm9ybWF0czogW1xuICAgICAgICAgICAge3RpdGxlOiAn0J7QsdGL0YfQvdGL0Lkg0YLQtdC60YHRgicsIGJsb2NrOiAncCd9LFxuICAgICAgICAgICAge3RpdGxlOiAn0JfQsNCz0L7Qu9C+0LLQvtC6JywgYmxvY2s6ICdoMid9LFxuICAgICAgICAgICAge3RpdGxlOiAn0J/QvtC00LfQsNCz0L7Qu9C+0LLQvtC6JywgYmxvY2s6ICdoMyd9LFxuICAgICAgICAgICAge3RpdGxlOiAn0JLRgNC10LfQutCwJywgYmxvY2s6ICdibG9ja3F1b3RlJ30sXG4gICAgICAgICAgICAvLyB7IHRpdGxlOiAnVGFibGUgcm93IDEnLCBzZWxlY3RvcjogJ3RyJywgY2xhc3NlczogJ3RhYmxlcm93MScgfVxuICAgICAgICBdLFxuICAgICAgICByZW1vdmVmb3JtYXQ6IFtcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJyonLCByZW1vdmUgOiAnYWxsJywgc3BsaXQgOiB0cnVlLCBleHBhbmQgOiBmYWxzZSwgYmxvY2tfZXhwYW5kOiB0cnVlLCBkZWVwIDogdHJ1ZX0sXG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gZXh0ZW5kZWRfdmFsaWRfZWxlbWVudHM6ICdpbWdbY2xhc3M9bXljbGFzc3whc3JjfGJvcmRlcjowfGFsdHx0aXRsZXx3aWR0aHxoZWlnaHR8c3R5bGVdJyxcbiAgICAgICAgLy8gaW52YWxpZF9lbGVtZW50czogJ3N0cm9uZyxiLGVtLGknLFxuXG4gICAgICAgIHBsdWdpbnM6IFsnZml4ZWR0b29sYmFyJywgJ2F1dG9yZXNpemUnLCAnY29kZW1pcnJvcicsICdsaW5rJywgJ2F1dG9saW5rJywgJ21lZGlhJywgJ25vbmVkaXRhYmxlJywgJ3Bhc3RlJywgJ3RhYmxlJywgJ3Zpc3VhbGJsb2NrcycsICdwYXN0ZSddLFxuICAgICAgICB0b29sYmFyOiAnc3R5bGVzZWxlY3QgfCBib2xkIGl0YWxpYyB8IGFsaWdubGVmdCBhbGlnbmNlbnRlciBhbGlnbnJpZ2h0IHwgYnVsbGlzdCBudW1saXN0IG91dGRlbnQgaW5kZW50IHwgbGluayBpbWFnZSB0YWJsZSBtZWRpYSB8IHZpc3VhbGJsb2NrcyBjb2RlIHJlbW92ZWZvcm1hdCB8IGZwOmltYWdlIGZwOmdhbGxlcnknLFxuXG4gICAgICAgIC8vIHBhc3RlX2FzX3RleHQ6IHRydWUsXG5cbiAgICAgICAgbWVkaWFfcG9zdGVyOiBmYWxzZSxcbiAgICAgICAgbWVkaWFfZGltZW5zaW9uczogZmFsc2UsXG5cbiAgICAgICAgdGFibGVfYXBwZWFyYW5jZV9vcHRpb25zOiBmYWxzZSxcbiAgICAgICAgdGFibGVfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfY2VsbF9hZHZ0YWI6IGZhbHNlLFxuICAgICAgICB0YWJsZV9yb3dfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfZGVmYXVsdF9hdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2RlZmF1bHQtdGFibGUnXG4gICAgICAgIH0sXG4gICAgICAgIHRhYmxlX2NsYXNzX2xpc3Q6IFtcbiAgICAgICAgICAgIHt0aXRsZTogJ0RlZmF1bHQnLCB2YWx1ZTogJ2RlZmF1bHQtdGFibGUnfSxcbiAgICAgICAgXSxcblxuICAgICAgICBjb2RlbWlycm9yOiB7XG4gICAgICAgICAgICBpbmRlbnRPbkluaXQ6IHRydWUsXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICBzdHlsZUFjdGl2ZUxpbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRoZW1lOiAnbW9ub2thaSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjc3NGaWxlczogW1xuICAgICAgICAgICAgICAgICd0aGVtZS9tb25va2FpLmNzcydcbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIH07XG59IiwiZnVuY3Rpb24gR2FsbGVyeU1vZHVsZShhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuR2FsbGVyeU1vZHVsZS5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuICAgIGVkaXRvcjogbnVsbCxcbiAgICBCVVRUT05fR0FMTEVSWTogJ0JVVFRPTl9HQUxMRVJZJyxcbiAgICBCVVRUT05fSU1BR0U6ICdCVVRUT05fSU1BR0UnLFxuICAgIHdpbmRvd1BhcmFtczoge1xuICAgICAgICBCVVRUT05fR0FMTEVSWToge1xuICAgICAgICAgICAgdGl0bGU6ICfQk9Cw0LvQtdGA0LXRjycsXG4gICAgICAgICAgICB3aWR0aDogNjMwLFxuICAgICAgICAgICAgaGVpZ2h0OiA0MDBcbiAgICAgICAgfSxcbiAgICAgICAgQlVUVE9OX0lNQUdFOiB7XG4gICAgICAgICAgICB0aXRsZTogJ9Ca0LDRgNGC0LjQvdC60LAnLFxuICAgICAgICAgICAgd2lkdGg6IDQzMCxcbiAgICAgICAgICAgIGhlaWdodDogMjAwXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICB0aW55bWNlLlBsdWdpbk1hbmFnZXIuYWRkKCdnYWxsZXJ5JywgZnVuY3Rpb24gKGVkaXRvciwgdXJsKSB7XG4gICAgICAgICAgICAvLyBBZGQgYSBidXR0b24gdGhhdCBvcGVucyBhIHdpbmRvd1xuICAgICAgICAgICAgZWRpdG9yLmFkZEJ1dHRvbignZnA6Z2FsbGVyeScsIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgIGljb246ICdnYWxsZXJ5LWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgdGl0bGU6ICfQk9Cw0LvQtdGA0LXRjycsXG4gICAgICAgICAgICAgICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yOiAnLnR5cGUtaW1hZ2UnLFxuICAgICAgICAgICAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub25CdXR0b25DbGljayhlZGl0b3IsIF90aGlzLkJVVFRPTl9HQUxMRVJZKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZWRpdG9yLmFkZEJ1dHRvbignZnA6aW1hZ2UnLCB7XG4gICAgICAgICAgICAgICAgdGV4dDogbnVsbCxcbiAgICAgICAgICAgICAgICBpY29uOiAnaW1hZ2UtYnV0dG9uJyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ9Ca0LDRgNGC0LjQvdC60LAnLFxuICAgICAgICAgICAgICAgIGRpc2FibGVkU3RhdGVTZWxlY3RvcjogJy50eXBlLWdhbGxlcnknLFxuICAgICAgICAgICAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub25CdXR0b25DbGljayhlZGl0b3IsIF90aGlzLkJVVFRPTl9JTUFHRSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vZml4IGJ1ZyB3aXRoIHBhZ2UganVtcGluZyB3aGVuIGNsaWNraW5nIGZpcnN0IHRpbWUgdG8gaW1hZ2UvZ2FsbGVyeVxuICAgICAgICAgICAgZWRpdG9yLm9uKCdpbml0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGVkaXRvci5zZWxlY3Rpb24uc2VsZWN0KGVkaXRvci5nZXRCb2R5KCksIHRydWUpOyAvLyBlZCBpcyB0aGUgZWRpdG9yIGluc3RhbmNlXG4gICAgICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5jb2xsYXBzZShmYWxzZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgb25CdXR0b25DbGljazogZnVuY3Rpb24gKGVkaXRvciwgdHlwZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgYmFzZVVybCA9ICQoJ2JvZHknKS5kYXRhKCdiYXNlLXVybCcpO1xuXG4gICAgICAgIHZhciB3aW4gPSBlZGl0b3Iud2luZG93TWFuYWdlci5vcGVuKHtcbiAgICAgICAgICAgIHRpdGxlOiBfdGhpcy53aW5kb3dQYXJhbXNbdHlwZV0udGl0bGUsXG4gICAgICAgICAgICB3aWR0aDogX3RoaXMud2luZG93UGFyYW1zW3R5cGVdLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBfdGhpcy53aW5kb3dQYXJhbXNbdHlwZV0uaGVpZ2h0LFxuICAgICAgICAgICAgYnV0dG9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ09rJywgc3VidHlwZTogJ3ByaW1hcnknLCBvbmNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkb2MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubWNlLWNvbnRhaW5lci1ib2R5PmlmcmFtZScpWzBdO1xuICAgICAgICAgICAgICAgICAgICBkb2MuY29udGVudFdpbmRvdy5zdWJtaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgd2luLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge3RleHQ6ICdDYW5jZWwnLCBvbmNsaWNrOiAnY2xvc2UnfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHVybDogJy9hc3NldHMvZmFjZXBhbG0vaW5jbHVkZS90ZW1wbGF0ZXMvZ2FsbGVyeURpYWxvZy5odG1sP190b2tlbj0nICsgX3RoaXMuYXBwLmdldENzcmZUb2tlblBhcmFtZXRlcigpLl90b2tlbiArICcmYmFzZVVybD0nICsgYmFzZVVybCArICcmdHlwZT0nICsgdHlwZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRXaW5kb3c6IGZ1bmN0aW9uIChlZGl0b3IpIHtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG5cbiAgICAgICAgJCgnLm1jZS1nYWxsZXJ5LXBsdWdpbi1ib2R5JykuYWRkQ2xhc3MoKGdldFF1ZXJ5UGFyYW1ldGVycygpLnR5cGUgPT0gJ0JVVFRPTl9HQUxMRVJZJyA/ICd0eXBlLWdhbGxlcnknIDogJ3R5cGUtaW1hZ2UnKSk7XG5cbiAgICAgICAgJCgnLmRyb3B6b25lJykuZGF0YSgnbXVsdGlwbGUnLCBnZXRRdWVyeVBhcmFtZXRlcnMoKS50eXBlID09PSAnQlVUVE9OX0dBTExFUlknID8gMSA6IDApO1xuXG4gICAgICAgIHZhciBjdXJyZW50Tm9kZSQgPSAkKHRoaXMuZWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpO1xuICAgICAgICBpZiAoY3VycmVudE5vZGUkLmlzKCcuZ2FsbGVyeVBsYWNlaG9sZGVyW2RhdGEtaW1hZ2VzXScpKSB7XG4gICAgICAgICAgICAkKCcuaW1hZ2VzLWxpc3QnKS5hcHBlbmQoJChjdXJyZW50Tm9kZSQuaHRtbCgpKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ1VwbG9hZGFibGVzTGlzdCcpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnRHJvcHpvbmVNYW5hZ2VyJykuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgICAgLy8gU3VibWl0IEhUTUwgdG8gVGlueU1DRTpcblxuICAgICAgICB2YXIgaW1hZ2VzSWRzID0gW107XG4gICAgICAgIHZhciBpbWFnZXNIdG1sID0gJyc7XG4gICAgICAgICQoJy5pbWFnZXMtbGlzdCAuaW1hZ2VbZGF0YS1pZF0nKS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaW1hZ2VzSWRzLnB1c2goJCh0aGlzKS5kYXRhKFwiaWRcIikpO1xuICAgICAgICAgICAgaW1hZ2VzSHRtbCArPSAkKHRoaXMpWzBdLm91dGVySFRNTC5yZXBsYWNlKC8oXFwuXFwuXFwvKSsvZywgJy8nKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIHR5cGVDbGFzc05hbWUgPSAoZ2V0UXVlcnlQYXJhbWV0ZXJzKCkudHlwZSA9PSAnQlVUVE9OX0dBTExFUlknID8gJ3R5cGUtZ2FsbGVyeScgOiAndHlwZS1pbWFnZScpO1xuXG4gICAgICAgIHRoaXMuZWRpdG9yLmluc2VydENvbnRlbnQoJzxkaXYgY2xhc3M9XCJtY2VOb25FZGl0YWJsZSBnYWxsZXJ5UGxhY2Vob2xkZXIgJyArIHR5cGVDbGFzc05hbWUgKyAnXCIgZGF0YS1pbWFnZXM9XCInICsgaW1hZ2VzSWRzICsgJ1wiPicgKyBpbWFnZXNIdG1sICsgJzwvZGl2PicpO1xuICAgIH1cblxufTtcbiIsImZ1bmN0aW9uIFd5c2l3eWdNYW5hZ2VyKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuc2V0T3B0aW9ucygpOyAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gICAgdGhpcy5vcHRpb25zW3RoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3Rvcl0gPSBnZXREZWZhdWx0VGlueU1jZU9wdGlvbnMoKTtcbn1cblxuV3lzaXd5Z01hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcbiAgICBkZWZhdWx0V3lzaXd5Z1NlbGVjdG9yOiAndGV4dGFyZWFbZGF0YS13eXNpd3lnXScsXG4gICAgb3B0aW9uczoge30sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgc2V0T3B0aW9uczogZnVuY3Rpb24gKG9wdGlvbnMsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXSA9ICQuZXh0ZW5kKHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0sIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjc3NcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICBhZGRDb250ZW50Q3NzOiBmdW5jdGlvbiAoY3NzLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLmNvbnRlbnRfY3NzID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLmNvbnRlbnRfY3NzID0gW3RoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3NdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0uY29udGVudF9jc3MgPSB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLmNvbnRlbnRfY3NzLmNvbmNhdChjc3MpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHBsdWdpbk5hbWVcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICBhZGRQbHVnaW46IGZ1bmN0aW9uIChwbHVnaW5OYW1lLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5wbHVnaW5zID0gdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5wbHVnaW5zLmNvbmNhdChwbHVnaW5OYW1lKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnV0dG9uc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIGFwcGVuZFRvb2xiYXI6IGZ1bmN0aW9uIChidXR0b25zLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYgKCFidXR0b25zLnN0YXJ0c1dpdGgoJyAnKSkge1xuICAgICAgICAgICAgYnV0dG9ucyA9ICcgJyArIGJ1dHRvbnM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS50b29sYmFyICs9IGJ1dHRvbnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlbW92ZVxuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIHJlbW92ZUZyb21Ub29sYmFyOiBmdW5jdGlvbiAocmVtb3ZlLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcblxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIgPSB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIucmVwbGFjZShyZW1vdmUsICcnKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnV0dG9uc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIHByZXBlbmRUb29sYmFyOiBmdW5jdGlvbiAoYnV0dG9ucywgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIGlmICghYnV0dG9ucy5lbmRzV2l0aCgnICcpKSB7XG4gICAgICAgICAgICBidXR0b25zID0gYnV0dG9ucyArICcgJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLnRvb2xiYXIgPSBidXR0b25zICsgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS50b29sYmFyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtXeXNpd3lnTWFuYWdlci5vcHRpb25zfHt9fVxuICAgICAqL1xuICAgIGdldE9wdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXRBbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVkaXRvclByb21pc2VzID0gW107XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgX3RoaXMuaW5pdEN1c3RvbU1vZHVsZXMoKTtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLmdldE9wdGlvbnMoKTtcblxuICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYmVmb3JlQWxsV3lzaXd5Z0luaXQnKTtcbiAgICAgICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoc2VsZWN0b3IpKSB7XG5cbiAgICAgICAgICAgICAgICAkKHNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGQgPSAkLkRlZmVycmVkKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uc1tzZWxlY3Rvcl0uc2V0dXAgPSBmdW5jdGlvbiAoZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3RvZG86INGD0LHRgNCw0YLRjCDQs9C70L7QsdCw0LvRjNC90YvQuSB0aW55bWNlLCDQuCDQtNC10YDQs9Cw0YLRjCDQutC+0L3QutGA0LXRgtC90YvQuSDRgNC10LTQsNC60YLQvtGAXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGlueW1jZS50cmlnZ2VyU2F2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub24oJ2luaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VzdG9tVG9vbGJhciA9ICQodGhpcykuZGF0YSgnd3lzaXd5Z1Rvb2xiYXInKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbVRvb2xiYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykudGlueW1jZSgkLmV4dGVuZChvcHRpb25zW3NlbGVjdG9yXSwgeyd0b29sYmFyJzogY3VzdG9tVG9vbGJhcn0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykudGlueW1jZShvcHRpb25zW3NlbGVjdG9yXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlZGl0b3JQcm9taXNlcy5wdXNoKGQucHJvbWlzZSgpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICQud2hlbi5hcHBseSgkLCBlZGl0b3JQcm9taXNlcykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYWZ0ZXJBbGxXeXNpd3lnSW5pdCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdEN1c3RvbU1vZHVsZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnR2FsbGVyeU1vZHVsZScpLnJlZ2lzdGVyKCk7XG4gICAgICAgIHRoaXMuYWRkUGx1Z2luKFsnZ2FsbGVyeSddKTtcbiAgICB9XG59O1xuIl19
