var Vue = require('vue');
var template = require('./map.html');
var loginCtrl = require('../../controllers/loginController');
var eventHelper = require('../../utils/eventHelper');
var toolBar = require('./plugin/toolBar/toolBar');
var mapType = require('./plugin/mapType/mapType');
var layerList = require('./plugin/layerList');
var global = require('./plugin/global');
var facilityController = require('controllers/facilityController');
var infoWindow = require('./plugin/infoWindow');
var waterPurifyFactory = require('modules/appWaterPurifyFactory');
var commandCenter = require('modules/emergencyRescue/commandCenter');
var serviceHelper = require('services/serviceHelper');

var initPlugin = function (facilityArr, self) {
    global.init();
    facilityController.getAllFacility(function (list) {
        self.$refs.mapLegend.init(list);
    });
}

// 定义组件
var comm = Vue.extend({
    template: template,
    data: function () {
        return {
            role: "",
            message: '',
            roleName: '',
            userName: '',
            loginSuccess: false,
            detailOpen: false,
            facility: '',
            showtools: false,
            leftMap: {},
            iscreateSymbol: false,
            iscreateSymbols: false,
            isCreatePolygon: false,
            isCreateLine: false,
            layer: '',
            layers: [],
            lineLayers: [],
            drawGraphics: [],
            drawPointGraphics: [],
            drawLineGraphics: [],
            polygonId: 1,
            baseMap: {},
            baseView: {},
            graLayer: {},
            graphics: [],
            layerIcon: require("img/factoryIcon.png"),
            wkt: [],
            factoryList: [
                // {
                //     name:"厂1",
                //     longitude:111.3664744140606,
                //     latitude:22.090718015960095,
                //     style:{
                //         top:'0px',
                //         let:'0px'
                //     }
                // },
                // {
                //     name:"厂2",
                //     longitude:113.3664744140606,
                //     latitude:22.790718015960095,
                //     style:{
                //         top:'0px',
                //         let:'0px'
                //     }
                // }
            ],
            ploygonStyleTransparent: {
                color: [90, 237, 9, 0],
                outline: { // autocasts as new SimpleLineSymbol()
                    color: [83, 83, 83],
                    width: 1
                }
            },
            ploygonStyle: [
                {
                    color: [90, 237, 9, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
                {
                    color: [255, 133, 39, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
                {
                    color: [248, 248, 4, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
                {
                    color: [2, 79, 149, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
                {
                    color: [255, 109, 109, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
                {
                    color: [248, 248, 4, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
                {
                    color: [2, 79, 149, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
                {
                    color: [255, 109, 109, 0.43],
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [83, 83, 83],
                        width: 1
                    }
                },
            ],
            //楼层地图当前高亮的构筑物图形
            highlightFacilityGraphic: null,
            defaultSymbol: null,
            clearTimeOut: '',//定时器
            clearBorderOpacity: 1.55,//定时器边框透明度
        }
    },
    methods: {
        //集团初始化地图
        initBaseMap: function () {
            //初始化地图
            var self = this;
            this.$refs.baseMap.init('mapDiv', {
                fromServer: true,
                // serverURL: serviceHelper.getBasicPath(),
                serverURL: serviceHelper.getEwaterPath(),
                token: serviceHelper.getToken(),
                mapType: 0,
                layerControl: 0
            }, function (api, currentMap, baseView) {
                self.baseMap = currentMap;
                console.log(currentMap)
                console.log(baseView)
                self.baseView = baseView;
                self.apiInstance = api;
                // let extend={
                //     xmax:[113.42566378324312,22.279619081520025],
                //     xmin:[113.58634737178434,22.248169780233358],
                //     ymax:[113.57672354188242,22.28030649794159],
                //     ymin:[113.58634737178434,22.248169780233358],
                // }
                // baseView.goTo(extend)
                baseView.on('layerview-create', function (evt) {//跳转到指定位置
                    setTimeout(()=>{
                        let x=self.appUserInfo.info.factory.xCoordinates;
                        let y=self.appUserInfo.info.factory.yCoordinates;
                        self.$refs.baseMap.setCenter(x,y)
                    },800)
                });
                // self.graLayer = this.$refs.baseMap.addGraphicLayer('graphicLayer');

                // self.drawLayer2 = this.$refs.baseMap.addGraphicLayer("drawLayer2", null, (response) => {
                //     let result = response.results[0].graphic.attributes;
                //     console.log(result);
                //     if (result.type === "ploygon") {
                //         console.error("ff")
                //     }
                // });

                // ★1.创建厂区点图层(只是layer图层，没有点在上面)
                self.pictureMarkLayer = this.$refs.baseMap.addGraphicLayer("pictureMarkLayer", null, function (response) {
                    let result = response.results[0].graphic.attributes; // ●读取303传的attr ---  self.apiInstance.createPictureMarkSymbol(self.pictureMarkLayer, item.xCoordinates, item.yCoordinates, imgObj, attr)
                    if (result.factoryId) {
                        // ●点击显示popup
                        eventHelper.emit("showInfoBox", result.factoryId)
                    }
                });
                self.getAllFactoryInfo();//首页获取所有厂区信息 在这里这行，因为要用到view 和api

                // ★2.创建纳污范围图层(只是layer图层，没有点在上面)
                self.drawLayer = this.$refs.baseMap.addGraphicLayer("drawLayer", null, (response) => {
                    let result = response.results[0].graphic.attributes;
                    console.log(result);
                    if (result.type === "ploygon") {
                        console.error("ff")
                    }
                });
                // 获取纳污范围
                self.getAllPolygon();//首页获取所有wkt 在这里这行，因为要用到view 和api

                // ★图层的点击事件
                baseView.on('click', function (evt) {
                    console.error(evt.mapPoint.longitude + " " + evt.mapPoint.latitude);
                    eventHelper.emit("saveWkt", [evt.mapPoint.longitude, evt.mapPoint.latitude])
                });
                // ★图层的鼠标移动事件
                self.baseView.on("pointer-move", function (event) {
                    self.baseView.hitTest(event).then(function (response) {
                        //当前鼠标下的图形，也就是应该高亮的图形
                        let pointerFacilityGraphic = null;

                        //图形（graphic）点击事件的实现
                        if (response.results[0]) {
                            //获取到点击的图形
                            var graphic = response.results[0].graphic;

                            if (graphic.layer) {
                                //实现点击楼层地图的构筑物后，构筑物地图加载当前构筑物的图层
                                // ●通过id判断当前是哪个图层
                                if (graphic.layer.id === "drawLayer") {
                                    //当前鼠标下的图形，也就是应该高亮的图形
                                    pointerFacilityGraphic = graphic;
                                }
                            }
                        }
                        //实现高亮图形效果
                        if (pointerFacilityGraphic == null && this.highlightFacilityGraphic != null) {
                            //当鼠标下没有图形，当前有高亮图形，把当前高亮的效果去掉
                            // 鼠标移出
                            clearInterval(self.clearTimeOut);
                            self.setGraphicHighlight(this.highlightFacilityGraphic, false);
                            this.highlightFacilityGraphic = null;
                            this.defaultSymbol = null;
                        }
                        else if (pointerFacilityGraphic != null && this.highlightFacilityGraphic == null) {
                            //当鼠标下有图形，当前没有高亮图形，把鼠标图形设为高亮
                            // 鼠标移入
                            clearInterval(self.clearTimeOut);
                            self.defaultSymbol = pointerFacilityGraphic.symbol;
                            self.setGraphicHighlight(pointerFacilityGraphic, true);
                            this.highlightFacilityGraphic = pointerFacilityGraphic;
                        }
                        else if (pointerFacilityGraphic != null && this.highlightFacilityGraphic === pointerFacilityGraphic) {
                            //当鼠标下有图形，且跟当前高亮图形是同一个，不做任何事
                            // 鼠标在图形上移动
                        }
                        else if (pointerFacilityGraphic != null && this.highlightFacilityGraphic !== pointerFacilityGraphic) {
                            //当鼠标下有图形，且跟当前高亮图形不同一个，把鼠标图形设为高亮，把当前高亮的效果去掉
                            self.setGraphicHighlight(this.highlightFacilityGraphic, false);
                            self.defaultSymbol = pointerFacilityGraphic.symbol;
                            clearInterval(self.clearTimeOut);
                            self.setGraphicHighlight(pointerFacilityGraphic, true);
                            this.highlightFacilityGraphic = pointerFacilityGraphic;
                        }

                    }.bind(this))
                }.bind(this));
            }.bind(this));
        },

        // ★1.1
        getAllFactoryInfo(){//获取所有厂区在地图点上的信息
            let self = this;
            facilityController.getAllFactoryInfo((result) => {
                self.factoryList = [];
                if (!!result.success) {
                    result.data.forEach((item) => {
                        if (item.name != "公司") {
                            self.factoryList.push(item);
                        }
                    })
                    // self.createPolygonFromServer(self.factoryList);//画纳污范围
                    // if (self.role=="集团人员") {
                    //     self.createPictureMarkSymbol(self.factoryList);//创建厂的图片覆盖物
                    // }

                    // ●创建图层建筑物
                    self.createPictureMarkSymbol(self.factoryList);
                    // ●初始化当前图层的根图层，可以给根图层绑定一些事件
                    self.$refs.infoWindow.init(self.apiInstance, self.baseView, self.factoryList)

                    // self.infoBoxes = list;
                    // self.registerEvent(api,view);
                    // result.data.forEach((item)=>{
                    //     if (item.patrolLogInfo!=null) {
                    //         item.recordDate=moment().format("MM-DD hh:ss",item.patrolLogInfo.state=="0"?item.patrolLogInfo.createDate:item.patrolLogInfo.endDate);
                    //         item.collapseOpenType=false;
                    //         self.groupInspectionStateList.push(item);
                    //     }
                    // })
                    // console.log(self.groupInspectionStateList)
                }
            })
        },
        // ★1.2.厂区点图层上面添加建筑物和文字
        createPictureMarkSymbol(data){
            let self=this;
            data.forEach((item) => {
                let imgObj = {
                    url: self.layerIcon,
                    width: "53px",
                    height: "36px"
                };
                let attr = {
                    "factoryId": item.id
                }
                self.apiInstance.createPictureMarkSymbol(self.pictureMarkLayer, item.xCoordinates, item.yCoordinates, imgObj, attr)
                let styleObj={
                    type: "text",
                    haloColor:"red",
                    haloSize:"12px",
                    color: '#04700b',
                    // 建筑物下面的文字
                    text: item.name,
                    xoffset: 0,
                    yoffset: -24,
                    font: {
                        family: "playfair-display",
                        size: 16,
                        weight:"bold"
                    }
                }
                self.apiInstance.createTextSymbol(self.pictureMarkLayer, item.xCoordinates,item.yCoordinates, styleObj)
            })
        },

        // ★2.1.获取地图上所有的wkt
        getAllPolygon(){
            let self=this;
            let param = {
                pageNumber: 1,
                pageSize: 100000,
            }
            facilityController.getAllPolygon(param,(result)=>{
                if (result.success) {
                    self.createPolygonFromServer(result.data.records);//画纳污范围
                }
                // self.factoryList=[
                //     {
                //         name:"其它",
                //         id:"other-factory"
                //     }
                // ];
                // if (!!result.success) {
                //     result.data.forEach((item)=>{
                //         if (item.name!="集团") {
                //             self.factoryList.push(item);
                //         }
                //     })
                // }
            })
        },
        // ★2.2.创建集合图形
        createPolygonFromServer(data){//wkt画图
            let self = this;
            let attributes = {
                type: "polygon"
            }
            data.forEach((item, index) => {
                // 用wkt来创建集合图形
                if (!!item.wkt) {
                    // let color=item.carryColor.split(",")
                    let color=item.carryColor.split(",");
                    let colorStype= {
                        color: color,
                        outline: { // autocasts as new SimpleLineSymbol()
                            color: item.carryBorderColor?item.carryBorderColor.split(","):[80,80,80],
                            width: 1.55,
                            style: "dash",
                        }
                    };
                    this.apiInstance.createPolygon(self.drawLayer, JSON.parse(item.wkt), colorStype, attributes);
                }
            })
        },


        setGraphicHighlight: function (graphic, isHighlight) {
            var style = {
                type: "simple-fill",
                //线颜色
                color: [this.defaultSymbol.color.r,this.defaultSymbol.color.g,this.defaultSymbol.color.b,this.defaultSymbol.color.a],
                outline: {
                    color: [this.defaultSymbol.outline.color.r,this.defaultSymbol.outline.color.g,this.defaultSymbol.outline.color.b,this.defaultSymbol.outline.color.a],
                    width: 1.55,
                    style:"dash"
                }
            };
            if (isHighlight) {
                //高亮
                style.color = [0, 0, 0, 0.3];
                style.outline.width = 2;
                graphic.symbol = style;
                this.clearTimeOut = setInterval(() => {
                    if(this.clearBorderOpacity < 1){
                        this.clearBorderOpacity = 1;
                    }else{
                        this.clearBorderOpacity = 0.1;
                    }
                    style.outline.color = [this.defaultSymbol.outline.color.r,this.defaultSymbol.outline.color.g,this.defaultSymbol.outline.color.b,this.clearBorderOpacity];
                    graphic.symbol = style;
                },300)
            }
            else {
                //不高亮
                graphic.symbol = style;
            }
        },
        //厂区初始化管网地图
        initNetWorkMap: function () {//现状管线地图
            if (!!this.mapNetWorkLayer) {
                this.$refs.baseMap.removeLayerById("mapNetWork");
                this.mapNetWorkLayer=null;
                return;
            }
            var url = "http://www.ewateryun.com/map/arcgis/rest/services/zhxj/pipe/MapServer";
            var id = "mapNetWork";
            this.mapNetWorkLayer = this.$refs.baseMap.addMapImageLayer({
                url: url,
                id: id,
                spatialReference: this.baseView.spatialReference
            });
        },
        //厂区初始化管网地图
        initNetWorkMap2: function () {//规划管线地图
            if (!!this.mapNetWorkLayer2) {
                this.$refs.baseMap.removeLayerById("mapNetWork2");
                this.mapNetWorkLayer2=null;
                return;
            }
            var url = "http://www.ewateryun.com/map/arcgis/rest/services/zhxj/GHpipe/MapServer";
            var id = "mapNetWork2";
            this.mapNetWorkLayer2 = this.$refs.baseMap.addMapImageLayer({
                url: url,
                id: id,
                spatialReference: this.baseView.spatialReference
            });
        },

        createPolygon(){//wkt画图
            this.drawLayer2.removeAll();
            console.log('你要的坐标点集合:', this.wkt)
            let attributes = {
                type: "polygon"
            }
            var graphic = this.apiInstance.createPolygon(this.drawLayer2, this.wkt, this.ploygonStyle[0], attributes);
            this.polygonWKT = this.apiInstance.polygonToWKT(graphic.geometry);
            console.log('你要的wkt:', this.polygonWKT)
        },
        clear(){//清空画图
            this.wkt = [];
            this.drawLayer2.removeAll();
        },
        drawWKT(){//wkt转换录入
            this.drawLayer2.removeAll();
            var graphic = this.apiInstance.wktToPolygon(this.polygonWKT, this.drawLayer2)
            console.log('你要的wkt转换出来的对象:', graphic)
        },
        submitWKT(id){//保存wkt到后台
            let self = this;
            if (!self.polygonWKT) {
                self.$message({
                    type: 'warning',
                    message: "请填点击地图获取wkt！"
                })
                return;
            }
            let param = {
                factoryId: id,
                wkt: JSON.stringify(self.wkt)
            }
            facilityController.saveWKT(param, (result) => {
                self.factoryList = [];
                if (!!result.success) {
                    self.$message("保存成功")
                }
            })
        },
        createPoint: function (legend, subFacilities) {
            subFacilities.forEach(function (item) {
                var icon = !!legend.icon ? legend.icon : legend.facilityTypeName;
                var newIcon = './img/toolbar/huawei-' + icon + '.png';
                item.fid = 'f' + legend.id;
                var imgObj = {
                    url: newIcon,
                    width: "30px",
                    height: "36px"
                };
                var textObj = {
                    color: 'red',
                    text: item.name,
                    yoffset: -18,
                    verticalAlignment: 'top',
                    font: {
                        size: 12
                    }
                };
                var attributes = {
                    'item': item,
                    'facilityTypeName': legend.facilityTypeName,
                    'id': item.fid
                };
                var graphic = this.apiInstance.createPictureMarkSymbol(this.graLayer, item.x, item.y, imgObj, attributes);
                this.graphics.push(graphic);
                this.graphics.push(this.apiInstance.createTextSymbol(this.graLayer, item.x, item.y, textObj));
            }.bind(this));
            this.facilityArr[legend.facilityTypeName] = {
                graphics: this.graphics,
                data: subFacilities,
                layer: this.graLayer
            };
        },
    },
    mounted: function () {
        var self = this;
        self.role = self.appUserInfo.info.factoryUserDefault.department1;//运行班，机修班，设备专责，工艺专责，厂长，副厂长,集团人员
        //初始化地图
        self.initBaseMap();
        eventHelper.on("mapLegend-click", (item) => {
            if (item.action == 'drawPolyon') {
                self.createPolygon();
            } else if (item.action == 'drawWKT') {
                self.drawWKT();
            } else if (item.action == 'clear') {
                self.clear();
            } else if (item.action == 'mapNetWork') {
                self.initNetWorkMap();
            } else if (item.action == 'mapNetWork2') {
                self.initNetWorkMap2();
            }
        })
        eventHelper.on("submitWKT", (id) => {
            console.error("拿到的厂区是：" + id)
            self.submitWKT(id);
        })
        eventHelper.on("saveWkt", (data) => {
            console.error("拿到的坐标是：" + data)
            self.wkt.push(data);
            // self.createPolygon();
            // self.createPictureMarkSymbol();
        })
        eventHelper.on('openMapLegend', function (legend) {
            eventHelper.emit('loading-start');
            console.warn(legend);
            if (!!legend.showIcon) {
                var cacheFacilities = self.facilityArr[legend.facilityTypeName];
                if (!!cacheFacilities && cacheFacilities.length > 0) {
                    // arcgisHelper.createPoints(cacheFacilities, legend, true);
                    eventHelper.emit('loading-end');
                } else {
                    facilityController.getFacilityByType(legend.id, function (subFacilities) {
                        // if (legend.facilityTypeName == 'CP') {
                        //     this.reportPointInterval = setInterval(function () {
                        //         var cacheFacilities = self.facilityArr[legend.facilityTypeName];
                        //         facilityController.getFacilityByType(legend.id, function (subFacilities) {
                        //             debugger;
                        //             if (cacheFacilities.data.length == subFacilities.length) {
                        //
                        //             } else {
                        //                 self.$notify({
                        //                     title: '提示信息',
                        //                     message: '新增巡查上报点',
                        //                     type: 'warning'
                        //                 });
                        //                 var items = [{
                        //                     title: '上报时间',
                        //                     content: moment().format('MM-DD HH:mm:ss', new Date())
                        //                 }, {
                        //                     title: '案件类型',
                        //                     content: subFacilities[subFacilities.length - 1].name
                        //                 }]
                        //                 eventHelper.emit('alert-point', [{
                        //                     items: items,
                        //                     x: subFacilities[subFacilities.length - 1].x,
                        //                     y: subFacilities[subFacilities.length - 1].y
                        //                 }]);
                        //                 mapHelper.removeGraphics(self.facilityArr[legend.facilityTypeName].layer,self.facilityArr[legend.facilityTypeName].graphics);
                        //                 self.createPoint(legend,subFacilities);
                        //                 cacheFacilities = self.facilityArr[legend.facilityTypeName];
                        //             }
                        //         }.bind(this));
                        //     }, 1000);
                        // } else {
                        //     if (!!self.reportPointInterval) {
                        //         clearInterval(self.reportPointInterval);
                        //         eventHelper.emit('alert-point-close');
                        //     }
                        // }
                        self.createPoint(legend, subFacilities);
                        eventHelper.emit('loading-end');
                    });
                }
            } else {
                var layer = self.facilityArr[legend.facilityTypeName].layer;
                var graphics = self.facilityArr[legend.facilityTypeName].graphics;
                layer.removeMany(graphics);
                eventHelper.emit('loading-end');
            }
        }.bind(this));
        eventHelper.on('subFacility-clicked', function (point) {
            console.log(point);
            map.centerAt([parseFloat(point.center[0]) + 0.005, point.center[1]]);
            this.$refs.rightPanel.open(point.item, point.facilityTypeName);
        }.bind(this));
        eventHelper.on('carDetail-clicked', function (point) {
            console.log(point);
            this.$refs.carDetail.open(point.item);
        }.bind(this));
    },
    components: {
        'layer-list': layerList,
        'info-window': infoWindow,
        'water-purify-factory': waterPurifyFactory,
        'command-center': commandCenter
    }
});
module.exports = comm;