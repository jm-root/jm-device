var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function(){
    jm.device = jm.device || {};
    var device = jm.device;

    var ERRCODE_DEVICE = 800;
    jm.ERR.device = {
        FA_INVALIDTYPE: {
            err: ERRCODE_DEVICE++,
            msg: '无效的类型'
        }
    };

    device.consts = {
        SEEK_SET: 0,
        SEEK_CUR: 1,
        SEEK_END: 2,

        RDONLY: 00000000,
        WRONLY: 00000001,
        RDWR: 00000002,

        CREAT: 00000100,
        EXCL: 00000200,
        NOCTTY: 00000400,
        TRUNC: 00001000,
        APPEND: 00002000,
        NONBLOCK: 00004000,
        SYNC: 00010000,
        FASYNC: 00020000,
        DIRECT: 00040000,
        LARGEFILE: 00100000,
        DIRECTORY: 00200000,
        NOFOLLOW: 00400000,
        NOATIME: 01000000,
        NDELAY: 00004000
    };

})();

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

/*
 *
 *   Copyright (c) 2001, Carlos E. Vidales. All rights reserved.
 *
 *   This sample program was written and put in the public domain
 *    by Carlos E. Vidales.  The program is provided "as is"
 *    without warranty of any kind, either expressed or implied.
 *   If you choose to use the program within your own products
 *    you do so at your own risk, and assume the responsibility
 *    for servicing, repairing or correcting the program should
 *    it prove defective in any manner.
 *   You may copy and distribute the program's source code in any
 *    medium, provided that you also include in each copy an
 *    appropriate copyright notice and disclaimer of warranty.
 *   You may also modify this program and distribute copies of
 *    it provided that you include prominent notices stating
 *    that you changed the file(s) and the date of any change,
 *    and that you do not charge any royalties or licenses for
 *    its use.
 *
 *
 *
 *   File Name:  calibrate
 *
 *
 *   This file contains functions that implement calculations
 *    necessary to obtain calibration factors for a touch screen
 *    that suffers from multiple distortion effects: namely,
 *    translation, scaling and rotation.
 *
 *   The following set of equations represent a valid display
 *    point given a corresponding set of touch screen points:
 *
 *
 *                                              /-     -\
 *              /-    -\     /-            -\   |       |
 *              |      |     |              |   |   Xs  |
 *              |  Xd  |     | A    B    C  |   |       |
 *              |      |  =  |              | * |   Ys  |
 *              |  Yd  |     | D    E    F  |   |       |
 *              |      |     |              |   |   1   |
 *              \-    -/     \-            -/   |       |
 *                                              \-     -/
 *
 *
 *    where:
 *
 *           (Xd,Yd) represents the desired display point
 *                    coordinates,
 *
 *           (Xs,Ys) represents the available touch screen
 *                    coordinates, and the matrix
 *
 *           /-   -\
 *           |A,B,C|
 *           |D,E,F| represents the factors used to translate
 *           \-   -/  the available touch screen point values
 *                    into the corresponding display
 *                    coordinates.
 *
 *
 *    Note that for practical considerations, the utilitities
 *     within this file do not use the matrix coefficients as
 *     defined above, but instead use the following
 *     equivalents, since floating point math is not used:
 *
 *            A = An/Divider
 *            B = Bn/Divider
 *            C = Cn/Divider
 *            D = Dn/Divider
 *            E = En/Divider
 *            F = Fn/Divider
 *
 *
 *
 *    The functions provided within this file are:
 *
 *          init() - calculates the set of factors
 *                                    in the above equation, given
 *                                    three sets of test points.
 *               transform() - returns the actual display
 *                                    coordinates, given a set of
 *                                    touch screen coordinates.
 *
 *
 */
