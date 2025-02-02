import { Coordinate, ILayerComponent, MapEngine } from "../MapEngine";
import {
  StaticResource,
  StaticResourceKey,
} from "../ResourceComponent/StaticResource";

declare type PointData<ResourceType> = {
  position: Coordinate;
  resourceKey: StaticResourceKey;
  key?: string | symbol; // 用于绑定一个PointData和一个PointRenderer，避免在更新PointDataList时重复创建渲染器. 应当在PointDataList中唯一.
  options?: any;
};

declare type PointDataUpdateType<ResourceType> = {
  position?: Coordinate;
  resourceKey?: StaticResourceKey;
  options?: any;
};

export class PointLayer<
  ResourceType,
  RendererType extends PointRenderer<ResourceType>
> implements ILayerComponent
{
  _parent: MapEngine | null = null;

  _resourceId: string;

  _centerCoord: Coordinate | null = null; // WMTS-Z24P

  _zoom: number = 3;

  _tileSize: number = 512;

  _enable: boolean;

  _resourceComponent: StaticResource<ResourceType> | null = null;

  _unknownResource: ResourceType;

  _RendererType: {
    new (
      parent: PointLayer<ResourceType, PointRenderer<ResourceType>>
    ): RendererType;
  };

  _rendererMap: Map<string | symbol, RendererType> = new Map();
  _pointData: PointData<ResourceType>[] | null;
  constructor({
    resourceId,
    points,
    unknownResource,
    RendererType,
    enable = true,
  }: {
    resourceId: string;
    points: PointData<ResourceType>[];
    unknownResource: ResourceType;
    RendererType: {
      new (
        parent: PointLayer<ResourceType, PointRenderer<ResourceType>>
      ): RendererType;
    };
    enable: boolean;
  }) {
    this._resourceId = resourceId;
    this._unknownResource = unknownResource;
    this._RendererType = RendererType;
    this._pointData = points;
    this._enable = enable;
  }

  init(): void {
    if (this._pointData === null) return;
    this._enable && this._updateRenderer();
    // this.setPointDataList(this._pointData, true);
    // this._initialPoints = null;
  }

  setParent(parent: MapEngine): void {
    this._parent = parent;
    this._tileSize = parent._tileSize;
    let resource = parent.getResourceComponent(this._resourceId);
    this._zoom = parent._zoom;
    if (resource instanceof StaticResource) this._resourceComponent = resource;
    else throw TypeError("Resource is not instanceof StaticResource");
  }

  setCenterCoord(x: number, y: number): void {
    this._centerCoord = { x, y };
    this._enable && this._render();
  }

  setZoom(zoom: number): void {
    this._zoom = zoom;
    this._enable && this._render();
  }

  render(): void {
    this._enable && this._render();
  }

  _updateRenderer(): void {
    if (!this._pointData) return;
    let usingKeySet = new Set<symbol | string>();
    // Process point in dataList
    for (let point of this._pointData) {
      let key = point.key;
      if (key) {
        if (usingKeySet.has(key)) {
          throw Error("Two or more Point Data has a Same Key");
        }
        if (this._rendererMap.has(key)) {
          // reusable
          let renderer = this._rendererMap.get(key)!;
          renderer.setData(
            point.position,
            this._resourceComponent?.getResource(point.resourceKey) ??
              this._unknownResource
          );
        } else {
          // unreusable
          this._rendererMap.set(key, this._createSingleRenderer(point));
        }
      } else {
        key = Symbol("Nokey point");
        this._rendererMap.set(key, this._createSingleRenderer(point));
      }
      usingKeySet.add(key);
    }
    // Delete unusable renderer
    for (let key of this._rendererMap.keys()) {
      if (!usingKeySet.has(key)) {
        this._rendererMap.get(key)!.destroy();
        this._rendererMap.delete(key);
      }
    }
  }

  _clearRenderer(): void {
    for (let key in this._rendererMap) {
      this._rendererMap.get(key)!.destroy();
    }
    this._rendererMap.clear();
  }

  _createSingleRenderer(data: PointData<ResourceType>) {
    let renderer = new this._RendererType(this);
    console.log(
      "resCom:" + this._resourceComponent,
      " isnull?=" + (this._resourceComponent === null)
    );

    renderer.setData(
      data.position,
      this._resourceComponent?.getResource(data.resourceKey) ??
        this._unknownResource
    );
    return renderer;
  }

  setEnable(enable: boolean): void {
    if (this._enable !== enable) {
      if (enable) {
        this._updateRenderer();
      } else {
        this._clearRenderer();
      }
      this._enable = enable;
    }
  }

  setPointDataList(
    dataList: PointData<ResourceType>[],
    initial?: boolean
  ): void {
    this._pointData = dataList;

    if (this._enable) {
      this._updateRenderer();
      if (!initial) this._render();
    }
  }

  addPoint(data: PointData<ResourceType>): void {
    let key = data.key;
    if (key) {
      if (this._rendererMap.has(key))
        throw Error("Two or more Point Data has a Same Key");
    } else {
      key = Symbol("Nokey point");
    }
    this._pointData?.push(data);
    if (this._enable) {
      let renderer = this._createSingleRenderer(data);
      this._rendererMap.set(key, renderer);
      this._render(key);
    }
  }

  removePoint(key: string | symbol): boolean {
    if (this._pointData === null) return false;
    let index = this._getPointIndexFromKey(key);
    if (index === null) return false;
    this._pointData.splice(index, 1);
    if (this._rendererMap.has(key)) {
      this._rendererMap.get(key)!.destroy();
      this._rendererMap.delete(key);
    }
    return true;
  }

  setPoint(
    key: string | symbol,
    data: PointDataUpdateType<ResourceType>
  ): boolean {
    if (this._pointData === null) return false;
    let index = this._getPointIndexFromKey(key);
    if (index === null) return false;
    let pointData = this._pointData[index];

    let renderer = this._rendererMap.get(key);
    if (data.position && data.position !== pointData.position) {
      pointData.position = data.position;
      renderer?.setPosition(data.position);
    }
    if (data.resourceKey && data.resourceKey !== pointData.resourceKey) {
      pointData.resourceKey = data.resourceKey;
      renderer?.setResource(
        this._resourceComponent?.getResource(data.resourceKey) ??
          this._unknownResource
      );
    }
    if (data.options !== undefined && data.options !== pointData.options) {
      pointData.options = data.options;
      renderer?.setOptions(data.options);
    }
    return true;
  }

  _getPointIndexFromKey(key: string | symbol): number | null {
    if (this._pointData === null) return null;
    for (let index = 0; index < this._pointData.length; ++index) {
      if (this._pointData[index].key === key) {
        return index;
      }
    }
    return null;
  }

  _render(targetKey?: string | symbol): void {
    if (this._centerCoord === null) return;
    if (targetKey) {
      let renderer = this._rendererMap.get(targetKey);
      if (renderer === undefined) return;
      renderer.render(this._centerCoord, this._zoom);
    } else {
      for (let key of this._rendererMap.keys()) {
        let renderer = this._rendererMap.get(key)!;
        renderer.render(this._centerCoord, this._zoom);
      }
    }
  }
}

