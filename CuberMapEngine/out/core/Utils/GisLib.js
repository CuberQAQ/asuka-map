export var GisLib;
(function (GisLib) {
    /**
     * Turn WMTS-Z24P into TileIndexInfo
     * @param x WMTS-Z24P x
     * @param y WMTS-Z24P x
     * @param zoom WMTS zoom level, range [0,24]
     */
    function getExtendedTileIndex256(x, y, zoom) {
        zoom = ~~zoom; // floor
        let tileLengthInWMTSZ24P = 1 << (32 - zoom); // 2^(32-zoom)
        return {
            tileX: ~~(x / tileLengthInWMTSZ24P),
            tileY: ~~(y / tileLengthInWMTSZ24P),
            zoom,
            pixelX: x % tileLengthInWMTSZ24P >> (24 - zoom),
            pixelY: y % tileLengthInWMTSZ24P >> (24 - zoom),
        };
    }
    GisLib.getExtendedTileIndex256 = getExtendedTileIndex256;
    /**
     * Turn WMTS-Z24P into TileIndexInfo
     * @param x WMTS-Z24P x
     * @param y WMTS-Z24P x
     * @param zoom WMTS zoom level, range [0,24]
     */
    function getExtendedTileIndex(x, y, zoom, tileSize) {
        zoom = ~~zoom; // floor
        let tileLengthInWMTSZ24P = 1 << (32 - zoom); // 2^(32-zoom)
        return {
            tileX: ~~(x / tileLengthInWMTSZ24P),
            tileY: ~~(y / tileLengthInWMTSZ24P),
            zoom,
            pixelX: ~~(((x % tileLengthInWMTSZ24P >> (24 - zoom)) * tileSize) / 256),
            pixelY: ~~(((y % tileLengthInWMTSZ24P >> (24 - zoom)) * tileSize) / 256),
        };
    }
    GisLib.getExtendedTileIndex = getExtendedTileIndex;
    function EarthCoord2WMTSZ24P(longitude, latitude) {
        return {
            x: Math.floor((Number(2.147483648e9) * ((longitude / 180) * Math.PI + Math.PI)) /
                Math.PI),
            y: Math.floor((Number(2.147483648e9) / Math.PI) *
                (Math.PI -
                    Math.log(Math.tan(Math.PI / 4 + ((latitude / 180) * Math.PI) / 2)))),
        };
    }
    GisLib.EarthCoord2WMTSZ24P = EarthCoord2WMTSZ24P;
    function WMTSZ24P2EarthCoord(x, y) {
        return {
            longitude: (((x * Math.PI) / Number(2.147483648e9) - Math.PI) / Math.PI) * 180,
            latitude: (((Math.atan(Math.exp(-(y / (Number(2.147483648e9) / Math.PI) - Math.PI))) -
                Math.PI / 4) *
                2) /
                Math.PI) *
                180,
        };
    }
    GisLib.WMTSZ24P2EarthCoord = WMTSZ24P2EarthCoord;
    function DMS2D(minus, d, m, s) {
        return (minus ? -1 : 1) * (d + m / 60 + s / 3600);
    }
    GisLib.DMS2D = DMS2D;
})(GisLib || (GisLib = {}));
