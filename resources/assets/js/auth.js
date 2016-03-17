function Auth() {

}

Auth.prototype = {
    init: function () {
        var _this = this;
        $('.login-form form').on('submit', function () {
            $.post($(this).attr('action'), $(this).serialize(), 'json').done(function (response) {
                if (response.user) {
                    document.location.href = '/cms/settings/';
                } else {
                    _this.shake();
                    if (response.errors) {
                        for (var i in response.errors) {
                            $.growl.error({title: '', message: response.errors[i]});
                        }
                    }
                }
            }).error(function (response) {
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