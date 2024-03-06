import { ISingleLoader } from "../../../core/ResourceComponent/SingleLoaderITResource";
import { ImgPathLike } from "../Renderer/HmImgTileRenderer";

export class HmSingleLoader implements ISingleLoader<ImgPathLike> {
  constructor() {
  }
  static getFileName(tileX: number, tileY: number, zoom: number) {
    return tileX + "," + tileY + "," + zoom + ".png";
  }
  isLoaded(tileX: number, tileY: number, zoom: number): boolean {
    // return !!hmFS.statAssetsSync({
    //   path: path.join("map/", HmSingleLoader.getFileName(tileX, tileY, zoom)),
    // });
    return true;
  }
  load(
    tileX: number,
    tileY: number,
    zoom: number
  ): Promise<{
    resource: string;
    tileX: number;
    tileY: number;
    zoom: number;
  }> {
    return new Promise((resolve: any, reject: any) => {
      resolve("map/emptyTile.png");
    });
  }
  getLoaded(tileX: number, tileY: number, zoom: number): string {
    return "map/emptyTile.png";
  }
}
