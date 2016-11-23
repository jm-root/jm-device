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
    if(jm.device.ComponentIOAdapter) return;
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