var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {


    jm.device.Calibrate = jm.EventEmitter.extend({
        _className: 'calibrate',

        ctor: function () {
            this._super();
        },

        /**********************************************************************
         *
         *     Function: init()
         *
         *  Description: Calling this function with valid input data
         *                in the display and screen input arguments
         *                causes the calibration factors between the
         *                screen and display points to be calculated,
         *                and the output argument - m - to be
         *                populated.
         *
         *               This function needs to be called only when new
         *                calibration factors are desired.
         *
         *
         *  Argument(s): t (input) - Pointer to an array of three
         *                                     sample, reference points.
         *               s (input) - Pointer to the array of touch
         *                                    screen points corresponding
         *                                    to the reference display points.
         *               m (output) - Pointer to the calibration
         *                                     matrix computed for the set
         *                                     of points being provided.
         *
         *
         *  From the article text, recall that the matrix coefficients are
         *   resolved to be the following:
         *
         *
         *      Divider =  (Xs0 - Xs2)*(Ys1 - Ys2) - (Xs1 - Xs2)*(Ys0 - Ys2)
         *
         *
         *
         *                 (Xd0 - Xd2)*(Ys1 - Ys2) - (Xd1 - Xd2)*(Ys0 - Ys2)
         *            A = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 (Xs0 - Xs2)*(Xd1 - Xd2) - (Xd0 - Xd2)*(Xs1 - Xs2)
         *            B = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 Ys0*(Xs2*Xd1 - Xs1*Xd2) +
         *                             Ys1*(Xs0*Xd2 - Xs2*Xd0) +
         *                                           Ys2*(Xs1*Xd0 - Xs0*Xd1)
         *            C = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 (Yd0 - Yd2)*(Ys1 - Ys2) - (Yd1 - Yd2)*(Ys0 - Ys2)
         *            D = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 (Xs0 - Xs2)*(Yd1 - Yd2) - (Yd0 - Yd2)*(Xs1 - Xs2)
         *            E = ---------------------------------------------------
         *                                   Divider
         *
         *
         *                 Ys0*(Xs2*Yd1 - Xs1*Yd2) +
         *                             Ys1*(Xs0*Yd2 - Xs2*Yd0) +
         *                                           Ys2*(Xs1*Yd0 - Xs0*Yd1)
         *            F = ---------------------------------------------------
         *                                   Divider
         *
         *
         *       Return: OK - the calibration matrix was correctly
         *                     calculated and its value is in the
         *                     output argument.
         *               NOT_OK - an error was detected and the
         *                         function failed to return a valid
         *                         set of matrix values.
         *                        The only time this sample code returns
         *                        NOT_OK is when Divider == 0
         *
         *
         *
         *                 NOTE!    NOTE!    NOTE!
         *
         *  init() and transform() will do fine
         *  for you as they are, provided that your digitizer
         *  resolution does not exceed 10 bits (1024 values).  Higher
         *  resolutions may cause the integer operations to overflow
         *  and return incorrect values.  If you wish to use these
         *  functions with digitizer resolutions of 12 bits (4096
         *  values) you will either have to a) use 64-bit signed
         *  integer variables and math, or b) judiciously modify the
         *  operations to scale results by a factor of 2 or even 4.
         *
         *
         */
        init: function (s, t) {
            var m = {};
            m.Divider = ((s[0].x - s[2].x) * (s[1].y - s[2].y)) -
                ((s[1].x - s[2].x) * (s[0].y - s[2].y));

            if (m.Divider == 0) return false;

            m.An = ((t[0].x - t[2].x) * (s[1].y - s[2].y)) -
                ((t[1].x - t[2].x) * (s[0].y - s[2].y));

            m.Bn = ((s[0].x - s[2].x) * (t[1].x - t[2].x)) -
                ((t[0].x - t[2].x) * (s[1].x - s[2].x));

            m.Cn = (s[2].x * t[1].x - s[1].x * t[2].x) * s[0].y +
                (s[0].x * t[2].x - s[2].x * t[0].x) * s[1].y +
                (s[1].x * t[0].x - s[0].x * t[1].x) * s[2].y;

            m.Dn = ((t[0].y - t[2].y) * (s[1].y - s[2].y)) -
                ((t[1].y - t[2].y) * (s[0].y - s[2].y));

            m.En = ((s[0].x - s[2].x) * (t[1].y - t[2].y)) -
                ((t[0].y - t[2].y) * (s[1].x - s[2].x));

            m.Fn = (s[2].x * t[1].y - s[1].x * t[2].y) * s[0].y +
                (s[0].x * t[2].y - s[2].x * t[0].y) * s[1].y +
                (s[1].x * t[0].y - s[0].x * t[1].y) * s[2].y;

            this.matrix = m;
            return true;
        },

        /**********************************************************************
         *
         *     Function: transform()
         *
         *  Description: Given a valid set of calibration factors and a point
         *                value reported by the touch screen, this function
         *                calculates and returns the true (or closest to true)
         *                display point below the spot where the touch screen
         *                was touched.
         *
         *
         *
         *  Argument(s): t (output) - Pointer to the calculated
         *                                      (true) display point.
         *               s (input) - Pointer to the reported touch
         *                                    screen point.
         *               m (input) - Pointer to calibration factors
         *                                    matrix previously calculated
         *                                    from a call to
         *                                    init()
         *
         *
         *  The function simply solves for Xd and Yd by implementing the
         *   computations required by the translation matrix.
         *
         *                                              /-     -\
         *              /-    -\     /-            -\   |       |
         *              |      |     |              |   |   Xs  |
         *              |  Xd  |     | A    B    C  |   |       |
         *              |      |  =  |              | * |   Ys  |
         *              |  Yd  |     | D    E    F  |   |       |
         *              |      |     |              |   |   1   |
         *              \-    -/     \-            -/   |       |
         *                                              \-     -/
         *
         *  It must be kept brief to avoid consuming CPU cycles.
         *
         *
         *       Return: OK - the display point was correctly calculated
         *                     and its value is in the output argument.
         *               NOT_OK - an error was detected and the function
         *                         failed to return a valid point.
         *
         *
         *
         *                 NOTE!    NOTE!    NOTE!
         *
         *  init() and transform() will do fine
         *  for you as they are, provided that your digitizer
         *  resolution does not exceed 10 bits (1024 values).  Higher
         *  resolutions may cause the integer operations to overflow
         *  and return incorrect values.  If you wish to use these
         *  functions with digitizer resolutions of 12 bits (4096
         *  values) you will either have to a) use 64-bit signed
         *  integer variables and math, or b) judiciously modify the
         *  operations to scale results by a factor of 2 or even 4.
         *
         *
         */
        transform: function (s) {
            var m = this.matrix;
            if (!m || !m.Divider) return null;
            var t = {};

            /* Operation order is important since we are doing integer */
            /*  math. Make sure you add all terms together before      */
            /*  dividing, so that the remainder is not rounded off     */
            /*  prematurely.                                           */

            t.x = ( (m.An * s.x) +
                    (m.Bn * s.y) +
                    m.Cn
                ) / m.Divider;

            t.y = ( (m.Dn * s.x) +
                    (m.En * s.y) +
                    m.Fn
                ) / m.Divider;

            return t;
        }

    });

    jm.device.Calibrate.generateSamplePoints = function (width, height) {
        var w = width;
        var h = height;
        var w0 = w * 0.8;
        var h0 = h * 0.8;
        var dw = w * 0.1;
        var dh = h * 0.1;
        dx1 = dw - 1;
        dy1 = dh - 1;
        dx2 = dx1 + w0;
        dy2 = h / 2 - 1;
        dx3 = w / 2 - 1;
        dy3 = dy1 + h0;

        return [
            {
                x: dx1,
                y: dy1
            },
            {
                x: dx2,
                y: dy2
            },
            {
                x: dx3,
                y: dy3
            }
        ];
    };

})();
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
var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {

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
/**
 *
 *    IO扩展板模块
 *
 *    板上数据分为非易失数据和易失数据两种类型
 *
 *    非易失数据：板掉电后数据不会丢失，数据量一般比较大，适合从板上直接读写，例如铁电存储
 *
 *    易失数据：板掉电后数据丢失，数据量一般较小，适合做内存映射，例如数字DIO, AD/DA数据等
 *
 *    支持的功能包括基本数字IO、AD/DA IO、板上存储读写等
 *
 *    数字IO定义：数字IO分为输入引脚Pin和输出引脚Pout，引脚数量根据具体扩展板有所不同
 *
 *    分别对输入引脚和输出引脚按低位到高位顺序每8个引脚组成一个字节单位, 从0开始编号
 *
 *    存储定义：对于存储按字节操作
 *
 */
var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {

    jm.device.ComponentIOAdapter = jm.device.ComponentDevice.extend({
        _className: 'ioAdapter',
        _singleton: false,

        properties: {
            ioSize: {get: 'getIOSize', set: 'setIOSize'},
            memSize: {get: 'getMemSize', set: 'setMemSize'},
            ioPos: {get: 'getIOPos'},
            memPos: {get: 'getMemPos'}
        },

        ctor: function (e, opts) {
            this._super(e, opts);
        },

        getIOSize: function () {
            return this._ioSize || 0;
        },

        setIOSize: function (v) {
            this._ioSize = v;
            this._ioPos = 0;
            this._ioBuffer = new Uint8Array(v);
            var buf = this._ioBuffer;
            for (var i = 0; i < buf.length; i++) {
                buf[i] = 0xFF;
            }
        },

        getMemSize: function () {
            return this._memSize || 0;
        },

        setMemSize: function (v) {
            this._memSize = v;
            this._memPos = 0;
        },

        getIOPos: function () {
            return this._ioPos || 0;
        },

        getMemPos: function () {
            return this._memPos || 0;
        },

        start: function () {

        },

        stop: function () {

        },

        //------易失数据读写-----------
        //同步数据到板上 -1 表示全部数据
        io_flush: function (len) {
        },

        //从板上更新数据 -1 表示全部数据
        io_update: function (len) {
        },

        /**
         *
         *    origin参数：
         *    0或SEEK_SET，从文件开始。
         *    1或SEEK_CUR，从当前位置。
         *    2或SEEK_END，从文件尾反绕。
         *
         */
        io_seek: function (offset, origin) {
            var pos = this.ioPos;
            pos = this._seek(pos, this.ioSize, offset, origin);
            this._ioPos = pos;
            return pos;
        },

        io_read: function (len) {
            var pos = this.ioPos;
            var buf = this._read(this._ioBuffer, pos, len);
            if (!buf) return null;
            this.io_seek(buf.byteLength, 1);
            return buf;
        },

        io_write: function (buf, len) {
            var pos = this.ioPos;
            var _len = this._write(this._ioBuffer, pos, buf, len);
            this.io_seek(_len, 1);
            return _len;
        },

        mem_seek: function (offset, origin) {
            var pos = this.memPos;
            pos = this._seek(pos, this.memSize, offset, origin);
            this._memPos = pos;
            return pos;
        },

        mem_read: function (len) {
            if (!this._memBuffer) return null;
            var pos = this.memPos;
            var size = this.memSize;
            var buf = this._read(this._memBuffer, pos, len);
            if (!buf) return null;
            this.mem_seek(buf.byteLength, 1);
            return buf;
        },

        mem_write: function (buf, len) {
            if (!this._memBuffer) return 0;
            var pos = this.memPos;
            var _len = this._write(this._memBuffer, pos, buf, len);
            this.mem_seek(_len, 1);
            return _len;
        },

        _seek: function (pos, size, offset, origin) {
            if (offset == undefined) {
                offset = 0;
            }
            if (origin == undefined) {
                origin = 1;
            }
            switch (origin) {
                case 0:
                    pos = offset;
                    break;
                case 1:
                    pos += offset;
                    break;
                case 2:
                    pos = size - 1 + offset;
                    break;
            }

            if (pos < -1 || pos >= size) pos = -1;
            return pos;
        },

        _read: function (buf, offset, len) {
            if (len == undefined) {
                len = buf.byteLength;
            }
            if (len <= 0 || offset == -1) return null;

            var size = buf.byteLength;
            var _len = len;
            var _available = size - offset;
            if (_len > _available) {
                _len = _available;
            }
            if (_len <= 0) return null;
            return buf.subarray(offset, offset + _len);
        },

        _write: function (targetBuf, offset, buf, len) {
            if (len == undefined) {
                len = buf.byteLength;
            }
            if (len <= 0 || offset == -1) return 0;
            var size = targetBuf.byteLength;
            var _len = len;
            var _available = size - offset;
            if (_len > _available) {
                _len = _available;
            }

            if (_len <= buf.byteLength) {
                buf = buf.subarray(0, _len);
            }
            targetBuf.set(buf, offset);
            return _len;
        }

    });

    var SeekType = {
        SEEK_SET: 0,    //从文件开始。
        SEEK_CUR: 1,  //从当前位置。
        SEEK_END: 2   //从文件尾反绕。
    };

    for (var key in SeekType) {
        var prototype = jm.device.ComponentIOAdapter.prototype;
        prototype[key] = SeekType[key];
    }

})();
/**
 *
 *    触摸屏设备
 *
 *    支持多点触摸， 每个点的信息包括id(1字节), status(1字节，触摸状态), x, y, z，分别用2字节表示，共8字节
 *
 *    最大支持 8*8 = 64路DI
 *
 *    内存定义：
 *
 *    64路DI  偏移地址0  长度8字节
 *
 *    MEM  :  偏移地址 0 ~ 16 -1  最大16字节存储 用于存储配置信息，例如校验参数
 *

 TouchInfo: {
        id: 0,
        status: 0,
        x: 0,
        y: 0,
        z: 0
    },
 *
 */
