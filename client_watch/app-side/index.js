// import { transferFile, _parseHmPath } from "@cuberqaq/transfer-file-side";
// globalThis.transferFile = transferFile
// import * as cbFS from "@cuberqaq/fs-side";
// import { network } from "@cuberqaq/network-side";
// import { image as image2 } from "@cuberqaq/image-side";
import { BaseSideService } from "@zeppos/zml/base-side";
function getFileName(tileX, tileY, zoom) {
  return "tile" + tileX + "x" + tileY + "y" + zoom + "z.png";
}
var inbox,
  outbox = transferFile.getOutbox();
var lock = false;
var transferingCount = 0;
var fileObjMap = new Map();
var nextKey = 10001;
AppSideService(
  BaseSideService({
    onRequest(req, res) {
      const _console = {
        log: (e) => {
          // console.log("debug:", e);
          this.call({
            method: "log",
            params: { utc: req.params.utc, info: e },
          });
        },
        warn: (e) => {
          // console.warn("debug:", e);
          this.call({
            method: "warn",
            params: { utc: req.params.utc, info: e },
          });
        },
        error: (e) => {
          // console.error("debug:", e);
          this.call({
            method: "error",
            params: { utc: req.params.utc, info: e },
          });
        },
      };
      // _console.warn("666");
      if (req.method === "AsukaMap.GetImgTile") {
        // if (lock) {
        //   _console.error("LOCKING BUT RECEIVE REQUEST!");
        //   res("LOCKING BUT RECEIVE REQUEST!");

        //   return;
        // }
        res(null, "wait for callback");
        let loadInfo = JSON.parse(req.params.info);
        let loadFileName = getFileName(
          loadInfo.tileX,
          loadInfo.tileY,
          loadInfo.zoom
        );
        // _console.warn("Pending to download Tile:", loadInfo);
        lock = true;
        if (false) {
          let downloadTask = network.downloader.downloadFile({
            url: `http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${loadInfo.zoom}&TILEROW=${loadInfo.tileY}&TILECOL=${loadInfo.tileX}&tk=7a4866131a483b65961af674d665908d`,
            filePath: "assets://map/" + loadFileName,
          });
          downloadTask.onSuccess = async (event) => {
            _console.warn("Download tile success!", event);
            await image.convert({
              filePath: "assets://map/" + loadFileName,
              targetFilePath: "assets://map/" + loadFileName,
            });
            _console.warn("convert success!");
            outbox.enqueueFile("assets://map/" + loadFileName).on(
              "change",
              /**
               *
               * @param {import("@cuberqaq/transfer-file-side").ChangeEvent} event
               */
              (event) => {
                if (event.data.readyState === "transferring") {
                  cbFS.rmSync({
                    path: "assets://map/" + xian,
                  });
                }
              }
            );
          };
          downloadTask.onFail = (event) => {
            _console.error("Download Failed!", event);
          };
        } else {
          let downloadVecTask = network.downloader.downloadFile({
            url: `http://a897331063.eicp.net:14514/imgtile?zoom=${loadInfo.zoom}&tileX=${loadInfo.tileX}&tileY=${loadInfo.tileY}`,
            filePath: loadFileName,
          });
          downloadVecTask.onSuccess = (event) => {
            // _console.warn("Download success!", event);
            // try {
            //   await image.convert({
            //     filePath: "data://download/" + loadFileName,
            //     targetFilePath: "data://download/" + loadFileName,
            //   });
            // } catch (e) {
            //   _console.error(e);
            //   this.call({
            //     method: "AsukaMap.GetImgTileCb",
            //     params: {
            //       type: "ERROR",
            //       key: req.params.key,
            //       reason: "convert error",
            //     },
            //   });
            //   lock = false;
            //   return;
            // }
            // _console.warn("Convert success!");
            _console.warn("Now transfering files count=" + ++transferingCount);
            let fileObj = outbox.enqueueFile("data://download/" + loadFileName);
            let key = nextKey++;
            fileObjMap.set(key, fileObj);
            fileObj.on("change", (event) => {
              // _console.log("！！！！！on change", event);
              if (event.data.readyState === "transferred") {
                --transferingCount;
                fileObjMap.get(key).cancel();
                fileObjMap.delete(key);
                // _console.log("transfered file success");
                lock = false;
                this.call({
                  method: "AsukaMap.GetImgTileCb",
                  params: { type: "OK", key: req.params.key },
                });
                return;
                // res(null, "OK");
              } else if (event.data.readyState === "error") {
                --transferingCount;
                fileObjMap.get(key).cancel();
                fileObjMap.delete(key);
                _console.log("error");
                this.call({
                  method: "AsukaMap.GetImgTileCb",
                  params: {
                    type: "ERROR",
                    key: req.params.key,
                    reason: "transfer file error",
                  },
                });
                lock = false;
                return;
                // res("transfer file error");
              }
            });

            // .on(
            //   "change",
            //   /**
            //    *
            //    * @param {import("@cuberqaq/transfer-file-side").ChangeEvent} event
            //    */
            //   (event) => {
            //     if (event.data.readyState === "transferring") {
            //       cbFS.rmSync({
            //         path: "assets://map/" + xian,
            //       });
            //     }
            //   }
            // );
          };
          downloadVecTask.onFail = (event) => {
            _console.error("Download Failed!", event);
            // res("Download Failed!")
            this.call({
              method: "AsukaMap.GetImgTileCb",
              params: {
                type: "ERROR",
                key: req.params.key,
                reason: "Download Failed!",
              },
            });
            lock = false;
          };

          
        }
      } else if (req.method === "AsukaMap.Init") {
        _console.warn(
          "！！！当前还有" + fileObjMap.keys.length + "个文件卡在队列里,清理..."
        );
        for (let fileObj of fileObjMap.values()) {
          fileObj.cancel();
        }
        transferingCount = 0;
      } else res("awa error");
    },
    onCall() {},
    onInit() {
      console.warn("app side service invoke onInit");
      // let downloadVecTask = network.downloader.downloadFile({
      //   url: "https://docs.zepp.com/zh-cn/img/logo.png", //`http://a897331063.eicp.net:14514/imgtile?zoom=${10}&tileX=${114}&tileY=${514}`,
      //   filePath: "assets://map/" + "test.png",
      // });
      // downloadVecTask.onSuccess = async (event) => {
      //   console.warn("test:Download success!", event);
      // };
      // downloadVecTask.onFail = async (res) => {
      //   console.error("test:Download Failed!", res);
      // };
      inbox = transferFile.getInbox();
      // cbFS._mkdir("/assets/map");
      // inbox.on("FILE", () => {
      //   let fileObj = inbox.getNextFile();
      //   // let buf = new ArrayBuffer(fileObj.fileSize);
      //   // // console.warn(
      //   // //   "Receive file",
      //   // //   fileObj,
      //   // //   cbFS.readSync({
      //   // //     fd: cbFS.openSync({ path: _parseHmPath(fileObj.filePath).path }),
      //   // //     buffer: buf,
      //   // //   }),
      //   // //   buf,
      //   // //   cbFS.readFileSync({ path: "maploader", options: { encoding: "utf8" } })
      //   // // );

      // });
    },
    onRun() {
      this.call({
        method: "warn",
        params: { utc: req.params.utc, info: "app side service invoke onRun" },
      });
      console.warn("app side service invoke onRun");
    },
    onDestroy() {
      console.warn("app side service invoke onDestroy");
    },
  })
);
