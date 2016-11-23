var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {
    if(jm.device.SerialPort) return;
    var logger = jm.getLogger('jm-device:serialPort');
    var device = jm.device;
    var utils = device.utils;

    if(!jm.Uart){
        //模拟jm.Uart
        jm.Uart = jm.EventEmitter.extend({
            _className: 'Uart',

            ctor: function (opts) {
                this._super(opts);
            },

            open: function (portName, baudRate, config) {
                return true;
            },

            close: function() {
            },

            read: function(dv, len) {
                return 0;
            },

            write: function(dv, len) {
                return len;
            }
        });
    }

    jm.device.SerialPort = jm.EventEmitter.extend({
        _className: 'SerialPort',

        ctor: function (opts) {
            this._super(opts);
            if (jm.Uart) {
                this.uart = new jm.Uart();
            }
        },

        /*
         *
         * portName可以为序号或者字符串,对应关系为
         * 0: COM1 /dev/ttyS0
         * 1: COM2 /dev/ttyS1
         * 依次类推
         * optName=0 等价于win32下optName='COM1' 及 linux下optName='ttyS0'
         *
         * opts为串口配置参数, 默认值为
         * {
         *   baudRate: 9600
         *   config: 0,
         *   bufferLen: 128,
         *   readInterval: 100
         * }
         * 表示波特率9600 8数据位 1停止位 无校验 读缓冲区128字节 读间隔时间100毫秒
         *
         * config为组合参数，例如
         * config = jm.device.SerialPort.DATABIT7 | jm.device.SerialPort.STOPBIT2
         * 表示7数据位， 2停止位
         *
         * */
        open: function (portName, opts) {
            if (!this.uart) return false;
            var baudRate = 9600;
            var config = 0;
            var bufferLen = 128;
            var readInterval = 100;
            if (opts) {
                if (opts.baudRate)
                    baudRate = opts.baudRate;
                if (opts.config)
                    config = opts.config;
                if (opts.bufferLen)
                    bufferLen = opts.bufferLen;
                if (opts.interval)
                    readInterval = opts.interval;
            }
            this.portName = portName;
            this.opts = opts;
            var uart = this.uart;
            if (uart.open(portName, baudRate, config)) {
                var buffer = new ArrayBuffer(bufferLen);
                this.readBuffer = buffer;
                this.readDataView = new DataView(buffer);
                this.emit('open');
                logger.debug(this.portName + ' opened');
                return true;
            }
            return false;
        },

        close: function () {
            if (!this.uart) return;
            var uart = this.uart;
            uart.close();
            this.emit('close');
            logger.debug(this.portName + ' closed');
        },

        write: function (dvOrBuffer, len) {
            if (!this.uart) return 0;
            var uart = this.uart;

            var dv = dvOrBuffer;
            if (dv instanceof Array) {
                dv = new Uint8Array(dv);
            }
            len = len || dv.byteLength;
            if (len <= 0) return 0;
            if (dv instanceof ArrayBuffer) {
                dv = new DataView(dv);
            } else if (dv instanceof Uint8Array) {
                dv = new DataView(dv.buffer, dv.byteOffset, len);
            }
            if (!dv instanceof DataView) return 0;
            var r = uart.write(dv, len);
            if(jm.debug){
                var s = this.portName + ' sended: len:' + r + ' hex:[';
                s += utils.dataViewToHex(dv, len);
                s += ']'
                logger.debug(s);
            }
            return r;
        },

        update: function () {
            if (!this.uart) return;
            var uart = this.uart;

            var dv = this.readDataView;
            var len = uart.read(dv, this.readBuffer.byteLength);
            if (len > 0) {
                this.emit('data', dv, len);
                if(jm.debug){
                    var s = this.portName + ' recevied: len:' + len + ' hex:[';
                    s += utils.dataViewToHex(dv, len);
                    s += ']'
                    logger.debug(s);
                }
            }
        }

    });

    var SerialPortConsts = {
        // UART DATA BIT
        DATABIT7: 0x01,
        DATABIT8: 0x00,

        // UART STOP BIT
        STOPBIT1: 0x00,
        STOPBIT2: 0x02,

        // UART PARITY BIT
        PARITYNONE: 0x00,
        PARITYODD: 0x0c,
        PARITYEVEN: 0x08
    };

    for (var key in SerialPortConsts) {
        var prototype = jm.device.SerialPort.prototype;
        prototype[key] = SerialPortConsts[key];
    }

    jm.device.ComponentSerialPort = jm.device.ComponentDevice.extend({

        _className: 'serialPort',
        _singleton: false,

        ctor: function (e, opts) {
            this.serialPort = new jm.device.SerialPort();
            this._super(e, opts);
            if (opts.autoOpen) {
                this.serialPort.open(opts.portName, opts.params);
            }
        },

        onAdd: function (e) {
            this._super(e);
            var self = this;

            e.on('add', function (em) {
                self.serialPort.on('data', function (dv, len) {
                    e.emit('data', dv, len);
                });

                em.on('exit', function (o) {
                    self.serialPort.close();
                });
            });
        },

        update: function() {
            this.serialPort.update();
        },

        read: function(dv, len) {
            return this.serialPort.read(dv, len);
        },

        write: function(dv, len) {
            return this.serialPort.write(dv, len);
        }

    });

})();
