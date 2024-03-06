import { log } from "@zos/utils";
import {
  CancellableDefer,
  CancellablePromise,
  CancellablePromiseArgType,
  Defer,
} from "../Utils/AsyncType";
import { GisLib } from "../Utils/GisLib";
import { ImgTileResource } from "./ImgTileResource";

export interface INoLoader<ResourceType> {
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
 * 一次只能加载一个瓦片资源的 资源获取器
 */
export class SingleLoaderITResource<
  ResourceType
> extends ImgTileResource<ResourceType> {
  _loader: INoLoader<ResourceType>;

  _loading: boolean = false;

  _requestMap: Map<
    TileKeyType,
    [GisLib.TileIndexInfo, CancellableDefer<ResourceType>[]]
  >;

  constructor(singleLoader: INoLoader<ResourceType>) {
    super();
    this._loader = singleLoader;
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
          this._requestMap.delete(tileKey);
        }
        return;
      }
    }
  }

  tryLoad(tileKey?: string) {
    if (this._loading) return;
    // log.warn("try load");
    if (typeof tileKey === "undefined")
      for (let key of this._requestMap.keys()) {
        tileKey = key;
        break;
      }
    if (typeof tileKey === "undefined") return;
    // log.warn("load " + tileKey);
    let tileInfo = this._requestMap.get(tileKey)![0];
    this._loading = true;
    this._loader
      .load(tileInfo.tileX, tileInfo.tileY, tileInfo.zoom)
      .then(({ resource, tileX, tileY, zoom }) => {
        let tileKey = SingleLoaderITResource.getTileKey(tileX, tileY, zoom);
        let requestTuple = this._requestMap.get(tileKey);
        if (requestTuple === undefined) return;
        for (let defer of requestTuple[1]) {
          defer.resolve && defer.resolve(resource);
        }
        this._requestMap.delete(tileKey);
      })
      .catch(({ tileX, tileY, zoom }) => {
        // TODO catch 传参比较特别
        let tileKey = SingleLoaderITResource.getTileKey(tileX, tileY, zoom);
        let requestTuple = this._requestMap.get(tileKey);
        if (requestTuple === undefined) return;
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

  getResource(
    tileX: number,
    tileY: number,
    zoom: number
  ): ResourceType | CancellablePromise<ResourceType, unknown> | null {
    log.warn("getResource:" + tileX + "," + tileY + "," + zoom);
    if (this._loader.isLoaded(tileX, tileY, zoom)) {
      // log.warn("isload:" + this._loader.getLoaded(tileX, tileY, zoom));
      return this._loader.getLoaded(tileX, tileY, zoom);
    } else {
      let tileKey = SingleLoaderITResource.getTileKey(tileX, tileY, zoom);

      let defer = new CancellableDefer<ResourceType>({
        option: { tileKey },
        onCancel: (promise, option) => {
          this.cancelRequest(option!.tileKey, promise);
        },
      });

      if (this._requestMap.has(tileKey))
        this._requestMap.get(tileKey)![1].push(defer);
      else {
        this._requestMap.set(tileKey, [{ tileX, tileY, zoom }, [defer]]);
        // log.warn("pend to try load=" + tileKey);
        this.tryLoad(tileKey);
      }
      return defer.promise;
    }
  }
}