var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {

    var logger = jm.getLogger('jm-device:touchDevice');
    
    jm.device.ComponentTouchDevice = jm.device.ComponentIOAdapter.extend({
        _className: 'touchDevice',
        _singleton: false,
        _nameReadOnly: true,

        properties: {
            calibrated: {get: 'getCalibrated'},
            config: {get: 'getConfig', set: 'setConfig'},
            touchInfo: {get: 'getTouchInfo', set: 'setTouchInfo'}
        },

        getCalibrated: function () {
            return this._calibrated;
        },

        getConfig: function () {
            return this._config || {};
        },

        setConfig: function (v) {
            this._config = v;
            if (!v) {
                this._calibrated = false;
                return;
            }
            if (v.source && v.target) {
                this._calibrated = this.calibrate.init(v.source, v.target);
            }
        },

        getConfigPath: function () {
            if (!cc.sys.isNative) return null;
            var fu = jsb.fileUtils;
            var path = fu.getWritablePath();
            path += '/touch.plist';
            return path;
        },

        loadConfig: function () {
            //if (!cc.sys.isNative) return;
            //
            //var fu = jsb.fileUtils;
            //var path = this.getConfigPath();
            //
            //var v = fu.getValueMapFromFile(path);
            //if (v) {
            //    this.config = v;
            //    logger.debug('loadConfig' + path + ' ' + JSON.stringify(v));
            //}
        },

        saveConfig: function () {
            //if (!cc.sys.isNative) return;
            //if (!this.config) return;
            //var fu = jsb.fileUtils;
            //var path = this.getConfigPath();
            //fu.writeToFile(this.config, path);
            //logger.debug('saveConfig' + path + ' ' + JSON.stringify(this.config));
        },

        setTouchInfo: function (opts) {
            this._touchInfo = opts;
            if (this.calibrated) {
                var id = opts.id;
                var x = opts.x;
                var y = opts.y;
                var t = this.transform(opts);
                if (t) {
                    x = t.x;
                    y = t.y;
                }
                if (cc && cc.eventManager) {
                    var code = 0;
                    switch (opts.status) {
                        case 2:
                            code = 1;
                            break;
                        case 4:
                            code = 2;
                            break;
                    }

                    if (cc.sys.isNative) {
                        cc.configuration.setValue('event_jm_touch', code + ', ' + id + ',' + x + ',' + y);
                        cc.eventManager.dispatchCustomEvent('event_jm_touch');
                        if(jm.debug){
                            jm.debug('dispatchCustomEvent: x:' + x + ' y:' + y);
                        }
                    }
                }
            }
            if (this.entity) {
                if(jm.debug){
                    logger.debug('touchInfo: x:' + opts.x + ' y:' + opts.y);
                }
                this.entity.emit('touch', opts);
            }
        },

        getTouchInfo: function () {
            return this._touchInfo || {};
        },

        transform: function (s) {
            if (!this._calibrated) return null;
            return this.calibrate.transform(s);
        },

        ctor: function (e, opts) {
            opts = opts || {};
            opts.ioSize = 8;
            opts.memSize = 16;
            opts.DIAddress = 0;
            this._super(e, opts);
            this._name = 'touchDevice';
            this._calibrated = false;
            this.calibrate = new jm.device.Calibrate();
            this.loadConfig();
        }

    });

})();

