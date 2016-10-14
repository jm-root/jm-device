var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {

    var logger = jm.getLogger('jm-device:receiptPrinter');
    var device = jm.device;
    var utils = device.utils;

    jm.device.ComponentReceiptPrinter = jm.device.ComponentDevice.extend({
        _className: 'receiptPrinter',
        _singleton: false,

        ctor: function (e, opts) {
            this.noPaper = false;
            this._super(e, opts);
        },

        onAdd: function (e) {
            this._super(e);
            var self = this;

            e.on('data', function (dv, len) {
                for (var i = 0; i < len; i++) {
                    var v = dv.getInt8(i);
                    var b = v >= 1;
                    if (this.noPaper != b) {
                        this.noPaper = b;
                        e.emit('status', b);
                    }
                }
            });
        },

        reset: function () {
            var buffer = new Uint8Array([0x1B, 0x40]);
            this.print(buffer);
        },

        getStatus: function () {
            var buffer = new Uint8Array([0x10, 0x04, 0x04]);
            this.print(buffer);
        },

        print: function (data, len) {
            var e = this.entity;
            var sp = e.serialPort.serialPort;
            if (sp) {
                return sp.write(data, len);
            }
            return 0;
        },

        cut: function (halfCut) {
            var buffer = new Uint8Array([0x1B, 0x69]);
            if (halfCut) {
                buffer = new Uint8Array([0x1B, 0x6D]);
            }
            this.print(buffer);
        },

        zouzhi: function (n) {
            n = n || 30;
            var buffer = new Uint8Array([0x1B, 0x4A, n]);
            this.print(buffer);
        },

        setAlign: function (n) {
            n = n || 0;
            var buffer = new Uint8Array([0x1B, 0x61, n]);
            this.print(buffer);
        },

        setLineSpace: function (n) {
            n = n || 0;
            var buffer = new Uint8Array([0x1B, 0x32]);
            if (n) {
                buffer = new Uint8Array([0x1B, 0x33, n]);
            }
            this.print(buffer);
        },

        setPosition: function (col, row) {
            col = col || 0;
            row = row || 0;
            var buffer = new Uint8Array([0x1B, 0x24, col, row]);
            this.print(buffer);
        },

        setFontSize: function (opts) {
            var cmd = 0x1B;
            var n = 0;
            if (opts.scaleHeight) n |= 0x20;
            if (opts.scaleWidth) n |= 0x10;
            if (opts.hanzi) {
                n = 0;
                cmd = 0x1C;
                if (opts.scaleHeight) n |= 0x8;
                if (opts.scaleWidth) n |= 0x4;
            }
            var buffer = new ArrayBuffer(4);
            var dv = new DataView(buffer);
            dv.setInt8(0, cmd, false);
            dv.setInt8(1, 0x21, false);
            dv.setInt8(2, n, false);
            var len = 3;
            this.print(dv, len);
        },

        setHanziFontSize: function (scaleWidth, scaleHeight) {
            var opts = {
                hanzi: true,
                scaleWidth: scaleWidth,
                scaleHeight: scaleHeight
            };
            this.setFontSize(opts);
        },

        setXiwenFontSize: function (scaleWidth, scaleHeight) {
            var opts = {
                hanzi: false,
                scaleWidth: scaleWidth,
                scaleHeight: scaleHeight
            };
            this.setFontSize(opts);
        }

    });

})();