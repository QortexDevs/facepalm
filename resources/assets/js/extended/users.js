/**
 * Created by xpundel on 04.04.16.
 */
$(document).ready(function () {
    if ($('tr[data-row-for-field="acl"]').length) {
        $('[data-row-for-field="role.name"] select').on('change', function () {

            var acl = $(this).find('option:selected').data('acl');

            if ($(this).val() == 1 || !$(this).val()) {
                $('tr[data-row-for-field="acl"]').hide();
            } else {
                $('tr[data-row-for-field="acl"]').show();
                $('ul.acl :checkbox').attr('checked', false);
                for (var path in acl) {
                    $('ul.acl :checkbox[name$="[acl][' + path + ']"]').attr('checked', true);
                }
            }
        }).trigger('change');
    }
});