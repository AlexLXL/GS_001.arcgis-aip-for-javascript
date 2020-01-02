define(function () {
    var CONFIG = require('config'),
        Map = cesc.require("cache/esri/Map"),
        TDTLayer = require('./TDTLayer'),
        eventHelper = require('utils/eventHelper'),
        TDTAnnoLayer = require('./TDTAnnoLayer'),
        FeatureLayer = cesc.require("esri/layers/FeatureLayer"),
        Graphic = cesc.require("esri/graphic"),
        Color = cesc.require("esri/Color"),
        Point = cesc.require('esri/geometry/Point'),
        GraphicsLayer = cesc.require("esri/layers/GraphicsLayer"),
        PictureMarkerSymbol = cesc.require("esri/symbols/PictureMarkerSymbol"),
        TextSymbol = cesc.require("esri/symbols/TextSymbol"),
        Font = cesc.require("esri/symbols/Font"),
        ArcGISDynamicMapServiceLayer = cesc.require('esri/layers/ArcGISDynamicMapServiceLayer'),
        deviceModel = require('./deviceModel'),
        ArcGISCacheLayer = require('./ArcGISCacheLayer');
    var map;
    var deviceList = {};
    var savedPoint;
    return {
        /**
         * 天地图WMTS
         **/
        tdWmtsServer: function (layerURL, centerX, centerY) {
            //注意！！！！！！
            //以下保存了地图外网和内网两种配置，与内外网有关的代码都有注释是内网或外网，如果要使用内网地图就把内网的注释代码释放并屏蔽掉外网，反之亦然
            map = new Map("mapDiv", {
                //内网
                // center: [117.82120, 37.17079],
                // zoom: 13

                //外网
                center: [centerX, centerY],
                zoom: 16
            });
            window.cesc.map = map;

            //内网
            // var basemap = new ArcGISCacheLayer(CONFIG.baseMap);
            //外网
            var basemap = new TDTLayer();

            map.addLayer(basemap);

            //外网
            var annolayer = new TDTAnnoLayer();
            map.addLayer(annolayer);

            var labels = new ArcGISDynamicMapServiceLayer(layerURL, {opacity: 0.6});
            //   map.addLayer(labels); 海绵体
            map.on('click', function (event) {
                console.log(event);
            });
            //  deviceModel.createTextSymbol(map); 海绵体
            return map;
        },
        createPoints: function (facilitys, legend) {
            var graLayer = new GraphicsLayer();
            var facilityArr = [];
            facilitys.forEach(function (item) {
                var icon = item.icon;
                var fid = legend.id;
                item.fid = fid;
                //deviceModel.createSymbol(Color, PictureMarkerSymbol, Point, Graphic, TextSymbol,Font, graLayer, item.x, item.y, icon, item, legend.facilityTypeName);
                deviceModel.createSymbol(Color, PictureMarkerSymbol, Point, Graphic, TextSymbol, graLayer, item.x, item.y, icon, item, legend.facilityTypeName);
                facilityArr.push({
                    x: item.x,
                    y: item.y,
                    items: [
                        {
                            title: '',
                            content: item.name,
                            type:'name'
                        },
                        {
                            title: '通信状态',
                            content: '正常'
                        }
                    ]
                })
            });
            eventHelper.emit('alert-point', facilityArr, true);
            /*  graLayer.on('mouse-over',function (evt) {
             console.log('over',evt);
             })*/
            graLayer.on('click', function (evt) {
                eventHelper.emit('subFacility-clicked', {
                    id: 'f' + evt.graphic.attributes.item.fid,
                    item: evt.graphic.attributes.item,
                    facilityTypeName: evt.graphic.attributes.facilityTypeName,
                    center: [evt.graphic.geometry.x, evt.graphic.geometry.y]
                });
            });
            map.addLayer(graLayer);
            return graLayer;
        },
        createDistrict: function (map) {
            deviceModel.ssjkCreatePoint(map, 999, 'f999', '兴宁区 1', 'abc', 108.36375263916017, 22.857919934082034, '', './img/mapLegend/district.png', '50', '30', 'abc', {
                fid: 123,
                name: 123
            });
        },
        //删除地图上图标
        removePoints: function (graLayer) {
            map.removeLayer(graLayer.layer);
        },
        removeGraphic: function (graphic) {
            map.graphics.remove(graphic);
        }
    }
});