//引用组件或视图

//此功能对应的视图（html）
var template = require('./index.html');
//用于获取token，url头部等
var serviceHelper = require('services/serviceHelper.js');
//增删改列表容器（代表一个表格的列表）
var container = require('modules/common/crud/listContainerV2');

//element select容器
var elSelectContainer = require('modules/common/control/elSelectContainer.js');

var comm = container.extend({
    //设置模板
    template: template,
    data: function () {
        return {
            //当前表的主要字段的名称，此名称是后台传来的数据的属性名，而不是显示的名称
            mainField: "name",
            //列表标题，会显示在列表左上角
            listTitle: "公司",
            //录入表单的表单验证规则（用法参考element的Form控件的表单验证说明）
            rules: {
                //以下的name对应form里prop为name的控件
                name: [
                    //required: true意思是必填字段，message=验证不通过时的提示信息，trigger=什么时候触发验证
                    {required: true, message: '请输入', trigger: 'change'}
                ],
            },
            //elSelect容器（厂区）
            elSelectContainerFactory: new elSelectContainer(),
            entityAutoBindValues: [{
                data: "elSelectContainerFactory", dataProp: "value", field: "factoryId", defaultValue: function () {
                    return "";
                }
            }],
        }
    },
    methods: {
        //初始化表单
        initForm: function () {
            var formData = serviceHelper.getDefaultAjaxParam();

            serviceHelper.getJson(serviceHelper.getBasicPath() + "/factoryUser/selectFactory", formData, function (result) {
                this.elSelectContainerFactory.datas = [{id: 0, name: "不关联厂区"}].concat(result);
            }.bind(this));
        },
        //编辑纳污范围
        editArea: function (row) {
            let wkt = row.wkt;
            if (!wkt) {
                alert("还没录入纳污范围");
                return;
            }

            this.vm.editArea(row);
        },
        //新增（或重新画）纳污范围
        newArea: function (row) {
            this.vm.newArea(row);
        },
    }
});

module.exports = comm;