export abstract class PointRenderer<ResourceType> {
  _position: Coordinate | null = null;
  _zoom: number | null = null;
  _centerCoord: Coordinate | null = null;
  constructor(
    protected _parent: PointLayer<ResourceType, PointRenderer<ResourceType>>
  ) {}
  setData(position: Coordinate, resource: ResourceType, options?: any): void {
    this.setPosition(position);
    this.setResource(resource);
    this.setOptions(options);
  }
  setPosition(position: Coordinate): void {
    if (this._position?.x !== position.x || this._position.y !== position.y) {
      this._position = { ...position };
      this.render();
    }
  }
  render(centerCoord?: Coordinate, zoom?: number): void {
    if (centerCoord === undefined) {
      if (this._centerCoord === null) return;
      centerCoord = this._centerCoord;
    }
    if (zoom === undefined) {
      if (this._zoom === null) return;
      zoom = this._zoom;
    }
    if (centerCoord === null || zoom === null) return;
    if (
      this._centerCoord === null ||
      this._centerCoord.x !== centerCoord.x ||
      this._centerCoord.y !== centerCoord.y ||
      this._zoom === null ||
      this._zoom !== zoom
    ) {
      if (this._position === null) return;
      this._centerCoord = { ...centerCoord };
      this._zoom = zoom;
      // Calculate Screen Position
      let tileSize = this._parent._tileSize;
      let result: Coordinate = {
        // TODO optimize the calculate method
        x:
          (((this._position.x - centerCoord.x) >> (24 - zoom)) * tileSize) /
          256,
        y:
          (((this._position.y - centerCoord.y) >> (24 - zoom)) * tileSize) /
          256,
      };
      this.setResultCoordinate(result);
    }
  }
  abstract setResource(resource: ResourceType): void;
  abstract setOptions(options: any): void;
  abstract setResultCoordinate(result: Coordinate): void;
  abstract destroy(): void;
}
