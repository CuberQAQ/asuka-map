import { IResourceComponent, MapEngine } from "../MapEngine";

export type StaticResourceKey = string | symbol;

export class StaticResource<ResourceType>
  implements IResourceComponent<ResourceType>
{
  _parent: MapEngine | null = null;

  constructor(
    public _resourceRecord: Record<string | number | symbol, ResourceType>
  ) {}

  setParent(parent: MapEngine): void {
    this._parent = parent;
  }

  getResource(key: StaticResourceKey): ResourceType | null {
    if (this._resourceRecord[key] !== undefined)
      return this._resourceRecord[key];
    return null;
  }
}
