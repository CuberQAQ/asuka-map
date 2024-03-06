import { StaticResource, } from "../ResourceComponent/StaticResource";
export class PointLayer {
    constructor({ resourceId, points, unknownResource, RendererType, enable = true, }) {
        this._parent = null;
        this._centerCoord = null; // WMTS-Z24P
        this._zoom = 3;
        this._tileSize = 256;
        this._resourceComponent = null;
        this._rendererMap = new Map();
        this._resourceId = resourceId;
        this._unknownResource = unknownResource;
        this._RendererType = RendererType;
        this._pointData = points;
        this._enable = enable;
    }
    init() {
        if (this._pointData === null)
            return;
        this._enable && this._updateRenderer();
        // this.setPointDataList(this._pointData, true);
        // this._initialPoints = null;
    }
    setParent(parent) {
        this._parent = parent;
        this._tileSize = parent._tileSize;
        let resource = parent.getResourceComponent(this._resourceId);
        this._zoom = parent._zoom;
        if (resource instanceof StaticResource)
            this._resourceComponent = resource;
        else
            throw TypeError("Resource is not instanceof StaticResource");
    }
    setCenterCoord(x, y) {
        this._centerCoord = { x, y };
        this._enable && this._render();
    }
    setZoom(zoom) {
        this._zoom = zoom;
        this._enable && this._render();
    }
    render() {
        this._enable && this._render();
    }
    _updateRenderer() {
        var _a, _b;
        if (!this._pointData)
            return;
        let usingKeySet = new Set();
        // Process point in dataList
        for (let point of this._pointData) {
            let key = point.key;
            if (key) {
                if (usingKeySet.has(key)) {
                    throw Error("Two or more Point Data has a Same Key");
                }
                if (this._rendererMap.has(key)) {
                    // reusable
                    let renderer = this._rendererMap.get(key);
                    renderer.setData(point.position, (_b = (_a = this._resourceComponent) === null || _a === void 0 ? void 0 : _a.getResource(point.resourceKey)) !== null && _b !== void 0 ? _b : this._unknownResource);
                }
                else {
                    // unreusable
                    this._rendererMap.set(key, this._createSingleRenderer(point));
                }
            }
            else {
                key = Symbol("Nokey point");
                this._rendererMap.set(key, this._createSingleRenderer(point));
            }
            usingKeySet.add(key);
        }
        // Delete unusable renderer
        for (let key of this._rendererMap.keys()) {
            if (!usingKeySet.has(key)) {
                this._rendererMap.get(key).destroy();
                this._rendererMap.delete(key);
            }
        }
    }
    _clearRenderer() {
        for (let key in this._rendererMap) {
            this._rendererMap.get(key).destroy();
        }
        this._rendererMap.clear();
    }
    _createSingleRenderer(data) {
        var _a, _b;
        let renderer = new this._RendererType(this);
        console.log("resCom:" + this._resourceComponent, " isnull?=" + (this._resourceComponent === null));
        renderer.setData(data.position, (_b = (_a = this._resourceComponent) === null || _a === void 0 ? void 0 : _a.getResource(data.resourceKey)) !== null && _b !== void 0 ? _b : this._unknownResource);
        return renderer;
    }
    setEnable(enable) {
        if (this._enable !== enable) {
            if (enable) {
                this._updateRenderer();
            }
            else {
                this._clearRenderer();
            }
            this._enable = enable;
        }
    }
    setPointDataList(dataList, initial) {
        this._pointData = dataList;
        if (this._enable) {
            this._updateRenderer();
            if (!initial)
                this._render();
        }
    }
    addPoint(data) {
        var _a;
        let key = data.key;
        if (key) {
            if (this._rendererMap.has(key))
                throw Error("Two or more Point Data has a Same Key");
        }
        else {
            key = Symbol("Nokey point");
        }
        (_a = this._pointData) === null || _a === void 0 ? void 0 : _a.push(data);
        if (this._enable) {
            let renderer = this._createSingleRenderer(data);
            this._rendererMap.set(key, renderer);
            this._render(key);
        }
    }
    removePoint(key) {
        if (this._pointData === null)
            return false;
        let index = this._getPointIndexFromKey(key);
        if (index === null)
            return false;
        this._pointData.splice(index, 1);
        if (this._rendererMap.has(key)) {
            this._rendererMap.get(key).destroy();
            this._rendererMap.delete(key);
        }
        return true;
    }
    setPoint(key, data) {
        var _a, _b;
        if (this._pointData === null)
            return false;
        let index = this._getPointIndexFromKey(key);
        if (index === null)
            return false;
        let pointData = this._pointData[index];
        let renderer = this._rendererMap.get(key);
        if (data.position && data.position !== pointData.position) {
            pointData.position = data.position;
            renderer === null || renderer === void 0 ? void 0 : renderer.setPosition(data.position);
        }
        if (data.resourceKey && data.resourceKey !== pointData.resourceKey) {
            pointData.resourceKey = data.resourceKey;
            renderer === null || renderer === void 0 ? void 0 : renderer.setResource((_b = (_a = this._resourceComponent) === null || _a === void 0 ? void 0 : _a.getResource(data.resourceKey)) !== null && _b !== void 0 ? _b : this._unknownResource);
        }
        if (data.options !== undefined && data.options !== pointData.options) {
            pointData.options = data.options;
            renderer === null || renderer === void 0 ? void 0 : renderer.setOptions(data.options);
        }
        return true;
    }
    _getPointIndexFromKey(key) {
        if (this._pointData === null)
            return null;
        for (let index = 0; index < this._pointData.length; ++index) {
            if (this._pointData[index].key === key) {
                return index;
            }
        }
        return null;
    }
    _render(targetKey) {
        if (this._centerCoord === null)
            return;
        if (targetKey) {
            let renderer = this._rendererMap.get(targetKey);
            if (renderer === undefined)
                return;
            renderer.render(this._centerCoord, this._zoom);
        }
        else {
            for (let key of this._rendererMap.keys()) {
                let renderer = this._rendererMap.get(key);
                renderer.render(this._centerCoord, this._zoom);
            }
        }
    }
}
export class PointRenderer {
    constructor(_parent) {
        this._parent = _parent;
        this._position = null;
        this._zoom = null;
        this._centerCoord = null;
    }
    setData(position, resource, options) {
        this.setPosition(position);
        this.setResource(resource);
        this.setOptions(options);
    }
    setPosition(position) {
        var _a;
        if (((_a = this._position) === null || _a === void 0 ? void 0 : _a.x) !== position.x || this._position.y !== position.y) {
            this._position = { ...position };
            this.render();
        }
    }
    render(centerCoord, zoom) {
        if (centerCoord === undefined) {
            if (this._centerCoord === null)
                return;
            centerCoord = this._centerCoord;
        }
        if (zoom === undefined) {
            if (this._zoom === null)
                return;
            zoom = this._zoom;
        }
        if (centerCoord === null || zoom === null)
            return;
        if (this._centerCoord === null ||
            this._centerCoord.x !== centerCoord.x ||
            this._centerCoord.y !== centerCoord.y ||
            this._zoom === null ||
            this._zoom !== zoom) {
            if (this._position === null)
                return;
            this._centerCoord = { ...centerCoord };
            this._zoom = zoom;
            // Calculate Screen Position
            let tileSize = this._parent._tileSize;
            let result = {
                // TODO optimize the calculate method
                x: (((this._position.x - centerCoord.x) >> (24 - zoom)) * tileSize) /
                    256,
                y: (((this._position.y - centerCoord.y) >> (24 - zoom)) * tileSize) /
                    256,
            };
            this.setResultCoordinate(result);
        }
    }
}
