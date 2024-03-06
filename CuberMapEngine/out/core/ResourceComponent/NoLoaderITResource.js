import { log } from "@zos/utils";
import { CancellableDefer, } from "../Utils/AsyncType";
import { ImgTileResource } from "./ImgTileResource";
/**
 * 一次只能加载一个瓦片资源的 资源获取器
 */
export class SingleLoaderITResource extends ImgTileResource {
    constructor(singleLoader) {
        super();
        this._loading = false;
        this._loader = singleLoader;
        this._requestMap = new Map();
    }
    static getTileKey(tileX, tileY, zoom) {
        return "" + tileX + "," + tileY + "," + zoom;
    }
    cancelRequest(tileKey, cancellingPromise) {
        if (!this._requestMap.has(tileKey))
            return;
        let deferList = this._requestMap.get(tileKey)[1];
        for (let i = 0; i < deferList.length; ++i) {
            const defer = deferList[i];
            if (defer.promise === cancellingPromise) {
                deferList.splice(i, 1);
                if (deferList.length === 0) {
                    this._requestMap.delete(tileKey);
                }
                return;
            }
        }
    }
    tryLoad(tileKey) {
        if (this._loading)
            return;
        // log.warn("try load");
        if (typeof tileKey === "undefined")
            for (let key of this._requestMap.keys()) {
                tileKey = key;
                break;
            }
        if (typeof tileKey === "undefined")
            return;
        // log.warn("load " + tileKey);
        let tileInfo = this._requestMap.get(tileKey)[0];
        this._loading = true;
        this._loader
            .load(tileInfo.tileX, tileInfo.tileY, tileInfo.zoom)
            .then(({ resource, tileX, tileY, zoom }) => {
            let tileKey = SingleLoaderITResource.getTileKey(tileX, tileY, zoom);
            let requestTuple = this._requestMap.get(tileKey);
            if (requestTuple === undefined)
                return;
            for (let defer of requestTuple[1]) {
                defer.resolve && defer.resolve(resource);
            }
            this._requestMap.delete(tileKey);
        })
            .catch(({ tileX, tileY, zoom }) => {
            // TODO catch 传参比较特别
            let tileKey = SingleLoaderITResource.getTileKey(tileX, tileY, zoom);
            let requestTuple = this._requestMap.get(tileKey);
            if (requestTuple === undefined)
                return;
            for (let defer of requestTuple[1]) {
                defer.reject && defer.reject();
            }
            this._requestMap.delete(tileKey);
        })
            .finally(() => {
            this._loading = false;
            this.tryLoad();
        });
        return;
    }
    getResource(tileX, tileY, zoom) {
        log.warn("getResource:" + tileX + "," + tileY + "," + zoom);
        if (this._loader.isLoaded(tileX, tileY, zoom)) {
            // log.warn("isload:" + this._loader.getLoaded(tileX, tileY, zoom));
            return this._loader.getLoaded(tileX, tileY, zoom);
        }
        else {
            let tileKey = SingleLoaderITResource.getTileKey(tileX, tileY, zoom);
            let defer = new CancellableDefer({
                option: { tileKey },
                onCancel: (promise, option) => {
                    this.cancelRequest(option.tileKey, promise);
                },
            });
            if (this._requestMap.has(tileKey))
                this._requestMap.get(tileKey)[1].push(defer);
            else {
                this._requestMap.set(tileKey, [{ tileX, tileY, zoom }, [defer]]);
                // log.warn("pend to try load=" + tileKey);
                this.tryLoad(tileKey);
            }
            return defer.promise;
        }
    }
}
