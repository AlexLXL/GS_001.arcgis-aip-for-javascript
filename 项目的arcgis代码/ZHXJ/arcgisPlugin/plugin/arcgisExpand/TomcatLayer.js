define(
    function (declare, tiledMap, tileInfo) {
        var declare = cesc.require("dojo/_base/declare");
        var tiledMap = cesc.require("esri/layers/TiledMapServiceLayer");
        var tileInfo = cesc.require("esri/layers/TileInfo");
        return declare("tdt.TomcatLayer", tiledMap, {
            constructor: function (inputOptions) {
                var options = this.getDefaultOptions();
                dojo.mixin(options, inputOptions);
                this.spatialReference = options.spatialReference;
                this.initialExtent = (this.fullExtent = new esri.geometry.Extent(107.325439453125000,22.203369140625000,109.632568359375000,24.038085937500000, this.spatialReference));
                //this.initialExtent = (this.fullExtent = new esri.geometry.Extent(-180.0, -90.0, 180.0, 90.0, this.spatialReference));
                this.tileInfo = options.tileInfo;
                this.format = options.format;
                this.id = options.id;
                this.tileUrl = inputOptions.url;
                this.loaded = true;
                this.onLoad(this);
            },
            getDefaultOptions: function () {
                var tileInfo = new esri.layers.TileInfo({
                    "rows": 256,
                    "cols": 256,
                    "compressionQuality": 75,
                    "origin": {
                        "x": -180,
                        "y": 90
                    },
                    "spatialReference": {
                        "wkid": 4326
                    },
                    "lods": [
                        { "level": 0, "resolution": 0.0054931640625, "scale": 901717.5572519102 },
                        { "level": 1, "resolution": 0.00274658203125, "scale": 450858.7786259551 },
                        { "level": 2, "resolution": 0.001373291015625, "scale": 225429.3893129775 },
                        { "level": 3, "resolution": 0.0006866455078125, "scale": 112714.6946564888 },
                        { "level": 4, "resolution": 3.4332275390625e-4, "scale": 56357.34732824438 },
                        { "level": 5, "resolution": 1.71661376953125e-4, "scale": 28178.67366412219 },
                        { "level": 6, "resolution": 8.58306884765625e-5, "scale": 14089.3368320611 },
                        { "level": 7, "resolution": 4.291534423828125e-5, "scale": 7044.668416030548 }
                    ]
                });
                var spatialReference = new esri.SpatialReference({ wkid: 4326 });
                var format = "png";
                return {
                    format: format,
                    tileInfo:tileInfo,
                    spatialReference:spatialReference
                }
            },
            getTileUrl: function (level, row, col) {
                return this.tileUrl + "/" + "L" + dojo.string.pad(level, 2, '0') + "/" + "R" + (dojo.string.pad(row.toString(16), 8, '0')).toUpperCase() + "/" + "C" + (dojo.string.pad(col.toString(16), 8, '0')).toUpperCase() + "." + this.format;
            }
        });
    }
); 