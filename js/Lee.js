$(function() {
	//////////////////////////////////////////////
	// 搜索框
	//////////////////////////////////////////////

    // uuid 生成器
    var MdUuid =function () {
        return Math.random().toString(36).slice(4)  
    }

    // 参数标记缓存器
    var memoized = function (fn) {
          var cache = {};
          return function () {
            // 我们约定以第一个参数作为key
            var __KEY__ = arguments[0]
            // 记录缓存
            return cache[__KEY__] || (cache[__KEY__] = fn.apply(this, arguments));
          };
    };

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

    var whileTrue = function () {
        return true
    }

    // 单例模式
    var _getData = getCallBackSingle(getData)

    var getListHtmlByfilter = function (__KEY__, data, condition) {
        // 如果存在缓存则直接返回，否则重新过滤
        return data.filter(condition).map(function (item) {
            // 转化为li（HTML String）
            var liHTML = (item.tags || []).map(function (tag) { return '<li class="myPanel__body--tag">' + tag + '</li>' }).join('')
            // 转化为ul（HTML String）
            var ulHTML = liHTML ? '<ul class="myPanel__body--tags">' + liHTML + '</ul>' : ''
            // 转化为title（HTML String）
            var titletHTML = '<div class="myPanel__body--title"><a class="myPanel__body--link" target="_blank" href="' + item.url + '">' + item.title + '</a></div>'
            // 最终返回
            return '<li class="myPanel__body--li">' + ulHTML + titletHTML + '</li>'
        }).join('')
    }

    var getCacheListHtmlByfilter = memoized(getListHtmlByfilter)

    // 搜搜
    var search = function (e) {
        // 转化为小写
        var key = e.target.value.toLocaleLowerCase()
        // 数据获取和清洗
        _getData(function (data) {
            // 过滤数据
            var listHTML = getCacheListHtmlByfilter(key, data, function (item) {
                // 判断标题和tags是否包含关键词
                return ~item.title.toLocaleLowerCase().indexOf(key) || ~(item.tags || []).join('').toLocaleLowerCase().indexOf(key)
            })

            // 替换内容
            $('.myPanel__body--ul').html(listHTML)

            // 重新计算nicescroll
            $('.myPanel__body').getNiceScroll().resize()
        })
    }

    var render = function (data) {
        // 生成list
        var listHTML = getCacheListHtmlByfilter('', data, whileTrue)

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
        $('.myPanel__header--input').focus().on('input', search)

        // hover
        $('.myPanel__body--li').mouseover(function () {
            $('.myPanel__body--li').removeClass('is-active')
            $('.myPanel__header--input').focus()
        })

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
        if (isVisible() && isExist() && event.keyCode == 27) {
            // 隐藏
            hide()
        }

        // enter键跳转页面
        if (isVisible() && isExist() && event.keyCode == 13) {
            var link = document.querySelector('.myPanel__body--li.is-active .myPanel__body--link')
            link && link.click()
        }

        // 按下down
        if (isVisible() && isExist() && event.keyCode == 40) {
            // 获取当前聚焦的索引
            var index = $('.myPanel__body--li.is-active').index()
            // 如果未-1说明没有任何聚焦，那么聚焦到第一位
            if (index === -1) {
                $('.myPanel__body--li').eq(0).addClass('is-active')
            } else {
                $('.myPanel__body--li').removeClass('is-active')
                $('.myPanel__body--li').eq(++index).addClass('is-active');
            }
        }

        // 按下up
        if (isVisible() && isExist() && event.keyCode == 38) {
            // 获取当前聚焦的索引
            var index = $('.myPanel__body--li.is-active').index()
            // 如果未-1说明没有任何聚焦，保持原样即可
            if (index === 0 || index === -1) {
                $('.myPanel__body--li').removeClass('is-active')
                $('.myPanel__header--input').focus()
            } else {
                $('.myPanel__body--li').removeClass('is-active')
                $('.myPanel__body--li').eq(--index).addClass('is-active');
            }
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

    // 美化卡片滚动条
    // $('.widget').niceScroll(niceScrollConfig())

    // 页面滚动条美化
    // $('body').niceScroll(niceScrollConfig({ autohidemode: false }))

    //////////////////////////////////////////////
    // 回到头部
    //////////////////////////////////////////////
    var __GO_TOP_TIMER__ = null;
    var goTop = function() {
        cancelAnimationFrame(__GO_TOP_TIMER__);
        __GO_TOP_TIMER__ = requestAnimationFrame(function fn() {
            var oTop = document.body.scrollTop || document.documentElement.scrollTop;
            if (oTop > 0) {
                document.body.scrollTop = document.documentElement.scrollTop = oTop - 500;
                __GO_TOP_TIMER__ = requestAnimationFrame(fn);
            } else {
                cancelAnimationFrame(__GO_TOP_TIMER__);
            }
        });
    }
    $('.js-go-top').click(function (e) {
        goTop()
    });
})