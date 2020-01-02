define(function () {
    var mapLegend = {
        items: [
            {
                id: "lengendBZ",
                name: "泵站",
                focus: true,
                imgSrc: "img/mapLegend/ico-2.png",
                checked: true,
                init: 'testLegendInit(true,"BZ")',
                onclick: 'testLegend(this,"BZ")',
                number: '123',
                ways: 'alert(123)'
            },
            {
                id: "lengendJSD",
                name: "积水点",
                imgSrc: "img/mapLegend/ico-3.png",
                checked: false,
                init: 'testLegendInit(false,"JSD")',
                onclick: 'testLegend(this,"JSD")',
                number: '123',
                ways: 'alert(123)'
            },
            {
                id: "lengendSWZ",
                name: "水文站",
                imgSrc: "img/mapLegend/ico-4.png",
                checked: false,
                init: 'testLegendInit(false,"SWZ")',
                onclick: 'testLegend(this,"SWZ")',
                number: '123',
                ways: 'alert(123)'
            },
            {
                id: "lengendYLZ",
                name: "雨量站",
                imgSrc: "img/mapLegend/ico-5.png",
                checked: false,
                init: 'testLegendInit(false,"YLZ")',
                onclick: 'testLegend(this,"YLZ")',
                number: '123',
                ways: 'alert(123)'
            },
            {
                id: "lengendJXSS",
                name: "井下水位",
                imgSrc: "img/mapLegend/ico-6.png",
                checked: false,
                init: 'testLegendInit(false,"JXSS")',
                onclick: 'testLegend(this,"JXSS")',
                number: '123',
                ways: 'alert(123)'
            },
            {
                id: "lengendSSD",
                name: "视频点",
                imgSrc: "img/mapLegend/ico-1.png",
                checked: false,
                init: 'testLegendInit(false,"SPD")',
                onclick: 'testLegend(this,"SPD")',
                number: '123',
                ways: 'alert(123)'
            }
        ]
    };
    var mapLegendSet = {
        items: [
            {
                id: "lengendBZ",
                name: "泵站",
                focus: true,
                imgSrc: "img/mapLegend/ico-2.png",
                checked: true,
                init: 'testLegendInit(true,"BZ")',
                onclick: 'testLegend(this,"BZ")',
                children: [{
                    id: "lengendBZ",
                    name: "泵站1",
                    imgSrc: "img/mapLegend/ico-2.png",
                    checked: true,
                    init: 'testLegendInit(true,"BZ")',
                    onclick: 'testLegend(this,"BZ")',
                    number: '123',
                    ways: 'alert(123)'
                },
                    {
                        id: "lengendJSD",
                        name: "泵站2",
                        imgSrc: "img/mapLegend/ico-3.png",
                        checked: false,
                        init: 'testLegendInit(false,"JSD")',
                        onclick: 'testLegend(this,"JSD")',
                        number: '125',
                        ways: 'alert(125)'
                    },
                    {
                        id: "lengendSWZ",
                        name: "泵站3",
                        imgSrc: "img/mapLegend/ico-4.png",
                        checked: false,
                        init: 'testLegendInit(false,"SWZ")',
                        onclick: 'testLegend(this,"SWZ")',
                        number: '897',
                        ways: 'alert(897)'
                    },
                    {
                        id: "lengendJXSS",
                        name: "泵站4",
                        imgSrc: "img/mapLegend/ico-6.png",
                        checked: false,
                        init: 'testLegendInit(false,"JXSS")',
                        onclick: 'testLegend(this,"JXSS")',
                        number: '453',
                        ways: 'alert(453)'
                    },
                    {
                        id: "lengendSSD",
                        name: "泵站5",
                        imgSrc: "img/mapLegend/ico-1.png",
                        checked: false,
                        init: 'testLegendInit(false,"SPD")',
                        onclick: 'testLegend(this,"SPD")',
                        number: '156',
                        ways: 'alert(156)'
                    }]
            },
            {
                id: "lengendJSD",
                name: "积水点",
                imgSrc: "img/mapLegend/ico-3.png",
                checked: false,
                init: 'testLegendInit(false,"JSD")',
                onclick: 'testLegend(this,"JSD")',
                children: [{
                    id: "lengendB",
                    name: "积水点1",
                    imgSrc: "img/mapLegend/ico-2.png",
                    checked: false,
                    init: 'testLegendInit(true,"BZ")',
                    onclick: 'testLegend(this,"BZ")',
                    number: '123',
                    ways: 'alert(123)'
                },
                    {
                        id: "lengendJS",
                        name: "积水点2",
                        imgSrc: "img/mapLegend/ico-3.png",
                        checked: true,
                        init: 'testLegendInit(false,"JSD")',
                        onclick: 'testLegend(this,"JSD")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengendSW",
                        name: "积水点3",
                        imgSrc: "img/mapLegend/ico-4.png",
                        checked: false,
                        init: 'testLegendInit(false,"SWZ")',
                        onclick: 'testLegend(this,"SWZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengendYL",
                        name: "积水点4",
                        imgSrc: "img/mapLegend/ico-5.png",
                        checked: false,
                        init: 'testLegendInit(false,"YLZ")',
                        onclick: 'testLegend(this,"YLZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengendJXS",
                        name: "积水点5",
                        imgSrc: "img/mapLegend/ico-6.png",
                        checked: false,
                        init: 'testLegendInit(false,"JXSS")',
                        onclick: 'testLegend(this,"JXSS")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengendSS",
                        name: "积水点6",
                        imgSrc: "img/mapLegend/ico-1.png",
                        checked: false,
                        init: 'testLegendInit(false,"SPD")',
                        onclick: 'testLegend(this,"SPD")',
                        number: '123',
                        ways: 'alert(123)'
                    }]
            },
            {
                id: "lengendSWZ",
                name: "水文站",
                imgSrc: "img/mapLegend/ico-4.png",
                checked: false,
                init: 'testLegendInit(false,"SWZ")',
                onclick: 'testLegend(this,"SWZ")',
                children: [{
                    id: "ngendBZ",
                    name: "水文站1",
                    imgSrc: "img/mapLegend/ico-2.png",
                    checked: false,
                    init: 'testLegendInit(true,"BZ")',
                    onclick: 'testLegend(this,"BZ")',
                    number: '123',
                    ways: 'alert(123)'
                },
                    {
                        id: "ngendJSD",
                        name: "水文站2",
                        imgSrc: "img/mapLegend/ico-3.png",
                        checked: false,
                        init: 'testLegendInit(false,"JSD")',
                        onclick: 'testLegend(this,"JSD")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "ngendSWZ",
                        name: "水文站3",
                        imgSrc: "img/mapLegend/ico-4.png",
                        checked: true,
                        init: 'testLegendInit(false,"SWZ")',
                        onclick: 'testLegend(this,"SWZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "ngendYLZ",
                        name: "水文站4",
                        imgSrc: "img/mapLegend/ico-5.png",
                        checked: false,
                        init: 'testLegendInit(false,"YLZ")',
                        onclick: 'testLegend(this,"YLZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "ngendJXSS",
                        name: "水文站5",
                        imgSrc: "img/mapLegend/ico-6.png",
                        checked: false,
                        init: 'testLegendInit(false,"JXSS")',
                        onclick: 'testLegend(this,"JXSS")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "ngendSSD",
                        name: "水文站6",
                        imgSrc: "img/mapLegend/ico-1.png",
                        checked: false,
                        init: 'testLegendInit(false,"SPD")',
                        onclick: 'testLegend(this,"SPD")',
                        number: '123',
                        ways: 'alert(123)'
                    }]
            },
            {
                id: "lengendYLZ",
                name: "雨量站",
                imgSrc: "img/mapLegend/ico-5.png",
                checked: false,
                init: 'testLegendInit(false,"YLZ")',
                onclick: 'testLegend(this,"YLZ")',
                children: [{
                    id: "lengdBZ",
                    name: "雨量站1",
                    imgSrc: "img/mapLegend/ico-2.png",
                    checked: false,
                    init: 'testLegendInit(true,"BZ")',
                    onclick: 'testLegend(this,"BZ")',
                    number: '123',
                    ways: 'alert(123)'
                },
                    {
                        id: "lengdJSD",
                        name: "雨量站2",
                        imgSrc: "img/mapLegend/ico-3.png",
                        checked: false,
                        init: 'testLegendInit(false,"JSD")',
                        onclick: 'testLegend(this,"JSD")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengdSWZ",
                        name: "雨量站3",
                        imgSrc: "img/mapLegend/ico-4.png",
                        checked: false,
                        init: 'testLegendInit(false,"SWZ")',
                        onclick: 'testLegend(this,"SWZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengdYLZ",
                        name: "雨量站4",
                        imgSrc: "img/mapLegend/ico-5.png",
                        checked: true,
                        init: 'testLegendInit(false,"YLZ")',
                        onclick: 'testLegend(this,"YLZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengdJXSS",
                        name: "雨量站5",
                        imgSrc: "img/mapLegend/ico-6.png",
                        checked: false,
                        init: 'testLegendInit(false,"JXSS")',
                        onclick: 'testLegend(this,"JXSS")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengdSSD",
                        name: "雨量站6",
                        imgSrc: "img/mapLegend/ico-1.png",
                        checked: false,
                        init: 'testLegendInit(false,"SPD")',
                        onclick: 'testLegend(this,"SPD")',
                        number: '123',
                        ways: 'alert(123)'
                    }]
            },
            {
                id: "lengendJXSS",
                name: "井下水位",
                imgSrc: "img/mapLegend/ico-6.png",
                checked: false,
                init: 'testLegendInit(false,"JXSS")',
                onclick: 'testLegend(this,"JXSS")',
                children: [{
                    id: "leendBZ",
                    name: "井下水位1",
                    imgSrc: "img/mapLegend/ico-2.png",
                    checked: false,
                    init: 'testLegendInit(true,"BZ")',
                    onclick: 'testLegend(this,"BZ")',
                    number: '123',
                    ways: 'alert(123)'
                },
                    {
                        id: "leendJSD",
                        name: "井下水位2",
                        imgSrc: "img/mapLegend/ico-3.png",
                        checked: false,
                        init: 'testLegendInit(false,"JSD")',
                        onclick: 'testLegend(this,"JSD")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "leendSWZ",
                        name: "井下水位3",
                        imgSrc: "img/mapLegend/ico-4.png",
                        checked: false,
                        init: 'testLegendInit(false,"SWZ")',
                        onclick: 'testLegend(this,"SWZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "leendYLZ",
                        name: "井下水位4",
                        imgSrc: "img/mapLegend/ico-5.png",
                        checked: false,
                        init: 'testLegendInit(false,"YLZ")',
                        onclick: 'testLegend(this,"YLZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "leendJXSS",
                        name: "井下水位5",
                        imgSrc: "img/mapLegend/ico-6.png",
                        checked: true,
                        init: 'testLegendInit(false,"JXSS")',
                        onclick: 'testLegend(this,"JXSS")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "leendSSD",
                        name: "井下水位6",
                        imgSrc: "img/mapLegend/ico-1.png",
                        checked: false,
                        init: 'testLegendInit(false,"SPD")',
                        onclick: 'testLegend(this,"SPD")',
                        number: '123',
                        ways: 'alert(123)'
                    }]
            },
            {
                id: "lengendSSD",
                name: "视频点",
                imgSrc: "img/mapLegend/ico-1.png",
                checked: false,
                init: 'testLegendInit(false,"SPD")',
                onclick: 'testLegend(this,"SPD")',
                children: [{
                    id: "lengenZ",
                    name: "视频点1",
                    imgSrc: "img/mapLegend/ico-2.png",
                    checked: false,
                    init: 'testLegendInit(true,"BZ")',
                    onclick: 'testLegend(this,"BZ")',
                    number: '123',
                    ways: 'alert(123)'
                },
                    {
                        id: "lengenSD",
                        name: "视频点2",
                        imgSrc: "img/mapLegend/ico-3.png",
                        checked: false,
                        init: 'testLegendInit(false,"JSD")',
                        onclick: 'testLegend(this,"JSD")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengenWZ",
                        name: "视频点3",
                        imgSrc: "img/mapLegend/ico-4.png",
                        checked: false,
                        init: 'testLegendInit(false,"SWZ")',
                        onclick: 'testLegend(this,"SWZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengenLZ",
                        name: "视频点4",
                        imgSrc: "img/mapLegend/ico-5.png",
                        checked: false,
                        init: 'testLegendInit(false,"YLZ")',
                        onclick: 'testLegend(this,"YLZ")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengenXSS",
                        name: "视频点5",
                        imgSrc: "img/mapLegend/ico-6.png",
                        checked: false,
                        init: 'testLegendInit(false,"JXSS")',
                        onclick: 'testLegend(this,"JXSS")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengenXSS",
                        name: "视频点5",
                        imgSrc: "img/mapLegend/ico-6.png",
                        checked: false,
                        init: 'testLegendInit(false,"JXSS")',
                        onclick: 'testLegend(this,"JXSS")',
                        number: '123',
                        ways: 'alert(123)'
                    },
                    {
                        id: "lengenSD",
                        name: "视频点6",
                        imgSrc: "img/mapLegend/ico-1.png",
                        checked: true,
                        init: 'testLegendInit(false,"SPD")',
                        onclick: 'testLegend(this,"SPD")',
                        number: '123',
                        ways: 'alert(123)'
                    }]
            }
        ]
    };
    var mapToolbarSet = {
        items: [
            {
                id: "toolbarKJCX", name: "空间查询", imgSrc: "glyphicon glyphicon-search", checked: false, onclick: '',
                children: [
                    {
                        id: "dbx",
                        name: "多边形",
                        imgSrc: "img/toolbar/dbx.png",
                        checked: false,
                        onclick: 'kjcxDraw("polygon");'
                    },
                    {
                        id: "yx",
                        name: "圆形",
                        imgSrc: "img/toolbar/yx.png",
                        checked: false,
                        onclick: 'kjcxDraw("circle");'
                    },
                    {
                        id: "jx",
                        name: "矩形",
                        imgSrc: "img/toolbar/jx.png",
                        checked: false,
                        onclick: 'kjcxDraw("rectangle");'
                    },
                    {id: "zj", name: "直线", imgSrc: "img/toolbar/hx.png", checked: false, onclick: 'kjcxDraw("line");'},
                ]

            },
            {
                id: "toolbarKDPG", name: "管道评估", imgSrc: "glyphicon glyphicon-search", checked: false, onclick: '',
                children: [
                    {
                        id: "xzgx",
                        name: "管线(禁用)",
                        imgSrc: "img/toolbar/hx.png",
                        checked: false,
                        onclick: 'chooseGxForPg()'
                    },
                    {
                        id: "dbxxz",
                        name: "区域评估",
                        imgSrc: "img/toolbar/yx.png",
                        checked: false,
                        onclick: 'gdpgDraw("polygon");'
                    },
                    {
                        id: "gdpgclear",
                        name: "清除",
                        imgSrc: "img/toolbar/yx.png",
                        checked: false,
                        onclick: 'clearPgLayerAndEvent();'
                    },
                ]

            },
            {
                id: "toolbarYX", name: "选择", imgSrc: "glyphicon glyphicon-ok-sign", checked: false, onclick: '',
                children: [
                    {
                        id: "gxevent",
                        name: "管线(禁用)",
                        imgSrc: "img/toolbar/gx.png",
                        checked: false,
                        onclick: 'addGxEvent();'
                    },
                    {
                        id: "gdevent",
                        name: "管点(禁用)",
                        imgSrc: "img/toolbar/gd.png",
                        checked: false,
                        onclick: 'addGdEvent();'
                    },
                    {
                        id: "xpjkevent",
                        name: "监控(禁用)",
                        imgSrc: "img/toolbar/sp.png",
                        checked: false,
                        onclick: 'addSpjkEvent();'
                    },
                    {
                        id: "proevent",
                        name: "问题(禁用)",
                        imgSrc: "img/toolbar/wt.png",
                        checked: false,
                        onclick: 'addProblemEvent();'
                    }
                ]
            },
            {
                id: "toolbarGDGC", name: "管点高程", imgSrc: "glyphicon glyphicon-wrench", checked: false, onclick: '',
                children: [
                    {
                        id: "toolXX",
                        name: "信息",
                        imgSrc: "img/toolbar/point_info.png",
                        checked: false,
                        onclick: 'javascript:infoToolbar()'
                    },
                    {
                        id: "toolYD",
                        name: "移动",
                        imgSrc: "img/toolbar/point_move.png",
                        checked: false,
                        onclick: 'javascript:editToolbar()'
                    },
                    {
                        id: "toolBQ",
                        name: "标签(off)",
                        imgSrc: "img/toolbar/point_elev.png",
                        checked: false,
                        onclick: 'javascript:showLabels(this)'
                    }
                ]
            },
            {
                id: "toolbarGDGC", name: "低洼点", imgSrc: "glyphicon glyphicon-record", checked: false, onclick: '',
                children: [
                    {
                        id: "toolTJ",
                        name: "添加",
                        imgSrc: "img/toolbar/dwd_add.png",
                        checked: false,
                        onclick: 'javascript:addDwd()'
                    },
                    {
                        id: "toolDQ",
                        name: "隐藏",
                        imgSrc: "img/toolbar/dwd_uncheck.png",
                        checked: false,
                        onclick: 'javascript:readDwd()'
                    },
                    {
                        id: "toolLB",
                        name: "列表",
                        imgSrc: "img/toolbar/dwd_list.png",
                        checked: false,
                        onclick: 'javascript:readDwdInfo()'
                    }
                ]
            }
        ]
    };
    return {
        init: function () {
            $("#toolBar").toolBar({data: mapToolbarSet});
            $("#mapType").mapType();
        }
    }
})
