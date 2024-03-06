import { log } from "@zos/utils";
import {
  CancellableDefer,
  CancellablePromise,
  CancellablePromiseArgType,
  Defer,
} from "../Utils/AsyncType";
import { GisLib } from "../Utils/GisLib";
import { ImgTileResource } from "./ImgTileResource";

export interface IMultiLoader<ResourceType> {
  isLoaded(tileX: number, tileY: number, zoom: number): boolean;
  load(
    tileX: number,
    tileY: number,
    zoom: number
  ): Promise<{
    resource: ResourceType;
    tileX: number;
    tileY: number;
    zoom: number;
  }>;
  getLoaded(tileX: number, tileY: number, zoom: number): ResourceType;
}
type TileKeyType = string;

/**
 * 一次加载多个瓦片资源的 资源获取器
 */
export class MultiLoaderITResource<
  ResourceType
> extends ImgTileResource<ResourceType> {
  _loader: IMultiLoader<ResourceType>;

  _loading: number = 0;

  _requestMap: Map<
    TileKeyType,
    [GisLib.TileIndexInfo, CancellableDefer<ResourceType>[], loading: boolean, finished: boolean]
  >;

  _maxThreads: number = 5;

  _timeout: number = 5000;

  constructor(
    multiLoader: IMultiLoader<ResourceType>,
    option?: { maxThreads: number }
  ) {
    super();
    option &&
      typeof option.maxThreads === "number" &&
      (this._maxThreads = option.maxThreads);
    this._loader = multiLoader;
    this._requestMap = new Map();
  }

  static getTileKey(tileX: number, tileY: number, zoom: number): TileKeyType {
    return "" + tileX + "," + tileY + "," + zoom;
  }

  cancelRequest(
    tileKey: string,
    cancellingPromise: CancellablePromise<ResourceType, unknown>
  ) {
    if (!this._requestMap.has(tileKey)) return;
    let deferList = this._requestMap.get(tileKey)![1];
    for (let i = 0; i < deferList!.length; ++i) {
      const defer = deferList![i];
      if (defer.promise === cancellingPromise) {
        deferList!.splice(i, 1);
        if (deferList!.length === 0) {
          // this._requestMap.get(tileKey)?.[3] = true;
          if (this._requestMap.get(tileKey)?.[2]) --this._loading;
          this._requestMap.delete(tileKey);
        }
        return;
      }
    }
  }

  tryLoad(tileKey?: string) {
    console.log("now thread:" + this._loading);

    if (this._loading >= this._maxThreads) return;
    // log.warn("try load");
    if (typeof tileKey === "undefined")
      for (let key of this._requestMap.keys()) {
        if (!this._requestMap.get(key)![2]) {
          tileKey = key;
          break;
        }
      }
    if (typeof tileKey === "undefined") return;
    // log.warn("load " + tileKey);
    let reqTuple = this._requestMap.get(tileKey)!;
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
        if (requestTuple === undefined) return;
        for (let defer of requestTuple[1]) {
          defer.resolve && defer.resolve(resource);
        }
      })
      .catch(({ tileX, tileY, zoom }) => {
        console.log("loader catch回調");
        // TODO catch 传参比较特别
        let tileKey = MultiLoaderITResource.getTileKey(tileX, tileY, zoom);
        let requestTuple = this._requestMap.get(tileKey);
        if (requestTuple === undefined) return;
        for (let defer of requestTuple[1]) {
          defer.reject && defer.reject();
        }
      })
      .finally(() => {
        console.log("loader finally");
        let reqTuple = this._requestMap.get(tileKey!)!
        reqTuple[3] = true
        this._requestMap.delete(tileKey!)
        if (reqTuple[2]) --this._loading;
        this.tryLoad();
      });
    this.tryLoad();
  }

  getResource(
    tileX: number,
    tileY: number,
    zoom: number
  ): ResourceType | CancellablePromise<ResourceType, unknown> | null {
    // log.warn("getResource:" + tileX + "," + tileY + "," + zoom);
    if (this._loader.isLoaded(tileX, tileY, zoom)) {
      // log.warn("isload:" + this._loader.getLoaded(tileX, tileY, zoom));
      return this._loader.getLoaded(tileX, tileY, zoom);
    } else {
      let tileKey = MultiLoaderITResource.getTileKey(tileX, tileY, zoom);

      let defer = new CancellableDefer<ResourceType>({
        option: { tileKey },
        onCancel: (promise, option) => {
          this.cancelRequest(option!.tileKey, promise);
        },
      });

      if (this._requestMap.has(tileKey))
        this._requestMap.get(tileKey)![1].push(defer);
      else {
        this._requestMap.set(tileKey, [{ tileX, tileY, zoom }, [defer], false, false]);
        // log.warn("pend to try load=" + tileKey);
        this.tryLoad(tileKey);
      }
      return defer.promise;
    }
  }
}
