/**
 * 任务分配链式操作模块
 * 1.分配单次任务
 * 2.分配多次任务
 * 3.分配多次任务多worker线程
 *
 * 任务在这里指的是一个函数执行的概念，所以我们可以把任务当成是一个个的function(){ ... }
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
    var slice = Array.prototype.slice;
    var _howdo = {
        task:function(){
            if(this.constructor === Howdo){
                return this;
            }
            var howdo = new Howdo();
            var args = slice.call(arguments);

            return howdo.task.apply(howdo,args);
        },
        each:function(){
            if(this.constructor === Howdo){
                return this;
            }
            var howdo = new Howdo();
            var args = slice.call(arguments);

            return howdo.task.apply(howdo,args);
        }
    };
    //====================================================================================
    //=============================== [constructor] ======================================
    //====================================================================================
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
        //分配任务
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
        //跟着做，串行执行所有任务
        follow: function (callback) {
            if(this.hasstart){
                return;
            }
            if(callback.constructor !== Function){
                throw new Error("the first of argments[0] must be function")
            }

            this.hasstart = !0;
            var current = 0;
            var tasks = this.tasks;
            var count = tasks.length;
            var args = [];

            if(!count){
                return callback();
            }
            //自执行函数执行分配任务
            (function _follow(){
                var fn = function(){
                    args = slice.call(arguments);
                    if(args[0]){
                        return callback.apply(_global,args[0]);
                    }

                    current++;
                    if(current === count){
                        return callback.apply(_global,args);
                    }else{
                        args.shift();
                        _follow();
                    }
                };
                args.unshift(fn);
                tasks[current].apply(_global,args);

            })();
        },
        //一起做,并行执行
        together: function (callback) {
            var the = this;
            if(callback.constructor !== Function){
                throw new Error("the first of argments[0] must be function")
            }
            if(this.hasstart){
                return;
            }
            this.hasstart = !0;
            var i;
            var tasks = this.tasks;
            var count = tasks.length;
            var taskData = [];
            var hasCallback = !1;
            var done = 0;//判断任务队列有没有执行完毕

            for(i = 0;i<count;i++){
                _doTask(i,tasks[i]);
            }

            function _doTask(index,task){
                var fn = function(){
                    if(hasCallback){
                        return;
                    }
                    var args = slice.call(arguments);
                    var ret = [];
                    var i = 0;
                    if(args[0]){
                        hasCallback = !0;
                        callback.apply(_global,args[0]);
                    }
                    taskData[index] = args.slice(1);
                    done++;
                    if(done === count){
                        for(;i<count;i++){
                            ret = ret.concat(taskData[count]);
                            ret.unshift(null);
                            callback.apply(_global,ret);
                        }
                    }
                };
                task(fn);
            }
        }
    };



    //====================================================================================
    //=============================== [constructor] ======================================
    //====================================================================================
    /**
     * worker lunch构造函数，负责提供外部调用所需的启动线程的方法，，本身是独立的
     */
    //封装一个类的实现
    var lunchWork = function(opt){
        //事件监听列表,由外部监听
        this.addEventList = opt.addEventList;
        this.task = opt.task;
    };

    var workerList = {};  //共有数据，记录worker列表


    lunchWork.prototype = {
        init:function(){
            //感觉应该有一个初始化操作
        },
        lunchAWork:function(name){
            //每次都会重新启动一个新的线程
            var myWorker = new Worker("../cmd_worker.js");
            var eventList = this.addEventList;
            var count = 0; //count值默认为0

            workerList[name] = myWorker;

            if(eventList&& eventList.constructor === Array){
                count = this.addEventList.length;
            }
            //如果事件监听列表不为空，则绑定事件
            if(count>0){
                var i = 0;
                for(;i<count;i++){
                    myWorker.addEventListener(eventList[i].key,eventList[i].fn);
                }
            }
            myWorker.postMessage = function(oEventData){
                //处理worker返回的信息
            };
        },
        killAWork:function(name){
            workerList[name].terminate();
        }
    };
});

