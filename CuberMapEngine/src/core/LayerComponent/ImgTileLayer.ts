import { Coordinate, ILayerComponent, MapEngine, Size } from "../MapEngine";
import { ImgTileResource } from "../ResourceComponent/ImgTileResource";
import { CancellablePromise } from "../Utils/AsyncType";
import { DataType } from "../Utils/DataType";
import { GisLib } from "../Utils/GisLib";
import { log, log as logger } from "@zos/utils";

const pow2 = [
  1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 16384, 32768, 65536,
  131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216,
  33554432, 67108864, 134217728, 268435456, 536870912, 1013741824, 2147483648,
  4294967296,
];

function abs(a: number) {
  return a < 0 ? -a : a; 
}

export class ImgTileLayer<
  ResourceType,
  RendererType extends ImgTileRenderer<ResourceType>
> implements ILayerComponent
{
  _parent: MapEngine | null = null;

  _enable: boolean;

  _resourceComponent: ImgTileResource<ResourceType> | null = null;

  _emptyResource:
    | ResourceType
    | ((tileInfo: GisLib.TileIndexInfo) => ResourceType);

  _resourceId: string;

  _RendererType: {
    new (
      parent: ImgTileLayer<ResourceType, ImgTileRenderer<ResourceType>>,
      tileSize: number
    ): RendererType;
  };

  _viewableSize: Size;

  _centerCoord: Coordinate | null = null; // WMTS-Z24P

  _zoom: number = 3;

  _tileSize: number = 512; // TODO

  _loadQuene: [xi: number, yi: number, dxi: number, dyi: number][];

  _rendererMatrix: DataType.TileReuseMatrix<RendererType> | null = null;

  constructor({
    resourceId,
    emptyResource,
    viewableSize = { width: 3, height: 3 },
    RendererType,
    enable = true,
  }: {
    resourceId: string;
    emptyResource:
      | ResourceType
      | ((tileInfo: GisLib.TileIndexInfo) => ResourceType);
    viewableSize?: Size;
    RendererType: {
      new (
        parent: ImgTileLayer<ResourceType, ImgTileRenderer<ResourceType>>,
        tileSize: number
      ): RendererType;
    };
    enable: boolean;
  }) {
    this._resourceId = resourceId;
    this._emptyResource = emptyResource;
    this._RendererType = RendererType;
    this._viewableSize = viewableSize;
    this._enable = enable;

    this._loadQuene = Array(
      this._viewableSize.width * this._viewableSize.height
    );
    let centerX = ~~(this._viewableSize.width / 2);
    let centerY = ~~(this._viewableSize.height / 2);
    let maxRadius =
      this._viewableSize.width >= this._viewableSize.height
        ? ~~(this._viewableSize.width / 2) + 1
        : ~~(this._viewableSize.height / 2) + 1;
    let p = 0,
      colorMap: boolean[] = Array(
        this._viewableSize.height * this._viewableSize.width
      ).fill(false);
    for (let r = 1; r <= maxRadius; ++r) {
      for (let xi = centerX - r + 1; xi < centerX + r; ++xi)
        for (let yi = centerY - r + 1; yi < centerY + r; ++yi) {
          if (
            xi >= 0 &&
            xi < this._viewableSize.width &&
            yi >= 0 &&
            yi < this._viewableSize.height &&
            !colorMap[yi * this._viewableSize.width + xi]
          ) {
            this._loadQuene[p++] = [xi, yi, xi - centerX, yi - centerY];
            // console.log("now loadq last="+JSON.stringify({a:this._loadQuene[p-1]}));

            colorMap[yi * this._viewableSize.width + xi] = true;
          }
        }
    }
    this._loadQuene.sort(
      (a, b) => abs(a[2]) + abs(a[3]) - (abs(b[2]) + abs(b[3]))
    );
    // let str = "loadQuene=";
    // for (
    //   let i = 0;
    //   i < this._viewableSize.height * this._viewableSize.width;
    //   ++i
    // ) {
    //   str += `${JSON.stringify(this._loadQuene[i])} `;
    // }
    // log.warn(str);
  }

  setParent(parent: MapEngine): void {
    this._parent = parent;
    this._tileSize = parent._tileSize;
    let resource = parent.getResourceComponent(this._resourceId);
    this._zoom = parent._zoom;
    if (resource instanceof ImgTileResource) this._resourceComponent = resource;
    else throw TypeError("Resource is not instanceof ImgTileResource");
  }

  setEnable(enable: boolean): void {
    if (this._enable !== enable) {
      if (enable) {
        this._initRenderer();
      } else {
        this._clearRenderer();
      }
      this._enable = enable;
    }
  }

  init(): void {
    this._enable && this._initRenderer();
  }

  _initRenderer(): void {
    if (this._rendererMatrix) throw Error("Already have a renderer matrix!");
    let rendererCount = this._viewableSize.width * this._viewableSize.height,
      rendererList = Array<RendererType>(rendererCount);
    for (let i = 0; i < rendererCount; ++i) {
      rendererList[i] = new this._RendererType(this, this._tileSize);
    }
    this._rendererMatrix = new DataType.TileReuseMatrix(
      this._viewableSize.width,
      this._viewableSize.height,
      rendererList
    );
  }
  _clearRenderer(): void {
    if (!this._rendererMatrix) return;
    for (let renderer of this._rendererMatrix._dataArray) {
      renderer.destroy();
    }
    this._rendererMatrix = null;
  }

  setZoom(zoom: number, initial?: boolean): void {
    if (~~zoom != this._zoom) {
      this._zoom = ~~zoom;
      this._rendererMatrix?.fillIfReuse(false);
      if (!initial) this._render();
    }
  }

  /**
   * WMTS-Z24P
   * @param x
   * @param y
   */
  setCenterCoord(x: number, y: number, initial?: boolean): void {
    this._centerCoord = { x, y };
    let centerTileInfo = GisLib.getExtendedTileIndex(
      x,
      y,
      this._zoom,
      this._tileSize
    );
    this._rendererMatrix?.setCenter(centerTileInfo.tileX, centerTileInfo.tileY);
    if (!initial) this._render(centerTileInfo);
  }

  render(): void {
    if (this._centerCoord === null) return;
    let centerTileInfo = GisLib.getExtendedTileIndex(
      this._centerCoord.x,
      this._centerCoord.y,
      this._zoom,
      this._tileSize
    );
    this._rendererMatrix?.setCenter(centerTileInfo.tileX, centerTileInfo.tileY);
    this._render(centerTileInfo);
  }

  _render(
    centerTileInfo: GisLib.ExtendedTileInfo | null = this._centerCoord != null
      ? GisLib.getExtendedTileIndex(
          this._centerCoord.x,
          this._centerCoord.y,
          this._zoom,
          this._tileSize
        )
      : null
  ) {
    if(!this._enable) return;
    if (centerTileInfo === null) throw TypeError("centerTileInfo is null");
    let centerTileCoord: Coordinate = {
      x: this._tileSize / 2 - centerTileInfo.pixelX,
      y: this._tileSize / 2 - centerTileInfo.pixelY,
    };
    //mlgbd
    // console.log("！！centerx="+centerTileCoord.x+" mlgbd tilesize="+this._tileSize+" centerti.x="+centerTileCoord.x);

    // for (
    //   let xi = 0, dxi = xi - ~~(this._viewableSize.width / 2);
    //   xi < this._viewableSize.width;
    //   ++xi, dxi = xi - ~~(this._viewableSize.width / 2)
    // )
    //   for (
    //     let yi = 0, dyi = yi - ~~(this._viewableSize.height / 2);
    //     yi < this._viewableSize.width;
    //     ++yi, dyi = yi - ~~(this._viewableSize.height / 2)
    //   )
    let len = this._viewableSize.height * this._viewableSize.width;
    for (let i = 0; i < len; ++i) {
      let [xi, yi, dxi, dyi] = this._loadQuene[i];
      let resource:
        | ResourceType
        | CancellablePromise<ResourceType, unknown>
        | null = null;
      if (!this._rendererMatrix?.getIfReuse(xi, yi)) {
        resource =
          this._resourceComponent?.getResource(
            centerTileInfo.tileX + dxi,
            centerTileInfo.tileY + dyi,
            this._zoom
          ) ?? null;
        this._rendererMatrix?.dealed(xi, yi);
      }
      let emptyRes =
        resource instanceof CancellablePromise
          ? this._emptyResource instanceof Function // TODO when ResourceType is Function, may disturb
            ? this._emptyResource({
                tileX: centerTileInfo.tileX + dxi,
                tileY: centerTileInfo.tileY + dyi,
                zoom: centerTileInfo.zoom,
              })
            : this._emptyResource
          : undefined;
      this._rendererMatrix?.get(xi, yi).setTile(
        {
          x: centerTileCoord.x + dxi * this._tileSize,
          y: centerTileCoord.y + dyi * this._tileSize,
        },
        0, // TODO
        resource,
        emptyRes
      );
    }
  }
}

