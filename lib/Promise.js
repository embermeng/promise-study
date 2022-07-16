/* 
    自定义Promise函数模块
*/
(function (window) {
    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'
    /* 
        Promise构造函数
        excutor: 执行器函数，同步执行
    */
    function Promise(excutor) {
        // 将当前promise对象的self保存
        const self = this
        self.state = PENDING // 指定promise对象初始状态为pending
        self.data = undefined // 给promise对象指定一个用于存储结果数据的属性
        self.callbacks = [] // 每个元素的结构：{onResolved() {}, onRejected() {}}
        function resolve(value) {
            // 如果当前状态不是pending，直接结束
            if (self.state !== PENDING) return
            // 将状态改为resolved
            self.state = RESOLVED
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
            if (self.state !== PENDING) return
            // 将状态改为rejected
            self.state = REJECTED
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
        // 向后传递成功的value
        onResolved = typeof onResolved === 'function' ? onResolved : (value) => value
        // 指定默认的失败的回调(实现错误/异常传透的关键点)
        // 向后传递失败的reason
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason }

        // self是调用then的promise对象
        const self = this

        // 返回一个新的promise对象
        return new Promise((resolve, reject) => {
            /* 
                调用指定的回调函数处理，根据执行结果改变return的promise状态
            */
            function handle(callback) {
                /* 
                    1. 如果抛出异常，return的promise就会失败，reason是error
                    2. 如果回调函数执行返回不是promise，return的promise就会成功，value就是返回的值
                    3. 如果回调函数返回的是promise，return的promise的结果就是这个promise的结果，value就是返回的值
                */
                try {
                    const result = callback(self.data)
                    if (result instanceof Promise) {
                        // 3.
                        result.then(resolve, reject)
                        // 当result成功时，return的promise也成功
                        // 当result失败时，return的promise也失败
                    } else {
                        // 2.
                        resolve(result)
                    }
                } catch (error) {
                    // 1.
                    reject(error)
                }
            }
            if (self.state === PENDING) {
                // 当前状态还是pending，将回调函数保存起来
                self.callbacks.push({
                    onResolved(value) {
                        handle(onResolved)
                    },
                    onRejected(reason) {
                        handle(onRejected)
                    }
                })
            } else if (self.state === RESOLVED) {
                // 如果当前状态是resolved，异步执行onResolved并改变return的promise状态
                setTimeout(() => {
                    handle(onResolved)
                });
            } else {
                // 如果当前状态是rejected，异步执行onRejected并改变return的promise状态
                setTimeout(() => {
                    handle(onRejected)
                });
            }
        })
    }
    Promise.prototype.catch = function (onRejected) {
        return this.then(undefined, onRejected)
    }

    /* 
        Promise函数对象的方法: resolve(), reject(), all(), race()
        resolve(): 返回一个指定结果的成功的promise
        reject(): 返回一个指定结果的失败的promise
        all(): 返回一个promise，只有当所有的promise都成功时才成功，否则失败
        race(): 返回一个promise，其结果由第一个完成的promise决定
    */
    Promise.resolve = function (value) {
        return new Promise((resolve, reject) => {
            if (value instanceof Promise) {
                // value是promise, value的结果作为new的promise的结果
                value.then(resolve, reject)
            } else {
                // value不是promise
                resolve(value)
            }
        })
    }
    Promise.reject = function (reason) {
        // 返回一个失败的promise
        return new Promise((resolve, reject) => {
            reject(reason)
        })
    }
    Promise.all = function (promises) {
        // 用来保存所有成功的value
        const values = new Array(promises.length)
        // 用来保存成功promise的数量
        let resolvedCount = 0

        return new Promise((resolve, reject) => {
            // 遍历获取每个promise的结果
            promises.forEach((p, index) => {
                Promise.resolve(p).then(
                    (value) => {
                        resolvedCount++
                        values[index] = value
                        // 如果全部成功了，将return的promise改为成功
                        if (resolvedCount === promises.length) {
                            resolve(values)
                        }
                    },
                    (reason) => {
                        // 只要有一个失败，return的promise失败
                        reject(reason)
                    }
                )
            })
        })
    }
    Promise.race = function (promises) {
        return new Promise((resolve, reject) => {
            // 遍历获取每个promise的结果
            promises.forEach((p, index) => {
                Promise.resolve(p).then(
                    (value) => {
                        // 一旦有成功的，将return的promise变为成功
                        resolve(value)
                    },
                    (reason) => {
                        // 一旦有失败的，将return的promise变为失败
                        reject(reason)
                    }
                )
            })
        })
    }

    // 向外暴露Promise函数
    window.Promise = Promise
})(window)