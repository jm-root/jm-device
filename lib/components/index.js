if (typeof module !== 'undefined' && module.exports) {
    require('./device');
    require('./serialport');
    require('./ioadapter');
    require('./touchDevice');
    require('./touchDeviceHC');
    require('./hopper');
    require('./receiptprinter');
    require('./billAcceptor');
}
