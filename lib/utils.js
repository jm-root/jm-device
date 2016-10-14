var jm = jm || {};
if ((typeof exports !== 'undefined' && typeof module !== 'undefined')) {
    jm = require('jm-ecs');
}

(function () {
    var device = jm.device || {};

    /**
     * utils对象
     * @class  utils
     */
    device.utils = {

        formatJSON: function (o) {
            return JSON.stringify(o, null, 2);
        },

        dataViewToHex: function (dvOrBuffer, len) {
            var dv = dvOrBuffer;
            if (dv instanceof Array) {
                dv = new Uint8Array(dv);
            }
            len = len || dv.byteLength;
            if (dv instanceof ArrayBuffer) {
                dv = new DataView(dv);
            } else if (dv instanceof Uint8Array) {
                dv = new DataView(dv.buffer, dv.byteOffset, len);
            }
            if (!dv instanceof DataView) return '';

            var s = '';
            for (var i = 0; i < len; i++) {
                var v = dv.getUint8(i);
                if (i == 0) {
                    s = v.toString(16);
                } else {
                    s += ' ' + v.toString(16);
                }
            }
            return s;
        },

        dataViewToString: function (dv, len) {
            var s = '';
            for (var i = 0; i < len; i++) {
                var v = dv.getInt8(i);
                s += String.fromCharCode(v);
            }
            return s;
        }
    };
})();
