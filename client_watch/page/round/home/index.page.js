import * as hmUI from "@zos/ui";
import * as hmFS from "@zos/fs";
import { log as Logger, log } from "@zos/utils";
import { DEVICE_HEIGHT, DEVICE_WIDTH, TEXT_STYLE } from "./index.style";
import { onGesture, GESTURE_UP } from "@zos/interaction";
import {
  ImgTileLayer,
  MapEngine,
  ZPlugin,
  GisLib,
  MultiLoaderITResource,
  PointLayer,
  StaticResource,
} from "@cuberqaq/cubermapengine";
import { setScrollLock } from "@zos/page";
import { BasePage } from "@zeppos/zml/base-page";
const logger = Logger.getLogger("helloworld");
import { Time } from "@zos/sensor";
import { getPackageInfo } from "@zos/app";
// import { inflateSync } from "fflate";
import { Geolocation } from "@zos/sensor";

function getFileName(tileX, tileY, zoom) {
  return "tile" + tileX + "x" + tileY + "y" + zoom + "z.png";
}

const time = new Time();

const packageInfo = getPackageInfo();

function getAppDir(appId = packageInfo.appId) {
  let s = Number(appId).toString(16).toUpperCase();
  switch (s.length) {
    case 1:
      return "0000000" + s;
    case 2:
      return "000000" + s;
    case 3:
      return "00000" + s;
    case 4:
      return "0000" + s;
    case 5:
      return "000" + s;
    case 6:
      return "00" + s;
    case 7:
      return "0" + s;
    case 8:
      return s;
  }
}
const appDir = getAppDir();
// var res, rej, utc, info
/**
 * @type {Map<number, [res, rej, utc, info, key]>}
 */
