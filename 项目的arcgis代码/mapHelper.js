define(function () {
    var generateNo = function () {
        var date = new Date();
        return ('PA' + date.getTime()).substring(5);
    }
    var regExes = {
      'typeStr': /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
      'spaces': /\s+/,
      'parenComma': /\)\s*,\s*\(/,
      'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/,  // can't use {2} here
      'trimParens': /^\s*\(?(.*?)\)?\s*$/
    };
    return {
        register: function (api, cb) {
            api.getInstance(function (type, currentInstance) {
                cb();
                this.apiVersion = type;
                this.apiInstance = currentInstance;
            }.bind(this));
        },
        getInstance: function () {
            return this.apiInstance;
        },
        initMap: function (container, centerX, centerY, zoom, sucessCb,clickCb) {
            this.apiInstance.initMap(container, centerX, centerY, zoom, function (map,view) {
                sucessCb(map,view);
                console.log('地图加载完毕！');
            },function(data){
                clickCb(data)
            });
        },
        createMapImageLayer: function (map,spatialReference, url, id,cb){
            return this.apiInstance.createMapImageLayer(map,spatialReference, url, id, function (layer) {
                cb(layer);
                console.log('图层加载成功！');
            });
        },
        /**
         * 天地图WMTS
         **/
        initTDMap: function (container, centerX, centerY, zoom, cb, clickCb) {
            if (this.apiVersion !== 'C') {
                console.error('天地图只支持arcgis 方式加载');
                return;
            }
            this.apiInstance.initTDLayer(container, centerX, centerY, zoom, function (map, view) {
                cb(map, view);
                console.log('地图加载完毕！');
            }, clickCb);
        },
        initTomcatMap: function (container,url, centerX, centerY, zoom, cb, clickCb) {
            if (this.apiVersion !== 'C') {
                console.error('天地图只支持arcgis 方式加载');
                return;
            }
            this.apiInstance.initTomcatLayer(container,url, centerX, centerY, zoom, function (map, view) {
                cb(map, view);
                console.log('地图加载完毕！');
            }, clickCb);
        },
        nnTraceAnalysisByRecursive: function (event, traceAnalysisType, vue, cb) {
            this.apiInstance.nnTraceAnalysisByRecursive(event, traceAnalysisType, vue, cb);
        },
        getGraphicsLayer: function (LayerId, index, map) {
            return this.apiInstance.getGraphicsLayer(LayerId, index, map);
        },
        createGraphicsLayer: function (map, id) {
            return this.apiInstance.createGraphicsLayer(map, id);
        },
        drawArrowPolyline: function (polyline, layer, length, angleValue, graphicColor) {
            this.apiInstance.drawArrowPolyline(polyline, layer, length, angleValue, graphicColor);
        },
        clearAnalysisInfo: function (currentMap) {
            this.apiInstance.clearAnalysisInfo(currentMap);
        },
        getLayer: function (currentMap, id) {
            var layer = this.apiInstance.getLayer(currentMap, id);
            return layer;
        },
        addLayers: function (currentMap, layers) {
            this.apiInstance.addLayers(currentMap, layers)
        },
        removeLayer: function (currentMap, layer) {
            this.apiInstance.removeLayer(currentMap, layer);
        },
        removeLayers: function (currentMap, layers) {
            this.apiInstance.removeLayers(currentMap, layers);
        },
        changeLineSymbolStyle: function (graphic, newStyleObj) {
            this.apiInstance.changeLineSymbolStyle(graphic, newStyleObj);
        },
        changePolygonSymbolStyle: function (graphic, newStyleObj) {
            this.apiInstance.changePolygonSymbolStyle(graphic, newStyleObj);
        },
        changeMarkSymbolStyle: function (graphic, newStyleObj) {
            this.apiInstance.changeMarkSymbolStyle(graphic, newStyleObj);
        },
        changePictureMarkSymbolStyle: function (graphic, newStyleObj) {
            this.apiInstance.changePictureMarkSymbolStyle(graphic, newStyleObj);
        },
        //删除多个图解
        removeGraphics: function (layer, graphics) {
            this.apiInstance.removeGraphics(layer, graphics)
        },
        registerMapTool: function (view, buttonId, position, cb) {
            if (this.apiVersion == 'C') {
                this.apiInstance.registerMapTool(view, buttonId, position, cb);
            }
        },
        createPolyline: function (layer, paths, styleObj) {
            return this.apiInstance.createPolyline(layer, paths, styleObj);
        },
        createTextSymbol: function (layer, x, y, textObj) {
            return this.apiInstance.createTextSymbol(layer, x, y, textObj);
        },
        createSymbol: function (layer, x, y, styleObj) {
            return this.apiInstance.createSymbol(layer, x, y, styleObj);
        },
        createPictureMarkSymbol: function (layer, x, y, imgObj, attributes) {
            return this.apiInstance.createPictureMarkSymbol(layer, x, y, imgObj, attributes);
        },
        createOffsetPictureMarkSymbol: function (layer, x, y, imgObj, attributes,offset) {
            return this.apiInstance.createOffsetPictureMarkSymbol(layer, x, y, imgObj, attributes,offset);
        },
        createPolygon: function (layer,spatialReference, coords, styleObj,attributes) {
            return this.apiInstance.createPolygon(layer,spatialReference, coords, styleObj,attributes);
        },
        //获取caseMap
        // getArcGISTiledMap: function (leftID,centerX, centerY, zoom, cb) {
        //     var leftMap = this.initTDMap(leftID,centerX, centerY, zoom, cb);
        //     setTimeout(function () {
        //         cb(leftMap);
        //     },100);
        //     apiInstance.createMapImageLayer(leftMap, 'http://192.168.0.213:6080/arcgis/rest/services/gz1918pipe/gz1918Pip/MapServer', 'lineLayer');
        //     // var leftLayer = new ArcGISDynamicMapServiceLayer('http://192.168.0.213:6080/arcgis/rest/services/gz1918pipe/gz1918Pip/MapServer');
        //     // var leftMap = this.initArcGISTiledMap(leftID, 'http://10.194.148.18:6080/arcgis/rest/services/guangzhoumap_gz/MapServer', cb);
        //     // leftMap.addLayer(leftLayer);
        //     return leftMap
        // },
        //设置地图中心点和地图显示层
        setCenter: function (view, x, y, zoom) {
            this.apiInstance.setCenter(view, x, y, zoom)
        },
        setCenterByGeometry: function (view,geometry) {
            this.apiInstance.setCenterByGeometry(view,geometry)
        },
        //加载水质净化厂图层
        initWPFLayer: function (map,featureProperty) {
            var wpfLayer = this.apiInstance.createFeatureLayer(map,featureProperty);
            var wpfLayerAnno = this.apiInstance.createGraphicsLayer(map,"wpfLayerAnno");
            for(var i=0,len=featureProperty.source.length;i<len;i++){
                console.log(JSON.stringify(featureProperty.source[i]));
                var graphic = this.apiInstance.createGraphic(featureProperty.source[i]);
                wpfLayerAnno.add(graphic);
            }
            return wpfLayer;
        },
        drawWkt(wkt, layer, style, attributes){//画多边形
            console.error("zxl")
            var points = read(wkt);
            if (!style) {
                style = {
                    color: [41, 0, 255, 0.8],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [255, 255, 255],
                        width: 1
                    }
                };
            }
            var polygon = this.apiInstance.createPolygon(layer, points, style, attributes);
            return polygon;
        },
        read(wkt){
            var features, type, str;
            wkt = wkt.replace(/[\n\r]/g, " ");
            var matches = regExes.typeStr.exec(wkt);
            if (matches) {
                type = matches[1].toLowerCase();
                str = matches[2];
                if (parse[type]) {
                    features = parse[type].apply(this, [str]);
                }
            }
            return features;
        },
        initFloorMap: function (container, centerX, centerY, zoom, cb, clickCb) {
            if (this.apiVersion !== 'C') {
                console.error('天地图只支持arcgis 方式加载');
                return;
            }
            this.apiInstance.initFloorMap(container, centerX, centerY, zoom, function (map, view) {
                cb(map, view);
                console.log('地图加载完毕！');
            }, clickCb);
        },
    }
});