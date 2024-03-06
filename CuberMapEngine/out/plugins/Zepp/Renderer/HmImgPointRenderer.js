var _a;
import { getDeviceInfo } from "@zos/device";
import { PointRenderer, } from "../../../core/LayerComponent/PointLayer";
import * as hmUI from "@zos/ui";
export class HmImgPointRenderer extends PointRenderer {
    constructor(_parent) {
        super(_parent);
        this._resultCoord = null;
        this._resource = null;
        this._widget = hmUI.createWidget(hmUI.widget.IMG, {
            x: 0,
            y: 0,
            src: "",
        });
        // this._widget?.setProperty(hmUI.prop.VISIBLE, false);
    }
    setOptions(options) { }
    setResource(resource) {
        var _b, _c;
        this._resource = resource;
        let { width, height } = hmUI.getImageInfo(resource.src);
        (_b = this._widget) === null || _b === void 0 ? void 0 : _b.setProperty(hmUI.prop.MORE, {
            src: resource.src,
            w: width,
            h: height,
        });
        if (this._resultCoord === null)
            return;
        let pos = {
            x: _a.originPoint.x +
                this._resultCoord.x -
                resource.anchor.x,
            y: _a.originPoint.y +
                this._resultCoord.y -
                resource.anchor.y,
        };
        (_c = this._widget) === null || _c === void 0 ? void 0 : _c.setProperty(hmUI.prop.MORE, pos);
    }
    setResultCoordinate(result) {
        var _b;
        this._resultCoord = { ...result };
        if (this._resource === null)
            return;
        let pos = {
            x: _a.originPoint.x + result.x - this._resource.anchor.x,
            y: _a.originPoint.y + result.y - this._resource.anchor.y,
        };
        (_b = this._widget) === null || _b === void 0 ? void 0 : _b.setProperty(hmUI.prop.MORE, pos);
    }
    destroy() {
        hmUI.deleteWidget(this._widget);
        this._widget = null;
    }
}
_a = HmImgPointRenderer;
HmImgPointRenderer.deviceInfo = getDeviceInfo();
HmImgPointRenderer.originPoint = {
    x: _a.deviceInfo.width / 2,
    y: _a.deviceInfo.height / 2,
};
