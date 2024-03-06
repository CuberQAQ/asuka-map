// import {
//   type ChangeEvent,
//   type Inbox,
//   type Outbox,
//   type TransferFile as TransferFileType,
// } from "@cuberqaq/transfer-file";
// import _TransferFile from "@zos/ble/TransferFile";
import path from "@cuberqaq/path-polyfill";
import * as hmFS from "@zos/fs";
import { log } from "@zos/utils";
import { Defer } from "../../../core/Utils/AsyncType";
export class HmMultiLoader {
    // _transferFile: TransferFileType;
    // _inbox: Inbox;
    // _outbox: Outbox;
    // _loadingFileName: string | null = null;
    // _loadingTile: { tileX: number; tileY: number; zoom: number } | null = null;
    constructor(_requestFunc) {
        this._requestFunc = _requestFunc;
    }
    static getFileName(tileX, tileY, zoom) {
        return "tile" + tileX + "x" + tileY + "y" + zoom + "z.png";
    }
    isLoaded(tileX, tileY, zoom) {
        return !!hmFS.statAssetsSync({
            path: path.join("map/", HmMultiLoader.getFileName(tileX, tileY, zoom)),
        });
    }
    load(tileX, tileY, zoom) {
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
        let defer = new Defer();
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
            var _a;
            (_a = defer === null || defer === void 0 ? void 0 : defer.resolve) === null || _a === void 0 ? void 0 : _a.call(defer, {
                resource: this.getLoaded(loadingTile.tileX, loadingTile.tileY, loadingTile.zoom),
                tileX: loadingTile.tileX,
                tileY: loadingTile.tileY,
                zoom: loadingTile.zoom,
            });
            defer = null;
        })
            .catch((err) => {
            var _a;
            log.error("Error when get " + HmMultiLoader.getFileName(tileX, tileY, zoom));
            (_a = defer === null || defer === void 0 ? void 0 : defer.reject) === null || _a === void 0 ? void 0 : _a.call(defer, "unknown reason");
        });
        return defer.promise;
    }
    getLoaded(tileX, tileY, zoom) {
        return path.join("map/", HmMultiLoader.getFileName(tileX, tileY, zoom));
    }
}
