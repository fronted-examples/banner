; (function (undefined) {
    "use strict";
    var _global;

    var defaultSetting = { // 默认配置
        width: 500,
        height: 300,
        transitionTime: 0.5,
        indicatorBackgroundColor: 'rgba(255, 255, 255, 0.3)',
        indicatorDefaultColor: 'rgba(255, 255, 255, 0.3)',
        indicatorActiveColor: 'rgba(255, 255, 255, 1)',
        intervalTime: 1500
    }
    var prevTime = 0; // 上一次事件触发的时间

    function Carousel(options) {
        var self = this;  // 在构造函数中使用，this指向新创建的对象Carousel{}，常把this保存在self里，因为在不同层级，this的指向可能不同
        self.state = Object.assign(defaultSetting, options); //合并参数，把默认设置和new对象的时候传进来的options进行合并，options里面设置了的项会覆盖默认设置的
        self.rootHtml = self.state.rootHtml ? document.querySelector(self.state.rootHtml) : document.body; // 要被插入轮播图的元素
        self.container = null; // 最外层容器
        self.carousel = null;  // 轮播图容器
        self.indicator = null; // 分页器容器
        self.prevButton = null; // 左侧按钮
        self.nextButton = null; // 右侧按钮
        self.index = 0;  // 焦点index初始值是1,指示第一张图片
        self.itemWidth = self.state.width; // 每张图片的宽带
        self.timer = null; // 自动轮播id
        self.sliderItems = []; // 轮播图
        self.indicators = []; // 分页器
        self.init(); // 初始化
    }

    // 轮播图组件的私有方法
    Carousel.prototype = {
        bindEvent() {
            var self = this
            // 由于内部按钮事件会冒泡到最外层元素，可以在最外层元素做事件代理
            self.container.addEventListener("click", function (e) {
                if (e.target.classList.contains('btn-prev') || e.target.classList.contains('prev')) {
                    throttle(self.prev.bind(self), 500); // 将事件内部的this和当前对象绑定在一起
                } else if (e.target.classList.contains("btn-next") || e.target.classList.contains('next')) {
                    throttle(self.next.bind(self), 500);
                }
            }, false)
            // 分页器绑定事件
            for (var i = 0; i < self.indicators.length; i++) {
                self.indicators[i].addEventListener('click', function (e) {
                    throttle(function () {
                        self.changeIndicator.bind(self)(e)
                    }, 500)
                }, false);
            }
            // 鼠标移入停止自动轮播
            self.container.addEventListener('mouseover', function () {
                self.stopPlay();
            }, false)
            // 鼠标移出开始自动轮播
            self.container.addEventListener('mouseout', function () {
                self.autoPlay();
            }, false)
        },
        // 创建可见容器
        createContainer() {
            var container = document.createElement('section');
            container.classList.add('container');
            this.setCarouselStyle(container, 'container');
            this.container = container;
        },
        // 创建轮播图容器
        createCarousel() {
            var carousel = document.createElement('div');
            carousel.classList.add('carousel');
            this.carousel = carousel;
        },
        // 创建轮播图片
        createSliderItems() {
            var img, self = this;
            for (var i = 0; i < self.state.imgs.length; i++) {
                img = new Image();
                img.src = self.state.imgs[i].url;
                img.setAttribute("class", 'carousel-item');
                this.setCarouselStyle(img, 'carousel');
                self.sliderItems.push(img);
            }
            img = new Image();
            img.src = self.state.imgs[0].url;
            img.setAttribute("class", 'carousel-item');
            this.setCarouselStyle(img, 'carousel');
            self.sliderItems.push(img);
        },
        // 创建分页器容器
        createIndicator() {
            var indicator = document.createElement("ul");
            indicator.classList.add("indicator", "row-between");
            this.setCarouselStyle(indicator, 'indicator');
            this.indicator = indicator;
        },
        // 创建分页器
        createIndicators() {
            for (var i = 0; i < this.state.imgs.length; i++) {
                var li = document.createElement("li");
                li.classList.add("dot");
                li.setAttribute('data-index', i);
                this.setCarouselStyle(li, 'indicators');
                this.indicators.push(li);
            }
        },
        // 创建前进后退按钮
        createButton() {
            var btnPrev = document.createElement("div");
            var btnNext = document.createElement("div");
            btnPrev.classList.add("btn", 'btn-prev', "flex-center");
            btnNext.classList.add("btn", 'btn-next', "flex-center");
            var prev = document.createElement("span");
            var next = document.createElement("span");
            prev.classList.add("prev", "btn-arrow");
            next.classList.add("next", "btn-arrow");
            btnPrev.appendChild(prev);
            btnNext.appendChild(next);
            this.prevButton = btnPrev;
            this.nextButton = btnNext;
        },
        // 获取元素的位置
        getBoundingRect(eleId) {
            var ele = document.querySelector(eleId)
            return ele.getBoundingClientRect()
        },
        // 渲染函数
        render(target, elements) {
            if (elements instanceof Array) {
                for (var i = 0; i < elements.length; i++) {
                    target.appendChild(elements[i]);
                }
            } else {
                target.appendChild(elements);
            }
        },
        // 设置轮播图和分页器的默认样式
        setCarouselStyle(ele, type) {
            if (type === 'container' || type === 'carousel') {
                ele.style.width = this.state.width + 'px';
                ele.style.height = this.state.height + 'px';
            } else if (type === 'indicator') {
                ele.style.backgroundColor = this.state.indicatorBackgroundColor;
            } else if (type === 'indicators') {
                ele.style.backgroundColor = this.state.indicatorDefaultColor;
            }
        },
        // 初始化
        init() {
            this.createContainer();
            this.createCarousel();
            this.createIndicator();
            this.createSliderItems();
            this.createIndicators();
            this.createButton();
            this.render(this.rootHtml, this.container);
            this.render(this.container, this.carousel);
            this.render(this.container, this.indicator);
            this.render(this.container, this.prevButton);
            this.render(this.container, this.nextButton);
            this.render(this.carousel, this.sliderItems);
            this.render(this.indicator, this.indicators);
            this.setIndicatorActive();
            this.bindEvent();
        },
        // 上一张
        prev() {
            var self = this
            if (!self.index) {
                // 在第一张时，关闭过渡，并瞬间切换到最后一张
                self.index = self.sliderItems.length - 1;
                self.sliderItemsMove(true);
                // 切换到最后一张后，开启过渡同时移动到真正意义上的最后一张图片。
                window.setTimeout(function () {
                    self.index = self.sliderItems.length - 2;
                    self.sliderItemsMove(false);
                }, 0);
            } else {
                self.index--
                self.sliderItemsMove(false)
            }
        },
        // 下一张
        next() {
            var self = this;
            self.index++;
            if (self.index === self.sliderItems.length - 1) {
                // 在切换到最后一张图500ms后，因为transition的动画时长是0.5s。关闭动画，将轮播图实际位置移到第一张图的位置，造成下一次切换像是再次从第一张开始，这个过程是肉眼不可见的
                // 这个操作要在使用动画效果过渡到最后一张之后进行
                window.setTimeout(function () {
                    self.index = 0
                    // 取消过渡，500ms瞬间移动到实际第一张的位置
                    self.sliderItemsMove(true)
                }, 500)
            }
            self.sliderItemsMove(false)
        },
        // 分页器的点击事件
        changeIndicator(e) {
            this.index = Number(e.target.dataset.index);
            this.sliderItemsMove(false);
        },
        // 自动轮播
        autoPlay() {
            var self = this;
            self.timer = window.setInterval(function () {
                self.index++;
                if (self.index === self.sliderItems.length - 1) {
                    window.setTimeout(function () {
                        self.index = 0;
                        self.sliderItemsMove(true);
                    }, self.state.transitionTime * 1000);
                }
                self.sliderItemsMove(false);
            }, self.state.intervalTime)
        },
        // 停止自动轮播
        stopPlay() {
            var self = this;
            clearInterval(self.timer)
        },
        // 图片移动
        sliderItemsMove(front) {
            var self = this;
            if (front) {
                self.carousel.style.transition = 'none';
            } else {
                self.carousel.style.transition = self.state.transitionTime + 's ease';
            }
            self.setIndicatorActive();
            self.carousel.style.transform = 'translateX(' + (-self.index * self.itemWidth) + 'px)';
        },
        // 设置激活的dot
        setIndicatorActive() {
            for (var i = 0; i < this.indicators.length; i++) {
                this.indicators[i].style.backgroundColor = this.state.indicatorDefaultColor
            }
            this.indicators[this.index % (this.sliderItems.length - 1)].style.backgroundColor = this.state.indicatorActiveColor
        }
    }

    // 自定义实现bind函数
    Function.prototype.bind = Function.prototype.bind || function bind(context) {
        if (typeof this !== 'function') {
            throw new TypeError(this + ' must be a function');
        }
        var self = this; // 这个必须有，否则如果是事件，会导致内部的this指向重新指向全局window
        var args = [].slice.call(arguments, 1);
        var bound = function () {
            var boundArgs = [].slice.call(arguments);
            var finalArgs = args.concat(boundArgs);
            if (this instanceof bound) {
                if (self.prototype) {
                    function Empty() { }
                    Empty.prototype = self.prototype;
                    bound.prototype = new Empty();
                }
                var result = self.apply(this, finalArgs);
                var isObject = typeof result === 'object' && result !== null;
                var isFunction = typeof result === 'function';
                if (isObject || isFunction) {
                    return result;
                }
                return this;
            }
            else {
                return self.apply(context, finalArgs);
            }
        };
        return bound;
    }

    // 这边要做事件代理，所以不能用定时器节流
    function throttle(fn, delay) {
        var now = Date.now();
        if (now - prevTime >= delay) {
            fn();
            prevTime = Date.now();
        }
    }

    // 将_global赋值为全局对象window, 严格模式下(0, eval)('this')会计算出。因为严格模式下this为undefined;
    _global = (function(){ return this || (0, eval)('this'); }());
    // 判断是否存在模块加载器：module.exports、amd、commonJs，否则直接将插件给全局对象
    if (typeof module !== "undefined" && module.exports) {
        module.exports = Calculate;
    } else if (typeof define === "function" && define.amd) {
        define(function(){return Calculate;});
    } else {
        !('Carousel' in _global) && (_global.Carousel = Carousel);
    }
})()