$(function() {
	//////////////////////////////////////////////
	// 搜索框
	//////////////////////////////////////////////

    // 9位 简易版
    var MdUuid =function () {
        return Math.random().toString(36).slice(4)  
    } 

    // 生成一个 Uuid
    var PANEL_ID = MdUuid()

 	// （回调版）单例模式，通常用于ajax类异步回调处理函数
 	var getCallBackSingle = function(fn) {
 		// 缓存
 	    var cache
 	    // 接受一个回调函数
	    return function (cb) {
	    	// 如果有缓存存在，那么直接使用缓存作为回调值，否则使用默认函数
	    	cache ? cb.apply(this, cache) : fn(function () {
	    		console.log('no cache')
	    		// 保存到缓存并且执行回调
	    		cb.apply(this, cache = arguments)
	    	})
	    }
 	}

    // 获取所有内容
    var getData = function (successcb) {
    	$.ajax({
    	    url: "/search.json",
    	    dataType: 'json',
            async: false,
            success: successcb,
    	    error: function(e, m){
    	       console.log('数据接口请求异常', e, m)
    	    }
    	})
    }

    // 单例模式
    var _getData = getCallBackSingle(getData)

    // 搜搜
    var search = function (e) {
        // 转化为小写
        var v = e.target.value.toLocaleLowerCase()
        // 数据获取和清洗
        _getData(function (data) {
            // 数据过滤
            var filterData = data.filter(function (item) {
                // 判断标题和tags是否包含关键词
                return ~item.title.toLocaleLowerCase().indexOf(v) || ~(item.tags || []).join('').toLocaleLowerCase().indexOf(v)
            })

            // 生成list
            var listHTML = getListHtml(filterData)

            // 替换内容
            $('.myPanel__body--ul').html(listHTML)

            // 重新计算nicescroll
            $('.myPanel__body').getNiceScroll().resize()
        })
    }

    // 生成list
    var getListHtml = function (data) {
        // 列表内容（HTML String）
        return data.map(function (item) {
            // 转化为li（HTML String）
            var liHTML = (item.tags || []).map(function (tag) { 
                return '<li class="myPanel__body--tag">' + tag + '</li>'
            }).join('')
            // 转化为ul（HTML String）
            var ulHTML = liHTML ? '<ul class="myPanel__body--tags">' + liHTML + '</ul>' : ''
            // 转化为title（HTML String）
            var titletHTML = '<div class="myPanel__body--title"><a class="myPanel__body--link" href="' + item.url + '">' + item.title + '</a></div>'
            // 最终返回
            return '<li class="myPanel__body--li">' + ulHTML + titletHTML + '</li>'
        }).join('')
    }

    var render = function (data) {
        // 生成list
        var listHTML = getListHtml(data);

        // 最终的dom
        var $myPanel = $('<div class="myPanel" id="' + PANEL_ID + '"">\
                             <div class="myPanel__container">\
                                <div class="myPanel__header">\
                                    <input type="text" placeholder="请输入搜索内容" class="myPanel__header--input" />\
                                </div>\
                                <div class="myPanel__body">\
                                    <ul class="myPanel__body--ul">\
                                        ' + listHTML + '\
                                    </ul>\
                                </div>\
                            </div>\
                        </div>')

        // 插入#container中
        $('#container').append($myPanel)

        // 聚焦文本框，绑定keyup搜索
        $('.myPanel__header--input').focus().keyup(search)

        // 美化滚动条
        $('.myPanel__body').niceScroll(niceScrollConfig())
    }

    var isExist = function () {
        return $("#" + PANEL_ID).size() > 0
    }

    var isVisible = function () {
        return $("#" + PANEL_ID).is(':visible')
    }

    var show = function () {
        $("#" + PANEL_ID).show()
        $('.myPanel__header--input').focus()
    }

    var hide = function () {
        $("#" + PANEL_ID).hide()
    }

    // 打开搜索框
    var openPanel = function () {
        // 如果不存在，则需要先插入
        if (isExist() === false) {
            // 获取数据后渲染它
            _getData(render)
        } else {
            // 如果已存在则显示它
            show()
        }
        // 阻止冒泡触发window而又给hide了
        event.preventDefault(); event.stopPropagation();
    }

    // 点击搜索，打开搜索框
    $('#nav-search-btn').click(openPanel)

    $(window).keydown(function (event) {
    	// 监听 Ctrl + Shift + p
    	if (event.ctrlKey && event.shiftKey && event.keyCode == 80) {
            // 打开搜索框
    		openPanel()
    	}
        // 监听esc键隐藏
        if (event.keyCode == 27) {
            // 隐藏
            hide()
        }
    }).click(function (event) {
        // 获取dom
        var panel = document.getElementById(PANEL_ID)
        // 如果存在dom，并且它正显示着，并且点击的地方不包含
        if (panel && isVisible() && !panel.contains(event.target)) {
            // 那么隐藏它
            hide()
        }
    })


    //////////////////////////////////////////////
    // 美化滚动条
    //////////////////////////////////////////////

    // nicescroll 通用配置
	var niceScrollConfig = function (config) {
		return Object.assign({}, { 
			cursorwidth: '4px',
	    	cursorcolor: 'rgba(0,0,0,0.2)', 
	    	autohidemode: true, 
	    	horizrailenabled: false, 
	    	emulatetouch: false, 
	    	zindex: 199307100337
	    }, config)
	}

	// 文章滚动条美化
    $('article .article-inner').niceScroll(niceScrollConfig())

    // 页面滚动条美化
    $('body').niceScroll(niceScrollConfig({ autohidemode: false }))
})