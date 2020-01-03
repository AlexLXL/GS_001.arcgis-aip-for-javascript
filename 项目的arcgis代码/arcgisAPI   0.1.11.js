import mapConfigHelper from './mapConfigHelper';
import facilityModel from '../model/facilityModel';
import mapService from 'services/mapService';
var serviceHelper = {};
var instance = {};
var graphicsLayer;
var arrowLayer;
var flashIntervalHandle;
var currentVue;
var regExes = {
  'typeStr': /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
  'spaces': /\s+/,
  'parenComma': /\)\s*,\s*\(/,
  'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/,  // can't use {2} here
  'trimParens': /^\s*\(?(.*?)\)?\s*$/
};
var parse = {
  /**
   * Return point feature given a point WKT fragment.
   * @param {String} str A WKT fragment representing the point
   * @returns {OpenLayers.Feature.Vector} A point feature
   * @private
   */
  'point': function (str) {
    var coords = trim(str).split(regExes.spaces);
    for (var i in coords)
      coords[i] = Number(coords[i]);
    return coords;//new esri.geometry.Point(coords[0], coords[1]);
  },
  'pointzm': function (str) {
    var coords = trim(str).split(regExes.spaces);
    for (var i in coords)
      coords[i] = Number(coords[i]);
    return coords.slice(0, 2);//new esri.geometry.Point(coords[0], coords[1]);
  },

  /**
   * Return a linestring feature given a linestring WKT fragment.
   * @param {String} str A WKT fragment representing the linestring
   * @returns {OpenLayers.Feature.Vector} A linestring feature
   * @private
   */
  'linestring': function (str) {
    var points = trim(str).split(',');

    var components = [];
    for (var i = 0, len = points.length; i < len; ++i) {
      components.push(parse.point.apply(this, [points[i]]));
    }
    return components//new esri.geometry.Polyline(components);
  },
  /**
   * Return a linestring feature given a linestring WKT fragment.
   * @param {String} str A WKT fragment representing the linestring
   * @returns {OpenLayers.Feature.Vector} A linestring feature
   * @private
   */
  'linestringzm': function (str) {
    var points = trim(str).split(',');

    var components = [];
    for (var i = 0, len = points.length; i < len; ++i) {
      components.push(parse.pointzm.apply(this, [points[i]]));
    }
    return components//new esri.geometry.Polyline(components);
  },

  /**
   * Return a multilinestring feature given a multilinestring WKT fragment.
   * @param {String} str A WKT fragment representing the multilinestring
   * @returns {OpenLayers.Feature.Vector} A multilinestring feature
   * @private
   */
  'multilinestring': function (str) {
    var line;
    var lines = trim(str).split(regExes.parenComma);
    var components = [];
    for (var i = 0, len = lines.length; i < len; ++i) {
      line = lines[i].replace(regExes.trimParens, '$1');
      components.push(parse.linestring.apply(this, [line]));
    }
    return components;
  },
  /**
   * Return a polygon feature given a polygon WKT fragment.
   * @param {String} str A WKT fragment representing the polygon
   * @returns {OpenLayers.Feature.Vector} A polygon feature
   * @private
   */
  'polygon': function (str) {
    var ring, linestring, linearring;
    var rings = trim(str).split(regExes.parenComma);

    var components = [];
    for (var i = 0, len = rings.length; i < len; ++i) {
      ring = rings[i].replace(regExes.trimParens, '$1');
      linestring = parse.linestring.apply(this, [ring]);
      components.push(linestring);
    }
    return components;
  }
};
function trim(str) {
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

// 读wkt
function read(wkt) {
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
};

// 初始化地图
instance.initMap = function (container, x, y, zoom, wkid, success, click) {
  var spatialReference = new instance.SpatialReference({wkid: parseInt(wkid)});
  var map = new instance.Map({});
  var view = new instance.MapView({
    container: container,
    map: map,
    spatialReference: spatialReference
  });
  view.on('click', function (evt) {
    console.log(evt);
    //evt.stopPropagation();
    if (!!click)
      click(evt);
  });
  //移除esri logo
  view.ui.remove("attribution");
  success(map, view);
};
// 带配置的初始化地图(还没用过)
instance.initMapWithConfig = function (container, cb, click, isFirstInit) {
  mapConfigHelper.init(function (config) {
    var baseMaps = mapConfigHelper.getBaseMapConfig();
    var facilities = mapConfigHelper.getFacilityConfig();
    var centerAndZoom = mapConfigHelper.getCenterAndZoom();// 底图中心点和放大缩小
    var centerX = centerAndZoom.x;
    var centerY = centerAndZoom.y;
    var zoom = !!centerAndZoom.zoom ? parseInt(centerAndZoom.zoom) : 1;
    var wkid = !!baseMaps[0].layer.wkid ? baseMaps[0].layer.wkid : 4326;
    instance.initMap(container, centerX, centerY, zoom, wkid, function (map, view) {
      var cacheLayers = {};
      cacheLayers.baseMaps = instance.processBaseMapConfig(map, baseMaps);
      /*   var spatialReference = cacheLayers.baseMaps[baseMaps[0].id][0].spatialReference;
       view.spatialReference = spatialReference;*/
      setTimeout(function () {
        instance.setCenter(view, centerX, centerY, zoom)
      }, 500);
      if (mapConfigHelper.getCustomLayerConfig().length > 0) {
        cacheLayers.customerLayers = {};
        mapConfigHelper.getCustomLayerConfig().forEach(function (clConfig) {
          var layer;
          if (clConfig.layer.type == "ArcGISFeatureLayer") {
            var layer = instance.createGraphicsLayer(map, view, clConfig.layer.funId);
            if (clConfig.layer.display == 0) {
              layer.visible = false;
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layer,
              config: clConfig
            };
          } else if (clConfig.layer.type == 'TomcatTile') {
            var layers = instance.createWebTileLayer(map, clConfig.layer, clConfig.layer.funId);
            if (!!clConfig.layer.transparency && clConfig.layer.transparency < 1) {
              layers[0].opacity = clConfig.layer.transparency
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layers[0],
              config: clConfig
            };
          } else if (clConfig.layer.type == 'ArcgisTile') {
            var layers = instance.createWebTileLayer(map, clConfig.layer, clConfig.layer.funId);
            if (!!clConfig.layer.transparency && clConfig.layer.transparency < 1) {
              layers[0].opacity = clConfig.layer.transparency
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layers[0],
              config: clConfig
            };
          }
          else {
            var layer = instance.createMapImageLayer(map, view, {
              url: clConfig.layer.url,
              id: clConfig.layer.funId,
              spatialReference:view.spatialReference
            });
            if (!!clConfig.layer.transparency && clConfig.layer.transparency < 1) {
              layer.opacity = clConfig.layer.transparency
            }
            if (clConfig.layer.display == 0) {
              layer.visible = false;
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layer,
              config: clConfig
            };
          }
        })
      }
      if (mapConfigHelper.getFacilityConfig().length > 0) {
        var counter = facilities.length;
        var graLayer = instance.createGraphicsLayer(map, view, 'facility-graphicLayer', null, 99);
        cacheLayers.facilityLayer = graLayer;
        facilities.forEach(function (facilityConfig, index) {
          var url = facilityConfig.layer.url;
          var facilityTypeName = facilityConfig.layer.funId;
          facilityConfig.icon = facilityConfig.layer.icon1;
          facilityConfig.facilityTypeName = facilityTypeName;
          var isShow = facilityConfig.layer.display == 1;
          mapService.getFacilityByTypeName(facilityTypeName, url, function (subFacilities) {
            counter--;
            if (isShow) {
              instance.createFacilityPoints(graLayer, facilityConfig, subFacilities);
            }
            facilityModel.addFacility(facilityConfig, subFacilities);
            if (counter == 0) {
              //get all data;
              cb(map, view, cacheLayers);
            }
          })
        });
      }
      else {
        cb(map, view, cacheLayers);
      }
    }, click);
  }.bind(this), isFirstInit);
};

// 边界框的最小和最大X和Y坐标。范围用于描述MapView的可见部分
instance.locateToExtent = function (view, extent, expand) {
  var newExtent = new instance.Extent(extent[0], extent[1], extent[2], extent[3], view.spatialReference);
  if (!expand) {
    expand = 0;
  }
  view.goTo(newExtent.expand(expand));
};
// 创建点
instance.createPoint = function (x, y, spatialReference) {
  var point = new instance.Point({
    longitude: x,
    latitude: y,
    spatialReference: spatialReference
  });
  return point;
}
// 创建线
instance.createPolyline = function (layer, paths, styleObj, attributes) {
  var line = new instance.Polyline({
    paths: paths,
    spatialReference: layer.spatialReference
  });
  var markerSymbol = new instance.SimpleLineSymbol(
    styleObj
    /*{
     color: [226, 119, 40],
     width: 4
     }*/);

  // Create a graphic and add the geometry and symbol to it
  var polyLine = new instance.Graphic({
    geometry: line,
    symbol: markerSymbol,
    attributes: attributes,
    spatialReference: layer.spatialReference
  });
  if (!!layer)
    layer.add(polyLine);
  return polyLine;
};
// 创建几何图形
instance.createPolygon = function (layer, coords, styleObj, attributes) {
  var polygon = new instance.Polygon({
    rings: coords,
    spatialReference: layer.spatialReference
  });
  var fillSymbol = new instance.SimpleFillSymbol(
    styleObj
    /*{
     color: [227, 139, 79, 0.8],
     outline: { // autocasts as new SimpleLineSymbol()
     color: [255, 255, 255],
     width: 1
     }
     }*/);
  var polygonGraphic = new instance.Graphic({
    geometry: polygon,
    symbol: fillSymbol,
    attributes: attributes,
    spatialReference: layer.spatialReference
  });
  if (!!layer)
    layer.add(polygonGraphic);
  return polygonGraphic;

};
// 创建几何图形，应该是可以结合点线面来使用的
instance.createGeometry = function (layer, geometry, styleObj) {
  var symbol = {};
  if (geometry.type == "point") {
    symbol = new instance.PictureMarkerSymbol(styleObj);
  } else {
    symbol = new instance.SimpleLineSymbol(styleObj);
  }
  var graphic = new instance.Graphic({
    geometry: geometry,
    symbol: symbol,
    spatialReference: layer.spatialReference
  });
  layer.add(graphic);
  return graphic;
};

// 改变线的样式
instance.changeLineSymbolStyle = function (graphic, newStyleObj) {
  var markerSymbol = new instance.SimpleLineSymbol(
    newStyleObj
    /*{
     color: [226, 119, 40],
     width: 4
     }*/);
  graphic.symbol = markerSymbol;
};
// 改变几何图形的样式
instance.changePolygonSymbolStyle = function (graphic, newStyleObj) {
  var fillSymbol = new instance.SimpleFillSymbol(
    newStyleObj
    /*{
     color: [227, 139, 79, 0.8],
     outline: { // autocasts as new SimpleLineSymbol()
     color: [255, 255, 255],
     width: 1
     }
     }*/);
  graphic.symbol = fillSymbol;
};
// 改变点的样式
instance.changeMarkSymbolStyle = function (graphic, newStyleObj) {
  var markerSymbol = new instance.SimpleMarkerSymbol(
    newStyleObj
    /*
     {
     color: [226, 119, 40],
     outline: { // autocasts as new SimpleLineSymbol()
     color: [255, 255, 255],
     width: 2
     }}*/
  );
  graphic.symbol = markerSymbol;
};
// 改变point图形的样式
instance.changePictureMarkSymbolStyle = function (graphic, newStyleObj) {
  var markerSymbol = new instance.PictureMarkerSymbol(
    newStyleObj
    /*{
     url: "https://webapps-cdn.esri.com/Apps/MegaMenu/img/logo.jpg",
     width: "8px",
     height: "8px"
     }*/);
  graphic.symbol = markerSymbol;
};
// 画笔
instance.initDrawPen = function (view, layer, drawComplete) {
  var searchArea;

  function createPoint(event) {
    return view.toMap(event);
  }

  function addVertex(point, isFinal) {

    var polygon = instance.drawConfig.activePolygon;
    var ringLength;

    if (!polygon) {
      var fillSymbol = new instance.SimpleFillSymbol(
        {
          color: [255, 0, 0, 0.8],
          outline: { // autocasts as new SimpleLineSymbol()
            color: [255, 255, 255],
            width: 2
          }
        });
      polygon = new instance.Polygon({
        spatialReference: view.spatialReference,
        symbol: fillSymbol
      });
      polygon.addRing([point, point]);
    } else {
      ringLength = polygon.rings[0].length;
      polygon.insertPoint(0, ringLength - 1, point);
    }
    instance.drawConfig.activePolygon = polygon;
    return redrawPolygon(polygon, isFinal);
  }

  /**
   * Clears polygon(s) from the view and adds the
   * given polygon to the view.
   */
  function redrawPolygon(polygon, finished) {

    // simplify the geometry so it can be drawn accross
    // the dateline and accepted as input to other services
    var geometry = finished ? instance.geometryEngine.simplify(polygon) :
      polygon;

    if (!geometry && finished) {
      console.log(
        "Cannot finish polygon. It must be a triangle at minimum. Resume drawing..."
      );
      return null;
    }

    clearPolygon();

    var polygonGraphic = new instance.Graphic({
      geometry: geometry,
      symbol: finished ? instance.drawConfig.finishedSymbol : instance.drawConfig.drawingSymbol
    });
    layer.add(polygonGraphic);
    return geometry;
  }

  /**
   * Executes on each pointer-move event. Updates the
   * final vertex of the activePolygon to the given
   * point.
   */
  function updateFinalVertex(point) {
    var polygon = instance.drawConfig.activePolygon.clone();

    var ringLength = polygon.rings[0].length;
    polygon.insertPoint(0, ringLength - 1, point);
    redrawPolygon(polygon);
  }

  /**
   * Cleares the drawn polygon in the view. Only one
   * polygon may be drawn at a time.
   */
  function clearPolygon() {
    var polygonGraphic = layer.graphics.find(function (graphic) {
      return graphic.geometry.type === "polygon";
    });

    if (polygonGraphic) {
      layer.graphics.remove(polygonGraphic);
    }
  }

  instance.pointerDownListener, instance.pointerMoveListener, instance.doubleClickListener;

  function deactivateDraw() {
    instance.drawConfig.isDrawActive = false;
    instance.pointerDownListener.remove();
    instance.pointerMoveListener.remove();
    instance.doubleClickListener.remove();
    instance.drawConfig.activePolygon = null;
  }

  function activateDraw() {
    instance.drawConfig.isDrawActive = true;
    // remove the previous popup and polygon if they already exist
    clearPolygon();
    view.popup.close();

    instance.pointerDownListener = view.on("click", function (event) {
      event.stopPropagation();
      var point = createPoint(event);
      addVertex(point);
    });
    instance.pointerMoveListener = view.on("pointer-move", function (event) {
      if (instance.drawConfig.activePolygon) {
        event.stopPropagation();

        var point = createPoint(event);
        updateFinalVertex(point);
      }
    });
    instance.doubleClickListener = view.on("double-click", function (event) {
      event.stopPropagation();

      searchArea = addVertex(event.mapPoint, true);

      // If an invalid search area is entered, then drawing
      // continues and the query is not executed
      if (!searchArea) {
        return null;
      }

      deactivateDraw();
      drawComplete(searchArea);
    });
  }

  return {
    startDraw: activateDraw,
    endDraw: function () {
      deactivateDraw();
      clearPolygon();
      view.popup.close();
      return searchArea;
    }
  }
};


// 底图添加可操作性图层Layer(可操作性图层的意思是可以控制显示隐藏，而底图属于一直显示的)
instance.addLayers = function (map, layers) {
  map.addMany(layers);
};
// 显示
instance.showLayer = function (map, id) {
  var currentLayer = map.findLayerById(id);
  if (!!currentLayer) {
    currentLayer.visible = true;
  }
};
// 隐藏
instance.hideLayer = function (map, id) {
  var currentLayer = map.findLayerById(id);
  if (!!currentLayer) {
    currentLayer.visible = false;
  }
};
// 获取
instance.getLayerById = function (map, layerId) {
  return map.findLayerById(layerId);
};
// 删除
instance.removeLayers = function (map, layers) {
  map.removeMany(layers);
};
// 创建可操作性图层图形类
instance.createGraphicsLayer = function (map, view, id, click, index) {
  var layer = new instance.GraphicsLayer({
    spatialReference: view.spatialReference,
    id: id
  });
  if (!!map) {
    if (!!index) {
      map.add(layer, index);
    } else {
      map.add(layer);
    }
  }
  if (!!click) {
    layer.on('layerview-create', function (evt) {
      var graView = evt.view;
      graView.on('click', function (event) {
        graView.hitTest(event).then(click);
      });
    });
  }
  return layer;
};
// 删除可操作性图层
instance.removeGraphics = function (layer, graphics) {
  layer.removeMany(graphics);
};


// 创建瓦片图层
instance.createWebTileLayer = function (map, layer, id, click) {
  var titleExtent = [];
  if (!!layer.tileExtent) {
    layer.tileExtent.split(',').forEach(function (extent) {
      titleExtent.push(parseFloat(extent))
    })
  }
  var tileInfoConfig = {
    url: layer.url,  //瓦片大小
    "size": parseFloat(layer.tileSizeRows),  //瓦片大小
    "compressionQuality": 0,
    "origin": {"x": parseFloat(layer.tileZeroX), "y": parseFloat(layer.tileZeroY)},  //切图原点
    "spatialReference": {"wkid": parseInt(layer.wkid)},  //瓦片比例尺
    "format": layer.tileFormat
  };
  var tileResolutions = layer.tileResolution.split(',');
  var tileLevels = layer.tileLevel.split(',');
  var tileScales = layer.tileScale.split(',');
  var lods = [];
  if (tileResolutions.length !== tileLevels.length || tileScales.length !== tileResolutions.length) {
    console.error('地图配置有误', layer);
  }
  else {
    //lods：等级、比例尺、分辨率。从ArcGIS切图配置文件conf.xml中获取。设置lods会影响地图比例尺控件的范围。
    for (var i = 0; i < tileScales.length; i++) {
      lods.push({
        "level": parseInt(tileLevels[i]),
        "resolution": parseFloat(tileResolutions[i]),
        "scale": parseFloat(tileScales[i])
      });
    }
    tileInfoConfig.lods = lods;
    var tileInfo = new instance.TileInfo(tileInfoConfig);
    var spatialReference = new instance.SpatialReference({wkid: parseInt(layer.wkid)});
    var fullExtent = new instance.Extent(titleExtent[0], titleExtent[1], titleExtent[2], titleExtent[3], spatialReference);
    if (layer.type == 'ArcgisTile') {
      var tiledLayer = new instance.WebTileLayer({
        id: id,
        urlTemplate: layer.url + '/tile/{level}/{row}/{col}',
        copyright: "",
        spatialReference: spatialReference,
        fullExtent: fullExtent,
        tileInfo: tileInfo
      });
    } else {
      var tiledLayer = new instance.WebTileLayer({
        id: id,
        urlTemplate: layer.url,
        copyright: "",
        spatialReference: spatialReference,
        fullExtent: fullExtent,
        tileInfo: tileInfo,
        getTileUrl: function (level, row, col) {
          if (layer.ext1 == 'superMap') {
            return this.urlTemplate + level + "/" + row + "/" + col + "." + this.tileInfo.format;
          }
          return this.urlTemplate + "L" + dojo.string.pad(level, 2, '0') + "/" + "R" + (dojo.string.pad(row.toString(16), 8, '0')).toUpperCase() + "/" + "C" + (dojo.string.pad(col.toString(16), 8, '0')).toUpperCase() + "." + this.tileInfo.format;

        }
      });
    }

    if (!!click) {
      tiledLayer.on('layerview-create', function (evt) {
        var graView = evt.view;
        var graLayerView = evt.layerView;
        var layerId = evt.layerView.layer.id;
        graView.on('click', function (event) {
          graView.hitTest(event).then(click);
        });
      });
    }
    if (!!map) {
      map.add(tiledLayer);
    }
    return [tiledLayer];
  }
};
// 使用瓦片图层WebTileLayer加载天地图
instance.initTDLayer = function (layerType) {
  var layerInfo = mapConfigHelper.getTdtLayerInfo();
  var curLayerInfo = layerInfo.find(n => n.layerName[0] === layerType);
  var tileInfo = new instance.TileInfo({
    "rows": 256,
    "cols": 256,
    "compressionQuality": 0,
    "origin": {
      "x": -180,
      "y": 90
    },
    "spatialReference": {
      "wkid": 4326
    },
    "lods": [
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
  var spatialReference = new instance.SpatialReference({wkid: 4326});
  var fullExtent = new instance.Extent(-180.0, -90.0, 180.0, 90.0, spatialReference);

  var tiledLayer = new instance.WebTileLayer({
    //urlTemplate: "http://{subDomain}.tianditu.com/DataServer?T=vec_c&x={col}&y={row}&l={level}",
    urlTemplate: "http://{subDomain}.tianditu.cn/" + curLayerInfo.layerName[0] + "_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + curLayerInfo.layerName[0] + "&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&FORMAT=tiles",
    subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
    copyright: "",
    spatialReference: spatialReference,
    fullExtent: fullExtent,
    tileInfo: tileInfo,
  });
  var tiledMarkLayer = new instance.WebTileLayer({
    urlTemplate: "http://{subDomain}.tianditu.cn/" + curLayerInfo.layerName[1] + "_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + curLayerInfo.layerName[1] + "&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&FORMAT=tiles",
    subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
    copyright: "",
    spatialReference: spatialReference,
    fullExtent: fullExtent,
    tileInfo: tileInfo,
  });
  return [tiledLayer, tiledMarkLayer];
};
// 创建4.x独有图层
instance.createMapImageLayer = function (map, view, config, cb) {
  config.spatialReference = view.spatialReference;
  // points to the states layer in a service storing U.S. census data
  var layer = new instance.MapImageLayer(config);
  layer.on('layerview-create', function (view) {
    if (!!cb) {
      cb(view)
    }
  })
  map.add(layer);  // adds the layer to the map
  return layer;
};


instance.createSymbol = function (layer, x, y, styleObj) {
  var point = new instance.Point({
    longitude: x,
    latitude: y
  });
  var markerSymbol = new instance.SimpleMarkerSymbol(
    styleObj
    /*
     {
     color: [226, 119, 40],
     outline: { // autocasts as new SimpleLineSymbol()
     color: [255, 255, 255],
     width: 2
     }}*/
  );

  // Create a graphic and add the geometry and symbol to it
  var markPoint = new instance.Graphic({
    geometry: point,
    symbol: markerSymbol,
    spatialReference: layer.spatialReference
  });
  if (!!layer)
    layer.add(markPoint);
  return markPoint;
};
instance.createTextSymbol = function (layer, x, y, textObj, attributes) {
  var point = new instance.Point({
    longitude: x,
    latitude: y,
    spatialReference: layer.spatialReference
  });
  if (!textObj) {
    textObj = {
      color: 'red',
      text: 'you are here',
      xoffset: 0,
      yoffset: 0,
      font: {
        size: 12
      }
    }
  }
  var textSymbol = new instance.TextSymbol(
    textObj
    //{
    //     color:'#333',
    //     text:'you are here',
    //     xoffset:3,
    //     yoffset:3,
    //     font:{
    //         size:12
    //     }
    // }
  );

  var markPoint = new instance.Graphic({
    geometry: point,
    symbol: textSymbol,
    attributes: attributes,
    spatialReference: layer.spatialReference
  });
  if (!!layer)
    layer.add(markPoint);
  return markPoint;
};
instance.createPictureMarkSymbol = function (layer, x, y, imgObj, attributes, popupAttribute) {
  var point = new instance.Point({
    longitude: x,
    latitude: y,
    spatialReference: layer.spatialReference
  });
  if (!imgObj) {
    imgObj = {
      url: "https://webapps-cdn.esri.com/Apps/MegaMenu/img/logo.jpg",
      width: "8px",
      height: "8px"
    }
  }
  var markerSymbol = new instance.PictureMarkerSymbol(
    imgObj
    /*{
     url: "https://webapps-cdn.esri.com/Apps/MegaMenu/img/logo.jpg",
     width: "8px",
     height: "8px"
     }*/);
  // Create a graphic and add the geometry and symbol to it
  var markPoint = new instance.Graphic({
    geometry: point,
    symbol: markerSymbol,
    attributes: attributes,
    popupTemplate: popupAttribute,
    spatialReference: layer.spatialReference
  });
  if (!!layer)
    layer.add(markPoint);
  return markPoint;
};

// goTo动画，设置中心
instance.setCenter = function (view, x, y, zoom) {
  var point = instance.createPoint(x, y, view.spatialReference);
  var newView = {};
  if (!!zoom) {
    newView.zoom = zoom;
  }
  if (!!x && !!y) {
    newView.target = point;
  }
  view.goTo(newView);
};


// wkt空间参照系统（wkt和点线面的相互转化）
instance.wktToPolygonLayer = function (wkt, layer, style, attributes) {
  var points = read(wkt);// 读wkt
  if (!style) {
    style = {
      color: [41, 0, 255, 0.8],
      outline: { // autocasts as new SimpleLineSymbol()
        color: [255, 255, 255],
        width: 1
      }
    };
  }
  var polygon = instance.createPolygon(layer, points, style, attributes);
  return polygon;
};
instance.wktToPoint = function (wkt, spatialreference) {
  /**
   *wkt转化成arcgis的Point对象
   * @param wkt
   * @returns {Polyline}
   * @constructor
   */
  var pt = read(wkt);
  var point = new instance.createPoint(pt[0], pt[1], spatialreference);
  return point;
};
instance.wkbToPolyline = function (wkt, layer, style, attrubute) {
  var points = read(wkt);
  var polyline = instance.createPolyline(layer, [points], style, attrubute)
  return polyline;
};
instance.wktToPolygon = function (wkt, spatialreference) {
  var points = read(wkt);
  var json = {
    rings: points,
    spatialReference: spatialreference
  }
  var polygon = new instance.Polygon(json);
  return polygon;
}
instance.pointToWKT = function (geometry) {
  return "POINT (" + geometry.x + " " + geometry.y + ")";
};
instance.lineToWKT = function (geometry) {
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
};
instance.polygonToWKT = function (geometry) {
  var wkt = [];
  var rings = geometry.rings;
  for (var i in rings) {
    var ring = rings[i];
    for (var j in ring) {
      var p = ring[j];
      wkt.push(p.join(" "));
    }
  }
  return "POLYGON ((" + wkt.join(",") + "))";
};




instance.createFacilityPoints = function (graLayer, facilityConfig, subFacilities) {
  var imgObj = {
    width: "24px",
    height: "32px"
  };
  var legendIcon;
  var graphics = [];
  subFacilities.forEach(function (facility) {
    if (facility.onlineState == false) {//优先判断是否在线
      legendIcon = facilityConfig.icon.split("-")[0] + '-04';
    }
    else if (facility.state === 1) {
      legendIcon = facilityConfig.icon.split("-")[0] + '-02';
    } else if (facility.state === 2) {
      legendIcon = facilityConfig.icon.split("-")[0] + '-03';
    } else {
      legendIcon = facilityConfig.icon;
    }
    if (facilityConfig.facilityTypeName == 'WQ') {
      legendIcon = facilityConfig.icon.split("-")[0] + '-02';
    }
    var newIcon = './img/mapLegend/facility/' + legendIcon + '.png';
    imgObj.url = newIcon;
    var attributes = {
      'item': facility,
      'facilityTypeName': facilityConfig.facilityTypeName,
      'id': facility.id
    };
    if (!!facility.x && facility.y) {
      var graphic = instance.createPictureMarkSymbol(graLayer, facility.x, facility.y, imgObj, attributes);
      graphics.push(graphic)
    }
  })
  if (!facilityConfig.graphics) {
    //为了第一次初始化时加载
    facilityConfig.graphics = graphics;
  }
};
instance.refreshFacilityLayer = function (map, cb) {
  if (mapConfigHelper.getFacilityConfig().length > 0) {
    var facilities = mapConfigHelper.getFacilityConfig();
    var counter = facilities.length;
    var graLayer = map.findLayerById('facility-graphicLayer');
    graLayer.removeAll();
    facilities.forEach(function (facilityConfig, index) {
      var url = facilityConfig.layer.url;
      var facilityTypeName = facilityConfig.layer.funId;
      facilityConfig.icon = facilityConfig.layer.icon1;
      facilityConfig.facilityTypeName = facilityTypeName;
      var isShow = facilityConfig.layer.display == 1;
      mapService.getFacilityByTypeName(facilityTypeName, url, function (subFacilities) {
        counter--;
        if (isShow) {
          instance.createFacilityPoints(graLayer, facilityConfig, subFacilities);
        }
        facilityModel.addFacility(facilityConfig, subFacilities);
        if (counter == 0) {
          //get all data;
          cb(facilityModel);
        }
      })
    });
  } else {
    cb();
  }
};
// 给底图添加layer
instance.processBaseMapConfig = function (map, baseMaps) {
  var cacheLayers = {};
  baseMaps.forEach(function (baseMap) {
    var layers;
    if (baseMap.layer.type == 'TomcatTile' || baseMap.layer.type == 'ArcgisTile') {
      layers = instance.createWebTileLayer(map, baseMap.layer, baseMap.id);
    } else if (baseMap.layer.type == 'TDT') {
      layers = instance.initTDLayer(baseMap.layer.tdtType);
    }
    if (!!layers) {
      cacheLayers[baseMap.id] = layers;
      layers.forEach(function (layer) {
        map.add(layer);
      });
    }
  });
  return cacheLayers;
};
instance.registerMapTool = function (view, buttonId, position, cb) {
  view.ui.add(buttonId, position);
  if (cb) {
    $("#" + buttonId)[0].addEventListener('click', function () {
      cb();
    });
  }
};
//10.17增加追溯分析
//绘制南宁追溯分析查询的管网信息
instance.drawNNPolyline = function (result, currentMapView, currentMap, cb) {
  var lineColor;
  var that = this;
  if (!graphicsLayer) {
    graphicsLayer = getMapGraphicsLayer(currentMap, "nnTraceAbilityAnalysis");
  }
  if (!arrowLayer) {
    arrowLayer = getMapGraphicsLayer(currentMap, "arrowSymbolLayer");
  }

  var pipeLineResult = result.mapAnalyzeResult.pipeLineResult;
  var pipeLineArr = [];
  var pipeStr = '';
  var cancalStr = '';
  for (var i = 0; i < pipeLineResult.length; i++) {
    var pipeLine = pipeLineResult[i];


    pipeLineArr.push(...pipeLine);
    // var line = Polyline({
    //     "paths": [[[pipeLine.startX, pipeLine.startY], [pipeLine.endX, pipeLine.endY]]],
    //     "spatialReference": currentMap.spatialReference
    // });
    // addArrowToLayer(line, getMapGraphicsLayer("arrowSymbolLayer"), 15, 60);
  }

  for (var i = 0; i < pipeLineArr.length; i++) {
    var pipeLineObj = pipeLineArr[i];
    if (pipeLineObj.ds2 > 0) {
      cancalStr += pipeLineObj.oid + ',';
    } else {
      pipeStr += pipeLineObj.oid + ',';
    }
    if (pipeLineObj.sort == "雨水")
      lineColor = [0, 255, 197];
    else if (pipeLineObj.sort == "污水")
      lineColor = [230, 0, 169];
    else
      lineColor = [230, 152, 0];
    var paths = [[[pipeLineObj.startX, pipeLineObj.startY], [pipeLineObj.endX, pipeLineObj.endY]]];
    var styleObj = {color: lineColor, width: 4}
    that.createPolyline(graphicsLayer, paths, styleObj);
    var line = new instance.Polyline({
      "paths": [[[pipeLineObj.startX, pipeLineObj.startY], [pipeLineObj.endX, pipeLineObj.endY]]],
      "spatialReference": currentMapView.spatialReference
    });
    that.drawArrowPolyline(currentMapView, line, getMapGraphicsLayer(currentMap, "arrowSymbolLayer"), 15, 50, "#2F4F4F");
  }
  if (pipeStr.length > 0) {
    console.warn('pipe(' + pipeStr.substring(0, pipeStr.length - 1) + ')');
  }
  if (cancalStr.length > 0) {
    console.warn('canal(' + cancalStr.substring(0, cancalStr.length - 1) + ')');
  }

  var slopeGraphicsLayer = getMapGraphicsLayer(currentMap, "nnSlopeGraphicsLayer");
  var bigSmallsGraphicsLayer = getMapGraphicsLayer(currentMap, "nnBigSmallsGraphicsLayer");
  var ywsGraphicsLayer = getMapGraphicsLayer(currentMap, "nnywsGraphicsLayer");
  var arrowSymbolLayer = getMapGraphicsLayer(currentMap, "arrowSymbolLayer");
  result.slopeGraphicsLayer = slopeGraphicsLayer;
  result.bigSmallsGraphicsLayer = bigSmallsGraphicsLayer;
  result.ywsGraphicsLayer = ywsGraphicsLayer;
  result.arrowSymbolLayer = arrowSymbolLayer;
  cb(result)
};
instance.drawArrowPolyline = function (currentMapView, polyline, layer, length, angleValue, graphicColor) {
  //线的坐标串
  var linePoint = polyline.paths;
  var arrowCount = linePoint.length;
  // var sfs = new instance.SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
  //     new instance.SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new instance.Color(graphicColor), 2), new instance.Color(graphicColor)
  // );
  var symbol = {
    type: "simple-fill",  // autocasts as new SimpleFillSymbol()
    color: "#000",
    style: "solid",
    outline: {  // autocasts as new SimpleLineSymbol()
      color: "red",
      width: 60
    }
  };
  var sfs = new instance.SimpleFillSymbol(symbol);
  for (var i = 0; i < arrowCount; i++) { //在拐点处绘制箭头
    var line = linePoint[i];
    var centerX = (line[0][0] + line[line.length - 1][0]) / 2;
    var centerY = (line[0][1] + line[line.length - 1][1]) / 2;
    var centerPoint = new instance.Point([centerX, centerY], currentMapView.spatialReference);
    var startPoint = new instance.Point([line[0][0], line[0][1]], currentMapView.spatialReference);
    var endPoint = new instance.Point([line[line.length - 1][0], line[line.length - 1][1]], currentMapView.spatialReference);

    var pixelCenter = currentMapView.toScreen(centerPoint);
    var pixelStart = currentMapView.toScreen(startPoint);
    var pixelEnd = currentMapView.toScreen(endPoint);
    var twoPointDistance = instance.calcTwoPointDistance(pixelStart.x, pixelStart.y, pixelEnd.x, pixelEnd.y);
    if (twoPointDistance <= 20)
      continue;
    var angle = angleValue;//箭头和主线的夹角
    var r = length; // r/Math.sin(angle)代表箭头长度
    var delta = 0; //主线斜率，垂直时无斜率
    var offsetPoint = [];//箭头尾部偏移量
    var param = 0; //代码简洁考虑
    var pixelTemX, pixelTemY;//临时点坐标
    var pixelX, pixelY, pixelX1, pixelY1;//箭头两个点

    if (pixelEnd.x - pixelStart.x == 0) {
      //斜率不存在是时
      pixelTemX = pixelEnd.x;
      offsetPoint[0] = pixelCenter.x - 3;
      if (pixelEnd.y > pixelStart.y) {
        pixelTemY = pixelCenter.y - r;
        offsetPoint[1] = pixelCenter.y - (r - 2);
      } else {
        pixelTemY = pixelCenter.y + r;
        offsetPoint[1] = pixelCenter.y + (r + 2);
      }
      //已知直角三角形两个点坐标及其中一个角，求另外一个点坐标算法
      pixelX = pixelTemX - r * Math.tan(angle);
      pixelX1 = pixelTemX + r * Math.tan(angle);
      pixelY = pixelY1 = pixelTemY;
    } else {
      //斜率存在时
      delta = (pixelEnd.y - pixelStart.y) / (pixelEnd.x - pixelStart.x);
      param = Math.sqrt(delta * delta + 1);

      if ((pixelEnd.x - pixelStart.x) < 0) {
        //第二、三象限
        pixelTemX = pixelCenter.x + r / param;
        pixelTemY = pixelCenter.y + delta * r / param;
        if ((pixelEnd.y - pixelStart.y) < 0) {
          //第三象限
          offsetPoint[0] = pixelCenter.x + (r - 2) / param;
          offsetPoint[1] = pixelCenter.y + delta * (r - 2) / param;
        } else {
          //第二象限
          offsetPoint[0] = pixelCenter.x + (r - 2) / param;
          offsetPoint[1] = pixelCenter.y + delta * (r - 2) / param;
        }
      } else {
        //第一、四象限
        pixelTemX = pixelCenter.x - r / param;
        pixelTemY = pixelCenter.y - delta * r / param;
        if ((pixelEnd.y - pixelStart.y) < 0) {
          //第四象限
          offsetPoint[0] = pixelCenter.x - (r - 2) / param;
          offsetPoint[1] = pixelCenter.y - delta * (r - 2) / param;
        } else {
          //第一象限
          offsetPoint[0] = pixelCenter.x - (r - 2) / param;
          offsetPoint[1] = pixelCenter.y - delta * (r - 2) / param;
        }
      }
      //已知直角三角形两个点坐标及其中一个角，求另外一个点坐标算法
      pixelX = pixelTemX + Math.tan(angle) * r * delta / param;
      pixelY = pixelTemY - Math.tan(angle) * r / param;

      pixelX1 = pixelTemX - Math.tan(angle) * r * delta / param;
      pixelY1 = pixelTemY + Math.tan(angle) * r / param;
    }
    var pointArrow = currentMapView.toMap(new instance.ScreenPoint(pixelX, pixelY));
    var pointArrow1 = currentMapView.toMap(new instance.ScreenPoint(pixelX1, pixelY1));
    var pointArrow2 = currentMapView.toMap(new instance.ScreenPoint(offsetPoint[0], offsetPoint[1]));
    instance.createPolyline(layer, [[pointArrow.x, pointArrow.y], [centerPoint.x, centerPoint.y], [pointArrow1.x, pointArrow1.y], [pointArrow2.x, pointArrow2.y]],
      {
        color: [51, 51, 204, 0.9],
        width: 4
      })
  }
};
instance.getGraphicsLayer = function (LayerId, index, map) {
  var graphicsLayer = null;
  if (map.findLayerById(LayerId)) {
    graphicsLayer = map.findLayerById(LayerId);
  } else {
    graphicsLayer = new instance.GraphicsLayer({id: LayerId});
    if (index)
      map.addMany([graphicsLayer], index);
    else
      map.addMany([graphicsLayer]);
  }
  return graphicsLayer;
};
instance.nnTraceAnalysisByRecursive = function (event, traceAnalysisType, vue, cb) {
  eventHelper.emit('isLoading');
  var result;
  currentVue = vue;
  var currentMap = vue.map.map;
  currentMapView = vue.leftMap;
  currentVue.showFacilityTraceLoading = true;
  currentVue.facilityTraceLength = 0;
  var pointBufferDistance = screenLengthToMapLength(currentMapView, 5);
  var formData = {};
  formData.token = serviceHelper.getToken();
  formData.r = Math.random();
  formData.x = event.mapPoint.x;
  formData.y = event.mapPoint.y;
  formData.pointBufferDistance = pointBufferDistance;
  if (traceAnalysisType === '上下') {
    formData.connectUp = "1";
    formData.connectDown = "1";
  } else if (traceAnalysisType === '向下') {
    formData.connectUp = "0";
    formData.connectDown = "1";
  } else {
    formData.connectUp = "1";
    formData.connectDown = "0";
  }
  //mapHelper.setCenter(formData.x,formData.y,currentMap,18);
  instance.clearAnalysisInfo(currentMap);
  $.ajax({
    type: "get",
    dataType: "json",
    url: serviceHelper.getBasicPath() + "/pipeAnalyze/flowConnectAnalysis",
    data: formData,
    success: function (ajaxResult) {
      if (ajaxResult) {
        if (ajaxResult.success == true) {
          result = ajaxResult.data;
          if (!result.success) {
            if (!!graphicsLayer) {
              graphicsLayer.removeAll();
            }
            if (!!arrowLayer) {
              arrowLayer.removeAll();
            }
            vue.$message.error(result.msg);
            eventHelper.emit('closeLoading');
            cb(false);
            return;
          }
          self.drawNNPolyline(result, currentMapView, currentMap);
          cb(true);
        } else {
          //后台操作失败的代码
          vue.$message.error(ajaxResult.msg);
        }
        currentVue.showFacilityTraceLoading = false;
      }
      eventHelper.emit('closeLoading');
    },
    error: function () {
      currentVue.showFacilityTraceLoading = false;
      eventHelper.emit('closeLoading');
    }
  });

};
instance.clearAnalysisInfo = function (currentMap) {
  if (!flashIntervalHandle)
    clearTimeout(flashIntervalHandle);
  if (!graphicsLayer)
    graphicsLayer = getMapGraphicsLayer(currentMap, "traceAbilityAnalysis");
  graphicsLayer.removeAll();
};
instance.dojoOn = function (dom, eventName, hitchFun) {
  return new instance.On(dom, eventName, hitchFun);
};
instance.dojoHitct = function (context, func) {
  return new instance.Lang.hitch(context, func);
};
instance.executeIdentifyTask = function (layerUrl, params, cb, cb1) {
  var identifyTask = new instance.IdentifyTask(layerUrl);
  var identifyParams = new instance.IdentifyParameters();
  identifyParams.tolerance = params.tolerance;
  identifyParams.layerOption = params.layerOption;
  identifyParams.width = params.width;
  identifyParams.height = params.height;
  identifyParams.geometry = params.geometry;
  identifyParams.mapExtent = params.mapExtent;
  identifyParams.returnGeometry = params.returnGeometry;
  identifyTask.execute(identifyParams).then(function (response) {
    return new instance.arrayUtils.map(response.results, function (result) {
      return cb(result);
    }.bind(this));
  }).then(cb1);
};
instance.createPolylineGeometry = function (paths) {
  var line = new instance.Polyline({
    hasZ: false,
    hasM: false,
    paths: paths,
    spatialReference: {wkid: 4326}
  });
  return line;
};
instance.screenLengthToMapLength = function (map, screenPixel) {
  var screenWidth = map.width;

  var mapWidth = map.extent.width;

  return (mapWidth / screenWidth) * screenPixel;
};
instance.calcTwoPointDistance = function (lat1, lng1, lat2, lng2) {
  var xdiff = lat2 - lat1;            // 计算两个点的横坐标之差
  var ydiff = lng2 - lng1;            // 计算两个点的纵坐标之差
  return Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);
};
//获取图层根据Id
var getMapGraphicsLayer = function (currentMap, LayerId, index) {
  var graphicsLayer = null;
  if (currentMap.findLayerById(LayerId)) {
    graphicsLayer = currentMap.findLayerById(LayerId);
  } else {
    graphicsLayer = new instance.GraphicsLayer({id: LayerId});
    if (index)
      currentMap.addMany([graphicsLayer], index);
    else
      currentMap.addMany([graphicsLayer]);
  }
  return graphicsLayer;
};
var getArcgis = function (cb) {
  var timmer = setInterval(function () {
    if (!!window.cesc && !!window.cesc.require) {
      cb();
      clearInterval(timmer)
    }
  }, 10);
}

export default {
  //用于获取token，url头部等
  getInstance: function (cb) {
    if (!!instance.Map) {
      cb(instance);
      return;
    }
    getArcgis(function () {
      cesc.require([
        'esri/map',                             // 底图
        'esri/Basemap',                         // 底图
        'esri/views/MapView',                   // 2D视图
        'esri/views/SceneView',                 // 3D视图

        "esri/layers/MapImageLayer",            // 4.x独有的图层
        "esri/PopupTemplate",                   // PopupTemplate是一个针对Layer和Graphic的弹窗，它与Popup最大的不同的是作用对象不同（Popup主要是针对View）。
        "dojo/on",                              //query获取节点、on绑定事件

        'esri/geometry/Extent',                 // 边界框的最小和最大X和Y坐标。范围用于描述MapView的可见部分
        'esri/geometry/Point',                  // 创建点
        'esri/geometry/Polyline',               // 创建线
        'esri/geometry/Circle',                // 创建圆
        'esri/geometry/Polygon',                // 创建几何图形
        'esri/Graphic',                         // 创建图形并分配其几何形状，符号和属性（用于创建上面的点，线，面，具体可看第六点:https://developers.arcgis.com/javascript/latest/sample-code/intro-graphics/index.html）
        
        'esri/Color',
        'esri/layers/GraphicsLayer',

        // 下面这几个具体可以看这个设置:https://developers.arcgis.com/javascript/latest/api-reference/esri-symbols-Font.html
        'esri/symbols/Font',                    // 文字的样式
        'esri/symbols/TextSymbol',              // 文本的样式（里面会有文字的样式）
        'esri/symbols/SimpleMarkerSymbol',      // 2D点的样式
        'esri/symbols/SimpleLineSymbol',        // 边框的样式
        'esri/symbols/SimpleFillSymbol',        // 填充的样式
        'esri/symbols/PictureMarkerSymbol',     // Point图形的样式

        // 没用过，详细:https://www.cnblogs.com/zhangkaiqiang/p/7358627.html
        'esri/layers/WebTileLayer',             // 瓦片形式图层加载天地图、百度地图
        'esri/layers/TileLayer',
        'esri/layers/support/TileInfo',         // 包含有关TileLayers，ElevationLayers和WebTileLayers的切片方案的信息。

        // 没用过，详细:https://www.cnblogs.com/coiorz/p/5054704.html
        'esri/geometry/SpatialReference',       // 地理坐标系统（lon, lat）和投影坐标系统（x, y）()

        // 没用过，详细：https://codepen.io/pen?editors=1000
        "esri/tasks/IdentifyTask",              // 识别操作
        "esri/tasks/support/IdentifyParameters",// 识别操作的参数
        "esri/tasks/QueryTask",              // 查询操作
        "esri/tasks/support/Query",         // 查询操作的参数

        "esri/config",
        "esri/geometry/geometryEngine",         // 一种客户端几何引擎，用于测试，测量和分析两个或多个2D几何之间的空间关系
        "esri/geometry/ScreenPoint",
        "dojo/_base/lang",
        "esri/widgets/Sketch/SketchViewModel",   // 画图的

        "dojo/_base/array",
        "esri/views/2d/draw/Draw",
        "esri/geometry/support/geodesicUtils",  // 此类对地球和70多个非地球球体执行大地测量。方法包括测地线长度，面积，点距和点对点计算。
        "esri/geometry/support/webMercatorUtils", // 将Web墨卡托坐标转换为地理坐标，反之亦然。
        "esri/layers/FeatureLayer",             // FeatureLayer是可以从地图服务或要素服务创建的单个图层
        "esri/identity/IdentityManager",    // 身份管理器--使用基于令牌的身份验证来保护ArcGIS Server资源。
        "esri/identity/ServerInfo",
        "esri/tasks/FindTask",      // 根据字符串值搜索ArcGIS Server REST API公开的地图服务。搜索可以在单个层的单个字段上，在一个层的多个字段上或在多个层的多个字段上进行。
        "esri/tasks/support/FindParameters",//使用FindParameters设置任务的参数。结果将是FindResult的实例。
        "esri/widgets/Compass"    // 小部件-指北针
      ], function (arcgisMap,
                   arcgisPoint,
                   arcgisExtent,
                   arcgisPolygon,
                   arcgisPolyline,
                   arcgisCircle,
                   arcgisGraphic,
                   arcgisColor,
                   arcgisFont,
                   arcgisGraphicsLayer,
                   arcgisTextSymbol,
                   arcgisSimpleMarkerSymbol,
                   arcgisSimpleLineSymbol,
                   arcgisSimpleFillSymbol,
                   arcgisPictureMarkerSymbol,
                   arcgisWebTileLayer,
                   MapView,
                   Basemap,
                   TileLayer,
                   SpatialReference,
                   SceneView,
                   config,
                   TileInfo,
                   geometryEngine,
                   MapImageLayer,
                   ScreenPoint,
                   On,
                   Lang,
                   PopupTemplate,
                   IdentifyTask,
                   IdentifyParameters,
                   arrayUtils,
                   SketchViewModel,
      ) {
        var clusterlayer = require('./ClusterLayer');
        instance.Map = arcgisMap;
        instance.Point = arcgisPoint;
        instance.Extent = arcgisExtent;
        instance.Polygon = arcgisPolygon;
        instance.Polyline = arcgisPolyline;
        instance.Circle = arcgisCircle;
        instance.Graphic = arcgisGraphic;
        instance.Color = arcgisColor;
        instance.Font = arcgisFont;
        instance.GraphicsLayer = arcgisGraphicsLayer;
        instance.TextSymbol = arcgisTextSymbol;
        instance.SimpleMarkerSymbol = arcgisSimpleMarkerSymbol;
        instance.SimpleLineSymbol = arcgisSimpleLineSymbol;
        instance.SimpleFillSymbol = arcgisSimpleFillSymbol;
        instance.PictureMarkerSymbol = arcgisPictureMarkerSymbol;
        instance.WebTileLayer = arcgisWebTileLayer;
        instance.MapView = MapView;
        instance.Basemap = Basemap;
        instance.TileLayer = TileLayer;
        instance.SpatialReference = SpatialReference;
        instance.SceneView = SceneView;
        instance.erisConfig = config;
        instance.TileInfo = TileInfo;
        instance.MapImageLayer = MapImageLayer;
        instance.ScreenPoint = ScreenPoint;
        instance.geometryEngine = geometryEngine;
        instance.On = On;
        instance.Lang = Lang;
        instance.PopupTemplate = PopupTemplate;
        instance.IdentifyTask = IdentifyTask;
        instance.IdentifyParameters = IdentifyParameters;
        instance.arrayUtils = arrayUtils;
        instance.SketchViewModel = SketchViewModel;
        instance.drawConfig = {
          drawingSymbol: new instance.SimpleFillSymbol({
            color: [255, 73, 35, 0.15],
            outline: {
              color: "#ff102a",
              width: 1
            }
          }),
          finishedSymbol: new instance.SimpleFillSymbol({
            color: [35, 255, 80, 0.45],
            outline: {
              color: "#ff102a",
              width: 2,
              style: 'dash-dot'
            }
          }),
          activePolygon: null,
          isDrawActive: false
        };
        instance.erisConfig.request.corsEnabledServers.push(
          "t0.tianditu.com",
          "t1.tianditu.com",
          "t2.tianditu.com",
          "t3.tianditu.com",
          "t4.tianditu.com",
          "t5.tianditu.com",
          "t7.tianditu.com",
          "t6.tianditu.com",
          "t8.tianditu.com",
          "t9.tianditu.com",
          "t10.tianditu.com",
          "t11.tianditu.com",
          "t12.tianditu.com"
        );
        cb(instance);
      });
    })

  }
}
