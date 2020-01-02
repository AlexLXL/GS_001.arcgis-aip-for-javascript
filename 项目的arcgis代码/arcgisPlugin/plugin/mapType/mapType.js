define(function () {

    var pluginName = "mapType",//插件调用名
        //默认属性
        defaults = {};
    //参数：元素，属性
    function Plugin(element, options) {
        this.element = $(element);
        this.settings = $.extend({}, defaults, options);//扩展属性，将defaults和options属性添加到第一个参数并返回，有相同属性就覆盖
        this._defauts = defaults;
        this._name = pluginName;
        this.init();
    }

    //面向对象，设置原型
    Plugin.prototype = {
        //初始化函数
        init: function () {
            var $this = this.element,//绑定元素
                data = this.settings.data,
                obj = this;//调用对象
            this.initMapType();
        },
        initMapType: function () {
            var $this = this.element;//绑定元素
            //构造mapType容器
            var str = [
                '<div id="mapType-wrapper">'
                , '<div id="mapType">'
                , '<div class="mapTypeCard normal active" data-name="normalMap">'
                , '<span>地图</span>'
                , '</div>'
                , '<div class="mapTypeCard earth" data-name="earth">'
                , '<span>地球</span>'
                , '</div>'
                , '</div>'
                , '</div>'
            ].join('');
            $this.append(str);
            $("#mapType").hover(
                function () {
                    $("#mapType-wrapper").addClass("expand");
                },
                function () {
                    $("#mapType-wrapper").removeClass("expand");
                }
            )
            $("[data-name]").on("click", function () {
                var actionName = $(this).data("name");
                switch (actionName) {
                    case "normalMap":
                        alert(actionName);
                        break;
                    case "earth":
                        alert(actionName);
                        break;
                }
                $(this).addClass("active").siblings().removeClass("active");
            });
        },
        remove: function () {
            this.element.off("," + pluginName);
            this.element.removeData(pluginName);
        }
    };
    $.fn[pluginName] = function (options) {
        this.each(function () {
            var el = $(this);
            if (el.data(pluginName)) {
                el.data(pluginName).remove();
            }
            el.data(pluginName, new Plugin(this, options));
        });
        return this;
    };
});