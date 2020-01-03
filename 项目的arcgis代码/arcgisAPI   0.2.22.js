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
instance.read = read;

// wkt和点线面layer的转换
instance.pointToWKT = function (geometry) {
  return "POINT (" + geometry.x + " " + geometry.y + ")";
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
instance.wkbToPolyline = function (wkt, layer, style, attrubute) {
  return instance.wktToPolyline(wkt, layer, style, attrubute)
};
instance.wktToPolyline = function (wkt, layer, style, attrubute) {
  var points = read(wkt);
  var polyline = instance.createPolyline(layer, [points], style, attrubute)
  return polyline;
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
instance.wktToPolygon = function (wkt, spatialreference, attributes) {
  var points = read(wkt);
  var json = {
    rings: points,
    spatialReference: spatialreference
  }
  var polygon = new instance.Polygon(json);
  return polygon;
}
instance.wktToPolygonLayer = function (wkt, layer, style, attributes) {
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
  var polygon = instance.createPolygon(layer, points, style, attributes);
  return polygon;
};

//画线
instance.enableCreateLine = function (view, lineLayer, labelLayer, completeIcon, cbData) {
  var draw = new instance.Draw({
    view: view
  });

  var action = draw.create("polyline", {mode: "click"});

  action.on("vertex-add", createGraphic);
  action.on("cursor-update", createGraphic);
  action.on("draw-complete", createGraphic);
  action.on("vertex-remove", createGraphic);

  function createGraphic(evt) {
    var vertices = evt.vertices;
    lineLayer.removeAll();

    var geometry = new instance.Polyline({
      paths: vertices,
      spatialReference: view.spatialReference
    });
    //距离
    var distance = getDistance(geometry);

    var graphic = new instance.Graphic({
      geometry: geometry,
      symbol: {
        type: "simple-line",
        // color: [237, 23, 128],//红色
        color: [64, 158, 254],//蓝色
        width: 2,
        cap: "round",
        join: "round",
        text: distance
      }
    });
    var cbGraphicArr = [];

    var paths = evt.vertices;
    var ls = paths[paths.length - 1];
    var point = new instance.Point({
      longitude: ls[0],
      latitude: ls[1],
      spatialReference: view.spatialReference
    });

    var graphiciComplete = setPoint(evt, distance, "labelDistance");//实时显示距离

    var graphicArray = [];
    if (!!labelLayer) {
      if (evt.type === 'vertex-add') {
        graphicArray = setPoint(evt, distance, "breakPoint");
      } else if (evt.type === "draw-complete") {
        lineLayer.remove(graphiciComplete);//去除默认文字
        if (graphicArray.length == 0) {
          setPoint(evt, distance, "breakPoint");
        }
        var num = getSize(distance) + 30;
        instance.addSearchBtn(point, labelLayer, completeIcon, "receive-line", num);//添加查询按钮
      }
    } else {//处理单独测距功能
      // var params = setPoint(evt, distance, "labelDistance");
      if (evt.type == "draw-complete") {
        cbGraphicArr = [graphic, ...graphiciComplete[0]];
      }
    }
    if (cbData) {
      cbData(evt, distance, cbGraphicArr);//返回测距的距离
    }
    lineLayer.add(graphic);

  }

  //Calculating distance
  function getDistance(geometry) {
    var geo = instance.webMercatorUtils.webMercatorToGeographic(geometry);
    var Length = instance.geodesicUtils.geodesicLengths([geo], instance.units.METERS);
    var length = parseFloat(Length[0]);
    if (length >= 1000) {
      length = (length / 1000).toFixed(2) + '千米';
    } else if (length > 0 && length < 1000) {
      length = length.toFixed(2) + "米";
    } else {
      length = "起点";
    }
    return length;
  };

  //计算背景色的宽度
  function getSize(distance) {
    var _len = '';
    if (distance == "起点") {
      _len = distance.toString().length * 12 + 10;
    } else {
      _len = (distance.toString().length - 1) * 12;
    }
    return _len;
  }

  //添加和显示graphic
  function setPoint(evt, distance, type) {
    var paths = evt.vertices;
    var ls = paths[paths.length - 1];
    var point = new instance.Point({
      longitude: ls[0],
      latitude: ls[1],
      spatialReference: view.spatialReference
    });
    var _len = getSize(distance);
    var graphic1 = new instance.Graphic({
      geometry: point,
      symbol: {
        type: "text",
        // color: [237, 23, 128],//红色
        // color: [255, 255, 255],//白色
        color: [51, 51, 51],//黑色
        text: distance,
        xoffset: _len / 2 + 10 + "px",
        yoffset: "-5px",
        font: {
          size: "12px",
          family: "sans-serif"
        }
      }
    });

    var markerSymbol3 = new instance.PictureMarkerSymbol({
      url: "./css/images/lableBG.png",
      width: _len + "px",
      height: "25px",
      xoffset: _len / 2 + 10 + "px",
      yoffset: 0,
    });
    var graphic3 = new instance.Graphic({
      geometry: point,
      symbol: markerSymbol3
    });
    var returnGraphic;
    if (type == "labelDistance") {
      lineLayer.addMany([graphic3, graphic1]);
      returnGraphic = [graphic3, graphic1];
    } else if (type == "breakPoint") {
      console.log("breakPoint")
      var markerSymbol2 = new instance.PictureMarkerSymbol({
        url: "./css/images/circle.png",
        width: "15px",
        height: "15px"
      });
      var graphic2 = new instance.Graphic({
        geometry: point,
        symbol: markerSymbol2
      });
      returnGraphic = [graphic2, graphic3, graphic1];
      labelLayer.addMany(returnGraphic);
    }
    return [returnGraphic, _len];
  }

  return action;
};
//添加查询按钮
instance.addSearchBtn = function (point, layer, iconUrl, type, num, num2) {
  var markerSymbol_ = new instance.PictureMarkerSymbol({
    url: iconUrl,
    width: "30px",
    height: "30px",
    yoffset: !!num2 ? num2 : 0,
    xoffset: num + "px"
  });
  var graphic3 = new instance.Graphic({
    geometry: point,
    symbol: markerSymbol_,
    attributes: {
      "facilityType": type
    }
  });
  layer.add(graphic3);
};

instance.createFacilityPoints = function (graLayer, facilityConfig, subFacilities, defaultHidden) {
  var imgObj = {
    width: "24px",
    height: "32px",
    yoffset: 16
  };
  var legendIcon;
  var graphics = [];
  subFacilities.forEach(function (facility) {
    if (facility.onlineState == false) {//优先判断是否在线
      legendIcon = facilityConfig.icon.split("-")[0] + '-00';
    }
    else if (facility.state === 1) {
      legendIcon = facilityConfig.icon.split("-")[0] + '-02';
    } else if (facility.state === 2) {
      legendIcon = facilityConfig.icon.split("-")[0] + '-03';
    } else if (facility.state === 3) {
      legendIcon = facilityConfig.icon.split("-")[0] + '-04';
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
      'id': facility.imei
    };
    if (!!facility.x && facility.y) {
      var graphic;
      if (defaultHidden) {
        graphic = instance.createPictureMarkSymbol(null, facility.x, facility.y, imgObj, attributes);// defaultHidden 默认不显示的测站不添加进图层
      } else {
        graphic = instance.createPictureMarkSymbol(graLayer, facility.x, facility.y, imgObj, attributes);
      }
      graphics.push(graphic)
    }
  })
  if (!facilityConfig.graphics) {
    //为了第一次初始化时加载
    facilityConfig.graphics = graphics;
  }
};
instance.refreshFacilityLayer = function (map, configHelper, cb) {
  if (configHelper.getFacilityConfig().length > 0) {
    var facilities = configHelper.getFacilityConfig();
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
}

//地图初始化配置
instance.initMapWithConfig = function (container, configHelper, cb, click, isFirstInit, projectId) {
  configHelper.init(function (config) {
    var baseMaps = configHelper.getBaseMapConfig();
    var facilities = configHelper.getFacilityConfig();
    var centerAndZoom = configHelper.getCenterAndZoom();
    var centerX = centerAndZoom.x;
    var centerY = centerAndZoom.y;
    var zoom = !!centerAndZoom.zoom ? parseInt(centerAndZoom.zoom) : 1;
    var wkid = !!baseMaps[0].layer.wkid ? baseMaps[0].layer.wkid : 4326;
    instance.initMap(container, centerX, centerY, zoom, wkid, function (map, view) {
      var start = new Date().getTime();
      var cacheLayers = {};
      cacheLayers.baseMaps = instance.processBaseMapConfig(map, baseMaps,view);
      /*   var spatialReference = cacheLayers.baseMaps[baseMaps[0].id][0].spatialReference;
       view.spatialReference = spatialReference;*/
      if (configHelper.getCustomLayerConfig().length > 0) {
        cacheLayers.customerLayers = {};
        configHelper.getCustomLayerConfig().forEach(function (clConfig, index) {
          var layer;
          var added = false;
          if (clConfig.layer.type == "ArcGISFeatureLayer") {
            var layer = instance.createGraphicsLayer(map, view, clConfig.layer.funId);
            if (clConfig.layer.display == 0) {
              layer.visible = false;
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layer,
              config: clConfig,
              group: clConfig.group,
              index: index
            };
          }
          else if (clConfig.layer.type == 'TomcatTile') {
            var layers;
            if (clConfig.layer.display == 0) {
              layers = instance.createWebTileLayer(null, clConfig.layer, clConfig.layer.funId);
            } else {
              layers = instance.createWebTileLayer(map, clConfig.layer, clConfig.layer.funId);
              added = true;
            }
            if (!!clConfig.layer.transparency && clConfig.layer.transparency < 1) {
              layers[0].opacity = clConfig.layer.transparency
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layers[0],
              config: clConfig,
              isAdd: added,
              group: clConfig.group,
              index: index
            };
          }
          else if (clConfig.layer.type == 'ArcgisTile') {
            if (clConfig.layer.display == 0) {
              layers = instance.createWebTileLayer(null, clConfig.layer, clConfig.layer.funId);
            } else {
              layers = instance.createWebTileLayer(map, clConfig.layer, clConfig.layer.funId);
              added = true;
            }
            if (!!clConfig.layer.transparency && clConfig.layer.transparency < 1) {
              layers[0].opacity = clConfig.layer.transparency
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layers[0],
              config: clConfig,
              isAdd: added,
              group: clConfig.group,
              index: index
            };
          }
          else {
            var layerConfig = {
              url: clConfig.layer.url,
              id: clConfig.layer.funId,
              spatialReference: view.spatialReference
            };
            if (clConfig.layer.url.indexOf('token') > -1 && clConfig.layer.url.split('token=').length > 1) {
              layerConfig.token = clConfig.layer.url.split('token=')[1]
            }
            if (clConfig.layer.display == 0) {
              layer = instance.createMapImageLayer(null, view, layerConfig);
            } else {
              layer = instance.createMapImageLayer(map, view, layerConfig);
              added = true;
            }
            if (!!clConfig.layer.transparency && clConfig.layer.transparency < 1) {
              layer.opacity = clConfig.layer.transparency
            }
            cacheLayers.customerLayers[clConfig.layer.funId] = {
              layer: layer,
              config: clConfig,
              isAdd: added,
              group: clConfig.group,
              index: index
            };
          }
        })
      }
      if (configHelper.getFacilityConfig().length > 0) {
        var counter = facilities.length;
        var graLayer = instance.createGraphicsLayer(map, view, 'facility-graphicLayer', null, 9998);
        cacheLayers.facilityLayer = graLayer;
        facilities.forEach(function (facilityConfig, index) {
          var url = facilityConfig.layer.url;
          var facilityTypeName = facilityConfig.layer.funId;
          facilityConfig.icon = facilityConfig.layer.icon1;
          facilityConfig.facilityTypeName = facilityTypeName;
          var defaultHidden = facilityConfig.layer.display == 0;
          mapService.getFacilityByTypeName(facilityTypeName, url, function (subFacilities) {
            counter--;
            instance.createFacilityPoints(graLayer, facilityConfig, subFacilities, defaultHidden);
            facilityModel.addFacility(facilityConfig, subFacilities);
            /*   if (counter == 0) {
             //get all data;
             cb(map, view, cacheLayers);
             }*/
          })
        });
      }
      var end = new Date().getTime();
      console.log(end - start)
      setTimeout(function () {
        instance.setCenter(view, centerX, centerY, zoom);
        cb(map, view, cacheLayers);
      }, 1500);
    }, click);
  }.bind(this), isFirstInit, projectId);
};
// 初始化天地图、百度地图、谷歌地图的图层
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
};// 瓦片图层能创建天地图什么的
instance.initTDLayer = function (layerType) {
  var layerInfo = mapConfigHelper.getTdtLayerInfo();
  var curLayerInfo
  layerInfo.forEach((n) => {
    if (n.layerName[0] === layerType) {
      curLayerInfo = n;
      return;
    }
  });
  if (!curLayerInfo) {
    console.error('图层配置错误')
  }
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
  var token = '&tk=b45b9f781f1b95159fc8676a663ef0f9';
  var tiledLayer = new instance.WebTileLayer({
    //urlTemplate: "http://{subDomain}.tianditu.com/DataServer?T=vec_c&x={col}&y={row}&l={level}",
    urlTemplate: "http://{subDomain}.tianditu.com/" + curLayerInfo.layerName[0] + "_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + curLayerInfo.layerName[0] + "&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&FORMAT=tiles" + token,
    subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
    copyright: "",
    spatialReference: spatialReference,
    fullExtent: fullExtent,
    tileInfo: tileInfo,
  });
  var date = new Date();
  var tiledMarkLayer = new instance.WebTileLayer({
    id: 'tdt' + date.getTime(),
    urlTemplate: "http://{subDomain}.tianditu.com/" + curLayerInfo.layerName[1] + "_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=" + curLayerInfo.layerName[1] + "&STYLE=default&TILEMATRIXSET=c&TILEMATRIX={level}&TILEROW={row}&TILECOL={col}&FORMAT=tiles" + token,
    subDomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
    copyright: "",
    spatialReference: spatialReference,
    fullExtent: fullExtent,
    tileInfo: tileInfo,
  });
  return [tiledLayer, tiledMarkLayer];
};
instance.initGDLayer = function (layerType) {
  var spatialReference = new instance.SpatialReference({wkid: 102100});
  var tileInfo = new instance.TileInfo({
    rows: 256,
    cols: 256,
    compressionQuality: 0,
    origin: {
      "x": -20037508.342787,
      "y": 20037508.342787
    },
    spatialReference: spatialReference,
    "lods": [{"level": 0, "resolution": 156543.033928, "scale": 591657527.591555},
      {"level": 1, "resolution": 78271.5169639999, "scale": 295828763.795777},
      {"level": 2, "resolution": 39135.7584820001, "scale": 147914381.897889},
      {"level": 3, "resolution": 19567.8792409999, "scale": 73957190.948944},
      {"level": 4, "resolution": 9783.93962049996, "scale": 36978595.474472},
      {"level": 5, "resolution": 4891.96981024998, "scale": 18489297.737236},
      {"level": 6, "resolution": 2445.98490512499, "scale": 9244648.868618},
      {"level": 7, "resolution": 1222.99245256249, "scale": 4622324.434309},
      {"level": 8, "resolution": 611.49622628138, "scale": 2311162.217155},
      {"level": 9, "resolution": 305.748113140558, "scale": 1155581.108577},
      {"level": 10, "resolution": 152.874056570411, "scale": 577790.554289},
      {"level": 11, "resolution": 76.4370282850732, "scale": 288895.277144},
      {"level": 12, "resolution": 38.2185141425366, "scale": 144447.638572},
      {"level": 13, "resolution": 19.1092570712683, "scale": 72223.819286},
      {"level": 14, "resolution": 9.55462853563415, "scale": 36111.909643},
      {"level": 15, "resolution": 4.77731426794937, "scale": 18055.954822},
      {"level": 16, "resolution": 2.38865713397468, "scale": 9027.977411},
      {"level": 17, "resolution": 1.19432856685505, "scale": 4513.988705},
      {"level": 18, "resolution": 0.597164283559817, "scale": 2256.994353},
      {"level": 19, "resolution": 0.298582141647617, "scale": 1128.497176}]
  });
  var fullExtent = new instance.Extent(-20037508.342787, -20037508.342787, 20037508.342787, 20037508.342787, spatialReference);
  var url;
  var subDomains;
  switch (layerType) {
    case "road"://矢量
      url = 'http://{subDomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={col}&y={row}&z={level}';
      subDomains = 'webrd';
      break;
    case "st"://影像
      url = 'http://{subDomain}.is.autonavi.com/appmaptile?style=6&x={col}&y={row}&z={level}';
      subDomains = 'webst';
      break;
    case "label"://影像标
      url = 'http://{subDomain}.is.autonavi.com/appmaptile?style=8&x={col}&y={row}&z={level}';
      subDomains = 'webst';
      break;
    default:
      url = 'http://{subDomain}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={col}&y={row}&z={level}';
      subDomains = 'webrd';
      break;
  }
  var date = new Date();
  var tiledLayer = new instance.WebTileLayer({
    id: 'gd' + date.getTime(),
    urlTemplate: url,
    subDomains: [subDomains + "01", subDomains + "02", subDomains + "03", subDomains + "04"],
    copyright: "",
    spatialReference: spatialReference,
    fullExtent: fullExtent,
    tileInfo: tileInfo,
  });
  return [tiledLayer];
};
instance.initBDLayer = function (layerType) {
  var spatialReference = new instance.SpatialReference({wkid: 102100});
  var tileInfo = new instance.TileInfo({
    rows: 256,
    cols: 256,
    compressionQuality: 90,
    origin: {
      "x": -20037508.3427892,
      "y": 20037508.3427892
    },
    spatialReference: spatialReference,
    "lods": [
      {"level": 0, "resolution": 156543.033928, "scale": 591657527.591555},
      {"level": 1, "resolution": 78271.5169639999, "scale": 295828763.795777},
      {"level": 2, "resolution": 39135.7584820001, "scale": 147914381.897889},
      {"level": 3, "resolution": 19567.8792409999, "scale": 73957190.948944},
      {"level": 4, "resolution": 9783.93962049996, "scale": 36978595.474472},
      {"level": 5, "resolution": 4891.96981024998, "scale": 18489297.737236},
      {"level": 6, "resolution": 2445.98490512499, "scale": 9244648.868618},
      {"level": 7, "resolution": 1222.99245256249, "scale": 4622324.434309},
      {"level": 8, "resolution": 611.49622628138, "scale": 2311162.217155},
      {"level": 9, "resolution": 305.748113140558, "scale": 1155581.108577},
      {"level": 10, "resolution": 152.874056570411, "scale": 577790.554289},
      {"level": 11, "resolution": 76.4370282850732, "scale": 288895.277144},
      {"level": 12, "resolution": 38.2185141425366, "scale": 144447.638572},
      {"level": 13, "resolution": 19.1092570712683, "scale": 72223.819286},
      {"level": 14, "resolution": 9.55462853563415, "scale": 36111.909643},
      {"level": 15, "resolution": 4.77731426794937, "scale": 18055.954822},
      {"level": 16, "resolution": 2.38865713397468, "scale": 9027.977411},
      {"level": 17, "resolution": 1.19432856685505, "scale": 4513.988705},
      {"level": 18, "resolution": 0.597164283559817, "scale": 2256.994353},
      {"level": 19, "resolution": 0.298582141647617, "scale": 1128.497176}
    ]
  });
  var fullExtent = new instance.Extent(-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892, spatialReference);
  var date = new Date();
  var tiledLayer = new instance.WebTileLayer({
    id: 'bd' + date.getTime(),
    copyright: "",
    urlTemplate: 'http://online1.map.bdimg.com',
    spatialReference: spatialReference,
    fullExtent: fullExtent,
    tileInfo: tileInfo,
    getTileUrl: function (level, row, col) {
      var zoom = level - 1;
      var offsetX = parseInt(Math.pow(2, zoom));
      var offsetY = offsetX - 1;
      var numX = col - offsetX, numY = (-row) + offsetY;
      var num = (col + row) % 8 + 1;
      var url = "";
      switch (layerType) {
        case "bd_vec"://矢量
          url = "http://online" + num + ".map.bdimg.com/tile/?qt=tile&x=" + numX + "&y=" + numY + "&z=" + level + "&styles=pl&scaler=1&udt=20141103";
          break;
        case "bd_img"://影像
          url = "http://shangetu" + num + ".map.bdimg.com/it/u=x=" + numX + ";y=" + numY + ";z=" + level + ";v=009;type=sate&fm=46&udt=20141015";
          break;
        case "bd_cva"://影像标注
          url = "http://online" + num + ".map.bdimg.com/tile/?qt=tile&x=" + numX + "&y=" + numY + "&z=" + level + "&styles=sl&udt=20141015";
          break;
        default:
          url = "http://online" + num + ".map.bdimg.com/tile/?qt=tile&x=" + numX + "&y=" + numY + "&z=" + level + "&styles=pl&scaler=1&udt=20141103";
          break;
      }
      return url;
    }
  });
  return [tiledLayer];
};

// layer的操作： 获取、增加、删除、显示、隐藏
instance.getLayerById = function (map, layerId) {
  return map.findLayerById(layerId);
};
instance.addLayers = function (map, layers) {
  map.addMany(layers);
};
instance.removeLayers = function (map, layers) {
  map.removeMany(layers);
};
instance.showLayer = function (map, id) {
  var currentLayer = map.findLayerById(id);
  if (!!currentLayer) {
    currentLayer.visible = true;
  }
};
instance.hideLayer = function (map, id) {
  var currentLayer = map.findLayerById(id);
  if (!!currentLayer) {
    currentLayer.visible = false;
  }
};
// 创建MapImageLayer
instance.createMapImageLayer = function (map, view, config, cb) {
  config.spatialReference = view.spatialReference;
  // points to the states layer in a service storing U.S. census data
  var layer = new instance.MapImageLayer(config);
  layer.on('layerview-create', function (view) {
    if (!!cb) {
      cb(view)
    }
  })
  if (!!map) {
    map.add(layer);  // adds the layer to the map
  }
  return layer;
};
// 创建、获取、删除GraphicsLayer
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
instance.removeGraphics = function (layer, graphics) {
  layer.removeMany(graphics);
};
// 设置大小
instance.locateToExtent = function (view, extent, expand) {
  var newExtent = new instance.Extent(extent[0], extent[1], extent[2], extent[3], view.spatialReference);
  if (!expand) {
    expand = 0;
  }
  view.goTo(newExtent.expand(expand));
};
// 设置中心点
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

// 创建点线面
instance.createPoint = function (x, y, spatialReference) {
  var point = new instance.Point({
    longitude: x,
    latitude: y,
    spatialReference: spatialReference
  });
  return point;
}
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
instance.createCircle = function (layer, porperties, styleObj, attributes) {
  var circle = new instance.Circle(porperties);
  var fillSymbol = new instance.SimpleFillSymbol(
    styleObj
    /*{
     color: [227, 139, 79, 0.8],
     outline: { // autocasts as new SimpleLineSymbol()
     color: [255, 255, 255],
     width: 1
     }
     }*/);
  var circleGraphic = new instance.Graphic({
    geometry: circle,
    symbol: fillSymbol,
    attributes: attributes,
    spatialReference: layer.spatialReference
  });
  if (!!layer)
    layer.add(circleGraphic);
  return circleGraphic;
},
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
instance.createPictureMarkSymbol = function (layer, x, y, imgObj, attributes, popupAttribute) {
  var point = new instance.Point({
    longitude: x,
    latitude: y,
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
  });
  if (!!layer) {
    point.spatialReference = layer.spatialReference;
    markPoint.spatialReference = layer.spatialReference;
    layer.add(markPoint);
  }

  return markPoint;
};

// Symbol样式改变
instance.changeLineSymbolStyle = function (graphic, newStyleObj) {
  var markerSymbol = new instance.SimpleLineSymbol(
    newStyleObj
    /*{
     color: [226, 119, 40],
     width: 4
     }*/);
  graphic.symbol = markerSymbol;
};
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
instance.processBaseMapConfig = function (map, baseMaps,view) {
  var cacheLayers = {};
  baseMaps.forEach(function (baseMap) {
    var layers;
    if (baseMap.layer.type == 'TomcatTile' || baseMap.layer.type == 'ArcgisTile') {
      layers = instance.createWebTileLayer(null, baseMap.layer, baseMap.layer.funId);
    } else if (baseMap.layer.type == 'TDT') {
      layers = instance.initTDLayer(baseMap.layer.tdtType);
    } else if (baseMap.layer.type == 'GD') {
      layers = instance.initGDLayer();
    } else if (baseMap.layer.type == 'BD') {
      layers = instance.initBDLayer();
    }else if (baseMap.layer.type == 'ArcGISRest') {
      layers=[];
      layers.push(instance.createMapImageLayer(null, view, {
        url: baseMap.layer.url,
        id: baseMap.layer.funId,
        spatialReference: view.spatialReference
      }))
    }else if (baseMap.layer.type == 'ArcGISRestTile') {
      var myTiledMapServiceLayer = instance.TileLayer(baseMap.layer.url);
      layers=[];
      layers.push(myTiledMapServiceLayer)
    }
    if (!!layers) {
      cacheLayers[baseMap.id] = layers;
      layers.forEach(function (layer, index) {
        map.add(layer, index);
      });
    }
  });
  return cacheLayers;
};



// 初始化画笔
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
    var polygonGraphic
    layer.graphics.forEach((graphic) => {
      if (graphic.geometry.type === "polygon") {
        polygonGraphic = graphic;
      }
    })
    if (!!polygonGraphic) {
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
instance.initDrawLinePen = function (view, layer, lineStyle) {
  var points = [];
  // creates and returns an instance of PolyLineDrawAction
  var draw = new instance.Draw({
    view: view
  });
  var action = draw.create("polyline", {mode: "click"});

  // focus the view to activate keyboard shortcuts for sketching

  // listen polylineDrawAction events to give immediate visual feedback
  // to users as the line is being drawn on the view.
  action.on("vertex-add", updateVertices);
  action.on("vertex-remove", updateVertices);
  action.on("cursor-update", updateVertices);
  action.on("redo", updateVertices);
  action.on("undo", updateVertices);
  action.on("draw-complete", updateVertices);
  // Checks if the last vertex is making the line intersect itself.
  function updateVertices(event) {
    // create a polyline from returned vertices
    const result = createGraphic(event);
    // if the last vertex is making the line intersects itself,
    // prevent the events from firing
    if (result.selfIntersects) {
      event.preventDefault();
    }
  }

  // create a new graphic presenting the polyline that is being drawn on the view
  function createGraphic(event) {
    const vertices = event.vertices;
    layer.removeAll();

    // a graphic representing the polyline that is being drawn
    const graphic = new instance.Graphic({
      geometry: {
        type: "polyline",
        paths: vertices,
        spatialReference: layer.spatialReference
      },
      symbol: lineStyle
      /*{
       type: "simple-line", // autocasts as new SimpleFillSymbol
       color: [4, 90, 141],
       width: 4,
       cap: "round",
       join: "round"
       }*/
    });

    // check if the polyline intersects itself.
    const intersectingSegment = getIntersectingSegment(graphic.geometry);

    // Add a new graphic for the intersecting segment.
    if (intersectingSegment) {
      layer.addMany([graphic, intersectingSegment]);
    }
    // Just add the graphic representing the polyline if no intersection
    else {
      layer.add(graphic);
    }

    // return intersectingSegment
    return {
      selfIntersects: intersectingSegment
    }
  }

  // function that checks if the line intersects itself
  function isSelfIntersecting(polyline) {
    if (polyline.paths[0].length < 3) {
      return false
    }
    const line = polyline.clone();

    //get the last segment from the polyline that is being drawn
    const lastSegment = getLastSegment(polyline);
    line.removePoint(0, line.paths[0].length - 1);

    // returns true if the line intersects itself, false otherwise
    return instance.geometryEngine.crosses(lastSegment, line);
  }

  // Checks if the line intersects itself. If yes, change the last
  // segment's symbol giving a visual feedback to the user.
  function getIntersectingSegment(polyline) {
    if (isSelfIntersecting(polyline)) {
      return new instance.Graphic({
        geometry: getLastSegment(polyline),
        symbol: {
          type: "simple-line", // autocasts as new SimpleLineSymbol
          style: "short-dot",
          width: 3.5,
          color: "yellow"
        }
      });
    }
    return null;
  }

  // Get the last segment of the polyline that is being drawn
  function getLastSegment(polyline) {
    const line = polyline.clone();
    const lastXYPoint = line.removePoint(0, line.paths[0].length - 1);
    const existingLineFinalPoint = line.getPoint(0, line.paths[0].length -
      1);

    return {
      type: "polyline",
      spatialReference: layer.spatialReference,
      hasZ: false,
      paths: [
        [
          [existingLineFinalPoint.x, existingLineFinalPoint.y],
          [lastXYPoint.x, lastXYPoint.y]
        ]
      ]
    };
  }

  return action;
}
// 画箭头线
instance.drawArrowPolyline = function (currentMapView, polyline, layer, length, angleValue, arrowColor) {
  if (!arrowColor) {
    arrowColor = [51, 51, 204, 0.9];
  }
  //线的坐标串
  var linePoint = polyline.paths;
  var arrowCount = linePoint.length;
  // var sfs = new instance.SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
  //     new instance.SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new instance.Color(graphicColor), 2), new instance.Color(graphicColor)
  // );
  var symbol = {
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
    return instance.createPolyline(layer, [[pointArrow.x, pointArrow.y], [centerPoint.x, centerPoint.y], [pointArrow1.x, pointArrow1.y], [pointArrow2.x, pointArrow2.y]],
      {
        color: arrowColor,
        width: 4
      })
  }
};


instance.registerMapTool = function (view, buttonId, position, cb) {
  view.ui.add(buttonId, position);
  if (cb) {
    $("#" + buttonId)[0].addEventListener('click', function () {
      cb();
    });
  }
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
instance.executeQueryTask = function (layerUrl, parms, cb) {
  var queryTask = new instance.QueryTask({
    url: layerUrl
  });
  var query = new instance.Query();
  for (var key in parms) {
    query[key] = parms[key]
  }
  // When resolved, returns features and graphics that satisfy the query.
  queryTask.execute(query).then(function (results) {
    cb(results)
  });
};
instance.executeIdentifyTask = function (layerUrl, params, cb, cb1) {
  var results = [];
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
    if (!response.results) {
      return cb([])
    }
    return new instance.arrayUtils.map(response.results, function (result) {
      cb(result)
      return result;
    }.bind(this));
  }).then(function (finalRes) {
    cb1(finalRes);
  });
};

/***
 *  属性查询
 * @param layerUrl
 * @param params
 * @param cb
 */
instance.executeFindTask = function (layerUrl, params, successCb,errorCb) {
  let findTask = new instance.FindTask({
    url: layerUrl
  });
  let findParams = new instance.FindParameters({
    layerIds: params.layerIds,
    searchFields: params.searchFields,
    searchText: params.searchText,
    returnGeometry: params.returnGeometry,
    contains: params.contains,
  });
  findTask.execute(findParams).then(successCb).catch(errorCb);
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
/*
 根据像素获取偏离值 - 追溯分析时候使用
 */
instance.screenLengthToMapLength = function (view, screenPixel) {
  var screenWidth = view.width;

  var mapWidth = view.extent.width;

  return (mapWidth / screenWidth) * screenPixel;
};
instance.calcTwoPointDistance = function (lat1, lng1, lat2, lng2) {
  var xdiff = lat2 - lat1;            // 计算两个点的横坐标之差
  var ydiff = lng2 - lng1;            // 计算两个点的纵坐标之差
  return Math.pow((xdiff * xdiff + ydiff * ydiff), 0.5);
};
/***
 * 地图权限认证
 * @param identityInfo
 */
instance.registerServer = function (identityInfo) {
  //获取Token
  let serverInfo = new instance.ServerInfo();
  serverInfo.serverString = identityInfo.serverString;  //这里配置ArcGIS Server的REST服务地址
  serverInfo.tokenServiceUrl = identityInfo.tokenServiceUrl;  //由于GIS Server和Portal联合了，所以使用Portal的token生成地址
  let userInfo = {username: identityInfo.username, password: identityInfo.password};  //这里填写Portal的用户和密码
  instance.esriId.generateToken(serverInfo, userInfo).then((data) => {
    //注册Token，注册之后，在Portal里的所有资源，只要该用户由权限访问，就可以直接使用，之前的所有安全服务请求都将会把token值作为参数发送到服务器端
    instance.esriId.registerToken({server: identityInfo.serverString, token: data.token});
  }, (error) => {
    console.error("地图权限认证失败！");
  });
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
instance.createClusterLayer = function (id, singleMarker, view, map) {
  var markerSymbol = new instance.PictureMarkerSymbol(singleMarker);
  var clusterLayer = new instance.ClusterLayer({
    "view": view,
    "map": map,
    "data": [],
    "id": id,
    "labelColor": "#000",
    "labelOffset": 0,
    "spatialReference": view.spatialReference,
    "singleSym": markerSymbol,
    "singlePoint": markerSymbol,
    "symbolArray": null,
    "graphicSym": null
  });
  return clusterLayer;
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
        'esri/map',
        'esri/geometry/Point',
        'esri/geometry/Extent',
        'esri/geometry/Polygon',
        'esri/geometry/Polyline',
        'esri/geometry/Circle',
        'esri/Graphic',
        'esri/Color',
        'esri/symbols/Font',
        'esri/layers/GraphicsLayer',
        'esri/symbols/TextSymbol',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/layers/WebTileLayer',
        'esri/views/MapView',
        'esri/Basemap',
        'esri/layers/TileLayer',
        'esri/geometry/SpatialReference',
        'esri/views/SceneView',
        "esri/config",
        'esri/layers/support/TileInfo',
        "esri/geometry/geometryEngine",
        "esri/layers/MapImageLayer",
        "esri/geometry/ScreenPoint",
        "dojo/on",
        "dojo/_base/lang",
        "esri/PopupTemplate",
        "esri/tasks/IdentifyTask",
        "esri/tasks/QueryTask",
        "esri/tasks/support/Query",
        "esri/tasks/support/IdentifyParameters",
        "dojo/_base/array",
        "esri/widgets/Sketch/SketchViewModel",
        "esri/views/2d/draw/Draw",
        "esri/geometry/support/geodesicUtils",
        "esri/geometry/support/webMercatorUtils",
        "esri/units",
        "esri/layers/FeatureLayer",
        "esri/identity/IdentityManager",
        "esri/identity/ServerInfo",
        "esri/tasks/FindTask",
        "esri/tasks/support/FindParameters",
        "esri/widgets/Compass"
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
                   QueryTask,
                   Query,
                   IdentifyParameters,
                   arrayUtils,
                   SketchViewModel,
                   Draw,
                   geodesicUtils,
                   webMercatorUtils,
                   units,
                   FeatureLayer,
                   esriId,
                   ServerInfo,
                   FindTask,
                   FindParameters,
                   Compass) {
        instance.ClusterLayer = require('./ClusterLayer');
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
        instance.QueryTask = QueryTask;
        instance.Query = Query;
        instance.IdentifyParameters = IdentifyParameters;
        instance.arrayUtils = arrayUtils;
        instance.SketchViewModel = SketchViewModel;
        instance.Draw = Draw;
        instance.webMercatorUtils = webMercatorUtils;
        instance.geodesicUtils = geodesicUtils;
        instance.units = units;//todo 由于4.9与4.7 api的 units对接不兼容，项目中可能重写units，需要找到更好的处理方法。
        instance.FeatureLayer = FeatureLayer;
        instance.esriId = esriId;
        instance.ServerInfo = ServerInfo;
        instance.FindTask = FindTask;
        instance.FindParameters = FindParameters;
        instance.Compass = Compass;
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
          "www.ewateryun.com",
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
