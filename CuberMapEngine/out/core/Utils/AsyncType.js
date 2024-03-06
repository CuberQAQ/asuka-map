export class CancellablePromise {
    constructor(executor, object) {
        this._promise = new Promise(executor);
        this._onCancel = object.onCancel;
        this._option = object.option;
        return this;
    }
    cancel() {
        this._onCancel(this, this._option);
    }
    then(onfulfilled, onrejected) {
        return this._promise.then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this._promise.catch(onrejected);
    }
    finally(onfinally) {
        return this._promise.finally(onfinally);
    }
}
export class Defer {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
export class CancellableDefer {
    constructor(object) {
        this._option = object;
        this.promise = new CancellablePromise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        }, this._option);
    }
}
