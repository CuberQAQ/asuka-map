export class MapEngine {
    constructor({ layers, resouces, center, zoom = 3, tileSize = 512, }) {
        this._layerList = [...layers];
        this._resourceMap = { ...resouces };
        this._centerCoord = { ...center };
        this._zoom = zoom;
        this._tileSize = tileSize;
        this._layerList.forEach((layer) => layer.setParent(this));
    }
    init() {
        for (let layer of this._layerList) {
            layer.init();
            this.setCenterCoord(this._centerCoord.x, this._centerCoord.y, true);
            this.setZoom(this._zoom, true);
        }
    }
    render() {
        for (let layer of this._layerList) {
            layer._enable && layer.render();
        }
    }
    getResourceComponent(id) {
        return this._resourceMap[id];
    }
    setCenterCoord(x, y, initial) {
        if (y < 0)
            y = 0;
        if (y > 4294967296)
            y = 4294967296;
        // if (x < 0) x += 4_294_967_296;
        // if (x > 4_294_967_296) x -= 4_294_967_296;
        this._centerCoord = { x, y };
        for (let layer of this._layerList) {
            layer.setCenterCoord(x, y, initial);
        }
    }
    setZoom(zoom, initial) {
        if (zoom < 2)
            zoom = 2;
        if (zoom > 24)
            zoom = 24;
        this._zoom = zoom;
        for (let layer of this._layerList) {
            layer.setZoom(zoom, initial);
        }
    }
    setRotation(degree) {
        // this._zoom = zoom
        // for (let layer of this._layerList) {
        //   layer.se(zoom);
        // }
    }
}
