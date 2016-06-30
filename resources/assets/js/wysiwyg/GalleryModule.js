function GalleryModule(app) {
    this.app = app;
}

GalleryModule.prototype = {
    app: null,

    register: function () {
        var _this = this;

        tinymce.PluginManager.add('gallery', function (editor, url) {
            // Add a button that opens a window
            editor.addButton('fp:gallery', {
                text: 'Галерея',
                icon: false,
                onclick: function () {
                    // Open window
                    var baseUrl = $('body').data('base-url');

                    var win = editor.windowManager.open({
                        title: 'Галерея',
                        width: 630,
                        height: 400,
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
                        url: '/assets/facepalm/include/templates/galleryDialog.html?_token=' + _this.app.getCsrfTokenParameter()._token + '&baseUrl=' + baseUrl,
                    });
                }
            });

            editor.addButton('fp:image', {
                text: 'Картинка',
                icon: false,
                onclick: function () {
                    // Open window
                    var baseUrl = $('body').data('base-url');

                    var win = editor.windowManager.open({
                        title: 'Картинка',
                        width: 430,
                        height: 200,
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
                        url: '/assets/facepalm/include/templates/imageDialog.html?_token=' + _this.app.getCsrfTokenParameter()._token + '&baseUrl=' + baseUrl,
                    });
                }
            });

        });

    }
};
