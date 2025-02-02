import { log } from "@zos/utils";

export namespace GisLib {
  export interface TileIndexInfo {
    tileX: number;
    tileY: number;
    zoom: number;
  }
  export interface ExtendedTileInfo extends TileIndexInfo {
    pixelX: number;
    pixelY: number;
  }
  /**
   * Turn WMTS-Z24P into TileIndexInfo
   * @param x WMTS-Z24P x
   * @param y WMTS-Z24P x
   * @param zoom WMTS zoom level, range [0,24]
   */
  export function getExtendedTileIndex256(
    x: number,
    y: number,
    zoom: number
  ): ExtendedTileInfo {
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
  /**
   * Turn WMTS-Z24P into TileIndexInfo
   * @param x WMTS-Z24P x
   * @param y WMTS-Z24P x
   * @param zoom WMTS zoom level, range [0,24]
   */
  export function getExtendedTileIndex(
    x: number,
    y: number,
    zoom: number,
    tileSize: number
  ): ExtendedTileInfo {
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

  export function EarthCoord2WMTSZ24P(longitude: number, latitude: number) {
    return {
      x: Math.floor(
        (Number(2.147483648e9) * ((longitude / 180) * Math.PI + Math.PI)) /
          Math.PI
      ),
      y: Math.floor(
        (Number(2.147483648e9) / Math.PI) *
          (Math.PI -
            Math.log(Math.tan(Math.PI / 4 + ((latitude / 180) * Math.PI) / 2)))
      ),
    };
  }

  export function WMTSZ24P2EarthCoord(x: number, y: number) {
    return {
      longitude:
        (((x * Math.PI) / Number(2.147483648e9) - Math.PI) / Math.PI) * 180,
      latitude:
        (((Math.atan(
          Math.exp(-(y / (Number(2.147483648e9) / Math.PI) - Math.PI))
        ) -
          Math.PI / 4) *
          2) /
          Math.PI) *
        180,
    };
  }

  export function DMS2D(minus: boolean, d: number, m: number, s: number) {
    return (minus ? -1 : 1) * (d + m / 60 + s / 3600);
  }
  const x_PI = (3.14159265358979324 * 3000.0) / 180.0;
  const PI = 3.1415926535897932384626;
  const a = 6378245.0;
  const ee = 0.00669342162296594323;

  export function outOfChina(lng: number, lat: number) {
    return (
      lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271 || false
    );
  }

  function transformlat(lng: number, lat: number) {
    var ret =
      -100.0 +
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

  function transformlng(lng: number, lat: number) {
    var ret =
      300.0 +
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

  export function wgs84togcj02(lng: number, lat: number): [number, number] {
    if (outOfChina(lng, lat)) {
      return [lng, lat];
    } else {
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

  export function getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    var R = 6371; // 地球半径，单位为千米
    var dLat = deg2rad(lat2 - lat1); // 将度数转换为弧度
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // 计算出的距离，单位为千米
    return d;
  }
  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

  export function getBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    // 将经纬度从度数转换为弧度
    var lat1Rad = deg2rad(lat1);
    var lon1Rad = deg2rad(lon1);
    var lat2Rad = deg2rad(lat2);
    var lon2Rad = deg2rad(lon2);

    // 计算经度差
    var dLon = lon2Rad - lon1Rad;

    // 计算方位角
    var y = Math.sin(dLon) * Math.cos(lat2Rad);
    var x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    var bearing = Math.atan2(y, x);

    // 将弧度转换为度数
    bearing = rad2deg(bearing);

    // 将角度转换为0到360度的范围
    bearing = (bearing + 360) % 360;

    return bearing;
  }
  function rad2deg(rad: number) {
    return rad * (180 / Math.PI);
  }
}
