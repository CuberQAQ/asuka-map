import { getDeviceInfo } from "@zos/device";
import {
  PointLayer,
  PointRenderer,
} from "../../../core/LayerComponent/PointLayer";
import { Coordinate } from "../../../core/MapEngine";
import * as hmUI from "@zos/ui";

type HmImgPointRendererResourceType = {
  src: string;
  anchor: Coordinate; // 相对于图片左上角的锚点坐标，此位置将于目标坐标点重合
};
export class HmImgPointRenderer extends PointRenderer<HmImgPointRendererResourceType> {
  static deviceInfo = getDeviceInfo();
  static originPoint = {
    x: this.deviceInfo.width / 2,
    y: this.deviceInfo.height / 2,
  };
  _widget: any | null;
  _resultCoord: Coordinate | null = null;
  _resource: HmImgPointRendererResourceType | null = null;
  constructor(
    _parent: PointLayer<
      HmImgPointRendererResourceType,
      PointRenderer<HmImgPointRendererResourceType>
    >
  ) {
    super(_parent);

    this._widget = hmUI.createWidget(hmUI.widget.IMG, {
      x: 0,
      y: 0,
      src: "",
    });
    // this._widget?.setProperty(hmUI.prop.VISIBLE, false);
  }

  setOptions(options: any): void {}

  setResource(resource: HmImgPointRendererResourceType): void {
    this._resource = resource;
    let { width, height } = hmUI.getImageInfo(resource.src);
    this._widget?.setProperty(hmUI.prop.MORE, { 
      src: resource.src,
      w: width,
      h: height,
    });
    if (this._resultCoord === null) return;
    let pos = {
      x:
        HmImgPointRenderer.originPoint.x +
        this._resultCoord.x -
        resource.anchor.x,
      y:
        HmImgPointRenderer.originPoint.y +
        this._resultCoord.y -
        resource.anchor.y,
    };
    this._widget?.setProperty(hmUI.prop.MORE, pos);
  }
  setResultCoordinate(result: Coordinate): void {
    this._resultCoord = { ...result };
    if (this._resource === null) return;
    let pos = {
      x: HmImgPointRenderer.originPoint.x + result.x - this._resource.anchor.x,
      y: HmImgPointRenderer.originPoint.y + result.y - this._resource.anchor.y,
    };
    this._widget?.setProperty(hmUI.prop.MORE, pos);
  }
  destroy(): void {
    hmUI.deleteWidget(this._widget);
    this._widget = null;
  }
}
