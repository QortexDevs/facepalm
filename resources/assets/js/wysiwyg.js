function InitWysiwyg() {
    var defaultOptions = {
        content_css: '/assets/facepalm/css/content.css',
        language: 'ru',
        menubar: false,
        statusbar: false,
        fixed_toolbar_container: true,
        style_formats: [
            {title: 'Обычный текст', block: 'p'},
            {title: 'Заголовок', block: 'h2'},
            {title: 'Подзаголовок', block: 'h3'},
            {title: 'Врезка', block: 'blockquote'},
            // { title: 'Table row 1', selector: 'tr', classes: 'tablerow1' }
        ],

        // extended_valid_elements: 'img[class=myclass|!src|border:0|alt|title|width|height|style]',
        // invalid_elements: 'strong,b,em,i',

        plugins: ['autoresize', 'codemirror', 'link', 'autolink', 'media', 'noneditable', 'paste', 'table', 'template', 'visualblocks'],
        toolbar: 'styleselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link table media | visualblocks code',

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

        setup: function (editor) {
            editor.on('change', function () {
                tinymce.triggerSave();
            });
        },

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
    for (var selector in options) {
        if (options.hasOwnProperty(selector)) {
            var currentOptions = $.extend(defaultOptions, options[selector]);
            $(selector).tinymce(currentOptions);
        }
    }

}

