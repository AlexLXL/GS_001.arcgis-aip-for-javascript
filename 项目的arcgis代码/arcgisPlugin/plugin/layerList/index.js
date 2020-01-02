var Vue = require('vue');
var template = require('./layerList.html');
var eventHelper = require('utils/eventHelper');
var facilityController = require('controllers/facilityController');

// 定义组件
var comm = Vue.extend({
    template: template,
    data: function () {
        return {
            defaultProps: {
                children: 'children',
                label: 'title'
            },
            legendList: [],
            checkList: []
        }
    },
    mounted: function () {

    },
    methods: {
        init: function (list) {
            var legendItem = [];
            list.forEach(function (type, index) {
                var facility = {
                    id: type.id,
                    title: type.nameCn,
                    facilityTypeName: type.name,
                    icon: type.icon,
                    showIcon: true,
                    showSub: false
                };
                if (facility.showIcon) {
                    this.checkList.push(facility.id);
                }
                legendItem.push(facility);
                eventHelper.emit('openMapLegend', facility);
            }.bind(this));
            this.legendList = [{
                id: 1,
                title: '测站',
                disabled: true,
                showIcon: true,
                showSub: false,
                children: legendItem
            }];
        },
        handleCheckChange: function (data, checked, indeterminate) {
            data.showIcon = checked;
            if (!indeterminate) {
                eventHelper.emit('openMapLegend', data);
            }
        },
        renderContent(h, {node, data, store}) {
            // console.log(node,data,store);
            if (!data.icon) {
                data.icon = 'default';
            }
            let icon = './img/toolbar/huawei-' + data.icon + '.png';
            let showIcon = data.showIcon;
            if (!!data.children) {
                return (
                    <span>
                    <span>{node.label}</span>
                    </span>);
            } else {
                return (
                    <span>
                    <span>
                    <span>{node.label}</span>
                </span>
                <span style="float: right; margin: 5px">
                    <img src={icon} width='20px' height='24px'/>
                    </span>
                    </span>);
            }
        }
    },
    components: {}
});
module.exports = comm;