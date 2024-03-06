import _TransferFile from "@zos/ble/TransferFile";
const TransferFile = _TransferFile;
import path from "@cuberqaq/path-polyfill";
import * as hmFS from "@zos/fs";
import { log } from "@zos/utils";
import { Defer } from "../../../core/Utils/AsyncType";
export class HmTestSingleLoader {
    constructor(_requestFunc) {
        this._requestFunc = _requestFunc;
        this._defer = null;
        this._loadingFileName = null;
        this._loadingTile = null;
        this._transferFile = new TransferFile();
        this._inbox = this._transferFile.getInbox();
        this._outbox = this._transferFile.getOutbox();
        // this._inbox.on("NEWFILE", () =>{
        //   console.log("！！！！！！new file");
        // })
        // this._inbox.on("FILE", () => {
        //   console.log("！！！！！！file");
        //   let fileObj = this._inbox.getNextFile();
        //   console.log(`！！！！！！！！！！！！！！get file, filename=${fileObj.fileName} loading=${this._loadingFileName}`);
        //   if (fileObj.fileName === this._loadingFileName)
        //     this._defer?.resolve?.({
        //       resource: this.getLoaded(
        //         this._loadingTile!.tileX,
        //         this._loadingTile!.tileY,
        //         this._loadingTile!.zoom
        //       ),
        //       tileX: this._loadingTile!.tileX,
        //       tileY: this._loadingTile!.tileY,
        //       zoom: this._loadingTile!.zoom,
        //     });
        //   this._defer = null;
        // });
    }
    static getFileName(tileX, tileY, zoom) {
        return "tile" + tileX + "x" + tileY + "y" + zoom + "z.png";
    }
    isLoaded(tileX, tileY, zoom) {
        return !!hmFS.statAssetsSync({
            path: path.join("map/", HmTestSingleLoader.getFileName(tileX, tileY, zoom)),
        });
    }
    load(tileX, tileY, zoom) {
        // log.warn("hm load tile:" + tileX + "," + tileY + "," + zoom);
        // hmFS.writeFileSync({
        //   path: "maploader",
        //   data: JSON.stringify({ tileX, tileY, zoom }),
        //   options: { encoding: "utf8" },
        // });
        this._loadingTile = { tileX, tileY, zoom };
        this._loadingFileName = HmTestSingleLoader.getFileName(tileX, tileY, zoom);
        // log.warn("hm load file step1")
        // let task = this._outbox.enqueueFile("data://maploader");
        let task = this._requestFunc({ tileX, tileY, zoom });
        // log.warn("hm load file step2")
        this._defer = new Defer();
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
            var _a, _b;
            (_b = (_a = this._defer) === null || _a === void 0 ? void 0 : _a.resolve) === null || _b === void 0 ? void 0 : _b.call(_a, {
                resource: this.getLoaded(this._loadingTile.tileX, this._loadingTile.tileY, this._loadingTile.zoom),
                tileX: this._loadingTile.tileX,
                tileY: this._loadingTile.tileY,
                zoom: this._loadingTile.zoom,
            });
            this._defer = null;
        })
            .catch((err) => {
            var _a, _b;
            log.error("Error when get " + HmTestSingleLoader.getFileName(tileX, tileY, zoom));
            (_b = (_a = this._defer) === null || _a === void 0 ? void 0 : _a.reject) === null || _b === void 0 ? void 0 : _b.call(_a, "unknown reason");
        });
        return this._defer.promise;
    }
    getLoaded(tileX, tileY, zoom) {
        return path.join("map/", HmTestSingleLoader.getFileName(tileX, tileY, zoom));
    }
}
