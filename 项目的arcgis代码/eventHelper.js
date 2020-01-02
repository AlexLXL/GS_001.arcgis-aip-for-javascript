define(['eventemitter3'], function (EventEmitter) {
    var eventEmitter = new EventEmitter();
    console.log('init event');
    return {
        emit: function (event, parm) {
            eventEmitter.emit(event, parm);
        },
        on: function (event, cb) {
            eventEmitter.on(event, cb);
        }
    }
});