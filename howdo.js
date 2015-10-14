/**
 * Created by sunshitao on 2015/9/9.
 * 仿照coolie组成一个链式的任务操作，进行依赖查找，模块合并、压缩等
 * 根据全局的变量类型，判断模块规范,其实这步在项目中可以省略，但是我们要加上
 *
 */

(function(factory){
    //commonJs  require,exports,module 都是全局的
    if(typeof require === 'function' && typeof exports === 'object' && module === 'object'){
        factory(require,exports,module);
    }
    //AMD  只定义了一个全局函数 define，没有require
    else if(typeof define === 'function'){
        define(factory);
    }
    //window
    else{
        factory();
    }

})(function(require,exports,module){

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

    module.exports = _howdo;
    //====================================================================================
    //=============================== [constructor] ======================================
    //====================================================================================
    //构造函数
    function Howdo(){
        //任务队列
        this.tasks = [];
        //是否已经开始执行任务了
        this.hasstart = !1;  //false
        //标示任务序号
        this.index = 0;
    }

    Howdo.prototype = {


        /**
         *  单次分配任务
         *  @param fn {Function} 任务函数
         *  @return Howdo {Object}
         *  @chainable
         *  @example
         *  //约定next为串行执行汇报，后面接follow
         *  //next只返回一个结果
         *  //err对象必须是Error的实例
         *  // howdo.task(function(next){
         *  //    next(new Error("错误"),1);
         *  // })
         *
         *  //done约定为并行执行汇报，后面接together
         *  //done建议只返回一个结果
         *  //err对象必须是Error的实例
         *  //howdo.task(function(done){
         *  //    done(new Error("错误"),1);
         *  //})
         *
         */
        task:function(fn){
            var the = this;
            if(typeof fn !== "Function"){
                throw new Error("the arg must be a function");
            }

            fn.index = the.index++;

            howdo.tasks.push(fn);
            return the;
        },

        /**
         * 循环分配任务
         * @param object {Array ,Object} 分配任务队列
         * @param callback  任务执行的回调函数
         * @returns {Howdo}
         * @chainable
         * @example
         * follow err 必须为Error实例
         * howdo.each([x,y,z],function(key,val,next,lasData){
         *      lastData 第1次为 undefined
         *      lastData 第2次为 1
         *      lastData 第3次为 2
         *      next(null, val);
         * }).follow(err,data){
         * //   err=null;
         * //   data = 3;
         * }
         *
         *
         * // together
         * // err对象必须是Error的实例
         * howdo.each([1, 2, 3], function(key, val, done){
         *     done(null, val);
         * }).together(function(err, data1, data2, dat3){
         *     // err = null
         *     // data1 = 1
         *     // data2 = 2
         *     // data3 = 3
         * });
         *
         */


        each:function(object,callback){
            var howdo = this;
            var i;
            var j;

            if(object && object.constructor === "Array"){
                for(i=0,j = object.length;i<j;i++){
                    task(i,object[i]);
                }
            }else if(typeof object === "Object"){
                for(i in object){
                    if(object.hasOwnProperty(i)){
                        task(i,object[i]);
                    }
                }
            }else{
                throw new Error("cannot call each on"+object);
            }

            function task(key,val){
                howdo = howdo.task(function(fn){

                    var arg = [key,val];
                    arg = arg.concat(slice.call(arguments));

                    callback.apply(val,arg);
                });
            };

            return howdo;
        },
        /**
         * 跟着做，任务串行执行
         * 链式结束
         * @example
         * howdo
         * .task(function(next){
         *     next(null, 1);
         * })
         * .task(function(next, data){
         *     // data = 1
         *     next(null, 2, 3);
         * })
         * .task(function(next, data1, data2){
         *     // data1 = 2
         *     // data2 = 3
         *     next(null, 4, 5, 6);
         * })
         * .follow(function(err, data1, data2, data3){
         *     // err = null
         *     // data1 = 1
         *     // data2 = 2
         *     // data3 = 3
         * });
         */

        follow:function(callback){
            if(this.hasstart){
                return;
            }
            if(typeof callback !== "Function"){
                throw new Error("howdo first argments[0] must be a function");
            }

            this.hasstart = !0;
            var current = 0;
            var tasks = this.tasks;
            var count = tasks.length;
            var args = [];

            if(!count){
                return callback();
            }
            (function _follow(){
                var fn = function(){
                    args = slice.apply(arguments);

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
        /**
         * 一起做，任务并行执行
         * 链式结束
         * @example
         * howdo
         * .task(function(done){
         *     done(null, 1);
         * })
         * .task(function(done){
         *     done(null, 2, 3);
         * })
         * .task(function(done){
         *     done(null, 4, 5, 6);
         * })
         * .together(function(err, data1, data2, data3, data4, data5, data6){
         *     // err = null
         *     // data1 = 1
         *     // data2 = 2
         *     // data3 = 3
         *     // data4 = 4
         *     // data5 = 5
         *     // data6 = 6
         * });
         */
        together:function(callback){
            if(this.hasstart){
                return;
            }
            if(typeof callback !== "Function"){
                throw new Error("howdo first argments[0] must be a function");
            }

            this.hasstart = !0;
            var done = 0;
            var tasks = this.tasks;
            var count = tasks.length;
            var taskData = [];
            var hasCallback = !1;
            var i = 0;

            if(!count){
                return callback();
            }
            for(;i<count;i++){
                _doTask(i,tasks[i]);
            }

            function _doTask(index,task){
                var fn = function(){
                    if(hasCallback){
                        return;
                    }
                    var args = slice.apply(arguments);
                    var ret = [];
                    var i=0;
                    if(args[0]){
                        hasCallback = !0;
                        return callback.apply(_global,args[0]);
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






});


var Howdo =function(){

    var localFunc = {};

    localFunc.task = function(){
        return this;
    };

    localFunc.follow = function(){

    };
};

module.exports = function(){

};
