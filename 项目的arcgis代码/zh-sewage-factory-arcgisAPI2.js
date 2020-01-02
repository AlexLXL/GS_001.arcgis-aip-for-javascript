var instance = {};

var getArcgis = function (cb) {
    var timmer = setInterval(function () {
        if (!!window.cesc && !!window.cesc.require) {
            cb();
            clearInterval(timmer)
        }
    }, 10);
};

export default {
    //用于获取token，url头部等
    getInstance: function (cb) {
        // if (!!instance.Map) {
        //     cb(instance);
        //     return;
        // }

        // SketchViewModel用于画图--详细可以看factoryCarryingAreaDraw文件加的新增图层
        getArcgis(function () {
            cesc.require([
                'esri/widgets/Sketch/SketchViewModel'
            ], function (SketchViewModel) {
                instance.SketchViewModel = SketchViewModel;

                cb(instance);
            });
        })

    }
}