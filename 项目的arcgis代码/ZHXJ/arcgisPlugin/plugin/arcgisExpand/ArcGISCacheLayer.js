define(function (declare, ArcGISTiledMapServiceLayer, SpatialReference, Extent, TileInfo) {
    declare = cesc.require("dojo/_base/declare"),
        ArcGISTiledMapServiceLayer = cesc.require("esri/layers/ArcGISTiledMapServiceLayer"),
        SpatialReference = cesc.require("esri/SpatialReference"),
        Extent = cesc.require("esri/geometry/Extent"),
        TileInfo = cesc.require("esri/layers/TileInfo");
    return declare(ArcGISTiledMapServiceLayer, {
        constructor: function (baseUrl) {
            this.baseUrl = baseUrl;  //地图地址
            this.spatialReference = new SpatialReference({wkid: 4326});
            this.fullExtent = new Extent(116.552554000000, 36.068627000000, 119.087879000000, 38.295418000000, this.spatialReference); //全图范围
            this.initialExtent = new Extent(117.552554000000, 37.068627000000, 118.087879000000, 37.295418000000, this.spatialReference); //初始范围
            this.tileInfo = new TileInfo({
                "rows": 256,  //瓦片大小
                "cols": 256,  //瓦片大小
                "compressionQuality": 0,
                "origin": {"x": -180, "y": 90},  //切图原点
                "spatialReference": {"wkid": 4326},  //瓦片比例尺
                //lods：等级、比例尺、分辨率。从ArcGIS切图配置文件conf.xml中获取。设置lods会影响地图比例尺控件的范围。
                "lods": [
                    {"level": 2, "scale": 57709923.66412225, "resolution": 0.3515625},
                    {"level": 3, "scale": 28854961.83206113, "resolution": 0.17578125},
                    {"level": 4, "scale": 14427480.91603056, "resolution": 0.087890625},
                    {"level": 5, "scale": 7213740.458015281, "resolution": 0.0439453125},
                    {"level": 6, "scale": 3606870.229007641, "resolution": 0.02197265625},
                    {"level": 7, "scale": 1803435.11450382, "resolution": 0.010986328125},
                    {"level": 8, "scale": 901717.5572519102, "resolution": 0.0054931640625},
                    {"level": 9, "scale": 450858.7786259551, "resolution": 0.00274658203125},
                    {"level": 10, "scale": 225429.3893129775, "resolution": 0.001373291015625},
                    {"level": 11, "scale": 112714.6946564888, "resolution": 0.0006866455078125},
                    {"level": 12, "scale": 56357.34732824438, "resolution": 0.00034332275390625},
                    {"level": 13, "scale": 28178.67366412219, "resolution": 0.000171661376953125},
                    {"level": 14, "scale": 14089.3368320611, "resolution": 0.0000858306884765625},
                    {"level": 15, "scale": 7044.668416030548, "resolution": 0.00004291534423828125},
                    {"level": 16, "scale": 3522.334208015274, "resolution": 0.00002145767211914063},
                    {"level": 17, "scale": 1761.167104007637, "resolution": 0.00001072883605957031}]
            });
            this.loaded = true;
            this.onLoad(this);
        },
        //构造请求地址格式算法（核心）
        getTileUrl: function (level, row, col) {
            //alert(level+","+row+","+col);		
            return this.baseUrl +
                "L" + dojo.string.pad(level, 2, '0') + "/" +  //等级
                "R" + dojo.string.pad(row.toString(16), 8, '0').toUpperCase() + "/" +  //行，16进制
                "C" + dojo.string.pad((col).toString(16), 8, '0').toUpperCase() + "." +  //列，16进制
                "png";
        }
    });
}); 