var reqMap = new Map();
var nextKey = 10000;
// const currentTime = time.getTime()
var geolocation = new Geolocation();
var callback = null;
Page(
  BasePage({
    onReceivedFile: (fileObj) => {
      console.log("！！！Receive File:"+fileObj.fileName);
    },

    onRequest() {},
    onCall: (req) => {
      if (req.method === "error")
        console.log("app-side ERROR:" + JSON.stringify(req));
      if (req.method === "warn")
        console.log("app-side WARN:" + JSON.stringify(req));
      if (req.method === "AsukaMap.GetImgTileCb") {
        let key = req.params.key;
        let [res, rej, utc, info, key2] = reqMap.get(key);
        reqMap.delete(key);
        // console.log("oncall回調 nya~" + " key" + key + " key2=" + key2);
        if (req.params.type === "OK") {
          let fileName = getFileName(info.tileX, info.tileY, info.zoom);
          let path = "download/" + fileName;
          // let stat = hmFS.statSync({ path });
          // console.log("Data file stat=" + (stat ? JSON.stringify(stat) : stat));
          let buf = hmFS.readFileSync({ path });
          hmFS.writeFileSync({ path, data: buf });
          hmFS.writeFileSync({ path: path + "awa", data: buf });
          hmFS.renameSync({
            oldPath: path,
            newPath: `../../${appDir}/assets/map/${fileName}`,
          });
          // console.log("oncall回調--ok nya~");
          res();
        } else {
          console.log(
            `(${utc})` +
              "！！！！！catch an error when ONCALL:" +
              JSON.stringify(req.params.reason)
          );
          // console.log("oncall回調--error nya~");
          if (req.params.reason === "transfer file error") res();
          else rej();
        }
      }
    },
    build() {
      logger.debug("page build invoked");
      // hmUI.createWidget(hmUI.widget.TEXT, {
      //   ...TEXT_STYLE,
      // });
      // this.request({
      //   method: "AsukaMap.GetImgTile",
      //   params: { info1: "awa" },
      // })
      //   .then(() => {
      //     console.log("awa okk");
      //   })
      //   .catch((e) => {
      //     console.log("awa err", e);
      //   });
      // inbox = transferFile.getInbox();
      // outbox = transferFile.getOutbox();
      this.request({
        method: "AsukaMap.Init",
        params: {}
      })
      const getImgTile = (info1) => {
        utc = time.getTime();
        info = info1;
        // console.log(`(${utc})` + "getImgTile...", info);
        return new Promise((res1, rej1) => {
          res = res1;
          rej = rej1;

          this.request({
            method: "AsukaMap.GetImgTile",
            params: { info: JSON.stringify(info), utc },
            timeout: 60000,
          })
            .then(() => {
              // console.log(`(${utc})` + "ok when REQUEST:");
            })

            .catch((e) => {
              console.log(
                `(${utc})` +
                  "！！！！！catch an error when REQUEST:" +
                  JSON.stringify(e)
              );
              rej();
            });
        });
      };
      const getImgTileM = (info1, type) => {
        ++nextKey;
        let res, rej, utc, info;
        utc = time.getTime();
        info = info1;
        // console.log(`(${utc})` + "getImgTile...", info);
        return new Promise((res1, rej1) => {
          res = res1;
          rej = rej1;
          reqMap.set(nextKey, [res, rej, utc, info, nextKey]);
          this.request({
            method: "AsukaMap.GetImgTile",
            params: { info: JSON.stringify(info), utc, key: nextKey },
            timeout: 60000,
          })
            .then(() => {
              // console.log(`(${utc})` + "ok when REQUEST:");
            })

            .catch((e) => {
              console.log(
                `(${utc})` +
                  "！！！！！catch an error when REQUEST:" +
                  JSON.stringify(e)
              );
              rej();
            });
        });
      };
      setScrollLock({ lock: true });

      onGesture({
        callback: (event) => {
          return true;
        },
      });

      // let transferFile = new TransferFile();
      // hmFS.writeFileSync({
      //   path: "maploader",
      //   data: JSON.stringify({ tileX: 3, tileY: 4, zoom: 3 }),
      //   options: { encoding: "utf8" },
      // });

      // transferFile
      //   .getOutbox()
      //   .enqueueFile("data://maploader")
      //   .on(
      //     "change",
      //     /**
      //      * @param {import("@cuberqaq/transfer-file").ChangeEvent} event
      //      */
      //     (event) => {
      //       if (event.data.readyState == "transferred") {
      //         log.warn("trans success!");
      //       } else if (event.data.readyState == "error") {
      //         log.warn("trans success!");
      //       }
      //     }
      //   );
      // let inbox = transferFile.getInbox();
      // inbox.on("FILE", () => {
      //   let fileObj = inbox.getNextFile();
      //   log.warn("receive new file:" + fileObj.filePath);
      //   let img = hmUI.createWidget(hmUI.widget.IMG, {
      //     x: 0,
      //     y: 0,
      //     src: "map/" + fileObj.fileName
      //   })
      // });

      let centerCoord = GisLib.EarthCoord2WMTSZ24P(...GisLib.wgs84togcj02(116.38, 39.9));
      let naviSuccess = false;
      // let centerCoord = { x: 2147483648, y: 2147483648 }; //GisLib.EarthCoord2WMTSZ24P(GisLib.DMS2D(false,116,23,17),GisLib.DMS2D(false,39,54,27))
      let pointLayer;
      let mapEngine = new MapEngine({
        layers: [
          new ImgTileLayer({
            resourceId: "img_layer",
            emptyResource: "map/emptyTile.png",
            viewableSize: { width: 3, height: 3 },
            RendererType: ZPlugin.HmImgTileRenderer,
          }),
          // new ImgTileLayer({
          //   resourceId: "choose_layer",
          //   emptyResource: "ciallo",
          //   viewableSize: { width: 3, height: 3 },
          //   RendererType: ZPlugin.HmImgTileRenderer,
          // }),
          (pointLayer = new PointLayer({
            resourceId: "point_resource",
            unknownResource: {
              src: "icon.png",
              anchor: { x: 16, y: 80 },
            },
            RendererType: ZPlugin.HmImgPointRenderer,
            points: [
              {
                resourceKey: "navi_img",
                position: GisLib.EarthCoord2WMTSZ24P(...GisLib.wgs84togcj02(116.38, 39.9)),
                key: "navi",
              },
            ],
          })),
        ],
        resouces: {
          img_layer: new MultiLoaderITResource(
            new ZPlugin.HmMultiLoader((info) => getImgTileM(info))
          ),
          // choose_layer: new StaticResource({
          //   choosed: "chosedTile.png"
          // }),
          // vec_layer: new MultiLoaderITResource(
          //   new ZPlugin.HmMultiLoader((info) => getImgTileM(info))
          // ),
          point_resource: new StaticResource({
            test_img: {
              src: "points/point.png",
              anchor: {
                x: 16,
                y: 80,
              },
            },
            navi_img: {
              src: "points/navi.png",
              anchor: {
                x: 30,
                y: 30,
              },
            },
          }),
        },
        center: {
          x: centerCoord.x,
          y: centerCoord.y,
        },
        zoom: 15,
        tileSize: 512,
      });
      mapEngine.init();
      mapEngine.render();
      

      let followNavi = false;
      callback = () => {
        // console.log(`定位回调！status=${geolocation.getStatus()}`);
        if (geolocation.getStatus() === "A") {
          let latitude = geolocation.getLatitude({ format: "DD" }),
            longitude = geolocation.getLongitude({ format: "DD" });
          centerCoord = GisLib.EarthCoord2WMTSZ24P(...GisLib.wgs84togcj02(longitude, latitude));
          if (!naviSuccess) {
            hmUI.showToast({ text: "定位成功" });
          }
          naviSuccess = true;
          // console.log(`定位回调：经度(${longitude}) 纬度(${latitude})`);
          pointLayer.setPoint("navi", {
            position: { ...centerCoord },
          });
          if (followNavi) {
            mapEngine.setCenterCoord(centerCoord.x, centerCoord.y);
          }
        }
      };

      geolocation.start();
      geolocation.onChange(callback);
      

      log.warn("MapEngine All done...");
      let touchLayer = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(0),
        y: px(0),
        w: DEVICE_WIDTH,
        h: DEVICE_HEIGHT,
        text: " ",
      });
      let zoomUpButton = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(170),
        y: px(15),
        w: px(60),
        h: px(60),
        radius: px(30),
        normal_color: 0xdddddd,
        press_color: 0xffffff,
        color: 0x222222,
        text: "+",
        text_size: px(36),
        click_func: () => {
          if(mapEngine._zoom >= 15) return
          mapEngine.setZoom(mapEngine._zoom + 1);
        },
      });
      zoomUpButton.setAlpha(128)
      let zoomDownButton = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(250),
        y: px(15),
        w: px(60),
        h: px(60),
        radius: px(30),
        normal_color: 0xdddddd,
        press_color: 0xffffff,
        color: 0x222222,
        text: "-",
        text_size: px(50),
        click_func: () => {
          if(mapEngine._zoom <= 1) return
          mapEngine.setZoom(mapEngine._zoom - 1);
        },
      });
      zoomDownButton.setAlpha(128)

      let addPointButton = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(125),
        y: px(405),
        w: px(160),
        h: px(60),
        radius: px(30),
        normal_color: 0xdddddd,
        press_color: 0xffffff,
        color: 0x222222,
        text: "标记",
        text_size: px(30),
        click_func: () => {
          pointLayer.addPoint({
            resourceKey: "test_img",
            position: { ...mapEngine._centerCoord },
            key: Symbol(),
          });
          let { longitude, latitude } = GisLib.WMTSZ24P2EarthCoord(
            mapEngine._centerCoord.x,
            mapEngine._centerCoord.y
          );
          let tip = `经度:${longitude}\n纬度:${latitude}`;
          hmUI.showToast({ text: tip });
          console.log("已标记中心点，" + tip);

          // TODO
          // 选中瓦片

        },
      });
      addPointButton.setAlpha(128)
      let centerNaviButton = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(295),
        y: px(405),
        w: px(60),
        h: px(60),
        radius: px(30),
        normal_color: 0xdddddd,
        press_color: 0xffffff,
        color: 0x222222,
        text: followNavi ? "开" : "关",
        text_size: px(30),
        click_func: () => {
          followNavi = !followNavi;
          if (followNavi && naviSuccess) {
            mapEngine.setCenterCoord(centerCoord.x, centerCoord.y);
          }
          centerNaviButton.setProperty(
            hmUI.prop.TEXT,
            followNavi ? "开" : "关"
          );
        },
      });
      centerNaviButton.setAlpha(128)
      let clicked = {
        x: 0,
        y: 0,
      };
      touchLayer.addEventListener(hmUI.event.CLICK_DOWN, (event) => {
        clicked.x = event.x;
        clicked.y = event.y;
      });
      touchLayer.addEventListener(hmUI.event.MOVE, (event) => {
        mapEngine.setCenterCoord(
          mapEngine._centerCoord.x -
            ((event.x - clicked.x) << (24 - mapEngine._zoom)),
          mapEngine._centerCoord.y -
            ((event.y - clicked.y) << (24 - mapEngine._zoom))
        );
        clicked.x = event.x;
        clicked.y = event.y;
      });



      
    },
    onInit() {
      logger.debug("page onInit invoked");
    },

    onDestroy() {
      logger.debug("page onDestroy invoked");
      // When not needed for use
      if (callback) geolocation.offChange(callback);
      geolocation.stop();
    },
  })
);
