var jm = jm || {};
if (typeof module !== 'undefined' && module.exports) {
    jm = require('../');
}

(function(){
    jm.debug = true;
    var logger = jm.logger;
    var em = jm.entityManager();
    em.init({});

    var types = {
        device: {
            components: {
                serialPort: {
                    portName: 'com1',
                    autoOpen: true
                },
                touchDeviceHC: {

                }
            }
        }
    };
    em.addEntityTypes(types);

    var e = em.createEntity('device');
    setInterval(function(){
        var sp = e.serialPort;
        sp.write([0x30]);
        sp.update();
    }, 1000);


})();

