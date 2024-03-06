import { log } from "@zos/utils";
export interface CancellablePromiseArgType<T, OptionType> {
  onCancel: (
    cancellingPromise: CancellablePromise<T, OptionType>,
    option: OptionType
  ) => void;
  option: OptionType;
}
export class CancellablePromise<T, OptionType = unknown> {
  _promise: Promise<T>;
  _onCancel: (
    cancellingPromise: CancellablePromise<T, OptionType>,
    option: OptionType
  ) => void;
  _option: OptionType;
  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void
    ) => void,
    object: CancellablePromiseArgType<T, OptionType>
  ) {
            this._promise = new Promise(executor);
            this._onCancel = object.onCancel;
    this._option = object.option;
    return this;
  }
  cancel() {
    this._onCancel(this, this._option);
  }
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }
  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult> {
    return this._promise.catch(onrejected);
  }
  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this._promise.finally(onfinally);
  }
}

export class Defer<T> {
  promise: Promise<T>;
  resolve?: (value: T | PromiseLike<T>) => void;
  reject?: (reason?: any) => void;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export class CancellableDefer<T, OptionType = any> {
  promise: CancellablePromise<T, OptionType>;
  resolve?: (value: T | PromiseLike<T>) => void;
  reject?: (reason?: any) => void;
  _option: CancellablePromiseArgType<T, OptionType>;
  constructor(object: CancellablePromiseArgType<T, OptionType>) {
            this._option = object;
    this.promise = new CancellablePromise<T, OptionType>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    }, this._option);
  }
}
