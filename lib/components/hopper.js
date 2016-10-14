var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {

    var logger = jm.getLogger('jm-device:hopper');
    var device = jm.device;
    var utils = device.utils;

    jm.device.ComponentHopper = jm.device.ComponentDevice.extend({
        _className: 'hopper',
        _singleton: false,
        PACKETHEAD1: 0x05,
        PACKETHEAD2: 0x01,
        MAXPACKETLEN: 12,

        //MH China Protocol　Ver 0.4
        //ict miniHopper MH-245GA CN61
        statusDict: {
            0x1: 'Motor problem',
            0x2: 'Insufficient Coins',
            0x8: 'Reserve',
            0x10: 'Prism Sensor Failure',
            0x20: 'Shaft Sensor Failure',
            0x80: 'Dispenser is busy'
        },

        properties: {
            remainCoins: {get: 'getRemainCoins'}
        },

        ctor: function (e, opts) {
            this._super(e, opts);
            this._enable = true;
            this.machineId = opts.machineId || 0x03;
            this.buf = [0x05, 0x10, this.machineId, 0x00, 0x00, 0x00];

            this._data = new Uint8Array(this.MAXPACKETLEN);
            this._offset = 0;
            this._step = 0;
            this._packetLen = 6;
        },

        onAdd: function (e) {
            this._super(e);
            var self = this;

            e.on('add', function (em) {
                self.reset();
            });

            e.on('data', function (dv, len) {
                if (len > 0) {
                    self.onData(dv, len);
                }
            });
        },

        validPacket: function (buf, len) {
            var r = true;
            if (buf[2] == this.machineId && this.checkCrc(buf)) {
            } else {
                r = false;
            }
            if (!r) {
                logger.debug('validPacket fail: ' + utils.dataViewToHex(buf, len));
            }
            return r;
        },

        onPacket: function (buf, len) {
            var self = this;
            var e = self.entity;
            var cmd = buf[3];
            var val = buf[4];
            self.cmd = cmd;
            e.emit('cmd', cmd);
            switch (cmd) {
                case 0x04:
                    var status = val;
                    self.status = status;
                    e.emit('status', status);
                    break;
                case 0x07:
                    e.emit('payOutOne');
                    break;
                case 0x08:
                    e.emit('payOutFin');
                    break;
                case 0x09:
                    e.emit('clear');
                    break;
                case 0xAA:
                    this._remainCoins = val;
                    break;
                case 0xBB:
                    e.emit('payOutBusy');
                    break;
            }
        },

        onData: function (dv, len) {
            var self = this;
            var buf = new Uint8Array(dv.buffer);
            len = len || dv.byteLength;

            var packetLen = this._packetLen;
            var data = this._data;
            var offset = this._offset;
            var step = this._step;

            for (var i = 0; i < len; i++) {
                var c = buf[i];
                if (step == 0 && c == self.PACKETHEAD1) {
                    step++;
                } else if (step == 1 && c == self.PACKETHEAD2) {
                    step++;
                    data[offset++] = self.PACKETHEAD1;
                    data[offset++] = self.PACKETHEAD2;
                } else if (step == 2) {
                    data[offset++] = c;

                    if (offset == packetLen) {
                        if (this.validPacket(data, offset)) {
                            this.onPacket(data, packetLen);
                        }
                        step = 0;
                        offset = 0;
                    }
                } else {
                    step = 0;
                    offset = 0;
                }
            }

            this._offset = offset;
            this._step = step;
        },

        reset: function () {
            this.send([0x12, 0x00]);
        },

        getStatus: function () {
            this.send([0x11, 0x00]);
        },

        payOut: function (v, withMsg) {
            if (withMsg) {
                this.send([0x14, v]);
            } else {
                this.send([0x10, v]);
            }
        },

        readRemainCoins: function () {
            this.send([0x13, 0x00]);
        },

        getRemainCoins: function () {
            return this._remainCoins || 0;
        },

        calcCrc: function (data) {
            var c = 0;
            var len = 6;
            for (var i = 0; i < len - 1; i++) {
                c += data[i];
            }
            data[len - 1] = c;
            return c;
        },

        checkCrc: function (data) {
            var len = 6;
            var c = data[len - 1];
            var nc = this.calcCrc(data);
            return c == nc;
        },

        send: function (data) {
            var buf = this.buf;
            for (var i = 0; i < data.length; i++) {
                buf[i + 3] = data[i];
            }
            this.calcCrc(buf);
            var e = this.entity;
            var sp = e.serialPort.serialPort;
            if (sp) {
                return sp.write(buf);
            }
            return 0;
        }

    });

})();