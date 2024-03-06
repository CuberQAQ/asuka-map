export class StaticResource {
    constructor(_resourceRecord) {
        this._resourceRecord = _resourceRecord;
        this._parent = null;
    }
    setParent(parent) {
        this._parent = parent;
    }
    getResource(key) {
        if (this._resourceRecord[key] !== undefined)
            return this._resourceRecord[key];
        return null;
    }
}
