define(function () {
    return {
        initInfo: function (apiInstance,data) {
            // var features = [{
            //     geometry: apiInstance.createPoint(113.50311687011336,22.869982739643635),
            //     attributes: {
            //         ObjectID: 1,
            //         name: "前山",
            //         state: 0,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.54500224608991,22.84182610967714),
            //     attributes: {
            //         ObjectID: 2,
            //         name: "拱北",
            //         state: 0,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.47050120849227,22.822207933294745),
            //     attributes: {
            //         ObjectID: 3,
            //         name: "南区",
            //         state: 0,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.3390085937462,22.792458854644273),
            //     attributes: {
            //         ObjectID: 4,
            //         name: "白藤",
            //         state: 1,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.28785350341418,22.793724905182376),
            //     attributes: {
            //         ObjectID: 5,
            //         name: "新青",
            //         state: 0,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.31978251952746,22.73262457534508),
            //     attributes: {
            //         ObjectID: 6,
            //         name: "三灶",
            //         state: 0,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.22674205321896,22.726291372205406),
            //     attributes: {
            //         ObjectID: 7,
            //         name: "平沙",
            //         state: 0,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.18348338622677,22.6737144751204),
            //     attributes: {
            //         ObjectID: 8,
            //         name: "南水",
            //         state: 0,
            //         select:false
            //     }
            // },{
            //     geometry: apiInstance.createPoint(113.1457178832971,22.801637454675255),
            //     attributes: {
            //         ObjectID: 9,
            //         name: "富山",
            //         state: 0,
            //         select:false
            //     }
            // }];
            let features=[];
            data.forEach((item)=>{
                let point={
                    geometry: apiInstance.createPoint(item.xCoordinates,item.yCoordinates),
                    attributes: {
                        ObjectID: item.id,
                        name: item.name.substring(0,2),
                        state: 0,
                        select:false
                    }
                }
                features.push(point);
            })
            var uvRenderer =  apiInstance.createUniqueValueRenderer();
            uvRenderer.addUniqueValueInfo({
                value: "0,false",
                symbol: apiInstance.createPictureMarkerSymbol({
                    type: "picture-marker-symbol",
                    url: require("img/WaterPurificationFactory/01.png"),
                    width: "100px",
                    height: "40px"
                }),
                label:"$feature.name"
            });
            uvRenderer.addUniqueValueInfo({
                value: "1,false",
                symbol: apiInstance.createPictureMarkerSymbol({
                    type: "picture-marker-symbol",
                    url: require("img/WaterPurificationFactory/03.png"),
                    width: "100px",
                    height: "40px"
                }),
                label:"$feature.name"
            });
            uvRenderer.addUniqueValueInfo({
                value: "0,true",
                symbol: apiInstance.createPictureMarkerSymbol({
                    type: "picture-marker-symbol",
                    url: require("img/WaterPurificationFactory/02.png"),
                    width: "100px",
                    height: "40px"
                }),
                label:"$feature.name"
            });
            uvRenderer.addUniqueValueInfo({
                value: "1,true",
                symbol: apiInstance.createPictureMarkerSymbol({
                    type: "picture-marker-symbol",
                    url: require("img/WaterPurificationFactory/04.png"),
                    width: "100px",
                    height: "40px"
                }),
                label:"$feature.name"
            });
            var featureProperty = {
                id:"wpf",
                fields: [{
                    name: "ObjectID",
                    alias: "ObjectID",
                    type: "oid"
                }, {
                    name: "name",
                    alias: "name",
                    type: "string"
                }, {
                    name: "state",
                    alias: "state",
                    type: "integer"
                }],
                outFields: "*",
                objectIdField: "ObjectID",
                geometryType: "point",
                spatialReference: { wkid: 4326 },
                source: features,  //  an array of graphics with geometry and attributes
                renderer: uvRenderer // UniqueValueRenderer based on `type` attribute
            };
            return featureProperty;
        }
    }
});


