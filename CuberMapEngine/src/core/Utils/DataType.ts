import { log } from "@zos/utils";
import { Coordinate } from "../MapEngine";

export namespace DataType {
  export class Matrix<ElementType> {
    _dataArray: ElementType[];
    _xLength: number;
    _yLength: number;
    constructor(xLength: number, yLength: number) {
      this._xLength = xLength;
      this._yLength = yLength;
      this._dataArray = Array<ElementType>(xLength * yLength);
    }
    get(x: number, y: number) {
      if (x < 0 || x >= this._xLength || y < 0 || y >= this._yLength)
        throw RangeError("Array index is out of range");
      return this._dataArray[x * this._yLength + y];
    }
    set(x: number, y: number, value: ElementType) {
      if (x < 0 || x >= this._xLength || y < 0 || y >= this._yLength)
        throw RangeError("Array index is out of range");
      this._dataArray[x * this._yLength + y] = value;
    }
    fill(value: ElementType) {
      for (let i = 0, len = this._xLength * this._yLength; i < len; ++i) {
        this._dataArray[i] = value;
      }
    }
  }

  export class TileReuseMatrix<ElementType> extends Matrix<ElementType> {
    _ifReusableArray: boolean[];
    _centerCoord: Coordinate | null = null;
    constructor(xLength: number, yLength: number, elements: ElementType[]) {
      super(xLength, yLength);
      this._ifReusableArray = Array<boolean>(xLength * yLength).fill(false);
      for (let i = 0; i < xLength; ++i)
        for (let j = 0; j < yLength; ++j) {
          this.set(i, j, elements[i * xLength + j]);
        }
    }
    getIfReuse(x: number, y: number) {
      if (x >= 0 && x < this._xLength && y >= 0 && y < this._yLength) {
        return this._ifReusableArray[x * this._yLength + y];
      }
      else throw RangeError(`out of matrix edge:x=${x},y=${y}`)
    }
    /**
     * Call when finish dealing with non-reusable element. Set element's reusable=true
     */
    dealed(x: number, y: number) {
      if (x >= 0 && x < this._xLength && y >= 0 && y < this._yLength) {
        this._ifReusableArray[x * this._yLength + y] = true;
      }
      else throw RangeError(`out of matrix edge:x=${x},y=${y}`)
    }

    setCenter(x: number, y: number) {
      if (this._centerCoord === null) {
        this._centerCoord = { x, y };
        return; // Because inited, Reuse Array Already filled with false
      }
      if (this._centerCoord.x == x && this._centerCoord.y == y) {
        return;
      }
      if (
        Math.abs(this._centerCoord.x - x) >= this._xLength ||
        Math.abs(this._centerCoord.y - y) >= this._yLength
      ) {
        this._ifReusableArray.fill(false);
        this._centerCoord = { x, y };
        return;
      }
      let oldMatrix = Array.from(this._dataArray);
      let dx = this._centerCoord.x - x,
        dy = this._centerCoord.y - y;
      let nonReusableList = <ElementType[]>[];
      this._ifReusableArray.fill(false);
      for (
        let oldX = 0, newX = oldX + dx;
        oldX < this._xLength;
        ++oldX, newX = oldX + dx
      )
        for (
          let oldY = 0, newY = oldY + dy;
          oldY < this._yLength;
          ++oldY, newY = oldY + dy
        ) {
          if (
            newX >= 0 &&
            newX < this._xLength &&
            newY >= 0 &&
            newY < this._yLength
          ) {
            // Reusable
            this.set(newX, newY, oldMatrix[oldX * this._xLength + oldY]);
            this._ifReusableArray[newX * this._xLength + newY] = true;
          } else {
            // Non-Reusable
            nonReusableList.push(oldMatrix[oldX * this._xLength + oldY]);
          }
        }
      // Place non-reusable element into empty place; TODO may be error?
      let p = 0;
      while (p < this._dataArray.length) {
        while (this._ifReusableArray[p] && p < this._dataArray.length) ++p;
        this._dataArray[p] = nonReusableList.pop()!;
        ++p;
      }
      this._centerCoord = { x, y };
    }
    fillIfReuse(ifReuse: boolean) {
      for (let i = 0; i < this._ifReusableArray.length; ++i)
        this._ifReusableArray[i] = ifReuse;
    }
  }
}
