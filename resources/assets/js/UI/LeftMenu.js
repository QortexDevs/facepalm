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

