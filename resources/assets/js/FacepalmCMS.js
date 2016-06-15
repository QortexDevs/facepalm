var FacepalmCMS = {

    defaultWysiwygSelector: 'textarea[data-wysiwyg]',
    wysiwygOptions: {},
    callbacks: {
        init: [],
        load: [],
    },

    init: function () {
        this.setWysiwygOptions({});
        this.callbacks.init.map(function(callback) {callback()})
    },

    setWysiwygOptions: function (options, selector) {
        if (!selector) selector = this.defaultWysiwygSelector;
        this.wysiwygOptions[selector] = options;
    },

    getWysiwygOptions: function () {
        return this.wysiwygOptions;
    },

    onInit: function (callback) {
        this.callbacks.init.push(callback);
    }
};