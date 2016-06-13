function InitWysiwyg() {
    // var baseUrl = $('body').data('base-url');
    //
    // $('textarea[data-wysiwyg]').each(function () {
    //     $(this).ckeditor({
    //         customConfig: '',
    //         toolbarGroups: [
    //             {name: 'clipboard', groups: ['clipboard', 'undo']},
    //             {name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing']},
    //             {name: 'forms', groups: ['forms']},
    //             {name: 'styles', groups: ['styles']},
    //             {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
    //             {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph']},
    //             {name: 'links', groups: ['links']},
    //             {name: 'insert', groups: ['insert']},
    //             {name: 'colors', groups: ['colors']},
    //             {name: 'tools', groups: ['tools']},
    //             {name: 'others', groups: ['others']},
    //             {name: 'about', groups: ['about']},
    //             {name: 'document', groups: ['mode', 'document', 'doctools']}
    //         ],
    //         removeButtons: 'autoFormat,CommentSelectedRange,UncommentSelectedRange,AutoComplete,Save,NewPage,Preview,Print,Cut,Copy,Paste,PasteText,PasteFromWord,Undo,Redo,Find,Replace,SelectAll,Scayt,Form,Checkbox,Radio,TextField,Textarea,Button,Select,HiddenField,Templates,Underline,Italic,Subscript,Strike,Superscript,JustifyBlock,BidiLtr,BidiRtl,Language,Embed,CodeSnippet,Flash,SpecialChar,Smiley,PageBreak,Iframe,Font,FontSize,TextColor,BGColor,About,Anchor,Unlink,Outdent,Indent',
    //         codemirror: {
    //             theme: 'monokai'
    //         },
    //         extraPlugins: 'uploadimage',
    //         uploadUrl: baseUrl + "/?_token=" + $('input:hidden[name=_token]').val() + '&fileFromWysiwyg=1',
    //     });
    // });

    var buttons = ['html', 'formatting', 'bold', 'italic', 'unorderedlist', 'link'];
    var plugins = ['bufferbuttons', 'table', 'fullscreen'];
    $('textarea[data-wysiwyg]').each(function () {
        $(this).redactor({
            buttons: buttons,

            toolbarFixed: true,
            minHeight: $(this).height(),

            lang: 'ru',
            focus: false,
            codemirror: true,

            formatting: ['p', 'h2', 'h3'],
            plugins: $(this).is('.easy') ? [] : plugins,

            imageUpload: './',
            imageUploadParam: 'Filedata',
            imageResizable: false,
            imagePosition: false,
            convertImageLinks: false,
            uploadImageFields: {type: 'image', fromWysiwyg: true},

            fileUpload: './',
            fileUploadParam: 'fileFromWysiwyg',

            cleanStyleOnEnter: true, //If set to 'true', this setting will prevent new paragraph from inheriting styles, classes and attributes form a previous paragraph
            allowedTags: ['p', 'h2', 'h3', 'h4', 'pre', 'a', 'i', 'b', 'em', 'strong', 'ul', 'ol', 'li', 'img', 'iframe', 'blockquote', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'span', 'br', 'hr', 'dl', 'dd', 'dt'],
            removeEmpty: ['h3', 'pre', 'a', 'i', 'b', 'em', 'strong', 'ul', 'ol', 'li', 'span'],
            //allowedAttr:  [
            //    ['p', 'class'],
            //    ['span', 'style'],
            //],
            replaceTags: [
                ['i', 'em'],
                ['b', 'strong'],
            ],

            changeCallback: function () {
            }

        });

        CodeMirror.fromTextArea($(this)[0], {
            lineNumbers: true,
            lineWrapping: true,
            htmlMode: true,
            theme: 'base16-dark'
        });
    });

    if (!RedactorPlugins) var RedactorPlugins = {};

    RedactorPlugins.bufferbuttons = function () {
        return {
            init: function () {
                var undo = this.button.addFirst('undo', 'Отменить');
                var redo = this.button.addAfter('undo', 'redo', 'Вернуть');

                this.button.addCallback(undo, this.buffer.undo);
                this.button.addCallback(redo, this.buffer.redo);
            }
        };
    };

    RedactorPlugins.inserthtml = function () {
        return {
            getTemplate: function () {
                return String()
                    + '<section id="redactor-modal-inserthtml">'
                    + '<textarea id="mymodal-textarea" rows="40" style="height: 400px;"></textarea>'
                    + '</section>';
            },
            init: function () {
                var button = this.button.add('inserthtml', 'Вставить HTML');
                this.button.addCallback(button, this.inserthtml.show);

                // make your added button as Font Awesome's icon
                this.button.setAwesome('inserthtml', 'fa-code');
            },
            show: function () {
                this.modal.addTemplate('inserthtml', this.inserthtml.getTemplate());

                this.modal.load('inserthtml', 'Вставьте HTML код', 800);

                this.modal.createCancelButton();

                var button = this.modal.createActionButton('Insert');
                button.on('click', this.inserthtml.insert);

                this.selection.save();
                this.modal.show();

                $('#mymodal-textarea').focus();
            },
            insert: function () {
                var html = $('#mymodal-textarea').val();
                var data = this.clean.savePreCode('<pre>' + html + '</pre>')

                this.modal.close();
                this.selection.restore();

                var current = this.selection.getBlock() || this.selection.getCurrent();

                if (current) $(current).after(data);
                else {
                    this.insert.html(data);
                }

                this.code.sync();

            }
        };
    };

}

