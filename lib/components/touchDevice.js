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
