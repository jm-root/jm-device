var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {

    var logger = jm.getLogger('jm-device:billAcceptor');
    var device = jm.device;
    var utils = device.utils;

    jm.device.ComponentBillAcceptor = jm.device.ComponentDevice.extend({
        _className: 'billAcceptor',
        _singleton: false,

        //ICT106 General Protocol For RS232
        statusDict: {
            0x3E: 'Bill Acceptor enable',
            0x5E: 'Bill Acceptor disable',
            0x71: 'Bill Acceptor busy',
            0x80: 'Bill Acceptor reset',
            0x81: 'Bill type',
            0xa1: 'Power Supply On communication',

            0x10: 'Bill accept finished',
            0x11: 'Bill accept failed',

            0x20: 'Motor failure',
            0x21: 'Checksum error',
            0x22: 'Bill jam',
            0x23: 'Bill remove',
            0x24: 'Stacker open',
            0x25: 'Sensor problem',
            0x26: 'Communication failed',
            0x27: 'Bill fish',
            0x28: 'Stacker problem',
            0x29: 'Bill reject',
            0x2A: 'Invalid command',
            0x2E: ' Reserved',
            0x2F: 'Exception has been recovered'
        },

        billDict: {
            0: 1,
            1: 5,
            2: 10,
            3: 20,
            4: 50,
            5: 100
        },

        properties: {
            enable: {get: 'getEnable', set: 'setEnable'}
        },

        ctor: function (e, opts) {
            this._super(e, opts);
            this._enable = true;
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

        onData: function (dv, len) {
            var self = this;
            var e = self.entity;
            var buf = new Uint8Array(dv.buffer);
            var status = buf[0];
            self.status = status;
            e.emit('status', status, self.statusDict[status]);
            switch (buf[0]) {
                case 0x80:
                    if (len == 2 && buf[1] == 0x8F) {
                        logger.debug('billAcceptor request reset.')
                        this.accept();
                    }
                    break;
                case 0x81:
                    if (len == 3 && buf[1] == 0x8F) {
                        var v = buf[2] - 0x40;
                        self.bill = v;
                        var bill = v;
                        var billValue = self.billDict[bill];
                        e.emit('escrow', bill, billValue);
                        logger.debug('billAcceptor request escrow ' + bill + ' ' + billValue);
                        if (self.noEscrow) {
                            self.accept();
                        }
                    }
                    break;
                case 0x10:
                    var bill = self.bill;
                    var billValue = self.billDict[bill];
                    e.emit('bill', bill, billValue);
                    logger.debug('billAcceptor accept bill ' + bill + ' ' + billValue);
                    break;
                case 0x11:
                    logger.debug('billAcceptor accept bill failed ' + self.bill);
                    break;
                case 0x3E:
                    this._enable = true;
                    break;
                case 0x5E:
                    this._enable = false;
                    break;
            }
        },

        reset: function () {
            this.send([0x30]);
        },

        getStatus: function () {
            this.send([0x0C]);
        },

        accept: function () {
            this.send([0x02]);
        },

        reject: function () {
            this.send([0x0F]);
        },

        holdAt: function () {
            this.send([0x18]);
        },

        getEnable: function () {
            return this._enable;
        },

        setEnable: function (bEnable) {
            if (bEnable) {
                this.send([0x3E]);
            } else {
                this.send([0x5E]);
            }
        },

        send: function (data, len) {
            var e = this.entity;
            var sp = e.serialPort.serialPort;
            if (sp) {
                return sp.write(data, len);
            }
            return 0;
        }

    });

})();