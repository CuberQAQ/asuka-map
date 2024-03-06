import { CancellableDefer, } from "../Utils/AsyncType";
import { ImgTileResource } from "./ImgTileResource";
/**
 * 一次加载多个瓦片资源的 资源获取器
 */
export class MultiLoaderITResource extends ImgTileResource {
    constructor(multiLoader, option) {
        super();
        this._loading = 0;
        this._maxThreads = 5;
        this._timeout = 5000;
        option &&
            typeof option.maxThreads === "number" &&
            (this._maxThreads = option.maxThreads);
        this._loader = multiLoader;
        this._requestMap = new Map();
    }
    static getTileKey(tileX, tileY, zoom) {
        return "" + tileX + "," + tileY + "," + zoom;
    }
    cancelRequest(tileKey, cancellingPromise) {
        var _a;
        if (!this._requestMap.has(tileKey))
            return;
        let deferList = this._requestMap.get(tileKey)[1];
        for (let i = 0; i < deferList.length; ++i) {
            const defer = deferList[i];
            if (defer.promise === cancellingPromise) {
                deferList.splice(i, 1);
                if (deferList.length === 0) {
                    // this._requestMap.get(tileKey)?.[3] = true;
                    if ((_a = this._requestMap.get(tileKey)) === null || _a === void 0 ? void 0 : _a[2])
                        --this._loading;
                    this._requestMap.delete(tileKey);
                }
                return;
            }
        }
    }
    tryLoad(tileKey) {
        console.log("now thread:" + this._loading);
        if (this._loading >= this._maxThreads)
            return;
        // log.warn("try load");
        if (typeof tileKey === "undefined")
            for (let key of this._requestMap.keys()) {
                if (!this._requestMap.get(key)[2]) {
                    tileKey = key;
                    break;
                }
            }
        if (typeof tileKey === "undefined")
            return;
        // log.warn("load " + tileKey);
        let reqTuple = this._requestMap.get(tileKey);
        let tileInfo = reqTuple[0];
        ++this._loading;
        reqTuple[2] = true; // loading mark
        // setTimeout(() =>{}, this._timeout)
        this._loader
            .load(tileInfo.tileX, tileInfo.tileY, tileInfo.zoom)
            .then(({ resource, tileX, tileY, zoom }) => {
            console.log("loader then回調");
            let tileKey = MultiLoaderITResource.getTileKey(tileX, tileY, zoom);
            let requestTuple = this._requestMap.get(tileKey);
            if (requestTuple === undefined)
                return;
            for (let defer of requestTuple[1]) {
                defer.resolve && defer.resolve(resource);
            }
        })
            .catch(({ tileX, tileY, zoom }) => {
            console.log("loader catch回調");
            // TODO catch 传参比较特别
            let tileKey = MultiLoaderITResource.getTileKey(tileX, tileY, zoom);
            let requestTuple = this._requestMap.get(tileKey);
            if (requestTuple === undefined)
                return;
            for (let defer of requestTuple[1]) {
                defer.reject && defer.reject();
            }
        })
            .finally(() => {
            console.log("loader finally");
            let reqTuple = this._requestMap.get(tileKey);
            reqTuple[3] = true;
            this._requestMap.delete(tileKey);
            if (reqTuple[2])
                --this._loading;
            this.tryLoad();
        });
        this.tryLoad();
    }
    getResource(tileX, tileY, zoom) {
        // log.warn("getResource:" + tileX + "," + tileY + "," + zoom);
        if (this._loader.isLoaded(tileX, tileY, zoom)) {
            // log.warn("isload:" + this._loader.getLoaded(tileX, tileY, zoom));
            return this._loader.getLoaded(tileX, tileY, zoom);
        }
        else {
            let tileKey = MultiLoaderITResource.getTileKey(tileX, tileY, zoom);
            let defer = new CancellableDefer({
                option: { tileKey },
                onCancel: (promise, option) => {
                    this.cancelRequest(option.tileKey, promise);
                },
            });
            if (this._requestMap.has(tileKey))
                this._requestMap.get(tileKey)[1].push(defer);
            else {
                this._requestMap.set(tileKey, [{ tileX, tileY, zoom }, [defer], false, false]);
                // log.warn("pend to try load=" + tileKey);
                this.tryLoad(tileKey);
            }
            return defer.promise;
        }
    }
}
