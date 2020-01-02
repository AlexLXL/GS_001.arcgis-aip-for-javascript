define([
    'expand/arcgis-load-map',
    'expand/deviceModel', 'services/mock/device'], function (loapMap, deviceModel, deviceService) {
    return {
        init: function (layerURL, centerX, centerY) {
            var map = loapMap.tdWmtsServer(layerURL, centerX, centerY);
            loapMap.customerLayer();
            window.sam = {};
            window.sam.mapCenter = loapMap.centerAndZoom;
        }
    }
});