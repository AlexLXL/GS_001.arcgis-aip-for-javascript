//地图通用操作


let comm = {
    //图层
    layer: {
        /**
         * 创建天地图图层
         * 只支持经纬度坐标（需要平面的麦卡托坐标可以自行修改）
         * @param tdtLayerType 天地图图层类型，支持以下值：img=影像——经纬度，cia=影像注记——经纬度，vec=矢量——经纬度，cva=矢量注记——经纬度
         * ter=地形图——经纬度，cta=地形图注记——经纬度
         */
        createTdtLayer: function (apiInstance, tdtLayerType, layerConfig) {
            //切片配置
            //PS：加载天地图图层本质上是用自定义切片图层
            var tileInfo = new apiInstance.TileInfo({
                "rows": 256,
                "cols": 256,
                "compressionQuality": 0,
                //切片原点
                "origin": {
                    "x": -180,
                    "y": 90
                },
                //坐标系
                "spatialReference": {
                    //本方法只支持经纬度坐标，坐标系为wgs84
                    "wkid": 4326
                },
                "lods": [
                    //天地图固定的切片级别
                    {"level": 2, "resolution": 0.3515625, "scale": 147748796.52937502},
                    {"level": 3, "resolution": 0.17578125, "scale": 73874398.264687508},
                    {"level": 4, "resolution": 0.087890625, "scale": 36937199.132343754},
                    {"level": 5, "resolution": 0.0439453125, "scale": 18468599.566171877},
                    {"level": 6, "resolution": 0.02197265625, "scale": 9234299.7830859385},
                    {"level": 7, "resolution": 0.010986328125, "scale": 4617149.8915429693},
                    {"level": 8, "resolution": 0.0054931640625, "scale": 2308574.9457714846},
                    {"level": 9, "resolution": 0.00274658203125, "scale": 1154287.4728857423},
                    {"level": 10, "resolution": 0.001373291015625, "scale": 577143.73644287116},
                    {"level": 11, "resolution": 0.0006866455078125, "scale": 288571.86822143558},
                    {"level": 12, "resolution": 0.00034332275390625, "scale": 144285.93411071779},
                    {"level": 13, "resolution": 0.000171661376953125, "scale": 72142.967055358895},
                    {"level": 14, "resolution": 8.58306884765625e-005, "scale": 36071.483527679447},
                    {"level": 15, "resolution": 4.291534423828125e-005, "scale": 18035.741763839724},
                    {"level": 16, "resolution": 2.1457672119140625e-005, "scale": 9017.8708819198619},
                    {"level": 17, "resolution": 1.0728836059570313e-005, "scale": 4508.9354409599309},
                    {"level": 18, "resolution": 5.3644180297851563e-006, "scale": 2254.4677204799655},
                    {"level": 19, "resolution": 2.68220901489257815e-006, "scale": 1127.23386023998275},
                    {"level": 20, "resolution": 1.341104507446289075e-006, "scale": 563.616930119991375},
                    {"level": 21, "resolution": 6.705522537231445375e-007, "scale": 281.8084650599956875},
                    {"level": 22, "resolution": 3.3527612686157226875e-007, "scale": 140.90423252999784375},
                    {"level": 23, "resolution": 1.67638063430786134375e-007, "scale": 70.452116264998921875},
                    {"level": 24, "resolution": 8.38190317153930671875e-008, "scale": 35.2260581324994609375}
                ]
            });
            //设置图层全图范围
            let spatialReference = new apiInstance.SpatialReference({wkid: 4326});
            let fullExtent = new apiInstance.Extent(-180.0, -90.0, 180.0, 90.0, spatialReference);

            //图层配置
            layerConfig = layerConfig || {};
            $.extend(layerConfig, {
                //天地图切片的url模板
                urlTemplate: "http://{subDomain}.tianditu.cn/" + tdtLayerType + "_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + tdtLayerType + "&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&FORMAT=tiles",
                subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
                copyright: "",
                spatialReference: spatialReference,
                fullExtent: fullExtent,
                tileInfo: tileInfo,
            });

            //根据图层配置新建图层
            let layer = new apiInstance.WebTileLayer(layerConfig);

            return layer;
        },
        /**
         * 创建图形图层并添加到地图
         * @param apiInstance
         * @param map 地图
         * @param layerConfig 图层配置
         */
        createGraphicsLayerAndAddToMap: function (apiInstance, map, layerConfig) {
            let layer = new apiInstance.GraphicsLayer(layerConfig);
            //图层添加到地图
            map.add(layer);

            return layer;
        },
    },
    //几何
    geometry: {
        /**
         * wkt转点的图形（Graphic）
         * @param apiInstance api
         * @param wkt wkt
         * @param style 样式
         * @param sr 空间参考
         * @param attributes 属性字段值（可空）
         */
        wktToPointGraphic: function (apiInstance, wkt, style, sr, attributes) {
            //wkt转点的几何对象
            let point = comm.geometry.wktToPoint(apiInstance, wkt, sr);

            //生成点样式
            let markerSymbol = new apiInstance.SimpleMarkerSymbol(
                style,
            );

            //生成图形
            let graphic = new apiInstance.Graphic({
                //几何对象
                geometry: point,
                //样式
                symbol: markerSymbol,
                //属性字段
                attributes: attributes,
            });

            return graphic;
        },
        /**
         * wkt转点的文字的图形（Graphic）
         * @param apiInstance api
         * @param wkt wkt
         * @param style 样式
         * @param sr 空间参考
         * @param attributes 属性字段值（可空）
         */
        wktToTextGraphic: function (apiInstance, wkt, style, sr, attributes) {
            //wkt转点的几何对象
            let point = comm.geometry.wktToPoint(apiInstance, wkt, sr);

            //生成点样式，TextSymbol=文字样式
            let markerSymbol = new apiInstance.TextSymbol(
                style,
            );

            //生成图形
            let graphic = new apiInstance.Graphic({
                //几何对象
                geometry: point,
                //样式
                symbol: markerSymbol,
                //属性字段
                attributes: attributes,
            });

            return graphic;
        },
        /**
         * wkt转点的图片的图形（Graphic）
         * @param apiInstance api
         * @param wkt wkt
         * @param style 样式
         * @param sr 空间参考
         * @param attributes 属性字段值（可空）
         */
        wktToPicGraphic: function (apiInstance, wkt, style, sr, attributes) {
            //wkt转点的几何对象
            let point = comm.geometry.wktToPoint(apiInstance, wkt, sr);

            //生成点样式，PictureMarkerSymbol=图片点样式
            let pictureMarkerSymbol = new apiInstance.PictureMarkerSymbol(
                style,
            );

            //生成图形
            let graphic = new apiInstance.Graphic({
                //几何对象
                geometry: point,
                //样式
                symbol: pictureMarkerSymbol,
                //属性字段
                attributes: attributes,
            });

            return graphic;
        },
        newPictureMarkerSymbol(apiInstance,style){
            let pictureMarkerSymbol = new apiInstance.PictureMarkerSymbol(
                style,
            );
            return pictureMarkerSymbol;
        },
        /**
         * wkt转点几何对象
         * @param apiInstance api
         * @param wkt wkt
         * @param sr 空间参考
         * @returns {apiInstance.Polyline}
         */
        wktToPoint: function (apiInstance, wkt, sr) {
            //wkt转坐标对象
            let points = comm.geometry.wktToCoords(wkt);

            //生成线
            let point = new apiInstance.Point({
                //坐标
                x: points[0],
                y: points[1],
                //空间参考
                spatialReference: sr
            });

            return point;
        },
        /**
         * 坐标集合转点几何对象
         * @param apiInstance api
         * @param wkt wkt
         * @param sr 空间参考
         * @returns {apiInstance.Polyline}
         */
        coordToPoint: function (apiInstance, coord, sr) {
            //生成线
            let point = new apiInstance.Point({
                //坐标
                x: coord[0],
                y: coord[1],
                //空间参考
                spatialReference: sr
            });

            return point;
        },
        /**
         * 根据x y新建点几何对象
         * @param apiInstance api
         * @param wkt wkt
         * @param sr 空间参考
         * @returns {apiInstance.Polyline}
         */
        xyToPoint: function (apiInstance, x, y, sr) {
            //生成线
            let point = new apiInstance.Point({
                //坐标
                x: x,
                y: y,
                //空间参考
                spatialReference: sr
            });

            return point;
        },
        /**
         * 点转wkt
         * @param geometry
         * @returns {string}
         */
        pointToWkt: function (geometry) {
            return "POINT (" + geometry.x + " " + geometry.y + ")";
        },
        /**
         * 线几何对象转线的图形（Graphic）
         * @param apiInstance api
         * @param wkt wkt
         * @param style 样式
         * @param sr 空间参考
         * @param attributes 属性字段值（可空）
         */
        polylineToPolylineGraphic: function (apiInstance, geometry, style, sr, attributes) {
            //生成线样式
            let lineSymbol = new apiInstance.SimpleLineSymbol(
                style,
            );

            //生成图形
            let graphic = new apiInstance.Graphic({
                //几何对象
                geometry: geometry,
                //样式
                symbol: lineSymbol,
                //属性字段
                attributes: attributes,
            });

            return graphic;
        },
        /**
         * wkt转线的图形（Graphic）
         * @param apiInstance api
         * @param wkt wkt
         * @param style 样式
         * @param sr 空间参考
         * @param attributes 属性字段值（可空）
         */
        wktToPolylineGraphic: function (apiInstance, wkt, style, sr, attributes) {
            //wkt转线的几何对象
            let polyline = comm.geometry.wktToPolyline(apiInstance, wkt, sr);

            //生成线样式
            let lineSymbol = new apiInstance.SimpleLineSymbol(
                style,
            );

            //生成图形
            let graphic = new apiInstance.Graphic({
                //几何对象
                geometry: polyline,
                //样式
                symbol: lineSymbol,
                //属性字段
                attributes: attributes,
            });

            return graphic;
        },
        /**
         * wkt转线几何对象
         * @param apiInstance api
         * @param wkt wkt
         * @param sr 空间参考
         * @returns {apiInstance.Polyline}
         */
        wktToPolyline: function (apiInstance, wkt, sr) {
            //wkt转坐标对象
            let points = comm.geometry.wktToCoords(wkt);

            //生成线
            let polyline = new apiInstance.Polyline({
                //坐标
                paths: points,
                //空间参考
                spatialReference: sr
            });

            return polyline;
        },
        /**
         * 坐标转线几何对象
         * @param apiInstance api
         * @param coord 坐标对象，格式如：[[[113.545949, 22.24015749], [113.56989, 22.24916], [113.55324, 22.220588]]]
         * @param sr 空间参考
         * @returns {apiInstance.Polyline}
         */
        coordToPolyline: function (apiInstance, coord, sr) {
            //生成线
            let polyline = new apiInstance.Polyline({
                //坐标
                paths: coord,
                //空间参考
                spatialReference: sr
            });

            return polyline;
        },
        /**
         * 线转wkt
         * @param geometry
         * @returns {string}
         */
        polylineToWkt: function (geometry) {
            var wkt = [];
            var paths = geometry.paths;
            for (var i in paths) {
                var path = paths[i];
                for (var j in path) {
                    var p = path[j];
                    wkt.push(p.join(" "));
                }
            }
            return "LINESTRING (" + wkt.join(",") + ")";
        },
        /**
         * wkt转面的图形（Graphic）
         * @param apiInstance api
         * @param wkt wkt
         * @param style 样式
         * @param sr 空间参考
         * @param attributes 属性字段值（可空）
         */
        wktToPolygonGraphic: function (apiInstance, wkt, style, sr, attributes) {
            //wkt转面的几何对象
            let polygon = comm.geometry.wktToPolygon(apiInstance, wkt, sr);

            //生成面样式
            let fillSymbol = new apiInstance.SimpleFillSymbol(
                style,
            );

            //生成图形
            let graphic = new apiInstance.Graphic({
                //几何对象
                geometry: polygon,
                //样式
                symbol: fillSymbol,
                //属性字段
                attributes: attributes,
            });

            return graphic;
        },
        /**
         * wkt转面几何对象
         * @param apiInstance api
         * @param wkt wkt
         * @param sr 空间参考
         * @returns {apiInstance.Polygon}
         */
        wktToPolygon: function (apiInstance, wkt, sr) {
            //wkt转坐标对象
            let points = comm.geometry.wktToCoords(wkt);

            //生成面
            let polygon = new apiInstance.Polygon({
                //坐标
                rings: points,
                //空间参考
                spatialReference: sr
            });

            return polygon;
        },
        /**
         * 面几何对象转面的图形（Graphic）
         * @param apiInstance api
         * @param wkt wkt
         * @param style 样式
         * @param sr 空间参考
         * @param attributes 属性字段值（可空）
         */
        polygonToPolygonGraphic: function (apiInstance, geometry, style, sr, attributes) {
            //生成面样式
            let fillSymbol = new apiInstance.SimpleFillSymbol(
                style,
            );

            //生成图形
            let graphic = new apiInstance.Graphic({
                //几何对象
                geometry: geometry,
                //样式
                symbol: fillSymbol,
                //属性字段
                attributes: attributes,
            });

            return graphic;
        },
        /**
         * 坐标对象转面几何对象
         * @param apiInstance api
         * @param coord 坐标对象 格式是arcgis jsapi标准，例如：[[[113.527839, 22.27028], [113.527238, 22.2557786], [113.5437178, 22.2597268], [113.54423, 22.2730306], [113.527839, 22.27028]]]
         * @param sr 空间参考
         * @returns {apiInstance.Polygon}
         */
        coordToPolygon: function (apiInstance, coord, sr) {
            //生成面
            let polygon = new apiInstance.Polygon({
                //坐标
                rings: coord,
                //空间参考
                spatialReference: sr
            });

            return polygon;
        },
        /**
         * 面转wkt
         * @param geometry
         * @returns {string}
         */
        polygonToWkt: function (geometry) {
            let wkt = [];
            let rings = geometry.rings;
            for (let i in rings) {
                let ring = rings[i];
                for (let j in ring) {
                    let p = ring[j];
                    wkt.push(p.join(" "));
                }
            }
            return "POLYGON ((" + wkt.join(",") + "))";
        },
        /**
         * wkt转坐标对象
         * PS：坐标对象是arcgis jsapi格式
         * @param wkt
         * @returns {*}
         */
        wktToCoords: function (wkt) {
            var features, type, str;
            wkt = wkt.replace(/[\n\r]/g, " ");
            var matches = comm.geometry.regExes.typeStr.exec(wkt);
            if (matches) {
                type = matches[1].toLowerCase();
                str = matches[2];
                if (comm.geometry.parse[type]) {
                    features = comm.geometry.parse[type].apply(this, [str]);
                }
            }
            return features;
        },
        /**
         *  wkt转坐标对象的正则表单式
         */
        regExes: {
            'typeStr': /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
            'spaces': /\s+/,
            'parenComma': /\)\s*,\s*\(/,
            'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/,  // can't use {2} here
            'trimParens': /^\s*\(?(.*?)\)?\s*$/
        },
        /**
         * wkt转坐标对象
         */
        parse: {
            'point': function (str) {
                var coords = comm.util.trim(str).split(comm.geometry.regExes.spaces);
                for (var i in coords)
                    coords[i] = Number(coords[i]);
                return coords;//new esri.geometry.Point(coords[0], coords[1]);
            },
            'pointzm': function (str) {
                var coords = comm.util.trim(str).split(comm.geometry.regExes.spaces);
                for (var i in coords)
                    coords[i] = Number(coords[i]);
                return coords.slice(0, 2);//new esri.geometry.Point(coords[0], coords[1]);
            },
            'linestring': function (str) {
                var points = comm.util.trim(str).split(',');

                var components = [];
                for (var i = 0, len = points.length; i < len; ++i) {
                    components.push(comm.geometry.parse.point.apply(this, [points[i]]));
                }
                return components//new esri.geometry.Polyline(components);
            },
            'linestringzm': function (str) {
                var points = comm.util.trim(str).split(',');

                var components = [];
                for (var i = 0, len = points.length; i < len; ++i) {
                    components.push(comm.geometry.parse.pointzm.apply(this, [points[i]]));
                }
                return components//new esri.geometry.Polyline(components);
            },
            'multilinestring': function (str) {
                var line;
                var lines = comm.util.trim(str).split(comm.geometry.regExes.parenComma);
                var components = [];
                for (var i = 0, len = lines.length; i < len; ++i) {
                    line = lines[i].replace(comm.geometry.regExes.trimParens, '$1');
                    components.push(comm.geometry.parse.linestring.apply(this, [line]));
                }
                return components;
            },
            'polygon': function (str) {
                var ring, linestring, linearring;
                var rings = comm.util.trim(str).split(comm.geometry.regExes.parenComma);

                var components = [];
                for (var i = 0, len = rings.length; i < len; ++i) {
                    ring = rings[i].replace(comm.geometry.regExes.trimParens, '$1');
                    linestring = comm.geometry.parse.linestring.apply(this, [ring]);
                    components.push(linestring);
                }
                return components;
            }
        },
    },
    //通用
    util: {
        trim: function (str) {
            return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }
    }
};

module.exports = comm;