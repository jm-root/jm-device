if (typeof module !== 'undefined' && module.exports) {
    require('./consts');
    require('./utils');
    require('./calibrate');
    require('./components');
    module.exports = require('jm-ecs');
}
