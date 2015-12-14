/**
 * Created by xpundel on 02.03.15.
 */

//= ../../../../bower_components/jquery/dist/jquery.js
//= ../../../../bower_components/underscore/underscore.js
//= ../../../../bower_components/underscore.string/dist/underscore.string.js

$(document).ready(function () {
    $(document).on('click', '.cms-module-list-content button.status', function () {
        var $tr = $(this).closest('tr[data-id]');
        var id = $tr.data('id');
        var model = $(this).closest('table[data-model]').data('model');
        var payload = new Object();
        payload.setWithPath(['toggle', model, id, 'status'], 1);
        payload = appendCsrfToken(payload);
        $.post('./', payload, 'json').done(function (result) {
            $tr.toggleClass('inactive', !result);
        });

    });
});

function appendCsrfToken(payload) {
    payload['_token'] = $('input:hidden[name=_token]').val();
    return payload
}



