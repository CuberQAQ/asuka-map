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
}
