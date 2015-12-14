/**
 * Created by xpundel on 14.12.15.
 */

Object.defineProperty(Object.prototype, 'setWithPath', {
    value: function (path, value) { /* Makes breakfast, solves world peace, takes out trash */
        if (typeof  path == 'string') {
            path = path.split('.');
        }
        if (!(path instanceof Array)) {
            return;
        }
        var cur = this;
        var fields = path;
        fields.map(function (field, index) {
            cur[field] = cur[field] || (index == fields.length - 1 ? (value || {}) : {});
            cur = cur[field];
        });

        return this;
    },
    writable: false,
    configurable: false,
    enumerable: false
});