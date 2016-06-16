function InitWysiwyg() {


    var defaultOptions = {
        content_css: '/assets/facepalm/css/content.css',
        language: 'ru',
        menubar: false,
        statusbar: false,
        style_formats: [
            {title: 'Обычный текст', block: 'p'},
            {title: 'Заголовок', block: 'h2'},
            {title: 'Подзаголовок', block: 'h3'},
            {title: 'Врезка', block: 'blockquote'},
            // { title: 'Table row 1', selector: 'tr', classes: 'tablerow1' }
        ],

        // extended_valid_elements: 'img[class=myclass|!src|border:0|alt|title|width|height|style]',
        // invalid_elements: 'strong,b,em,i',

        plugins: ['fixedtoolbar', 'autoresize', 'codemirror', 'link', 'autolink', 'media', 'noneditable', 'paste', 'table', 'visualblocks'],
        toolbar: 'styleselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image table media | visualblocks code',

        images_upload_url: 'postAcceptor.php',
        images_upload_base_path: '/some/basepath',
        images_upload_credentials: true,
        image_caption: true,

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
    var options = FacepalmCMS.getWysiwygOptions();
    var editorPromises = [];
    for (var selector in options) {
        if (options.hasOwnProperty(selector)) {
            var currentOptions = $.extend(defaultOptions, options[selector]);

            if (currentOptions.content_css_add) {
                if (typeof currentOptions.content_css == 'string') {
                    currentOptions.content_css = [currentOptions.content_css];
                }
                currentOptions.content_css = currentOptions.content_css.concat(currentOptions.content_css_add)
            }
            if (currentOptions.pluginsAdd) {
                currentOptions.plugins = currentOptions.plugins.concat(currentOptions.pluginsAdd);
            }
            if (currentOptions.toolbarAdd) {
                currentOptions.toolbar += currentOptions.toolbarAdd;
            }

            $(selector).each(function () {
                var d = $.Deferred();
                currentOptions.setup = function (editor) {
                    editor.on('change', function () {
                        tinymce.triggerSave();
                    });
                    editor.on('init', function () {
                        d.resolve();
                    });
                };

                $(this).tinymce(currentOptions);

                editorPromises.push(d.promise());
            });
        }
    }

    $.when.apply($, editorPromises).then(function () {
    });
}

