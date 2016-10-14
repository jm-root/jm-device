var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {

    jm.device.ComponentDevice = jm.Component.extend({
        _className: 'device',

        ctor: function (e, opts) {
            this._super(e, opts);
        }

    });

})();