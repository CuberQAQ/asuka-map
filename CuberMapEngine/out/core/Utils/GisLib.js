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
            pixelX: x % tileLengthInWMTSZ24P >> (24 - zoom), // /2^(24-zoom)
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
            pixelX: ~~(((x % tileLengthInWMTSZ24P >> (24 - zoom)) * tileSize) / 256), // /2^(24-zoom)
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
    const x_PI = (3.14159265358979324 * 3000.0) / 180.0;
    const PI = 3.1415926535897932384626;
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    function outOfChina(lng, lat) {
        return (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false);
    }
    GisLib.outOfChina = outOfChina;
    function transformlat(lng, lat) {
        var ret = -100.0 +
            2.0 * lng +
            3.0 * lat +
            0.2 * lat * lat +
            0.1 * lng * lat +
            0.2 * Math.sqrt(Math.abs(lng));
        ret +=
            ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
                2.0) /
                3.0;
        ret +=
            ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) /
                3.0;
        ret +=
            ((160.0 * Math.sin((lat / 12.0) * PI) +
                320 * Math.sin((lat * PI) / 30.0)) *
                2.0) /
                3.0;
        return ret;
    }
    function transformlng(lng, lat) {
        var ret = 300.0 +
            lng +
            2.0 * lat +
            0.1 * lng * lng +
            0.1 * lng * lat +
            0.1 * Math.sqrt(Math.abs(lng));
        ret +=
            ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
                2.0) /
                3.0;
        ret +=
            ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) /
                3.0;
        ret +=
            ((150.0 * Math.sin((lng / 12.0) * PI) +
                300.0 * Math.sin((lng / 30.0) * PI)) *
                2.0) /
                3.0;
        return ret;
    }
    function wgs84togcj02(lng, lat) {
        if (outOfChina(lng, lat)) {
            return [lng, lat];
        }
        else {
            var dlat = transformlat(lng - 105.0, lat - 35.0);
            var dlng = transformlng(lng - 105.0, lat - 35.0);
            var radlat = (lat / 180.0) * PI;
            var magic = Math.sin(radlat);
            magic = 1 - ee * magic * magic;
            var sqrtmagic = Math.sqrt(magic);
            dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
            dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
            const mglat = lat + dlat;
            const mglng = lng + dlng;
            return [mglng, mglat];
        }
    }
    GisLib.wgs84togcj02 = wgs84togcj02;
    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // 地球半径，单位为千米
        var dLat = deg2rad(lat2 - lat1); // 将度数转换为弧度
        var dLon = deg2rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) *
                Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // 计算出的距离，单位为千米
        return d;
    }
    GisLib.getDistanceFromLatLonInKm = getDistanceFromLatLonInKm;
    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
    function getBearing(lat1, lon1, lat2, lon2) {
        // 将经纬度从度数转换为弧度
        var lat1Rad = deg2rad(lat1);
        var lon1Rad = deg2rad(lon1);
        var lat2Rad = deg2rad(lat2);
        var lon2Rad = deg2rad(lon2);
        // 计算经度差
        var dLon = lon2Rad - lon1Rad;
        // 计算方位角
        var y = Math.sin(dLon) * Math.cos(lat2Rad);
        var x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
        var bearing = Math.atan2(y, x);
        // 将弧度转换为度数
        bearing = rad2deg(bearing);
        // 将角度转换为0到360度的范围
        bearing = (bearing + 360) % 360;
        return bearing;
    }
    GisLib.getBearing = getBearing;
    function rad2deg(rad) {
        return rad * (180 / Math.PI);
    }
})(GisLib || (GisLib = {}));
