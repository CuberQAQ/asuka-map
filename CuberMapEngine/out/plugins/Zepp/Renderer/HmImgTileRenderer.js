var _a;
import { px } from "@zos/utils";
import { WidgetImgTileRenderer, } from "../../../core/LayerComponent/ImgTileLayer";
import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
export class HmImgTileWidget {
    constructor() {
        this._tileSize = 512; //TODO
        this._hmWidget = hmUI.createWidget(hmUI.widget.IMG, {
            x: px(0),
            y: px(0),
            w: this._tileSize,
            h: this._tileSize,
            src: "map/emptyTile.png",
            auto_scale: true,
        });
    }
    setResource(resource) {
        // log.warn("setResource="+resource);
        setTimeout(() => { var _b; return (_b = this._hmWidget) === null || _b === void 0 ? void 0 : _b.setProperty(hmUI.prop.SRC, resource); }, 2);
    }
    setRotation(rotation) {
        // log.warn("setRotation="+rotation);
        // TODO
    }
    setCenterCoord(centerCoord) {
        var _b;
        let prop = {
            x: _a.originPoint.x + centerCoord.x - this._tileSize / 2,
            y: _a.originPoint.y + centerCoord.y - this._tileSize / 2,
        };
        (_b = this._hmWidget) === null || _b === void 0 ? void 0 : _b.setProperty(hmUI.prop.MORE, prop);
    }
    destroy() {
        if (this._hmWidget !== null)
            hmUI.deleteWidget(this._hmWidget);
        this._hmWidget = null;
    }
}
_a = HmImgTileWidget;
HmImgTileWidget.deviceInfo = getDeviceInfo();
HmImgTileWidget.originPoint = {
    x: _a.deviceInfo.width / 2,
    y: _a.deviceInfo.height / 2,
};
export class HmImgTileRenderer extends WidgetImgTileRenderer {
    createWidget() {
        return new HmImgTileWidget();
    }
}
