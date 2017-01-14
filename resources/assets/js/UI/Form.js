function Form(app) {
    this.app = app;
}

Form.prototype = {
    app: null,

    initNestedForms: function () {
        $('.nested-form button[data-action="add-item"]').on('click', function () {
            var randomId = '%CREATE_' + Math.random().toString(36).substring(2, 8) + '%';
            var template = $(this).closest('.nested-form').find('script.template').html().replace(/\[]/g, '[' + randomId + ']');
            $(this).closest('.nested-form').find('.nested-form-table').append($(template));
            return false;
        });
    },
    init: function () {
        this.initSave();
        this.initDatepicker();
        this.initNestedForms();
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