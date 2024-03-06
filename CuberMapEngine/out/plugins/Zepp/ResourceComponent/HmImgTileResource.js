export class HmSingleLoader {
    constructor() {
    }
    static getFileName(tileX, tileY, zoom) {
        return tileX + "," + tileY + "," + zoom + ".png";
    }
    isLoaded(tileX, tileY, zoom) {
        // return !!hmFS.statAssetsSync({
        //   path: path.join("map/", HmSingleLoader.getFileName(tileX, tileY, zoom)),
        // });
        return true;
    }
    load(tileX, tileY, zoom) {
        return new Promise((resolve, reject) => {
            resolve("map/emptyTile.png");
        });
    }
    getLoaded(tileX, tileY, zoom) {
        return "map/emptyTile.png";
    }
}
