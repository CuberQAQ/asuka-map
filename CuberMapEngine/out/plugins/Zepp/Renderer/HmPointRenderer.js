import { PointRenderer } from "../../../core/LayerComponent/PointLayer";
import * as hmUI from "@zos/ui";
export class HmImgPointRenderer extends PointRenderer {
    constructor(_parent) {
        super(_parent);
        this._widget = hmUI.createWidget(hmUI.widget.IMG, {
            x: 0,
            y: 0,
            src: ""
        });
        this._widget.setProperty(hmUI.prop.VISIBLE, false);
    }
    setOptions(options) { }
    setResource(resource) {
        this._widget.setProperty();
    }
    setResultCoordinate(result) {
    }
    destroy() {
    }
}
