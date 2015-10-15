/**
 * 该worker线程需要足够抽象，
 * 任务的具体执行函数由外部来控制，worker的工作就是执行外部传来的任务！！！
 * worker提供一个calculate函数，一个IO函数（不一定有必要，再看看nodeJs的IO实现机制）
 * Created by sunshitao on 2015/10/15.
 */
var something;

var localFunc = {
    taskCalculate:function(){
        return something;
    },
    taskIO:function(){
        return something;
    },
    /**
     * 通知worker层的数据回执
     * @param name 执行的方法名
     * @param fn 任务函数
     * @private
     */
    _replay:function(name,fn){

    }
};


/**
 * worker相应函数
 * @param oEvent
 * oEvent.type  calculate  or  IO
 * oEvent.taskFunc
 */
onmessage = function(oEvent){
    localFunc["task"+oEvent.type]();
};
