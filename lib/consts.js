var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('jm-ecs');
}

(function(){
    if(jm.device) return;
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
