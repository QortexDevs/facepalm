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

        // prevent drop external files into whole page
        window.addEventListener("dragover", function (e) {
            e = e || event;
            e.preventDefault();
        }, false);
        window.addEventListener("drop", function (e) {
            e = e || event;
            e.preventDefault();
        }, false);

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
        this.initComboboxes();
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
        var _this = this;
        $.datetimepicker.setLocale('ru');
        $('.datepicker').each(function () {
            _this.initDatepickerControl($(this));
        });


        $('.datepicker + .clear-date').on('click', function () {
            $(this).prev().val('');
        });
    },

    initDatepickerControl: function (el) {
        el.datetimepicker({
            i18n: {
                ru: {
                    months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
                    dayOfWeek: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
                }
            },
            yearStart: 1900,
            yearEnd: (new Date()).getFullYear() + 10,
            timepicker: el.is('.datetime'),
            format: 'd.m.Y' + (el.is('.datetime') ? " H:i" : ""),
            mask: true,
            lazyInit: true,
        });
    },

    initTabs: function () {
        $('.tabs-container .tab').on('click', function () {
            var container$ = $(this).closest('.tabs-container');
            $(this).addClass('active').siblings().removeClass('active');
            $(this).parent().next().children('.tab-content:eq(' + $(this).prevAll().length + ')').addClass('active').siblings().removeClass('active')
        });
    },

    initComboboxes: function () {
        $("select.combobox").select2({
            tags: true,
            selectOnBlur: true,
        })

        function formatState(state) {
            if (!state.id) {
                return state.text;
            }
            var texts = state.text.split('%|').map(function (el) {
                return el.trim()
            });
            if (texts[1]) {
                var $state = $(
                    '<span>' + texts[0] + ' <span style="font-size: 12px;color: #999;">' + texts[1] + '</span></span>'
                );
                return $state;
            } else {
                return state.text;

            }
        };

        $('select[data-search=true]').select2({
            dropdownCssClass: 'bigdrop',
            templateResult: formatState,
            templateSelection: formatState
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
        $('.list-language-selector').on('change', function () {
            Cookies.set('lang_' + $('body').data('navHash'), $(this).val()/*, { expires:1 }*/);
            document.location.reload(true);
        });
    },

    /**
     *
     */
    initButtons: function () {
        this.initStatusButton();
        this.initDeleteButton();
        this.initAddButton();
        this.initAddToRootButton();
        this.initFilter();
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
                _facepalm.service('Form').initComboboxes();
                _facepalm.service('Form').initDatepicker();
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
                _facepalm.service('Form').initComboboxes();
                _facepalm.service('Form').initDatepicker();
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
            if ($('.list-language-selector').length) {
                payload['listLanguage'] = $('.list-language-selector').val();
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

    initFilter: function () {
        var timer = null;
        var prevFilter = '';
        $('.list-filter input:text').on('change input keypress blur', function (e) {
            var strSearch = $('.list-filter input:text').val();
            if (e.keyCode === 13) return false;
            if (prevFilter !== strSearch) {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function () {
                    prevFilter = strSearch;
                    if (strSearch.length !== 1) {
                        $.get('./?filter=' + strSearch).done(function (response) {
                            $('.cms-module-list-content').replaceWith(response);
                        });
                    }
                }, 500);
            }
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
            console.log($(this).val());
            if ($(this).val() == 1 || !$(this).val()) {
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
            height: 250
        }
    },

    register: function () {
        var _this = this;
        console.log('register');

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
        console.log('onButtonClick');

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
        console.log('init window');

        $('.mce-gallery-plugin-body').addClass((getQueryParameters().type == 'BUTTON_GALLERY' ? 'type-gallery' : 'type-image'));

        $('.dropzone').data('multiple', getQueryParameters().type === 'BUTTON_GALLERY' ? 1 : 0);

        var currentNode$ = $(this.editor.selection.getNode());
        if (currentNode$.is('.galleryPlaceholder[data-images]')) {
            $('.images-list').append($(currentNode$.html().replace(/<textarea (.*?)>/, '<textarea>')))
        }
        $('.images-list').toggleClass('with-comments', editor.settings.fp_images_with_comments == true);

        this.app.service('UploadablesList').init();
        this.app.service('DropzoneManager').init();
    },

    submit: function () {
        // "use strict";
        console.log('submit');

        // Submit HTML to TinyMCE:

        var imagesIds = [];
        var comments = {};
        var imagesHtml = '';
        $('.images-list .image[data-id]').map(function () {
            imagesIds.push($(this).data("id"));
            var comment = $(this).find('textarea').val() || '';
            if(comment) {
                comments[$(this).data("id")] = comment;
            }
            var str = $(this)[0].outerHTML.replace(/(\.\.\/)+/g, '/').replace(/<textarea(.*)<\/textarea>/g, '<textarea style="height:' + (Math.max(20, 14 * comment.length / 20)) + 'px">' + comment + '</textarea>');
            imagesHtml += str;

        });

        console.log(imagesHtml);

        var typeClassName = (getQueryParameters().type == 'BUTTON_GALLERY' ? 'type-gallery' : 'type-image');

        this.editor.insertContent('<div class="mceNonEditable galleryPlaceholder ' + typeClassName + '" data-images="' + imagesIds + '" data-comments="' + encodeURIComponent(JSON.stringify(comments)) + '">' + imagesHtml + '</div>');
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
                    if ($(this).data('imagesWithComments')) {
                        options[selector] = $.extend(options[selector], {'fp_images_with_comments': true});
                        options[selector] = $.extend(options[selector], {'body_class': "fp_images_with_comments"});
                    }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkF1dGguanMiLCJGYWNlcGFsbUNNUy5qcyIsIlNlcnZpY2VMb2NhdG9yLmpzIiwidXRpbGl0eS5qcyIsIlVJL0Ryb3B6b25lTWFuYWdlci5qcyIsIlVJL0Zvcm0uanMiLCJVSS9Hb29nbGVNYXAuanMiLCJVSS9MZWZ0TWVudS5qcyIsIlVJL0xpc3QuanMiLCJVSS9VSS5qcyIsIlVJL1VwbG9hZGFibGVzTGlzdC5qcyIsIlVJL1ZpZGVvc0xpc3QuanMiLCJleHRlbmRlZC91c2Vycy5qcyIsInd5c2l3eWcvRGVmYXVsdFRpbnlNY2VPcHRpb25zLmpzIiwid3lzaXd5Zy9HYWxsZXJ5TW9kdWxlLmpzIiwid3lzaXd5Zy93eXNpd3lnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYWxsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gQXV0aE1hbmFnZXIoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkF1dGhNYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICQoJy5sb2dpbi1mb3JtIGZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5wb3N0KCQodGhpcykuYXR0cignYWN0aW9uJyksICQodGhpcykuc2VyaWFsaXplKCksICdqc29uJylcbiAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSAnL2Ntcy8nO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2hha2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5lcnJvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIHJlc3BvbnNlLmVycm9ycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmdyb3dsLmVycm9yKHt0aXRsZTogJycsIG1lc3NhZ2U6IHJlc3BvbnNlLmVycm9yc1tpXX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vdG9kbzog0L/QtdGA0LXQtNC10LvQsNGC0Ywg0LLRi9Cy0L7QtCDRgtC10LrRgdGC0LAg0L7RiNC40LHQutC4ISDQm9C+0LrQsNC70LjQt9Cw0YbQuNGPIVxuXG4gICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe3RpdGxlOiAnJywgbWVzc2FnZTogJ9Cd0LXQstC10YDQvdGL0LUg0LvQvtCz0LjQvSDQuNC70Lgg0L/QsNGA0L7Qu9GMJ30pO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zaGFrZSgpO1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKHJlc3BvbnNlLnJlc3BvbnNlSlNPTik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuICQoJy5sb2dpbi1mb3JtIGZvcm0nKS5sZW5ndGggPT0gMDtcbiAgICB9LFxuXG4gICAgc2hha2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCgnLmxvZ2luLWZvcm0nKS5hZGRDbGFzcygnc2hha2UnKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcubG9naW4tZm9ybScpLnJlbW92ZUNsYXNzKCdzaGFrZScpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG59OyIsIl8ubWl4aW4ocy5leHBvcnRzKCkpO1xuRHJvcHpvbmUuYXV0b0Rpc2NvdmVyID0gZmFsc2U7XG5cblxuLyoqXG4gKlxuICogQHJldHVybnMge0ZhY2VwYWxtQ01TfCp9XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRmFjZXBhbG1DTVMoKSB7XG5cbiAgICBpZiAoYXJndW1lbnRzLmNhbGxlZS5fc2luZ2xldG9uSW5zdGFuY2UpIHtcbiAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5jYWxsZWUuX3NpbmdsZXRvbkluc3RhbmNlO1xuICAgIH1cblxuICAgIGFyZ3VtZW50cy5jYWxsZWUuX3NpbmdsZXRvbkluc3RhbmNlID0gdGhpcztcbn1cblxuXG5GYWNlcGFsbUNNUy5wcm90b3R5cGUgPSB7XG4gICAgY3NyZlRva2VuOiAnJyxcbiAgICBiYXNlVXJsOiBudWxsLFxuICAgIHNlcnZpY2VMb2NhdG9yOiBudWxsLFxuICAgIGV2ZW50SGFuZGxlcnM6IHt9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGYWNlcGFsbUNNU31cbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemF0aW9uXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RmFjZXBhbG1DTVN9XG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZpcmUoJ2JlZm9yZUluaXQnKTtcblxuICAgICAgICB0aGlzLnNlcnZpY2VMb2NhdG9yID0gbmV3IFNlcnZpY2VMb2NhdG9yKHRoaXMpO1xuICAgICAgICB0aGlzLmJhc2VVcmwgPSAkKCdib2R5JykuZGF0YSgnYmFzZS11cmwnKTtcblxuICAgICAgICB0aGlzLnNlcnZpY2UoJ1d5c2l3eWdNYW5hZ2VyJyk7IC8vaW5pdCBtYW5hZ2VyXG5cbiAgICAgICAgdGhpcy5maXJlKCdhZnRlckluaXQnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFN0YXJ0IFVJIGFuZCBvdGhlciBzZXJ2aWNlcywgYWZ0ZXIgZG9tIHJlYWR5XG4gICAgICovXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5maXJlKCdiZWZvcmVTdGFydCcpO1xuXG4gICAgICAgICAgICBpZiAoX3RoaXMuc2VydmljZSgnQXV0aE1hbmFnZXInKS5pbml0KCkpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5pbml0U2Vzc2lvbktlZXBBbGl2ZSgpO1xuXG4gICAgICAgICAgICAgICAgX3RoaXMuc2VydmljZSgnVUknKS5pbml0KCk7XG4gICAgICAgICAgICAgICAgX3RoaXMuc2VydmljZSgnV3lzaXd5Z01hbmFnZXInKS5pbml0QWxsKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF90aGlzLmZpcmUoJ2FmdGVyU3RhcnQnKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBzZXJ2aWNlIGZyb20gU2VydmljZSBMb2NhdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2VydmljZU5hbWVcbiAgICAgKiBAcGFyYW0gcGFyYW1cbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBzZXJ2aWNlOiBmdW5jdGlvbiAoc2VydmljZU5hbWUsIHBhcmFtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VMb2NhdG9yLmdldChzZXJ2aWNlTmFtZSwgcGFyYW0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpcmUgZXZlbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudE5hbWVcbiAgICAgKi9cbiAgICBmaXJlOiBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhldmVudE5hbWUpO1xuICAgICAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLm1hcChmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyIHJlZ2lzdHJhdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50TmFtZVxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbiAoZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudE5hbWVdLnB1c2goY2FsbGJhY2spO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQaW5nIHRpbWVyXG4gICAgICovXG4gICAgaW5pdFNlc3Npb25LZWVwQWxpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5nZXQoJy4vJywgeydwaW5nJzogJ3BpbmcnfSk7XG4gICAgICAgIH0sIDEyMDAwMCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEJ1aWxkIHBheWxvYWQgb2JqZWN0IGZvciBhamF4IHJlcXVlc3RzXG4gICAgICogQHBhcmFtIHBhdGhcbiAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgKi9cbiAgICBidWlsZFBheWxvYWQ6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gXy5leHRlbmQoe30uc2V0V2l0aFBhdGgocGF0aCwgdmFsdWUpLCB0aGlzLmdldENzcmZUb2tlblBhcmFtZXRlcigpKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYXlsb2FkXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZG9SZXF1ZXN0OiBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICByZXR1cm4gJC5wb3N0KHRoaXMuYmFzZVVybCArICcvJywgcGF5bG9hZCwgJ2pzb24nKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IENTUkYgdG9rZW4gb2JqZWN0IHtfdG9rZW46J3h4eCd9XG4gICAgICogQHJldHVybnMge3tfdG9rZW46IHN0cmluZ319XG4gICAgICovXG4gICAgZ2V0Q3NyZlRva2VuUGFyYW1ldGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghdGhpcy5jc3JmVG9rZW4pIHtcbiAgICAgICAgICAgIHRoaXMuc2V0Q3NyZlRva2VuKCQoJ2lucHV0OmhpZGRlbltuYW1lPV90b2tlbl0nKS52YWwoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsnX3Rva2VuJzogdGhpcy5jc3JmVG9rZW59O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgQ1NSRiB0b2tlbiB2YWx1ZVxuICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAqL1xuICAgIHNldENzcmZUb2tlbjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY3NyZlRva2VuID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBzZXRCYXNlVXJsOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5iYXNlVXJsID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufTtcblxuIiwiZnVuY3Rpb24gU2VydmljZUxvY2F0b3IoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblNlcnZpY2VMb2NhdG9yLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgc2VydmljZXNNYXA6IHt9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiAoY2xhc3NOYW1lLCBwYXJhbSkge1xuICAgICAgICBpZiAoIXRoaXMuc2VydmljZXNNYXBbY2xhc3NOYW1lXSkge1xuICAgICAgICAgICAgaWYgKHdpbmRvd1tjbGFzc05hbWVdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXJ2aWNlc01hcFtjbGFzc05hbWVdID0gbmV3IHdpbmRvd1tjbGFzc05hbWVdKHRoaXMuYXBwLCBwYXJhbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcItCd0LXQuNC30LLQtdGB0YLQvdGL0Lkg0LrQu9Cw0YHRgTogXCIgKyBjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VzTWFwW2NsYXNzTmFtZV07XG4gICAgfSxcblxufTtcblxuIiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMTQuMTIuMTUuXG4gKi9cblxuLyoqXG4gKiBAbWV0aG9kIHNldFdpdGhQYXRoXG4gKiBTZXRzIHRoZSBuZXN0ZWQgcHJvcGVydHkgb2Ygb2JqZWN0XG4gKi9cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCAnc2V0V2l0aFBhdGgnLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uIChwYXRoLCB2YWx1ZSkgeyAvKiBNYWtlcyBicmVha2Zhc3QsIHNvbHZlcyB3b3JsZCBwZWFjZSwgdGFrZXMgb3V0IHRyYXNoICovXG4gICAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mICBwYXRoID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3BsaXQoJy4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghKHBhdGggaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY3VyID0gdGhpcztcbiAgICAgICAgICAgIHZhciBmaWVsZHMgPSBwYXRoO1xuICAgICAgICAgICAgZmllbGRzID0gZmllbGRzLmZpbHRlcihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlICE9ICd1bmRlZmluZWQnICYmIHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmaWVsZHMubWFwKGZ1bmN0aW9uIChmaWVsZCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjdXJbZmllbGRdID0gY3VyW2ZpZWxkXSB8fCAoaW5kZXggPT0gZmllbGRzLmxlbmd0aCAtIDEgPyAodHlwZW9mIHZhbHVlICE9ICd1bmRlZmluZWQnID8gdmFsdWUgOiB7fSkgOiB7fSk7XG4gICAgICAgICAgICAgICAgY3VyID0gY3VyW2ZpZWxkXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxufSk7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBtc1xuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGRlbGF5KG1zKSB7XG4gICAgdmFyIGQgPSAkLkRlZmVycmVkKCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGQucmVzb2x2ZSgpO1xuICAgIH0sIG1zKTtcbiAgICByZXR1cm4gZC5wcm9taXNlKCk7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBzdHJcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBnZXRRdWVyeVBhcmFtZXRlcnMoc3RyKSB7XG4gICAgcmV0dXJuIChzdHIgfHwgZG9jdW1lbnQubG9jYXRpb24uc2VhcmNoKS5yZXBsYWNlKC8oXlxcPykvLCAnJykuc3BsaXQoXCImXCIpLm1hcChmdW5jdGlvbiAobikge1xuICAgICAgICByZXR1cm4gbiA9IG4uc3BsaXQoXCI9XCIpLCB0aGlzW25bMF1dID0gblsxXSwgdGhpc1xuICAgIH0uYmluZCh7fSkpWzBdO1xufVxuXG4vKipcbiAqXG4gKi9cbmlmICghU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCkge1xuICAgIFN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgICB2YXIgc3ViamVjdFN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBwb3NpdGlvbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHBvc2l0aW9uKSB8fCBNYXRoLmZsb29yKHBvc2l0aW9uKSAhPT0gcG9zaXRpb24gfHwgcG9zaXRpb24gPiBzdWJqZWN0U3RyaW5nLmxlbmd0aCkge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBzdWJqZWN0U3RyaW5nLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBwb3NpdGlvbiAtPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xuICAgICAgICB2YXIgbGFzdEluZGV4ID0gc3ViamVjdFN0cmluZy5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pO1xuICAgICAgICByZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xuICAgIH07XG59XG5cbi8qKlxuICpcbiAqL1xuaWYgKCFTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGgpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU3RyaW5nLnByb3RvdHlwZSwgJ3N0YXJ0c1dpdGgnLCB7XG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiB8fCAwO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGFzdEluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikgPT09IHBvc2l0aW9uO1xuICAgICAgICB9XG4gICAgfSk7XG59IiwiZnVuY3Rpb24gRHJvcHpvbmVNYW5hZ2VyKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5Ecm9wem9uZU1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHRlbXBsYXRlSW1hZ2UgPSB0d2lnKHtcbiAgICAgICAgICAgIGRhdGE6ICQoJyNpbWFnZS1wcmV2aWV3LXRlbXBsYXRlJykuaHRtbCgpXG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGVtcGxhdGVGaWxlID0gdHdpZyh7XG4gICAgICAgICAgICBkYXRhOiAkKCcjZmlsZS1wcmV2aWV3LXRlbXBsYXRlJykuaHRtbCgpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHByZXZlbnQgZHJvcCBleHRlcm5hbCBmaWxlcyBpbnRvIHdob2xlIHBhZ2VcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgZSA9IGUgfHwgZXZlbnQ7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlID0gZSB8fCBldmVudDtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICQoXCIuZHJvcHpvbmVcIikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZHJvcHpvbmUkID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpc011bHRpcGxlID0gZHJvcHpvbmUkLmRhdGEoJ211bHRpcGxlJykgPT0gXCIxXCI7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICQodGhpcykuZHJvcHpvbmUoe1xuICAgICAgICAgICAgICAgICAgICBwYXJhbGxlbFVwbG9hZHM6IDMsXG4gICAgICAgICAgICAgICAgICAgIGFkZFJlbW92ZUxpbmtzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB1cGxvYWRNdWx0aXBsZTogaXNNdWx0aXBsZSxcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlSW1hZ2VUaHVtYm5haWxzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbWF4RmlsZXM6IGlzTXVsdGlwbGUgPyBudWxsIDogMSxcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1OYW1lOiAkKHRoaXMpLmRhdGEoJ2lucHV0LW5hbWUnKSxcbiAgICAgICAgICAgICAgICAgICAgY2xpY2thYmxlOiAkKHRoaXMpLmZpbmQoXCIuZHotbWVzc2FnZVwiKVswXSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0ZWRGaWxlczogZHJvcHpvbmUkLmRhdGEoJ3R5cGUnKSA9PSAnaW1hZ2UnID8gJ2ltYWdlLyonIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBfdGhpcy5hcHAuYmFzZVVybCArIFwiLz9fdG9rZW49XCIgKyBfdGhpcy5hcHAuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkuX3Rva2VuICsgZHJvcHpvbmUkLmRhdGEoJ3BhcmFtZXRlcnMnKSxcblxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZmlsZSwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRmlsZShmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNNdWx0aXBsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lJC5wcmV2KCkuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZHJvcHpvbmUkLmRhdGEoJ3R5cGUnKSA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZHJvcHpvbmUkLnByZXYoKS5maW5kKCcuaW1hZ2VbZGF0YS1pZD0nICsgcmVzcG9uc2VbaV0uaW1hZ2UuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJvcHpvbmUkLnByZXYoKS5hcHBlbmQodGVtcGxhdGVJbWFnZS5yZW5kZXIocmVzcG9uc2VbaV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VwbG9hZGFibGVzTGlzdCcpLmluaXRGYW5jeWJveChkcm9wem9uZSQucHJldigpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZHJvcHpvbmUkLnByZXYoKS5maW5kKCcuZmlsZVtkYXRhLWlkPScgKyByZXNwb25zZVtpXS5maWxlLmlkICsgJ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lJC5wcmV2KCkuYXBwZW5kKHRlbXBsYXRlRmlsZS5yZW5kZXIocmVzcG9uc2VbaV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZmlsZSwgZXJyb3JNZXNzYWdlLCB4aHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRmlsZShmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdG9kbzog0L3QvtGA0LzQsNC70YzQvdC+INC+0LHRgNCw0LHQsNGC0YvQstCw0YLRjCDQuCDQv9C+0LrQsNC30YvQstCw0YLRjCDQvtGI0LjQsdC60LhcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZ3Jvd2wuZXJyb3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAn0J7RiNC40LHQutCwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAn0J3QtSDRg9C00LDQtdGC0YHRjyDQt9Cw0LPRgNGD0LfQuNGC0Ywg0YTQsNC50Lsg0L3QsCDRgdC10YDQstC10YAuINCd0LXQstC10YDQvdGL0Lkg0YTQvtGA0LzQsNGCINC40LvQuCDRgdC70LjRiNC60L7QvCDQsdC+0LvRjNGI0L7QuSDRgNCw0LfQvNC10YAuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogNzAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cblxuICAgIH0sXG5cblxufTsiLCJmdW5jdGlvbiBGb3JtKGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5Gb3JtLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5pdFNhdmUoKTtcbiAgICAgICAgdGhpcy5pbml0RGF0ZXBpY2tlcigpO1xuICAgICAgICB0aGlzLmluaXRUYWJzKCk7XG4gICAgICAgIHRoaXMuaW5pdENvbWJvYm94ZXMoKTtcbiAgICB9LFxuXG4gICAgaW5pdFNhdmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmZvcm0tYnV0dG9ucyBidXR0b24uc2F2ZS1idXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZm9ybURhdGEgPSAkKCcubWFpbi1jbXMtZm9ybScpLnNlcmlhbGl6ZSgpO1xuICAgICAgICAgICAgdmFyIGNyZWF0ZU1vZGUgPSAkKCcuY21zLW1vZHVsZS1mb3JtLXBhZ2UnKS5kYXRhKCdjcmVhdGUtbW9kZScpO1xuICAgICAgICAgICAgdmFyIGJ1dHRvbiQgPSAkKHRoaXMpO1xuXG4gICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVTcGlubmVyKHRydWUpO1xuICAgICAgICAgICAgX3RoaXMuYXBwLnNlcnZpY2UoJ1VJJykudG9nZ2xlRm9ybUJ1dHRvbnMoZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyBNaW5pbXVtIGRlbGF5IHRvIGF2b2lkIHVucGxlYXNhbnQgYmxpbmtpbmdcbiAgICAgICAgICAgICQud2hlbihcbiAgICAgICAgICAgICAgICAkLnBvc3QoX3RoaXMuYXBwLmJhc2VVcmwgKyAnLycsIGZvcm1EYXRhKSxcbiAgICAgICAgICAgICAgICBkZWxheShjcmVhdGVNb2RlID8gMTAwIDogNTAwKVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSByZXN1bHRbMF07XG4gICAgICAgICAgICAgICAgaWYgKGNyZWF0ZU1vZGUgJiYgcGFyc2VJbnQocmVzcG9uc2UpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYnV0dG9uJC5kYXRhKCdhY3Rpb24nKSA9PSAnc2F2ZS1hbmQtcmV0dXJuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IF90aGlzLmFwcC5iYXNlVXJsO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IF8ucnRyaW0oZG9jdW1lbnQubG9jYXRpb24uaHJlZiwgJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cmwuZW5kc1dpdGgoJy9jcmVhdGUnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IF8uc3RyTGVmdEJhY2sodXJsLCAnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHVybCArICcvJyArIHJlc3BvbnNlICsgJy8nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJC5ncm93bC5ub3RpY2Uoe3RpdGxlOiAnJywgbWVzc2FnZTogXCJD0L7RhdGA0LDQvdC10L3QvlwifSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmFwcC5zZXJ2aWNlKCdVSScpLnRvZ2dsZVNwaW5uZXIoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVUknKS50b2dnbGVGb3JtQnV0dG9ucyh0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYnV0dG9uJC5kYXRhKCdhY3Rpb24nKSA9PSAnc2F2ZS1hbmQtcmV0dXJuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IF90aGlzLmFwcC5iYXNlVXJsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgaW5pdERhdGVwaWNrZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy90b2RvOiDQv9C+0LTRg9C80LDRgtGMLCDQvdCw0YHRh9C10YIgbGl2ZT9cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJC5kYXRldGltZXBpY2tlci5zZXRMb2NhbGUoJ3J1Jyk7XG4gICAgICAgICQoJy5kYXRlcGlja2VyJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5pbml0RGF0ZXBpY2tlckNvbnRyb2woJCh0aGlzKSk7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgJCgnLmRhdGVwaWNrZXIgKyAuY2xlYXItZGF0ZScpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQodGhpcykucHJldigpLnZhbCgnJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBpbml0RGF0ZXBpY2tlckNvbnRyb2w6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5kYXRldGltZXBpY2tlcih7XG4gICAgICAgICAgICBpMThuOiB7XG4gICAgICAgICAgICAgICAgcnU6IHtcbiAgICAgICAgICAgICAgICAgICAgbW9udGhzOiBbJ9Cv0L3QstCw0YDRjCcsICfQpNC10LLRgNCw0LvRjCcsICfQnNCw0YDRgicsICfQkNC/0YDQtdC70YwnLCAn0JzQsNC5JywgJ9CY0Y7QvdGMJywgJ9CY0Y7Qu9GMJywgJ9CQ0LLQs9GD0YHRgicsICfQodC10L3RgtGP0LHRgNGMJywgJ9Ce0LrRgtGP0LHRgNGMJywgJ9Cd0L7Rj9Cx0YDRjCcsICfQlNC10LrQsNCx0YDRjCddLFxuICAgICAgICAgICAgICAgICAgICBkYXlPZldlZWs6IFsn0JLRgScsICfQn9C9JywgJ9CS0YInLCAn0KHRgCcsICfQp9GCJywgJ9Cf0YInLCAn0KHQsSddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHllYXJTdGFydDogMTkwMCxcbiAgICAgICAgICAgIHllYXJFbmQ6IChuZXcgRGF0ZSgpKS5nZXRGdWxsWWVhcigpICsgMTAsXG4gICAgICAgICAgICB0aW1lcGlja2VyOiBlbC5pcygnLmRhdGV0aW1lJyksXG4gICAgICAgICAgICBmb3JtYXQ6ICdkLm0uWScgKyAoZWwuaXMoJy5kYXRldGltZScpID8gXCIgSDppXCIgOiBcIlwiKSxcbiAgICAgICAgICAgIG1hc2s6IHRydWUsXG4gICAgICAgICAgICBsYXp5SW5pdDogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRUYWJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQoJy50YWJzLWNvbnRhaW5lciAudGFiJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciQgPSAkKHRoaXMpLmNsb3Nlc3QoJy50YWJzLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnYWN0aXZlJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLm5leHQoKS5jaGlsZHJlbignLnRhYi1jb250ZW50OmVxKCcgKyAkKHRoaXMpLnByZXZBbGwoKS5sZW5ndGggKyAnKScpLmFkZENsYXNzKCdhY3RpdmUnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdENvbWJvYm94ZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChcInNlbGVjdC5jb21ib2JveFwiKS5zZWxlY3QyKHtcbiAgICAgICAgICAgIHRhZ3M6IHRydWUsXG4gICAgICAgICAgICBzZWxlY3RPbkJsdXI6IHRydWUsXG4gICAgICAgIH0pXG5cbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0U3RhdGUoc3RhdGUpIHtcbiAgICAgICAgICAgIGlmICghc3RhdGUuaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUudGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0ZXh0cyA9IHN0YXRlLnRleHQuc3BsaXQoJyV8JykubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC50cmltKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHRleHRzWzFdKSB7XG4gICAgICAgICAgICAgICAgdmFyICRzdGF0ZSA9ICQoXG4gICAgICAgICAgICAgICAgICAgICc8c3Bhbj4nICsgdGV4dHNbMF0gKyAnIDxzcGFuIHN0eWxlPVwiZm9udC1zaXplOiAxMnB4O2NvbG9yOiAjOTk5O1wiPicgKyB0ZXh0c1sxXSArICc8L3NwYW4+PC9zcGFuPidcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiAkc3RhdGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZS50ZXh0O1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJCgnc2VsZWN0W2RhdGEtc2VhcmNoPXRydWVdJykuc2VsZWN0Mih7XG4gICAgICAgICAgICBkcm9wZG93bkNzc0NsYXNzOiAnYmlnZHJvcCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZVJlc3VsdDogZm9ybWF0U3RhdGUsXG4gICAgICAgICAgICB0ZW1wbGF0ZVNlbGVjdGlvbjogZm9ybWF0U3RhdGVcbiAgICAgICAgfSk7XG4gICAgfVxufTsiLCJmdW5jdGlvbiBHb29nbGVNYXAoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkdvb2dsZU1hcC5wcm90b3R5cGUgPSB7XG4gICAgaW5pdE1hcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCQoJy5tYXAuZ29vZ2xlW2RhdGEtbGF0XVtkYXRhLWxuZ10nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICQuZ2V0U2NyaXB0KFwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCRjl3TldnQzE2aUNIbVRsb1dFbDVZN3NBUkRTeXFSVUUmbGlicmFyaWVzPXBsYWNlcyZzZW5zb3I9ZmFsc2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5maXJlKCdhZnRlckdvb2dsZU1hcHNBcGlMb2FkJyk7XG5cbiAgICAgICAgICAgICAgICB2YXIgc2hpZnRLZXkgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5vbmtleWRvd24gPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEtleSA9ICgoZS5rZXlJZGVudGlmaWVyID09ICdTaGlmdCcpIHx8IChlLnNoaWZ0S2V5ID09IHRydWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2luZG93Lm9ua2V5dXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEtleSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICQoJy5tYXBbZGF0YS1sYXRdW2RhdGEtbG5nXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqZWN0TGF0ID0gcGFyc2VGbG9hdCgkKHRoaXMpLmRhdGEoJ2xhdCcpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdExuZyA9IHBhcnNlRmxvYXQoJCh0aGlzKS5kYXRhKCdsbmcnKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0TGF0ID0gaXNOYU4ob2JqZWN0TGF0KSA/IDAgOiBvYmplY3RMYXQ7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdExuZyA9IGlzTmFOKG9iamVjdExuZykgPyAwIDogb2JqZWN0TG5nO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwVHlwZUNvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWV0Vmlld0NvbnRyb2w6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgem9vbTogMixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlcjogbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvYmplY3RMYXQsIG9iamVjdExuZylcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iamVjdExhdCAmJiBvYmplY3RMbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcE9wdGlvbnMuem9vbSA9IDEyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBFbGVtZW50ID0gJCh0aGlzKVswXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobWFwRWxlbWVudCwgbWFwT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9iamVjdExhdCwgb2JqZWN0TG5nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcDogbWFwXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaGlmdEtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobWFwRWxlbWVudCkuY2xvc2VzdCgnLmxhdC1sbmctY29udGFpbmVyJykuZmluZChcIltkYXRhLWxhdGxuZy1maWVsZD1sYXRdXCIpLnZhbChldmVudC5sYXRMbmcubGF0KCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChtYXBFbGVtZW50KS5jbG9zZXN0KCcubGF0LWxuZy1jb250YWluZXInKS5maW5kKFwiW2RhdGEtbGF0bG5nLWZpZWxkPWxuZ11cIikudmFsKGV2ZW50LmxhdExuZy5sbmcoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24oZXZlbnQubGF0TG5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBzZWFyY2ggYm94IGFuZCBsaW5rIGl0IHRvIHRoZSBVSSBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFjLWlucHV0Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkub24oJ2tleXByZXNzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLndoaWNoID09IDEzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWFyY2hCb3ggPSBuZXcgZ29vZ2xlLm1hcHMucGxhY2VzLlNlYXJjaEJveChpbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5jb250cm9sc1tnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb24uVE9QX0xFRlRdLnB1c2goaW5wdXQpO1xuXG4gICAgICAgICAgICAgICAgICAgIG1hcC5hZGRMaXN0ZW5lcignYm91bmRzX2NoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hCb3guc2V0Qm91bmRzKG1hcC5nZXRCb3VuZHMoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXJrZXJzID0gW107XG4gICAgICAgICAgICAgICAgICAgIHNlYXJjaEJveC5hZGRMaXN0ZW5lcigncGxhY2VzX2NoYW5nZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGxhY2VzID0gc2VhcmNoQm94LmdldFBsYWNlcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsYWNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYm91bmRzID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZ0JvdW5kcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwbGFjZSA9IHBsYWNlc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwbGFjZS5nZW9tZXRyeS52aWV3cG9ydCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGdlb2NvZGVzIGhhdmUgdmlld3BvcnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdW5kcy51bmlvbihwbGFjZS5nZW9tZXRyeS52aWV3cG9ydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm91bmRzLmV4dGVuZChwbGFjZS5nZW9tZXRyeS5sb2NhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5maXRCb3VuZHMoYm91bmRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYWZ0ZXJNYXBzSW5pdCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbiIsImZ1bmN0aW9uIExlZnRNZW51KGFwcCkge1xuICAgIHRoaXMuYXBwID0gYXBwO1xufVxuXG5MZWZ0TWVudS5wcm90b3R5cGUgPSB7XG4gICAgaW5pdE1haW5NZW51OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuYXZIYXNoID0gJCgnYm9keScpLmRhdGEoJ25hdkhhc2gnKTtcbiAgICAgICAgdmFyIHNjcm9sbENvb2tpZU5hbWUgPSAnc2Nyb2xsXycgKyBuYXZIYXNoO1xuICAgICAgICB2YXIgaW5pdGlhbFNjcm9sbCA9IDA7XG4gICAgICAgIGlmIChDb29raWVzLmdldChzY3JvbGxDb29raWVOYW1lKSkge1xuICAgICAgICAgICAgaW5pdGlhbFNjcm9sbCA9IENvb2tpZXMuZ2V0KHNjcm9sbENvb2tpZU5hbWUpO1xuICAgICAgICAgICAgLy90b2RvOiDQodC+0YXRgNCw0L3Rj9GC0Ywg0LIg0LrRg9C60YMg0LXRidC1INC4INCw0LnQtNC40YjQvdC40LosINC/0YDQvtCy0LXRgNGP0YLRjCwg0L7QvSDQu9C4INCw0LrRgtC40LLQtdC9LCDQuCDRgtC+0LvRjNC60L4g0YLQvtCz0LTQsCDRgdC60YDQvtC70LvQuNGC0YwuXG4gICAgICAgICAgICAvL3RvZG86INCY0L3QsNGH0LUg0LLRi9GB0YfQuNGC0YvQstCw0YLRjCDQv9C+0LfQuNGG0LjRjiwg0LrRg9C00LAg0YHQutGA0L7Qu9C70LjRgtGMXG4gICAgICAgIH1cbiAgICAgICAgJCgnLm1haW4tbWVudSAubGVmdC1wYW5lbDpub3QoLmNvbGxhcHNlZCksIC5tYWluLW1lbnUgLnJpZ2h0LXBhbmVsJykubUN1c3RvbVNjcm9sbGJhcih7XG4gICAgICAgICAgICB0aGVtZTogXCJsaWdodC0yXCIsXG4gICAgICAgICAgICBhdXRvRXhwYW5kU2Nyb2xsYmFyOiB0cnVlLFxuICAgICAgICAgICAgc2Nyb2xsSW5lcnRpYTogNDAwLFxuICAgICAgICAgICAgbW91c2VXaGVlbDoge1xuICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FsbGJhY2tzOiB7XG4gICAgICAgICAgICAgICAgb25TY3JvbGw6IGZ1bmN0aW9uIChxLCBxMSkge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGluaXRpYWxTY3JvbGwgJiYgJCgnLm1haW4tbWVudSAucmlnaHQtcGFuZWwgbGkuYWN0aXZlJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAkKCcubWFpbi1tZW51IC5yaWdodC1wYW5lbCcpLm1DdXN0b21TY3JvbGxiYXIoXCJzY3JvbGxUb1wiLCBpbml0aWFsU2Nyb2xsLCB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsSW5lcnRpYTogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcubWFpbi1tZW51IC5yaWdodC1wYW5lbCBhW2hyZWZdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICB2YXIgJHNjcm9sbGVyT3V0ZXIgPSAkKCcubWFpbi1tZW51IC5yaWdodC1wYW5lbCcpO1xuICAgICAgICAgICAgdmFyICRkcmFnZ2VyID0gJHNjcm9sbGVyT3V0ZXIuZmluZCgnLm1DU0JfZHJhZ2dlcicpO1xuICAgICAgICAgICAgdmFyIHNjcm9sbEhlaWdodCA9ICRzY3JvbGxlck91dGVyLmZpbmQoJy5tQ1NCX2NvbnRhaW5lcicpLmhlaWdodCgpO1xuICAgICAgICAgICAgdmFyIGRyYWdnZXJUb3AgPSAkZHJhZ2dlci5wb3NpdGlvbigpLnRvcDtcblxuICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IGRyYWdnZXJUb3AgLyAoJHNjcm9sbGVyT3V0ZXIuaGVpZ2h0KCkgLSAkZHJhZ2dlci5oZWlnaHQoKSkgKiAoc2Nyb2xsSGVpZ2h0IC0gJHNjcm9sbGVyT3V0ZXIuaGVpZ2h0KCkpO1xuXG4gICAgICAgICAgICBDb29raWVzLnNldChzY3JvbGxDb29raWVOYW1lLCBzY3JvbGxUb3ApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiIsImZ1bmN0aW9uIExpc3QoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkxpc3QucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcblxuICAgIHNlbGVjdG9yczoge1xuICAgICAgICAnc3RhdHVzJzogWycuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLnN0YXR1cycsICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLnN0YXR1cyddLFxuICAgICAgICAnZGVsZXRlJzogWycuY21zLW1vZHVsZS1saXN0LWNvbnRlbnQgYnV0dG9uLmRlbGV0ZScsICcuY21zLW1vZHVsZS10cmVlLWNvbnRlbnQgYnV0dG9uLmRlbGV0ZSddLFxuICAgICAgICAnYWRkJzogJy5jbXMtbW9kdWxlLXRyZWUtY29udGVudCBidXR0b24uYWRkJyxcbiAgICAgICAgJ2FkZFJvb3QnOiAnLmFkZC1uZXctdHJlZS1pdGVtJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbml0QnV0dG9ucygpO1xuICAgICAgICB0aGlzLmluaXRTb3J0YWJsZSgpO1xuICAgICAgICAkKCcubGlzdC1sYW5ndWFnZS1zZWxlY3RvcicpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBDb29raWVzLnNldCgnbGFuZ18nICsgJCgnYm9keScpLmRhdGEoJ25hdkhhc2gnKSwgJCh0aGlzKS52YWwoKS8qLCB7IGV4cGlyZXM6MSB9Ki8pO1xuICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBpbml0QnV0dG9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmluaXRTdGF0dXNCdXR0b24oKTtcbiAgICAgICAgdGhpcy5pbml0RGVsZXRlQnV0dG9uKCk7XG4gICAgICAgIHRoaXMuaW5pdEFkZEJ1dHRvbigpO1xuICAgICAgICB0aGlzLmluaXRBZGRUb1Jvb3RCdXR0b24oKTtcbiAgICAgICAgdGhpcy5pbml0RmlsdGVyKCk7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHN0YXR1c1xuICAgICAqL1xuICAgIGluaXRTdGF0dXNCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLnN0YXR1cy5qb2luKCcsJyksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpZCA9IF90aGlzLmdldEl0ZW1JZChidG4kKTtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IF90aGlzLmdldEl0ZW1Db250YWluZXIoYnRuJCk7XG5cbiAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ3RvZ2dsZScsIG1vZGVsLCBpZCwgJ3N0YXR1cyddLCAxKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC50b2dnbGVDbGFzcygnaW5hY3RpdmUnLCAhcmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIERlbGV0ZSBvYmplY3RcbiAgICAgKi9cbiAgICBpbml0RGVsZXRlQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKF90aGlzLnNlbGVjdG9ycy5kZWxldGUpO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBfdGhpcy5zZWxlY3RvcnMuZGVsZXRlLmpvaW4oJywnKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1N1cmU/JykpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnRuJCA9ICQodGhpcyk7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gX3RoaXMuZ2V0SXRlbUlkKGJ0biQpO1xuICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IF90aGlzLmdldEl0ZW1Nb2RlbChidG4kKTtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbUNvbnRhaW5lciQgPSBfdGhpcy5nZXRJdGVtQ29udGFpbmVyKGJ0biQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpdGVtQ29udGFpbmVyJC5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBjaGlsZFxuICAgICAqL1xuICAgIGluaXRBZGRCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLmFkZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ0biQgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGlkID0gX3RoaXMuZ2V0SXRlbUlkKGJ0biQpO1xuICAgICAgICAgICAgdmFyIG1vZGVsID0gX3RoaXMuZ2V0SXRlbU1vZGVsKGJ0biQpO1xuICAgICAgICAgICAgdmFyIGl0ZW1Db250YWluZXIkID0gX3RoaXMuZ2V0SXRlbUNvbnRhaW5lcihidG4kKTtcblxuICAgICAgICAgICAgdmFyIHBheWxvYWQgPSBfdGhpcy5hcHAuYnVpbGRQYXlsb2FkKFsnY3JlYXRlJywgbW9kZWwsIF90aGlzLmdlbmVyYXRlUmFuZG9tSWRTdHJpbmcoKSwgJ3BhcmVudF9pZCddLCBpZCk7XG5cbiAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gYnRuJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5maW5kKCdzY3JpcHRbZGF0YS10ZW1wbGF0ZS1uYW1lPVwiZW1wdHktdHJlZS1lbGVtZW50XCJdJykuaHRtbCgpO1xuICAgICAgICAgICAgICAgIGl0ZW1Db250YWluZXIkLmZpbmQoJz51bCcpLmFwcGVuZChfdGhpcy5jcmVhdGVOZXdFbGVtZW50KHRlbXBsYXRlLCByZXN1bHQpKTtcbiAgICAgICAgICAgICAgICBfZmFjZXBhbG0uc2VydmljZSgnRm9ybScpLmluaXRDb21ib2JveGVzKCk7XG4gICAgICAgICAgICAgICAgX2ZhY2VwYWxtLnNlcnZpY2UoJ0Zvcm0nKS5pbml0RGF0ZXBpY2tlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqIEFkZCBvYmplY3QgdG8gdGhlIHRyZWUgcm9vdFxuICAgICAqL1xuICAgIGluaXRBZGRUb1Jvb3RCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgX3RoaXMuc2VsZWN0b3JzLmFkZFJvb3QsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBidG4kID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpdGVtQ29udGFpbmVyJCA9IGJ0biQuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJyk7XG4gICAgICAgICAgICB2YXIgaWQgPSBwYXJzZUludChpdGVtQ29udGFpbmVyJC5kYXRhKCd0cmVlLXJvb3QnKSk7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBpdGVtQ29udGFpbmVyJC5kYXRhKCdtb2RlbCcpO1xuXG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoWydjcmVhdGUnLCBtb2RlbCwgX3RoaXMuZ2VuZXJhdGVSYW5kb21JZFN0cmluZygpLCAncGFyZW50X2lkJ10sIGlkKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBidG4kLmNsb3Nlc3QoJ1tkYXRhLW1vZGVsXScpLmZpbmQoJ3NjcmlwdFtkYXRhLXRlbXBsYXRlLW5hbWU9XCJlbXB0eS10cmVlLWVsZW1lbnRcIl0nKS5odG1sKCk7XG4gICAgICAgICAgICAgICAgaXRlbUNvbnRhaW5lciQuZmluZCgndWw6Zmlyc3QnKS5hcHBlbmQoX3RoaXMuY3JlYXRlTmV3RWxlbWVudCh0ZW1wbGF0ZSwgcmVzdWx0KSk7XG4gICAgICAgICAgICAgICAgX2ZhY2VwYWxtLnNlcnZpY2UoJ0Zvcm0nKS5pbml0Q29tYm9ib3hlcygpO1xuICAgICAgICAgICAgICAgIF9mYWNlcGFsbS5zZXJ2aWNlKCdGb3JtJykuaW5pdERhdGVwaWNrZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBpbml0U29ydGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBmdW5jdGlvbiBpbml0U29ydGFibGVFbmdpbmUoZWwsIGhhbmRsZU5hbWUsIGdyb3VwTmFtZSkge1xuICAgICAgICAgICAgdmFyIHNvcnRhYmxlID0gU29ydGFibGUuY3JlYXRlKGVsLCB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogMjAwLFxuICAgICAgICAgICAgICAgIGdyb3VwOiBncm91cE5hbWUsXG4gICAgICAgICAgICAgICAgaGFuZGxlOiBoYW5kbGVOYW1lLFxuICAgICAgICAgICAgICAgIG9uQWRkOiBmdW5jdGlvbiAoLyoqRXZlbnQqL2V2dCkge1xuICAgICAgICAgICAgICAgICAgICBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uICgvKipFdmVudCovZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uVHJlZVNvcnQoZXZ0LCBzb3J0YWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvblRyZWVTb3J0KGV2dCwgc29ydGFibGUpIHtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9ICQoZXZ0LnRhcmdldCkuY2xvc2VzdCgnW2RhdGEtbW9kZWxdJykuZGF0YSgnbW9kZWwnKTtcbiAgICAgICAgICAgIHZhciBwYXJlbnRJZCA9ICQoZXZ0LnRhcmdldCkuZGF0YSgnaWQnKTtcbiAgICAgICAgICAgIHZhciBvcmRlckFycmF5ID0gc29ydGFibGUudG9BcnJheSgpLmZpbHRlcihmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwgPj0gMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF8uZXh0ZW5kKHtzYXZlOiB7fX0sIF90aGlzLmFwcC5nZXRDc3JmVG9rZW5QYXJhbWV0ZXIoKSk7XG4gICAgICAgICAgICBwYXlsb2FkWydzYXZlJ11bbW9kZWxdID0ge307IC8vIG9iamVjdCwgbm90IGFuIGFycmF5LiBPdGhlcndpc2UgaXQgd2lsbCBjcmVhdGUgMC4uaWQgZW1wdHkgZWxlbWVudHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gb3JkZXJBcnJheSkge1xuICAgICAgICAgICAgICAgIGlmIChvcmRlckFycmF5Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF1bb3JkZXJBcnJheVtpXV0gPSB7J3Nob3dfb3JkZXInOiBwYXJzZUludChpKSArIDEsICdwYXJlbnRfaWQnOiBwYXJlbnRJZH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCQoJy5saXN0LWxhbmd1YWdlLXNlbGVjdG9yJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcGF5bG9hZFsnbGlzdExhbmd1YWdlJ10gPSAkKCcubGlzdC1sYW5ndWFnZS1zZWxlY3RvcicpLnZhbCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfdGhpcy5hcHAuZG9SZXF1ZXN0KHBheWxvYWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVHJlZXNcbiAgICAgICAgJCgnLmNtcy1tb2R1bGUtdHJlZS1jb250ZW50JykuZWFjaChmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgdmFyIHBsYWluID0gJCh0aGlzKS5kYXRhKCdwbGFpbicpID09PSAxO1xuICAgICAgICAgICAgdmFyIHRyZWVOYW1lID0gJ3RyZWVfJyArIGk7XG4gICAgICAgICAgICAkKHRoaXMpLmZpbmQoKHBsYWluID8gJz4nIDogJycpICsgJ3VsJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaW5pdFNvcnRhYmxlRW5naW5lKCQodGhpcylbMF0sICcuaWQnLCB0cmVlTmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTGlzdHNcbiAgICAgICAgJCgnLmNtcy1tb2R1bGUtbGlzdC1jb250ZW50W2RhdGEtc29ydGFibGU9XCJ0cnVlXCJdIHRib2R5JykuZWFjaChmdW5jdGlvbiAoaSkge1xuICAgICAgICAgICAgdmFyIGxpc3ROYW1lID0gJ2xpc3RfJyArIGk7XG4gICAgICAgICAgICBpbml0U29ydGFibGVFbmdpbmUoJCh0aGlzKVswXSwgJy5jb2x1bW4taWQnLCBsaXN0TmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIGluaXRGaWx0ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRpbWVyID0gbnVsbDtcbiAgICAgICAgdmFyIHByZXZGaWx0ZXIgPSAnJztcbiAgICAgICAgJCgnLmxpc3QtZmlsdGVyIGlucHV0OnRleHQnKS5vbignY2hhbmdlIGlucHV0IGtleXByZXNzIGJsdXInLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHN0clNlYXJjaCA9ICQoJy5saXN0LWZpbHRlciBpbnB1dDp0ZXh0JykudmFsKCk7XG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09PSAxMykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgaWYgKHByZXZGaWx0ZXIgIT09IHN0clNlYXJjaCkge1xuICAgICAgICAgICAgICAgIGlmICh0aW1lcikge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2RmlsdGVyID0gc3RyU2VhcmNoO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyU2VhcmNoLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJC5nZXQoJy4vP2ZpbHRlcj0nICsgc3RyU2VhcmNoKS5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5jbXMtbW9kdWxlLWxpc3QtY29udGVudCcpLnJlcGxhY2VXaXRoKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsJFxuICAgICAqIEByZXR1cm5zIHsqfEhUTUxFbGVtZW50fG51bGx9XG4gICAgICovXG4gICAgZ2V0SXRlbUNvbnRhaW5lcjogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICByZXR1cm4gZWwkLmNsb3Nlc3QoJ1tkYXRhLWlkXScpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGVsJFxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGdldEl0ZW1JZDogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRJdGVtQ29udGFpbmVyKGVsJCkuZGF0YSgnaWQnKTtcbiAgICB9LFxuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbCRcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKi9cbiAgICBnZXRJdGVtTW9kZWw6IGZ1bmN0aW9uIChlbCQpIHtcbiAgICAgICAgcmV0dXJuIGVsJC5jbG9zZXN0KCdbZGF0YS1tb2RlbF0nKS5kYXRhKCdtb2RlbCcpO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZW5lcmF0ZVJhbmRvbUlkU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAnJUNSRUFURV8nICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDgpICsgJyUnO1xuICAgIH0sXG5cblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHRlbXBsYXRlXG4gICAgICogQHBhcmFtIHJlc3VsdFxuICAgICAqIEByZXR1cm5zIHsqfGpRdWVyeX1cbiAgICAgKi9cbiAgICBjcmVhdGVOZXdFbGVtZW50OiBmdW5jdGlvbiAodGVtcGxhdGUsIHJlc3VsdCkge1xuICAgICAgICB2YXIgbmV3SXRlbSQgPSAkKHRlbXBsYXRlLnJlcGxhY2UobmV3IFJlZ0V4cCgnJUNSRUFURV8lJywgJ2cnKSwgcmVzdWx0KSkuYXR0cignZGF0YS1pZCcsIHJlc3VsdCk7XG4gICAgICAgIG5ld0l0ZW0kLmZpbmQoJy5pZCcpLnRleHQocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ld0l0ZW0kO1xuICAgIH1cbn07IiwiZnVuY3Rpb24gVUkoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cblVJLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgdXNlck1lbnU6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5pdFVzZXJNZW51KCk7XG4gICAgICAgIHRoaXMuaW5pdEhyZWZCdXR0b25zKCk7XG4gICAgICAgIHRoaXMuaW5pdFN0YXJ0dXBOb3RpZmljYXRpb25zKCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0dvb2dsZU1hcCcpLmluaXRNYXBzKCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0xlZnRNZW51JykuaW5pdE1haW5NZW51KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0xpc3QnKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0Zvcm0nKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0Ryb3B6b25lTWFuYWdlcicpLmluaXQoKTtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdCgpO1xuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdWaWRlb3NMaXN0JykuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBpbml0U3RhcnR1cE5vdGlmaWNhdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCQoJy5jbXMtbW9kdWxlLWZvcm0tcGFnZScpLmRhdGEoJ2p1c3QtY3JlYXRlZCcpKSB7XG4gICAgICAgICAgICAkLmdyb3dsLm5vdGljZSh7dGl0bGU6ICcnLCBtZXNzYWdlOiBcItCe0LHRitC10LrRgiDRgdC+0LfQtNCw0L1cIn0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXRVc2VyTWVudTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnVzZXItaWNvbicpKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXJNZW51ID0gbmV3IERyb3Aoe1xuICAgICAgICAgICAgICAgIG9wZW5PbjogJ2NsaWNrJyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbSByaWdodCcsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcudXNlci1pY29uJyksXG4gICAgICAgICAgICAgICAgY29udGVudDogJCgnLnVzZXItZHJvcGRvd24tY29udGFpbmVyJykuaHRtbCgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0SHJlZkJ1dHRvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2J1dHRvbltocmVmXScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmxvY2F0aW9uLmhyZWYgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHRvZ2dsZVNwaW5uZXI6IGZ1bmN0aW9uIChzaG93KSB7XG4gICAgICAgICQoJyNzcGlubmVyJykudG9nZ2xlQ2xhc3MoJ3Nob3cnLCBzaG93KTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlRm9ybUJ1dHRvbnM6IGZ1bmN0aW9uIChlbmFibGUpIHtcbiAgICAgICAgJCgnLmZvcm0tYnV0dG9ucyBidXR0b24nKS5wcm9wKCdkaXNhYmxlZCcsICFlbmFibGUpO1xuICAgIH1cblxufSIsImZ1bmN0aW9uIFVwbG9hZGFibGVzTGlzdChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuVXBsb2FkYWJsZXNMaXN0LnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgWydpbWFnZScsICdmaWxlJ10uZm9yRWFjaChmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgICAgIF90aGlzLmluaXREZWxldGVCdXR0b24obW9kZWwpO1xuXG4gICAgICAgICAgICAkKCcuJyArIG1vZGVsICsgJ3MtbGlzdCcpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChtb2RlbCA9PSAnaW1hZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmluaXRGYW5jeWJveCgkKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMuaW5pdFNvcnRhYmxlKCQodGhpcylbMF0sIG1vZGVsKVxuXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIGluaXREZWxldGVCdXR0b246IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLicgKyBtb2RlbCArICdzLWxpc3QgLicgKyBtb2RlbCArICcgLmRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChjb25maXJtKCdTdXJlPycpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQkID0gJCh0aGlzKS5jbG9zZXN0KCcuJyArIG1vZGVsKTtcbiAgICAgICAgICAgICAgICB2YXIgaWQgPSBlbGVtZW50JC5kYXRhKCdpZCcpO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ2RlbGV0ZScsIG1vZGVsLCBpZF0sIDEpO1xuICAgICAgICAgICAgICAgIF90aGlzLmFwcC5kb1JlcXVlc3QocGF5bG9hZCkuZG9uZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQkLmZhZGVPdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdFNvcnRhYmxlOiBmdW5jdGlvbiAoZWwsIG1vZGVsKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzb3J0YWJsZSA9IFNvcnRhYmxlLmNyZWF0ZShlbCwge1xuICAgICAgICAgICAgYW5pbWF0aW9uOiAyMDAsXG4gICAgICAgICAgICBoYW5kbGU6IG1vZGVsID09ICdmaWxlJyA/IFwiLmljb25cIiA6IG51bGwsXG4gICAgICAgICAgICBzY3JvbGw6IHRydWUsXG4gICAgICAgICAgICBvblVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBvcmRlckFycmF5ID0gc29ydGFibGUudG9BcnJheSgpO1xuICAgICAgICAgICAgICAgIHZhciBwYXlsb2FkID0gX3RoaXMuYXBwLmJ1aWxkUGF5bG9hZChbJ3NhdmUnLCBtb2RlbF0sIHt9KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIG9yZGVyQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9yZGVyQXJyYXkuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBheWxvYWRbJ3NhdmUnXVttb2RlbF1bb3JkZXJBcnJheVtpXV0gPSB7J3Nob3dfb3JkZXInOiBwYXJzZUludChpKSArIDF9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGluaXRGYW5jeWJveDogZnVuY3Rpb24gKGVsJCkge1xuICAgICAgICBlbCQuZmluZCgnLmltYWdlID4gYScpLmZhbmN5Ym94KHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEsXG4gICAgICAgICAgICBvcGVuRWZmZWN0OiAnZWxhc3RpYycsXG4gICAgICAgICAgICBoZWxwZXJzOiB7XG4gICAgICAgICAgICAgICAgb3ZlcmxheToge1xuICAgICAgICAgICAgICAgICAgICBsb2NrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjc3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogJ3JnYmEoMCwwLDAsMC41KSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbn07IiwiZnVuY3Rpb24gVmlkZW9zTGlzdChhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbn1cblxuVmlkZW9zTGlzdC5wcm90b3R5cGUgPSB7XG4gICAgYXBwOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHZhciB0ZW1wbGF0ZUltYWdlID0gdHdpZyh7XG4gICAgICAgICAgICBkYXRhOiAkKCcjaW1hZ2UtcHJldmlldy10ZW1wbGF0ZScpLmh0bWwoKVxuICAgICAgICB9KTtcblxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNtcy1idXR0b25bZGF0YS1hZGQtdmlkZW9dJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5mYW5jeWJveC5vcGVuKHR3aWcoe2RhdGE6ICQoJyNpbnNlcnQtdmlkZW8tdGVtcGxhdGUnKS5odG1sKCl9KS5yZW5kZXIoe1xuICAgICAgICAgICAgICAgIGlucHV0TmFtZTogJCh0aGlzKS5kYXRhKCdpbnB1dC1uYW1lJylcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuaW5zZXJ0LXZpZGVvLWRpYWxvZyBidXR0b24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZGlhbG9nJCA9ICQodGhpcykuY2xvc2VzdCgnLmluc2VydC12aWRlby1kaWFsb2cnKTtcbiAgICAgICAgICAgIHZhciB0ZXh0YXJlYSQgPSBkaWFsb2ckLmZpbmQoJ3RleHRhcmVhJyk7XG4gICAgICAgICAgICB2YXIgcGF5bG9hZCA9IF90aGlzLmFwcC5idWlsZFBheWxvYWQoKTtcbiAgICAgICAgICAgIHBheWxvYWRbdGV4dGFyZWEkLmF0dHIoJ25hbWUnKV0gPSB0ZXh0YXJlYSQudmFsKCk7XG4gICAgICAgICAgICBwYXlsb2FkWydtdWx0aXBsZSddID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGlhbG9nJC5hZGRDbGFzcygncHJvY2Vzc2luZycpO1xuICAgICAgICAgICAgdGV4dGFyZWEkLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSkuY3NzKCdiYWNrZ3JvdW5kJywgJyNlZWUnKTtcblxuICAgICAgICAgICAgX3RoaXMuYXBwLmRvUmVxdWVzdChwYXlsb2FkKS5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBidXR0b24gPSAkKCcuY21zLWJ1dHRvbltkYXRhLWFkZC12aWRlb11bZGF0YS1pbnB1dC1uYW1lPVwiJyArIHRleHRhcmVhJC5hdHRyKCduYW1lJykgKyAnXCJdJyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1dHRvbi5wcmV2QWxsKCcuaW1hZ2VzLWxpc3Q6Zmlyc3QnKS5maW5kKCcuaW1hZ2VbZGF0YS1pZD0nICsgcmVzcG9uc2VbaV0uaW1hZ2UuaWQgKyAnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnV0dG9uLnByZXZBbGwoJy5pbWFnZXMtbGlzdDpmaXJzdCcpLmFwcGVuZCh0ZW1wbGF0ZUltYWdlLnJlbmRlcihyZXNwb25zZVtpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5hcHAuc2VydmljZSgnVXBsb2FkYWJsZXNMaXN0JykuaW5pdEZhbmN5Ym94KGJ1dHRvbi5wcmV2QWxsKCcuaW1hZ2VzLWxpc3Q6Zmlyc3QnKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJC5mYW5jeWJveC5jbG9zZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG59OyIsIi8qKlxuICogQ3JlYXRlZCBieSB4cHVuZGVsIG9uIDA0LjA0LjE2LlxuICovXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLmxlbmd0aCkge1xuICAgICAgICAkKCdbZGF0YS1yb3ctZm9yLWZpZWxkPVwicm9sZS5uYW1lXCJdIHNlbGVjdCcpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygkKHRoaXMpLnZhbCgpKTtcbiAgICAgICAgICAgIGlmICgkKHRoaXMpLnZhbCgpID09IDEgfHwgISQodGhpcykudmFsKCkpIHtcbiAgICAgICAgICAgICAgICAkKCd0cltkYXRhLXJvdy1mb3ItZmllbGQ9XCJhY2xcIl0nKS5oaWRlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQoJ3RyW2RhdGEtcm93LWZvci1maWVsZD1cImFjbFwiXScpLnNob3coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkudHJpZ2dlcignY2hhbmdlJyk7XG4gICAgfVxufSk7IiwiLyoqXG4gKiBDcmVhdGVkIGJ5IHhwdW5kZWwgb24gMTcuMDYuMTYuXG4gKi9cbmZ1bmN0aW9uIGdldERlZmF1bHRUaW55TWNlT3B0aW9ucygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50X2NzczogJy9hc3NldHMvZmFjZXBhbG0vY3NzL2NvbnRlbnQuY3NzJyxcbiAgICAgICAgbGFuZ3VhZ2U6ICdydScsXG4gICAgICAgIG1lbnViYXI6IGZhbHNlLFxuICAgICAgICBzdGF0dXNiYXI6IGZhbHNlLFxuICAgICAgICByZWxhdGl2ZV91cmxzIDogZmFsc2UsXG4gICAgICAgIHN0eWxlX2Zvcm1hdHM6IFtcbiAgICAgICAgICAgIHt0aXRsZTogJ9Ce0LHRi9GH0L3Ri9C5INGC0LXQutGB0YInLCBibG9jazogJ3AnfSxcbiAgICAgICAgICAgIHt0aXRsZTogJ9CX0LDQs9C+0LvQvtCy0L7QuicsIGJsb2NrOiAnaDInfSxcbiAgICAgICAgICAgIHt0aXRsZTogJ9Cf0L7QtNC30LDQs9C+0LvQvtCy0L7QuicsIGJsb2NrOiAnaDMnfSxcbiAgICAgICAgICAgIHt0aXRsZTogJ9CS0YDQtdC30LrQsCcsIGJsb2NrOiAnYmxvY2txdW90ZSd9LFxuICAgICAgICAgICAgLy8geyB0aXRsZTogJ1RhYmxlIHJvdyAxJywgc2VsZWN0b3I6ICd0cicsIGNsYXNzZXM6ICd0YWJsZXJvdzEnIH1cbiAgICAgICAgXSxcbiAgICAgICAgcmVtb3ZlZm9ybWF0OiBbXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICcqJywgcmVtb3ZlIDogJ2FsbCcsIHNwbGl0IDogdHJ1ZSwgZXhwYW5kIDogZmFsc2UsIGJsb2NrX2V4cGFuZDogdHJ1ZSwgZGVlcCA6IHRydWV9LFxuICAgICAgICBdLFxuXG4gICAgICAgIC8vIGV4dGVuZGVkX3ZhbGlkX2VsZW1lbnRzOiAnaW1nW2NsYXNzPW15Y2xhc3N8IXNyY3xib3JkZXI6MHxhbHR8dGl0bGV8d2lkdGh8aGVpZ2h0fHN0eWxlXScsXG4gICAgICAgIC8vIGludmFsaWRfZWxlbWVudHM6ICdzdHJvbmcsYixlbSxpJyxcblxuICAgICAgICBwbHVnaW5zOiBbJ2ZpeGVkdG9vbGJhcicsICdhdXRvcmVzaXplJywgJ2NvZGVtaXJyb3InLCAnbGluaycsICdhdXRvbGluaycsICdtZWRpYScsICdub25lZGl0YWJsZScsICdwYXN0ZScsICd0YWJsZScsICd2aXN1YWxibG9ja3MnLCAncGFzdGUnXSxcbiAgICAgICAgdG9vbGJhcjogJ3N0eWxlc2VsZWN0IHwgYm9sZCBpdGFsaWMgfCBhbGlnbmxlZnQgYWxpZ25jZW50ZXIgYWxpZ25yaWdodCB8IGJ1bGxpc3QgbnVtbGlzdCBvdXRkZW50IGluZGVudCB8IGxpbmsgaW1hZ2UgdGFibGUgbWVkaWEgfCB2aXN1YWxibG9ja3MgY29kZSByZW1vdmVmb3JtYXQgfCBmcDppbWFnZSBmcDpnYWxsZXJ5JyxcblxuICAgICAgICAvLyBwYXN0ZV9hc190ZXh0OiB0cnVlLFxuXG4gICAgICAgIG1lZGlhX3Bvc3RlcjogZmFsc2UsXG4gICAgICAgIG1lZGlhX2RpbWVuc2lvbnM6IGZhbHNlLFxuXG4gICAgICAgIHRhYmxlX2FwcGVhcmFuY2Vfb3B0aW9uczogZmFsc2UsXG4gICAgICAgIHRhYmxlX2FkdnRhYjogZmFsc2UsXG4gICAgICAgIHRhYmxlX2NlbGxfYWR2dGFiOiBmYWxzZSxcbiAgICAgICAgdGFibGVfcm93X2FkdnRhYjogZmFsc2UsXG4gICAgICAgIHRhYmxlX2RlZmF1bHRfYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICdkZWZhdWx0LXRhYmxlJ1xuICAgICAgICB9LFxuICAgICAgICB0YWJsZV9jbGFzc19saXN0OiBbXG4gICAgICAgICAgICB7dGl0bGU6ICdEZWZhdWx0JywgdmFsdWU6ICdkZWZhdWx0LXRhYmxlJ30sXG4gICAgICAgIF0sXG5cbiAgICAgICAgY29kZW1pcnJvcjoge1xuICAgICAgICAgICAgaW5kZW50T25Jbml0OiB0cnVlLFxuICAgICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgc3R5bGVBY3RpdmVMaW5lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0aGVtZTogJ21vbm9rYWknXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3NzRmlsZXM6IFtcbiAgICAgICAgICAgICAgICAndGhlbWUvbW9ub2thaS5jc3MnXG4gICAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICB9O1xufSIsImZ1bmN0aW9uIEdhbGxlcnlNb2R1bGUoYXBwKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG59XG5cbkdhbGxlcnlNb2R1bGUucHJvdG90eXBlID0ge1xuICAgIGFwcDogbnVsbCxcbiAgICBlZGl0b3I6IG51bGwsXG4gICAgQlVUVE9OX0dBTExFUlk6ICdCVVRUT05fR0FMTEVSWScsXG4gICAgQlVUVE9OX0lNQUdFOiAnQlVUVE9OX0lNQUdFJyxcbiAgICB3aW5kb3dQYXJhbXM6IHtcbiAgICAgICAgQlVUVE9OX0dBTExFUlk6IHtcbiAgICAgICAgICAgIHRpdGxlOiAn0JPQsNC70LXRgNC10Y8nLFxuICAgICAgICAgICAgd2lkdGg6IDYzMCxcbiAgICAgICAgICAgIGhlaWdodDogNDAwXG4gICAgICAgIH0sXG4gICAgICAgIEJVVFRPTl9JTUFHRToge1xuICAgICAgICAgICAgdGl0bGU6ICfQmtCw0YDRgtC40L3QutCwJyxcbiAgICAgICAgICAgIHdpZHRoOiA0MzAsXG4gICAgICAgICAgICBoZWlnaHQ6IDI1MFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGNvbnNvbGUubG9nKCdyZWdpc3RlcicpO1xuXG4gICAgICAgIHRpbnltY2UuUGx1Z2luTWFuYWdlci5hZGQoJ2dhbGxlcnknLCBmdW5jdGlvbiAoZWRpdG9yLCB1cmwpIHtcbiAgICAgICAgICAgIC8vIEFkZCBhIGJ1dHRvbiB0aGF0IG9wZW5zIGEgd2luZG93XG4gICAgICAgICAgICBlZGl0b3IuYWRkQnV0dG9uKCdmcDpnYWxsZXJ5Jywge1xuICAgICAgICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgaWNvbjogJ2dhbGxlcnktYnV0dG9uJyxcbiAgICAgICAgICAgICAgICB0aXRsZTogJ9CT0LDQu9C10YDQtdGPJyxcbiAgICAgICAgICAgICAgICBkaXNhYmxlZFN0YXRlU2VsZWN0b3I6ICcudHlwZS1pbWFnZScsXG4gICAgICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkJ1dHRvbkNsaWNrKGVkaXRvciwgX3RoaXMuQlVUVE9OX0dBTExFUlkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlZGl0b3IuYWRkQnV0dG9uKCdmcDppbWFnZScsIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgIGljb246ICdpbWFnZS1idXR0b24nLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAn0JrQsNGA0YLQuNC90LrQsCcsXG4gICAgICAgICAgICAgICAgZGlzYWJsZWRTdGF0ZVNlbGVjdG9yOiAnLnR5cGUtZ2FsbGVyeScsXG4gICAgICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vbkJ1dHRvbkNsaWNrKGVkaXRvciwgX3RoaXMuQlVUVE9OX0lNQUdFKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy9maXggYnVnIHdpdGggcGFnZSBqdW1waW5nIHdoZW4gY2xpY2tpbmcgZmlyc3QgdGltZSB0byBpbWFnZS9nYWxsZXJ5XG4gICAgICAgICAgICBlZGl0b3Iub24oJ2luaXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnNlbGVjdGlvbi5zZWxlY3QoZWRpdG9yLmdldEJvZHkoKSwgdHJ1ZSk7IC8vIGVkIGlzIHRoZSBlZGl0b3IgaW5zdGFuY2VcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2VsZWN0aW9uLmNvbGxhcHNlKGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBvbkJ1dHRvbkNsaWNrOiBmdW5jdGlvbiAoZWRpdG9yLCB0eXBlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBiYXNlVXJsID0gJCgnYm9keScpLmRhdGEoJ2Jhc2UtdXJsJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdvbkJ1dHRvbkNsaWNrJyk7XG5cbiAgICAgICAgdmFyIHdpbiA9IGVkaXRvci53aW5kb3dNYW5hZ2VyLm9wZW4oe1xuICAgICAgICAgICAgdGl0bGU6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS50aXRsZSxcbiAgICAgICAgICAgIHdpZHRoOiBfdGhpcy53aW5kb3dQYXJhbXNbdHlwZV0ud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IF90aGlzLndpbmRvd1BhcmFtc1t0eXBlXS5oZWlnaHQsXG4gICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnT2snLCBzdWJ0eXBlOiAncHJpbWFyeScsIG9uY2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvYyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tY2UtY29udGFpbmVyLWJvZHk+aWZyYW1lJylbMF07XG4gICAgICAgICAgICAgICAgICAgIGRvYy5jb250ZW50V2luZG93LnN1Ym1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB3aW4uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCcsIG9uY2xpY2s6ICdjbG9zZSd9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdXJsOiAnL2Fzc2V0cy9mYWNlcGFsbS9pbmNsdWRlL3RlbXBsYXRlcy9nYWxsZXJ5RGlhbG9nLmh0bWw/X3Rva2VuPScgKyBfdGhpcy5hcHAuZ2V0Q3NyZlRva2VuUGFyYW1ldGVyKCkuX3Rva2VuICsgJyZiYXNlVXJsPScgKyBiYXNlVXJsICsgJyZ0eXBlPScgKyB0eXBlLFxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdFdpbmRvdzogZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgY29uc29sZS5sb2coJ2luaXQgd2luZG93Jyk7XG5cbiAgICAgICAgJCgnLm1jZS1nYWxsZXJ5LXBsdWdpbi1ib2R5JykuYWRkQ2xhc3MoKGdldFF1ZXJ5UGFyYW1ldGVycygpLnR5cGUgPT0gJ0JVVFRPTl9HQUxMRVJZJyA/ICd0eXBlLWdhbGxlcnknIDogJ3R5cGUtaW1hZ2UnKSk7XG5cbiAgICAgICAgJCgnLmRyb3B6b25lJykuZGF0YSgnbXVsdGlwbGUnLCBnZXRRdWVyeVBhcmFtZXRlcnMoKS50eXBlID09PSAnQlVUVE9OX0dBTExFUlknID8gMSA6IDApO1xuXG4gICAgICAgIHZhciBjdXJyZW50Tm9kZSQgPSAkKHRoaXMuZWRpdG9yLnNlbGVjdGlvbi5nZXROb2RlKCkpO1xuICAgICAgICBpZiAoY3VycmVudE5vZGUkLmlzKCcuZ2FsbGVyeVBsYWNlaG9sZGVyW2RhdGEtaW1hZ2VzXScpKSB7XG4gICAgICAgICAgICAkKCcuaW1hZ2VzLWxpc3QnKS5hcHBlbmQoJChjdXJyZW50Tm9kZSQuaHRtbCgpLnJlcGxhY2UoLzx0ZXh0YXJlYSAoLio/KT4vLCAnPHRleHRhcmVhPicpKSlcbiAgICAgICAgfVxuICAgICAgICAkKCcuaW1hZ2VzLWxpc3QnKS50b2dnbGVDbGFzcygnd2l0aC1jb21tZW50cycsIGVkaXRvci5zZXR0aW5ncy5mcF9pbWFnZXNfd2l0aF9jb21tZW50cyA9PSB0cnVlKTtcblxuICAgICAgICB0aGlzLmFwcC5zZXJ2aWNlKCdVcGxvYWRhYmxlc0xpc3QnKS5pbml0KCk7XG4gICAgICAgIHRoaXMuYXBwLnNlcnZpY2UoJ0Ryb3B6b25lTWFuYWdlcicpLmluaXQoKTtcbiAgICB9LFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFwidXNlIHN0cmljdFwiO1xuICAgICAgICBjb25zb2xlLmxvZygnc3VibWl0Jyk7XG5cbiAgICAgICAgLy8gU3VibWl0IEhUTUwgdG8gVGlueU1DRTpcblxuICAgICAgICB2YXIgaW1hZ2VzSWRzID0gW107XG4gICAgICAgIHZhciBjb21tZW50cyA9IHt9O1xuICAgICAgICB2YXIgaW1hZ2VzSHRtbCA9ICcnO1xuICAgICAgICAkKCcuaW1hZ2VzLWxpc3QgLmltYWdlW2RhdGEtaWRdJykubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGltYWdlc0lkcy5wdXNoKCQodGhpcykuZGF0YShcImlkXCIpKTtcbiAgICAgICAgICAgIHZhciBjb21tZW50ID0gJCh0aGlzKS5maW5kKCd0ZXh0YXJlYScpLnZhbCgpIHx8ICcnO1xuICAgICAgICAgICAgaWYoY29tbWVudCkge1xuICAgICAgICAgICAgICAgIGNvbW1lbnRzWyQodGhpcykuZGF0YShcImlkXCIpXSA9IGNvbW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc3RyID0gJCh0aGlzKVswXS5vdXRlckhUTUwucmVwbGFjZSgvKFxcLlxcLlxcLykrL2csICcvJykucmVwbGFjZSgvPHRleHRhcmVhKC4qKTxcXC90ZXh0YXJlYT4vZywgJzx0ZXh0YXJlYSBzdHlsZT1cImhlaWdodDonICsgKE1hdGgubWF4KDIwLCAxNCAqIGNvbW1lbnQubGVuZ3RoIC8gMjApKSArICdweFwiPicgKyBjb21tZW50ICsgJzwvdGV4dGFyZWE+Jyk7XG4gICAgICAgICAgICBpbWFnZXNIdG1sICs9IHN0cjtcblxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhpbWFnZXNIdG1sKTtcblxuICAgICAgICB2YXIgdHlwZUNsYXNzTmFtZSA9IChnZXRRdWVyeVBhcmFtZXRlcnMoKS50eXBlID09ICdCVVRUT05fR0FMTEVSWScgPyAndHlwZS1nYWxsZXJ5JyA6ICd0eXBlLWltYWdlJyk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuaW5zZXJ0Q29udGVudCgnPGRpdiBjbGFzcz1cIm1jZU5vbkVkaXRhYmxlIGdhbGxlcnlQbGFjZWhvbGRlciAnICsgdHlwZUNsYXNzTmFtZSArICdcIiBkYXRhLWltYWdlcz1cIicgKyBpbWFnZXNJZHMgKyAnXCIgZGF0YS1jb21tZW50cz1cIicgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoY29tbWVudHMpKSArICdcIj4nICsgaW1hZ2VzSHRtbCArICc8L2Rpdj4nKTtcbiAgICB9XG5cbn07XG4iLCJmdW5jdGlvbiBXeXNpd3lnTWFuYWdlcihhcHApIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLnNldE9wdGlvbnMoKTsgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgIHRoaXMub3B0aW9uc1t0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3JdID0gZ2V0RGVmYXVsdFRpbnlNY2VPcHRpb25zKCk7XG59XG5cbld5c2l3eWdNYW5hZ2VyLnByb3RvdHlwZSA9IHtcbiAgICBhcHA6IG51bGwsXG4gICAgZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjogJ3RleHRhcmVhW2RhdGEtd3lzaXd5Z10nLFxuICAgIG9wdGlvbnM6IHt9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEBwYXJhbSBzZWxlY3RvclxuICAgICAqL1xuICAgIHNldE9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zLCBzZWxlY3Rvcikge1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSBzZWxlY3RvciA9IHRoaXMuZGVmYXVsdFd5c2l3eWdTZWxlY3RvcjtcbiAgICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0gPSAkLmV4dGVuZCh0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY3NzXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgYWRkQ29udGVudENzczogZnVuY3Rpb24gKGNzcywgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2NzcyA9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2NzcyA9IFt0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLmNvbnRlbnRfY3NzXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnNbc2VsZWN0b3JdLmNvbnRlbnRfY3NzID0gdGhpcy5vcHRpb25zW3NlbGVjdG9yXS5jb250ZW50X2Nzcy5jb25jYXQoY3NzKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwbHVnaW5OYW1lXG4gICAgICogQHBhcmFtIHNlbGVjdG9yXG4gICAgICovXG4gICAgYWRkUGx1Z2luOiBmdW5jdGlvbiAocGx1Z2luTmFtZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0ucGx1Z2lucyA9IHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0ucGx1Z2lucy5jb25jYXQocGx1Z2luTmFtZSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1dHRvbnNcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICBhcHBlbmRUb29sYmFyOiBmdW5jdGlvbiAoYnV0dG9ucywgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG4gICAgICAgIGlmICghYnV0dG9ucy5zdGFydHNXaXRoKCcgJykpIHtcbiAgICAgICAgICAgIGJ1dHRvbnMgPSAnICcgKyBidXR0b25zO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhciArPSBidXR0b25zO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZW1vdmVcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICByZW1vdmVGcm9tVG9vbGJhcjogZnVuY3Rpb24gKHJlbW92ZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFzZWxlY3Rvcikgc2VsZWN0b3IgPSB0aGlzLmRlZmF1bHRXeXNpd3lnU2VsZWN0b3I7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS50b29sYmFyID0gdGhpcy5vcHRpb25zW3NlbGVjdG9yXS50b29sYmFyLnJlcGxhY2UocmVtb3ZlLCAnJyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1dHRvbnNcbiAgICAgKiBAcGFyYW0gc2VsZWN0b3JcbiAgICAgKi9cbiAgICBwcmVwZW5kVG9vbGJhcjogZnVuY3Rpb24gKGJ1dHRvbnMsIHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICghc2VsZWN0b3IpIHNlbGVjdG9yID0gdGhpcy5kZWZhdWx0V3lzaXd5Z1NlbGVjdG9yO1xuICAgICAgICBpZiAoIWJ1dHRvbnMuZW5kc1dpdGgoJyAnKSkge1xuICAgICAgICAgICAgYnV0dG9ucyA9IGJ1dHRvbnMgKyAnICc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zW3NlbGVjdG9yXS50b29sYmFyID0gYnV0dG9ucyArIHRoaXMub3B0aW9uc1tzZWxlY3Rvcl0udG9vbGJhcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7V3lzaXd5Z01hbmFnZXIub3B0aW9uc3x7fX1cbiAgICAgKi9cbiAgICBnZXRPcHRpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnM7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBpbml0QWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlZGl0b3JQcm9taXNlcyA9IFtdO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIF90aGlzLmluaXRDdXN0b21Nb2R1bGVzKCk7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5nZXRPcHRpb25zKCk7XG5cbiAgICAgICAgX3RoaXMuYXBwLmZpcmUoJ2JlZm9yZUFsbFd5c2l3eWdJbml0Jyk7XG4gICAgICAgIGZvciAodmFyIHNlbGVjdG9yIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KHNlbGVjdG9yKSkge1xuXG4gICAgICAgICAgICAgICAgJChzZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnNbc2VsZWN0b3JdLnNldHVwID0gZnVuY3Rpb24gKGVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy90b2RvOiDRg9Cx0YDQsNGC0Ywg0LPQu9C+0LHQsNC70YzQvdGL0LkgdGlueW1jZSwg0Lgg0LTQtdGA0LPQsNGC0Ywg0LrQvtC90LrRgNC10YLQvdGL0Lkg0YDQtdC00LDQutGC0L7RgFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbnltY2UudHJpZ2dlclNhdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLm9uKCdpbml0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1c3RvbVRvb2xiYXIgPSAkKHRoaXMpLmRhdGEoJ3d5c2l3eWdUb29sYmFyJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ2ltYWdlc1dpdGhDb21tZW50cycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zW3NlbGVjdG9yXSA9ICQuZXh0ZW5kKG9wdGlvbnNbc2VsZWN0b3JdLCB7J2ZwX2ltYWdlc193aXRoX2NvbW1lbnRzJzogdHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uc1tzZWxlY3Rvcl0gPSAkLmV4dGVuZChvcHRpb25zW3NlbGVjdG9yXSwgeydib2R5X2NsYXNzJzogXCJmcF9pbWFnZXNfd2l0aF9jb21tZW50c1wifSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbVRvb2xiYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykudGlueW1jZSgkLmV4dGVuZChvcHRpb25zW3NlbGVjdG9yXSwgeyd0b29sYmFyJzogY3VzdG9tVG9vbGJhcn0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykudGlueW1jZShvcHRpb25zW3NlbGVjdG9yXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlZGl0b3JQcm9taXNlcy5wdXNoKGQucHJvbWlzZSgpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgICQud2hlbi5hcHBseSgkLCBlZGl0b3JQcm9taXNlcykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5hcHAuZmlyZSgnYWZ0ZXJBbGxXeXNpd3lnSW5pdCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgaW5pdEN1c3RvbU1vZHVsZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5hcHAuc2VydmljZSgnR2FsbGVyeU1vZHVsZScpLnJlZ2lzdGVyKCk7XG4gICAgICAgIHRoaXMuYWRkUGx1Z2luKFsnZ2FsbGVyeSddKTtcbiAgICB9XG59O1xuIl19
