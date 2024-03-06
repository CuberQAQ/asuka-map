import { log } from "@zos/utils";
import { CancellablePromise } from "./Utils/AsyncType";

export declare type Coordinate = {
  x: number;
  y: number;
};
export declare type Size = {
  width: number;
  height: number;
};

export class MapEngine {
  _layerList: ILayerComponent[];

  _resourceMap: { [id: string]: IResourceComponent<any> };

  /**
   * 采用边长为2^32的正方形表示Web墨卡托投影下的坐标，相当于WMTS在zoom等级24时位于整个地球上的像素坐标。在此简称“WMTS-Z24P坐标”(非官方称呼)
   */
  _centerCoord: Coordinate;

  _zoom: number;

  _tileSize: number;
  constructor({
    layers,
    resouces,
    center,
    zoom = 3,
    tileSize = 256,
  }: {
    layers: ILayerComponent[];
    resouces: { [id: string]: IResourceComponent<unknown> };
    center: Coordinate;
    zoom: number;
    tileSize: number;
  }) {
    this._layerList = [...layers];
    this._resourceMap = { ...resouces };
    this._centerCoord = { ...center };
    this._zoom = zoom;
    this._tileSize = tileSize;

    this._layerList.forEach((layer) => layer.setParent(this));
  }

  init() {
    for (let layer of this._layerList) {
      layer.init();
      this.setCenterCoord(this._centerCoord.x, this._centerCoord.y, true);
      this.setZoom(this._zoom, true);
    }
  }

  render() {
    for (let layer of this._layerList) {
      layer._enable && layer.render();
    }
  }

  getResourceComponent(id: string): IResourceComponent<unknown> | undefined {
    return this._resourceMap[id];
  }

  setCenterCoord(x: number, y: number, initial?: boolean) {
    if (y < 0) y = 0;
    if (y > 4_294_967_296) y = 4_294_967_296;
    // if (x < 0) x += 4_294_967_296;
    // if (x > 4_294_967_296) x -= 4_294_967_296;
    this._centerCoord = { x, y };
    for (let layer of this._layerList) {
      layer.setCenterCoord(x, y, initial);
    }
  }

  setZoom(zoom: number, initial?: boolean) {
    if (zoom < 2) zoom = 2;
    if (zoom > 24) zoom = 24;
    this._zoom = zoom;
    for (let layer of this._layerList) {
      layer.setZoom(zoom, initial);
    }
  }

  setRotation(degree: number) {
    // this._zoom = zoom
    // for (let layer of this._layerList) {
    //   layer.se(zoom);
    // }
  }
}

export interface ILayerComponent {
  _parent: MapEngine | null;

  _enable: boolean;

  setParent(parent: MapEngine): void;

  setEnable(enable: boolean): void;

  init(): void;

  render(): void;

  setZoom(zoom: number, initial?: boolean): void;

  setCenterCoord(x: number, y: number, initial?: boolean): void;
}

export interface IResourceComponent<ResourceType> {
  _parent: MapEngine | null;

  setParent(parent: MapEngine): void;

  getResource(
    ...args: any
  ): ResourceType | CancellablePromise<ResourceType> | null;
}