export abstract class ImgTileRenderer<ResourceType> {
  _parent: ImgTileLayer<ResourceType, ImgTileRenderer<ResourceType>>;
  _tileSize: number;
  constructor(
    parent: ImgTileLayer<ResourceType, ImgTileRenderer<ResourceType>>,
    tileSize: number
  ) {
    this._parent = parent;
    this._tileSize = tileSize;
  }

  abstract setTile(
    centerCoord: Coordinate,
    rotation: number,
    resource: ResourceType | CancellablePromise<ResourceType> | null,
    emptyResource?: ResourceType // Must be defined when resource is Promise
  ): void;

  abstract destroy(): void;
}

export interface IImgTileWidget<ResourceType> {
  setResource(resource: ResourceType): void;
  setCenterCoord(centerCoord: Coordinate): void;
  setRotation(rotation: number): void;
  destroy(): void;
}

export abstract class WidgetImgTileRenderer<
  ResourceType
> extends ImgTileRenderer<ResourceType> {
  _centerCoord: Coordinate | null = null;
  _rotation: number = 0;
  _unresolvedPromise: CancellablePromise<ResourceType, unknown> | null = null;
  _widget: IImgTileWidget<ResourceType> | null;

  constructor(
    parent: ImgTileLayer<ResourceType, ImgTileRenderer<ResourceType>>,
    tileSize: number
  ) {
    super(parent, tileSize);
    this._widget = this.createWidget();
  }

  abstract createWidget(): IImgTileWidget<ResourceType>;

  setTile(
    centerCoord: Readonly<Coordinate>,
    rotation: number,
    resource: ResourceType | CancellablePromise<ResourceType, unknown> | null,
    emptyResource?: ResourceType
  ): void {
    if (
      !this._centerCoord ||
      centerCoord.x != this._centerCoord.x ||
      centerCoord.y != this._centerCoord.y
    ) {
      this._centerCoord = centerCoord;
      this._widget?.setCenterCoord(this._centerCoord);
    }
    if (this._rotation != rotation) {
      this._rotation = rotation;
      this._widget?.setRotation(rotation);
    }
    if (resource !== null) {
      if (this._unresolvedPromise) {
        this._unresolvedPromise.cancel(); // TODO test
        this._unresolvedPromise = null;
      }
      if (resource instanceof CancellablePromise) {
        this._unresolvedPromise = resource;
        resource
          .then((resource) => {
            this._widget?.setResource(resource);
          })
          .finally(() => {
            this._unresolvedPromise = null;
          });
        if (emptyResource === undefined) {
          throw TypeError(
            "When resource is a promise, emptyResource shouldn't be undefined"
          );
        }
        this._widget?.setResource(emptyResource);
      } else {
        this._widget?.setResource(resource);
      }
    }
  }

  destroy(): void {
    this._widget?.destroy();
    this._widget = null;
    this._unresolvedPromise?.cancel();
  }
}