/**
 *
 *    鸿城触摸屏设备
 //鸿城单点触摸屏串口通信协议
 //
 //1、波特率：9600, 数据位：8，停止位：1，校验位：N。
 //
 //2、发送的数据包格式（共10个字节）：
 //
 //   54H，D0，D1，D2，D3，D4，D5，D6，D7，55H
 //
 //其中：55H，54H---数据包开始符。
 //
 //D0---触摸状态，开始触按为81H，
 //
 //保持触按为82H，抬起为84H。
 //
 //          D1---触摸点X坐标低8位。
 //
 //          D2---触摸点X坐标高8位。
 //
 //          D3---触摸点Y坐标低8位。
 //
 //          D4---触摸点Y坐标高8位。
 //
 //          D5---触摸点Z坐标低8位，默认FFH
 //
 //          D6---触摸点Z坐标高8位，默认00H
 //
 //          D7---校验字节，D7=D0+D1+D2+D3+D4-AEH，如大于
 //
 //FFH取低8位，如小于0，取补码。如校验字节不对，
 //
 //放弃该数据包。
 //
 //
 //
 //说明：保持触按的过程中会一直有数据发送，每30ms左右一个数据包。
 //
 //
 //鸿城两点触摸屏串口通信协议
 //
 //1、波特率：19200, 数据位：8，停止位：1，校验位：N。
 //
 //2、发送的数据包格式（共13个字节）：
 //
 //   55H，54H，BTN1，X1L, X1H, Y1L， Y1H，BTN2，X2L，X2H，Y2L，Y2H，N
 //
 //其中：55H，54H---数据包开始符。
 //
 //BTN1---第一个触摸点的触摸状态，开始触按为81H，保持触按为82H，抬起为84H。
 //
 //BTN2---第二个触摸点的触摸状态
 //
 //          X1L---第一个触摸点X坐标低8位。
 //
 //          X1H---第一个触摸点X坐标高8位。
 //
 //          Y1L---第一个触摸点Y坐标低8位。
 //
 //          Y1H---第一个触摸点Y坐标高8位。
 //
 //          X2L---第二个触摸点X坐标低8位。
 //
 //          X2H---第二个触摸点X坐标高8位。
 //
 //          Y2L---第二个触摸点Y坐标低8位。
 //
 //          Y2H---第二个触摸点Y坐标高8位。
 //
 //N表示存在几个点
 //
 //说明：保持触按的过程中会一直有数据发送，每30ms左右一个数据包。
 //
 //
 */
