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
        })


    },


};