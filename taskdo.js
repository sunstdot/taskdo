/**
 * 任务分配链式操作模块
 * 1.分配单次任务
 * 2.分配多次任务
 * 3.分配多次任务多worker线程
 * Created by sunshitao on 2015/10/14.
 */

var howdo;
(function (factory) {
    //commonJs中require,module,exports都是全局的
    if (typeof require === "function" && typeof module === "object" && typeof exports === "object") {
        //判断出commonJs规范
        factory(require, exports, module);
    }
    //AMD模式，全局定义了define
    else if (typeof define === "function") {
        define(factory);
    }
    //window
    else {
        factory();
    }

})(function (require, exports, module) {
    var _global = typeof global === "undefined" ? window : global;
    var _howdo = {

        //test
    }
});


//定义构造函数
var Howdo = function () {
    //任务队列
    this.tasks = [];
    //已经执行的任务,static共享方法要用
    this.executedTask = [];
    //是否已经开始执行任务
    this.hasstart = !1;
    //任务执行标志 0未开始，1在执行，2执行完毕,每个任务都会分配这个，
    //从封装角度看任务间独立，应该不能去查询其他任务的执行状态,这个在任务生成出创建
    //标识任务序号
    this.index = 0;
};

//构造一个链式操作
Howdo.prototype = {
    //分配单次任务
    task: function (fn) {
        var the = this;
        if (fn.constructor !== Function) {
            throw new Error("the task is not a function", fn);
        }

        fn.index = the.index++;
        the.tasks.push(fn);
        return the;
    },
    //循环分配任务
    each: function (object, callback) {
        var the = this;
        var i;
        if (object.constructor === Array) {
            for (i = 0; i < object.length; i++) {
                task(i, object[i]);
            }
        } else if (object.constructor === Object) {
            for (i in object) {
                if (object.hasOwnProperty(i)) {
                    task(i, object[i]);
                }
            }
        } else {
            throw new Error("can not call each on" + object);
        }

        function task(i, val) {
            the = the.task(function (fn) {
                var args = [i, val];
                args = args.concat(slice.call(arguments));
                callback.apply(val, args);
            });
        }

        return the;
    },

    //一下分配多任务

    togather: function (obejct) {

    },

    follow: function () {

    }
};


module.exports = howdo;
