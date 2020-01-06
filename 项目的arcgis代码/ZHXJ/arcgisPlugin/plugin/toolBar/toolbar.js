define(function () {

    var pluginName = "toolBar",//插件调用名
        //默认属性
        defaults = {
            data: " "
        };
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
            this.initToolBar(data);
        },
        initToolBar: function (data) {
            var $this = this.element;//绑定元素
            //1.构造工具栏容器
            var toolbar = '<div class="tool-box">' +
                '<div class="tool-container clearfix">';
            //2.遍历父节点，增加一级菜单
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                var id = item.id;
                var name = item.name;
                var child = item.children;
                var checked = item.checked;
                var imgSrc = item.imgSrc;
                var onclick = item.onclick;
                //2.1 构造一级菜单，并且绑定事件
                toolbar += '<div class="noline tool">';
                if (child instanceof Array) {
                    toolbar += '<a id=' + id + ' href="#" onclick=' + onclick + '><b><span class="' + imgSrc + '" style="padding-right:5px;"></span><span>' + name + '</span></b><em></em></a><ul class="menu-xl">';
                    //3.遍历子节点，构造二级菜单并绑定事件
                    for (var j = 0; j < child.length; j++) {
                        var toolId = child[j].id;
                        var toolName = child[j].name;
                        var toolImg = child[j].imgSrc;
                        var toolOnclick = child[j].onclick;
                        toolbar += '<li><a id=' + toolId + ' href="#" onclick=' + toolOnclick + '><img src="' + toolImg + '"/><span class="toolName">' + toolName + '</span></a></li>';
                    }
                    toolbar += '</ul>';
                } else if (checked) {
                    toolbar += '<a id=' + id + ' href="#" onclick=' + onclick + '><b>' + name + '</b><em></em></a>';
                } else {
                    toolbar += '<a id=' + id + ' href="#" onclick=' + onclick + '><img  src="' + imgSrc + '">' + name + '</a>';
                }
                toolbar += '</div>';
            }
            toolbar += '</div>'
            '</div>';
            $this.append(toolbar);
            $(".tool").hover(function () {
                $(this).find("ul").show();
            }, function () {
                $(".tool").hover(function () {

                });
                $(".menu-xl").hide();
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