/* 
    自定义Promise函数模块
*/
(function (window) {
    /* 
        Promise构造函数
        excutor: 执行器函数，同步执行
    */
    function Promise(excutor) {
        // 将当前promise对象的self保存
        const self = this
        self.state = 'pending' // 指定promise对象初始状态为pending
        self.data = undefined // 给promise对象指定一个用于存储结果数据的属性
        self.callbacks = [] // 每个元素的结构：{onResolved() {}, onRejected() {}}
        function resolve(value) {
            // 如果当前状态不是pending，直接结束
            if (self.state !== 'pending') return
            // 将状态改为resolved
            self.state = 'resolved'
            // 保存value数据
            self.data = value
            // 如果有待执行的callback函数，立即异步执行回调函数onResolved
            if (self.callbacks.length > 0) {
                setTimeout(() => { // 放入异步队列中执行所有成功的回调
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });
                });
            }
        }
        function reject(reason) {
            // 如果当前状态不是pending，直接结束
            if (self.state !== 'pending') return
            // 将状态改为rejected
            self.state = 'rejected'
            // 保存reason数据
            self.data = reason
            // 如果有待执行的callback函数，立即异步执行回调函数onResolved
            if (self.callbacks.length > 0) {
                setTimeout(() => { // 放入异步队列中执行所有成功的回调
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                });
            }
        }
        // 立即同步执行excutor
        try {
            excutor(resolve, reject)
        } catch (error) { // 如果执行器抛出异常，promise对象变为rejected状态
            reject(error)
        }
    }

    /* 
        Promise原型对象上的then()和catch()
        then(): 指定成功和失败的回调，返回一个新的Promise对象
        catch(): 指定失败的回调，返回一个新的Promise对象
    */
    Promise.prototype.then = function (onResolved, onRejected) {
        const self = this
        // 假设当前状态还是pending，将回调函数保存起来
        self.callbacks.push({
            onResolved,
            onRejected
        })
    }
    Promise.prototype.catch = function (onRejected) {

    }

    /* 
        Promise函数对象的方法: resolve(), reject(), all(), race()
        resolve(): 返回一个指定结果的成功的promise
        reject(): 返回一个指定结果的失败的promise
        all(): 返回一个promise，只有当所有的promise都成功时才成功，否则失败
        race(): 返回一个promise，其结果由第一个完成的promise决定
    */
    Promise.resolve = function (value) { }
    Promise.reject = function (reason) { }
    Promise.all = function (promises) { }
    Promise.race = function (promises) { }

    // 向外暴露Promise函数
    window.Promise = Promise
})(window)