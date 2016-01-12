/**
 * Created by xpundel on 02.03.15.
 */

//= ../../../../bower_components/jquery/dist/jquery.js
//= ../../../../bower_components/underscore/underscore.js
//= ../../../../bower_components/underscore.string/dist/underscore.string.js
//= ../../../../bower_components/moment/moment.js
//= ../../../../bower_components/pikaday-time/pikaday.js
//= ../../../../bower_components/growl/javascripts/jquery.growl.js
//= ../../../../bower_components/dropzone/dist/dropzone.js

$(document).ready(function () {


    $(document).on('click', '.cms-module-list-content button.status', function () {
        var $tr = $(this).closest('tr[data-id]');
        var id = $tr.data('id');
        var model = $(this).closest('table[data-model]').data('model');
        var payload = _.extend({}.setWithPath(['toggle', model, id, 'status'], 1), getCsrfTokenParameter());
        $.post('./', payload, 'json').done(function (result) {
            $tr.toggleClass('inactive', !result);
        });
        return false;
    });

    $(document).on('click', '.form-buttons button.save-button', function () {
        var formData = $('.main-cms-form').serialize();

        toggleSpinner(true);
        toggleFormButtons(false);

        // Minimum delay to avoid unpleasant blinking
        $.when($.post('./', formData), delay(800)).then(function () {
                $.growl.notice({title: '', message: "Cохранено"});
                toggleSpinner(false);
                toggleFormButtons(true);
            }
        );
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
    $(".dropzone").each(function () {
        $(this).dropzone({
            url: "./?_token=" + $('input:hidden[name=_token]').val(),
            paramName: $(this).data('input-name'),
            //maxFilesize: 2, // MB
            //uploadMultiple:true,
            //addRemoveLinks:true,
            //accept: function(file, done) {
            //    if (file.name == "justinbieber.jpg") {
            //        done("Naha, you don't.");
            //    }
            //    else { done(); }
            //}
        });
    })


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



