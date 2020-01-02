//引用组件或视图

//此功能对应的视图（html）
var template = require('./index.html');
//用于获取token，url头部等
var serviceHelper = require('services/serviceHelper.js');
//全局事件类
var eventHelper = require('utils/eventHelper');
//地图操作类
var mapUtil = require('utils/mapUtil.js');
//右侧面板基类
var defaultBase = require('modules/common/defaultBase');

//主表容器
var containerMain = require('./mainList');

const comm = defaultBase.extend({
    //设置模板
    template: template,
    components: {
        //vue组件方式引入各个表的容器，一个表一个容器
        //主表容器
        'containerMain': containerMain,
    },
    data: function () {
        return {
            //地图插件api
            apiInstance: null,
            //地图map对象
            map: null,
            //地图mapView对象
            mapView: null,
            //预览纳污范围图层
            layerPreview: null,
            //画面的画图对象
            sketchPolygon: null,
            //当前编辑的纳污范围的实体
            currentDrawRow: null,
        }
    },
    mounted: function () {
        //地图初始化方法
        this.initMap();

        //获取到表容器
        this.containerMain = this.$refs.containerMain1;
        //容器初始化，初始化必须在页面加载完成，也就是mounted时触发
        //参数：this（传入全局vue对象）；controller的url；grid的列头设置
        this.containerMain.init(this, "/factoryCarryingArea");
        //刷新列表
        this.containerMain.refreshList();

        this.containerMain.initForm();
    },
    methods: {
        //地图初始化方法
        initMap() {
            //调用地图插件的地图初始化方法，注意$refs后面跟着插件名，属于vue插件的用法。init方法参数说明：
            //参数1：arcgis jsapi地图绑定的div的id，id要全局唯一，不用手动添加div（div和其id会在插件内自动写入）
            //参数2：地图的配置项，具体每项的说明看代码注释
            //PS：地图的配置项表面上有x和y配置地图初始化中心点，zoom配置初始化缩放级别，但实际上这些值传入去但没用，因此是不可用的。要实现以上功能可以在地图加载完成的回调函数实现
            //参数3：地图初始化成功的回调，可以理解为map的ready（loaded）事件
            this.$refs.mapDemo1.init("factoryCarryingAreaDraw1", {
                    fromServer: true,//是否从后台获取地图配置
                    // serverURL: serviceHelper.getBasicPath(),
                    serverURL: serviceHelper.getEwaterPath(),
                    token: serviceHelper.getToken(),
                    //地图坐标系wkid
                    //PS：理论上地图坐标系可以跟图层坐标系不同，一定情况下会自动投影转换，具体规则涉及坐标系知识，在此不展开
                    // wkid: 4547,
                    // wkid: 4326,
                    //图例控制控件，0为不加载图例控件，1~其他 为图例的样式，默认样式为1，可通过定制开发在插件中编写并使用
                    mapType: 0,
                    //底图控制控件，0为不加载地图控件，1~其他 为底图控制的样式，默认样式为1，可通过定制开发在插件中编写并使用
                    layerControl: 0,
                    //地图点击事件回调
                    click: function (evt) {
                    }
                }, (api, map, view) => {
                    //地图加载完成的回调

                    //获取到地图相关对象，用于后续对地图的操作
                    this.apiInstance = api;
                    this.map = map;
                    this.mapView = view;

                    //预览纳污范围的图层
                    this.layerPreview = new this.apiInstance.GraphicsLayer({
                        //空间参考，一般要跟地图的一样
                        spatialReference: this.mapView.spatialReference,
                    });
                    //图层添加到地图
                    //PS：GraphicsLayer也是图层之一，因此也支持通用的图层功能
                    this.map.add(this.layerPreview);

                    //刷新预览的纳污范围
                    this.refreshPreviewArea();

                    //画面的初始化
                    this.drawPolygonInit();
                }
            )
        },
        //刷新预览的纳污范围
        refreshPreviewArea: function () {
            //清空预览图层
            this.layerPreview.removeAll();

            //查询所有纳污范围
            var formData = serviceHelper.getDefaultAjaxParam();
            formData.pageNumber = 1;
            formData.pageSize = 9999999;

            serviceHelper.getJson(serviceHelper.getBasicPath() + "/factoryCarryingArea/list", formData, function (result) {
                let records = result.records;
                records.forEach(function (item) {
                    let wkt = item.wkt;
                    let carryColor = item.carryColor;
                    carryColor = carryColor.replace(/\s+/g, "");

                    //样式
                    //PS：其他高级样式配置请看样式的章节
                    let style = {
                        //线颜色
                        color: carryColor.split(","),
                        // color: [50, 205, 50, 0.3],
                        outline: { // autocasts as new SimpleLineSymbol()
                            color: item.carryBorderColor?item.carryBorderColor.split(","):[80,80,80],
                            width: 1.55,
                            style: "dash",
                        }
                    };

                    //这里不是wkt，也是坐标数组的json，先转成坐标数组
                    let coord = JSON.parse(wkt);
                    //坐标转面
                    let polygon = mapUtil.geometry.coordToPolygon(this.apiInstance, coord, this.mapView.spatialReference);
                    //wkt转面的图形（Graphic）
                    let graphic = mapUtil.geometry.polygonToPolygonGraphic(this.apiInstance, polygon, style, this.mapView.spatialReference, null);

                    //加到预览图层
                    this.layerPreview.add(graphic);
                }.bind(this));
            }.bind(this));
        },
        //画面的初始化
        drawPolygonInit: function () {
            //新建一个图形图层用于存放画图过程中的图形
            let layer = new this.apiInstance.GraphicsLayer({
                //空间参考，一般要跟地图的一样
                spatialReference: this.mapView.spatialReference,
            });
            //图层添加到地图
            //PS：GraphicsLayer也是图层之一，因此也支持通用的图层功能
            this.map.add(layer);

            //new SketchViewModel，此对象用于画图
            this.sketchPolygon = new this.apiInstance.SketchViewModel({
                //mapView
                view: this.mapView,
                //一个图形图层
                layer: layer,
                polylineSymbol: {
                    type: "simple-line",  // autocasts as new SimpleMarkerSymbol()
                    color: "#8A2BE2",
                    width: "4",
                    style: "dash"
                },
                polygonSymbol: {
                    type: "simple-fill",  // autocasts as new SimpleMarkerSymbol()
                    color: "rgba(138,43,226, 0.8)",
                    style: "solid",
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: "white",
                        width: 1
                    }
                }
            });

            //绑定create-complete事件，新增画图完成时会触发
            this.sketchPolygon.on("create-complete", function (event) {
                //画面完成后保存到实体
                this.saveWktToEntity(event);
            }.bind(this));

            //绑定update-complete事件，编辑画图完成时会触发
            this.sketchPolygon.on("update-complete", function (event) {
                //画面完成后保存到实体
                this.saveWktToEntity(event);
            }.bind(this));
        },
        //画面完成后保存到实体
        saveWktToEntity: function (event) {
            if (!this.currentDrawRow) {
                return;
            }

            //画的结果的几何对象
            //PS：画完后SketchViewModel创建的图形会消失，因此如果要在画完后还要显示在地图上，就要另外再编码画在地图上，SketchViewModel只会提供画的结果的几何对象
            let geometry = event.geometry;

            //这里不是wkt，而是坐标数组的json，先转成坐标数组
            let wkt = JSON.stringify(geometry.rings);

            var formData = $.extend(serviceHelper.getDefaultAjaxParam(), this.currentDrawRow);
            formData.wkt = wkt;

            serviceHelper.postJson(serviceHelper.getBasicPath() + "/factoryCarryingArea/save", formData, function (result) {
                //保存后要刷新预览纳污范围
                this.refreshPreviewArea();
                //刷新列表
                this.containerMain.refreshList();

                //清空当前编辑实体
                this.currentDrawRow = null;

                alert("保存成功");
            }.bind(this));
        },
        //新增（或重新画）纳污范围
        newArea: function (row) {
            this.currentDrawRow = row;

            //开始画线
            //参数1：画的几何类型，有值：point=点 | multipoint=多点 | polyline=线 | polygon=面 | rectangle=矩形 | circle=原型
            this.sketchPolygon.create("polygon");
        },
        //编辑纳污范围
        editArea: function (row) {
            this.currentDrawRow = row;

            let wkt = row.wkt;
            let carryColor = row.carryColor;
            carryColor = carryColor.replace(/\s+/g, "");

            //样式
            //PS：其他高级样式配置请看样式的章节
            let style = {
                //线颜色
                // color: carryColor.split(","),
                //线颜色
                color: [50, 205, 50, 0.3],
                outline: {
                    color: [255, 0, 0],
                    width: 1
                }
            };

            let coord = JSON.parse(wkt);

            let polygon = mapUtil.geometry.coordToPolygon(this.apiInstance, coord, this.mapView.spatialReference);

            this.mapView.extent = polygon.extent;

            //wkt转面的图形（Graphic）
            let graphic = mapUtil.geometry.polygonToPolygonGraphic(this.apiInstance, polygon, style, this.mapView.spatialReference, null);

            this.sketchPolygon.update(graphic);
        },
    }
});

module.exports = comm;