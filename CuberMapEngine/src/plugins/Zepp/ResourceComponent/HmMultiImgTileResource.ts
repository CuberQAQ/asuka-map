// import {
//   type ChangeEvent,
//   type Inbox,
//   type Outbox,
//   type TransferFile as TransferFileType,
// } from "@cuberqaq/transfer-file";
// import _TransferFile from "@zos/ble/TransferFile";


import { IMultiLoader } from "../../../core/ResourceComponent/MultiLoaderITResource";
import { ImgPathLike } from "../Renderer/HmImgTileRenderer";
import path from "@cuberqaq/path-polyfill";
import * as hmFS from "@zos/fs";
import { log } from "@zos/utils";
import { Defer } from "../../../core/Utils/AsyncType";
import { Coordinate } from "../../../core/MapEngine";

declare type RequestFuncType = (json: {
  tileX: number;
  tileY: number;
  zoom: number;
}) => Promise<void>;
export class HmMultiLoader implements IMultiLoader<ImgPathLike> {
  // _transferFile: TransferFileType;
  // _inbox: Inbox;
  // _outbox: Outbox;
  // _loadingFileName: string | null = null;
  // _loadingTile: { tileX: number; tileY: number; zoom: number } | null = null;
  constructor(protected _requestFunc: RequestFuncType) {
    
  }
  static getFileName(tileX: number, tileY: number, zoom: number) {
    return "tile" + tileX + "x" + tileY + "y" + zoom + "z.png";
  }
  isLoaded(tileX: number, tileY: number, zoom: number): boolean {
    return !!hmFS.statAssetsSync({
      path: path.join("map/", HmMultiLoader.getFileName(tileX, tileY, zoom)),
    });
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
    // log.warn("hm load tile:" + tileX + "," + tileY + "," + zoom);

    // hmFS.writeFileSync({
    //   path: "maploader",
    //   data: JSON.stringify({ tileX, tileY, zoom }),
    //   options: { encoding: "utf8" },
    // });
    let loadingTile = { tileX, tileY, zoom };
    let loadingFileName = HmMultiLoader.getFileName(tileX, tileY, zoom);
    // log.warn("hm load file step1")
    // let task = this._outbox.enqueueFile("data://maploader");
    let task = this._requestFunc({ tileX, tileY, zoom });
    // log.warn("hm load file step2")
    let defer: Defer<{
      resource: ImgPathLike;
      tileX: number;
      tileY: number;
      zoom: number;
    }> | null = new Defer();
    // task.on("change", (event: ChangeEvent) => {
    //   if (event.data.readyState === "error") {
    //     log.error(
    //       "Error when get " + HmTestSingleLoader.getFileName(tileX, tileY, zoom)
    //     );
    //     this._defer?.reject?.("unknown reason");
    //   }
    // });
    task
      .then(() => {
        // TODO if (fileObj.fileName === this._loadingFileName)
        // log.log(
        //   "Success load img tile" +
        //     HmTestSingleLoader.getFileName(tileX, tileY, zoom)
        // );

        defer?.resolve?.({
          resource: this.getLoaded(
            loadingTile!.tileX,
            loadingTile!.tileY,
            loadingTile!.zoom
          ),
          tileX: loadingTile!.tileX,
          tileY: loadingTile!.tileY,
          zoom: loadingTile!.zoom,
        });
        defer = null;
      })
      .catch((err) => {
        log.error(
          "Error when get " + HmMultiLoader.getFileName(tileX, tileY, zoom)
        );
        defer?.reject?.("unknown reason");
      });
    return defer.promise;
  }
  getLoaded(tileX: number, tileY: number, zoom: number): string {
    return path.join("map/", HmMultiLoader.getFileName(tileX, tileY, zoom));
  }
}
