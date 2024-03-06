import { IResourceComponent, MapEngine } from "../MapEngine";
import { CancellablePromise } from "../Utils/AsyncType";

export abstract class ImgTileResource<ResourceType>
  implements IResourceComponent<ResourceType>
{
  _parent: MapEngine | null = null;

  setParent(parent: MapEngine): void {
    this._parent = parent;
  }

  abstract getResource(
    tileX: number,
    tileY: number,
    zoom: number,
  ): ResourceType | CancellablePromise<ResourceType> | null;
}

