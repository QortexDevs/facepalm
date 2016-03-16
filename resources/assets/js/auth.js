function Auth() {

}

Auth.prototype = {
    init: function () {
        $('.login-form form').on('submit', function () {
            $.post($(this).attr('action'), $(this).serialize(), 'json').done(function (response) {
                // console.log(response);
            }).error(function(response) {
                // console.log(response.responseJSON);
                $('.login-form').addClass('shake');
                setTimeout(function() {
                    $('.login-form').removeClass('shake');
                }, 1000);
            });
            return false;
        })
    }
};