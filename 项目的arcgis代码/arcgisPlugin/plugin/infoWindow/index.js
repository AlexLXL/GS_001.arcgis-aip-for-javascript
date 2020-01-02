var template = require('./infoWindow.html');
var eventHelper = require('utils/eventHelper');
const appTabModel = require("controllers/model/appTabModel");
// 定义组件
let self;
var comm = Vue.extend({
    template: template,
    data: function () {
        return {
            infoBoxes: [],
            fcEvents: [],
            showInput: false,
        }
    },
    created: function () {
        self = this;
    },
    methods: {
        init(api, view, list){
            self.baseView = view;
            self.apiInstance = api;
            self.infoBoxes = list;
            self.infoBoxes.forEach((item)=>{
                self.$set(item,"style",{
                    top:'0px',
                    left:'0px'
                })
                self.$set(item,"infoBoxVisible",false)
            })
            self.registerEvent(api,view);
        },
        // 注册这个图层的事件
        registerEvent(api,view){
            api.dojoOn(
                view.root, "mousemove", api.dojoHitct(this, function () {
                    // console.log('mousemove')
                    this.relocate();
                }.bind(this))
            )
            api.dojoOn(
                view.root, "resize", api.dojoHitct(this, function () {
                    // console.log('resize')
                    this.relocate();
                }.bind(this))
            )
            api.dojoOn(
                view.root, "mouse-wheel", api.dojoHitct(this, function () {
                    // console.log('resize')
                    this.relocate();
                }.bind(this))
            )
            api.dojoOn(
                view.root, "pan-end", api.dojoHitct(this, function () {
                    // console.log('resize')
                    this.relocate();
                }.bind(this))
            )
            api.dojoOn(
                view.root, "mouseup", api.dojoHitct(this, function () {
                    // console.log('resize')
                    this.relocate();
                }.bind(this))
            )
        },
        // 重新定位poplu的位置
        relocate: function () {
            for (let i = 0; i < self.infoBoxes.length; i++) {
                if (self.isNumber(self.infoBoxes[i].xCoordinates) && self.isNumber(self.infoBoxes[i].yCoordinates)) {
                    let boxID = '#infoBox-' + i;
                    let point = self.apiInstance.createPoint(self.infoBoxes[i].xCoordinates, self.infoBoxes[i].yCoordinates, self.baseView.spatialReference);
                    // console.log(point)
                    // point.geometry.spatialReference = self.baseView.spatialReference;

                    let screenPoint = self.baseView.toScreen(point);// view.toScreen 转换坐标,点的空间参考需与地图保持一致
                    // console.log(screenPoint)
                    let x = screenPoint.x;
                    let y = screenPoint.y;
                    self.infoBoxes[i].style.top = y-140 + 'px';
                    self.infoBoxes[i].style.left = x-100 + 'px';
                    // console.log(self.infoBoxes[i].style)
                }
            }
        },
        isNumber: function (value) {
            var patrn = /^(-)?\d+(\.\d+)?$/;
            if (patrn.exec(value) == null || value == "") {
                return false;
            } else {
                return true;
            }
        },
        display: function (flag) {
            for (var i = 0; i < self.infoBoxes.length; i++) {
                var boxID = '#infoBox-' + i;
                if (flag) {
                    $(boxID).show();

                } else {
                    $(boxID).hide();

                }
            }
        },
        highLight: function (infoID) {
            $('#' + infoID).css('z-index', 9999);
        },
        normalize: function (infoID) {
            $('#' + infoID).css('z-index', 1);
        },
        // 点击这个popup后出发打开其他tag
        openSiteplan(item){
            appTabModel.setFactoryId(item.id);
            eventHelper.emit("factoryFloorViewRender");
            let url={
                funUrl: "factoryFloorView",
                id: "factoryFloorView",
                title: "厂区平面图",
                children: [
                ]
                // factoryid:item.id
            };
            eventHelper.emit('other-page-open-menu',url);
        }
    },
    mounted: function () {
        /* y:-85
         x:-106*/
        // this.map = {};
        // eventHelper.on('mapCreated', function (map) {
        //     this.map = map;
        //     this.map.on('extent-change', function () {
        //         setTimeout(function () {
        //             this.relocate();
        //         }.bind(this), 10);
        //     }.bind(this));
        //     this.map.on('zoom-end', function () {
        //         setTimeout(function () {
        //             this.display(true)
        //         }.bind(this), 10);
        //     }.bind(this));
        //     this.map.on('pan-end', function () {
        //         setTimeout(function () {
        //             this.display(true)
        //         }.bind(this), 10);
        //     }.bind(this));
        //     this.map.on('zoom-start', function () {
        //         setTimeout(function () {
        //             this.display(false);
        //         }.bind(this), 10);
        //     }.bind(this));
        //     this.map.on('pan-start', function () {
        //         setTimeout(function () {
        //             this.display(false)
        //         }.bind(this), 10);
        //     }.bind(this));
        // }.bind(this));
        eventHelper.on("showInfoBox",(id)=>{
            self.infoBoxes.forEach((item)=>{
                item.infoBoxVisible=item.id===id?true:false;
            })
        })
        eventHelper.on('alert-point', function (points, isReplace) {
            if (!!isReplace) {
                this.infoBoxes = points;
            }
            else {
                this.infoBoxes.push(...points.slice(0));
            }
            this.$nextTick(function () {
                this.relocate();
            }.bind(this));
        }.bind(this));
        eventHelper.on('alert-point-close', function (point, isAll) {
            if (!!isAll) {
                this.infoBoxes = [];
            }
            else {
                for (var i = 0; i < this.infoBoxes.length; i++) {
                    var item = this.infoBoxes[i];
                    if (item.x == point.x && item.y == point.y) {
                        this.infoBoxes.splice(i, 1);
                    }
                }
            }
        }.bind(this));

    },
    components: {}
});
module.exports = comm;