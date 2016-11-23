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
    if(jm.device.ComponentTouchDeviceHC) return;
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