var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function () {
    var logger = jm.getLogger('jm-device:touchDeviceHC');
    var device = jm.device;
    var utils = device.utils;

    jm.device.ComponentTouchDeviceHC = jm.device.ComponentTouchDevice.extend({
        _className: 'touchDeviceHC',
        PACKETHEAD1: 0x55,
        PACKETHEAD2: 0x54,
        MAXPACKETLEN: 128,

        properties: {
            type: {get: 'getType', set: 'setType'},   //触摸屏类型 默认0 单点触摸  1 两点触摸
            dataLen: {get: 'getDataLen'},              //包中有效数据长度
            endLen: {get: 'getEndLen'}                 //包尾有效数据长度
        },

        getType: function () {
            return this._type || 0;
        },

        setType: function (v) {
            this._type = v;
            this._dataLen = v == 0 ? 5 : 11;
            this._endLen = v == 0 ? 3 : 0;
        },

        getDataLen: function () {
            return this._dataLen == undefined ? 5 : this._dataLen;
        },

        getEndLen: function () {
            return this._endLen == undefined ? 3 : this._endLen;
        },

        ctor: function (e, opts) {
            this._super(e, opts);
            this._data = new Uint8Array(this.MAXPACKETLEN);
            this._offset = 0;
            this._step = 0;
        },

        onAdd: function (e) {
            this._super(e);
            var self = this;

            e.on('data', function (dv, len) {
                len = len || dv.byteLength;
                if (len > 0) {
                    self.onData(dv, len);
                }
            });
        },

        calcCrc: function (buf, len) {
            len = len || buf.byteLength;
            if (len <= 0) return 0;

            var r = 0;
            for (var i = 0; i < len; i++) {
                r += buf[i];
                r &= 0xFF;
            }
            r -= 0xAE;
            r &= 0xFF;
            return r;
            //D7---校验字节，D7=D0+D1+D2+D3+D4-AEH，
        },

        validPacket: function (buf, len) {
            len = len || buf.byteLength;
            var r = true;
            switch (this.type) {
                case 1:
                    r = this.validPacket1(buf, len);
                    break;
                default:
                    r = this.validPacket0(buf, len);
                    break;
            }
            if (!r) {
                if(jm.debug){
                    logger.debug('validPacket fail: ' + utils.dataViewToHex(buf, len));
                }
            }
            return r;
        },

        onData: function (dv, len) {
            var self = this;
            var e = self.entity;
            var buf = new Uint8Array(dv.buffer);
            len = len || dv.byteLength;

            var dataLen = this.dataLen;
            var endLen = this.endLen;
            var data = this._data;
            var offset = this._offset;
            var step = this._step;

            for (var i = 0; i < len; i++) {
                var c = buf[i];
                if (step == 0 && c == self.PACKETHEAD1) {
                    step++;
                } else if (step == 1 && c == self.PACKETHEAD2) {
                    step++;
                    offset = 0;
                } else if (step == 2) {
                    data[offset++] = c;

                    if (offset == dataLen + endLen) {
                        if (this.validPacket(data, offset)) {
                            this.onPacket(data, dataLen);
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

        validPacket0: function (buf, len) {
            var crc = buf[len - 1];
            return this.calcCrc(buf, len - 3) == crc;
        },

        validPacket1: function (buf, len) {
            return true;
        },

        onPacket: function (buf, len) {
            if(jm.debug){
                logger.debug('onPacket:' + utils.dataViewToHex(buf, len));
            }
            switch (this.type) {
                case 1:
                    break;
                default:
                    var dv = new DataView(buf.buffer, 0, len);
                    var opts = {
                        id: 0,
                        status: buf[0] & 0x0F,
                        x: dv.getUint16(1, true),
                        y: dv.getUint16(3, true),
                        z: 0
                    };
                    this.touchInfo = opts;
                    break;
            }
        }


    });

})();

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