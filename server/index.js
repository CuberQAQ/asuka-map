import child_process from "child_process";
import express from "express";
import {
  createWriteStream,
  writeFileSync,
  existsSync,
  WriteStream,
  readFileSync,
} from "fs";
import path from "path";
import request from "request";
import { promisify } from "util";
// import sharp from "sharp";
import jimp from "jimp";
import { deflateSync } from "fflate";
let PORT = 14514;
const app = express();
const exec = promisify(child_process.exec);
app.use(express.json());
app.use(express.static("public"));

/**
 * @param {string} url
 * @param {WriteStream} dest
 * @param {(err:any, dest:WriteStream)=>void} cb
 */
const fetchTileCb = (url, dest, cb) => {
  request.get(url).pipe(dest).on("finish", cb);
  return dest;
};
const fetchTile = promisify(fetchTileCb);

function getFileName(type, zoom, tileX, tileY) {
  return `${type}_z${zoom}x${tileX}y${tileY}`;
}

app.get("/imgtile", async (req, res) => {
  let utc = Date.now();
  let fileName = getFileName(
    "vec",
    req.query.zoom,
    req.query.tileX,
    req.query.tileY
  );
  console.log(`[${fileName}] 发送文件...`);
  let fileDir = "./public";
  let filePathRaw = path.join(fileDir, fileName + ".raw");
  let filePathRawCvg = path.join(fileDir, fileName + "_cvg.raw");
  let filePathRes = path.join(fileDir, fileName + ".png");

  if (!existsSync(filePathRes)) {
    writeFileSync(filePathRaw, "");
    writeFileSync(filePathRawCvg, "");
    writeFileSync(filePathRes, "");
    let stream = createWriteStream(filePathRaw);
    let streamCvg = createWriteStream(filePathRawCvg);
    await Promise.all([
      fetchTile(
        `http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${req.query.zoom}&TILEROW=${req.query.tileY}&TILECOL=${req.query.tileX}&tk=7a4866131a483b65961af674d665908d`,
        stream
      ),
      fetchTile(
        `http://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${req.query.zoom}&TILEROW=${req.query.tileY}&TILECOL=${req.query.tileX}&tk=7a4866131a483b65961af674d665908d`,
        streamCvg
      ),
    ]);
    // let {data, info}= await sharp(filePathRaw).sharpen().modulate({: 1.5}).toFile(filePathRes)
    let image = await jimp.read(filePathRaw);

    image
      // .scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
      //   const red = image.bitmap.data[idx];
      //   const green = image.bitmap.data[idx + 1];
      //   const blue = image.bitmap.data[idx + 2];
      //   if (red === 245 && green === 244 && blue === 238) {
      //     // 将该像素设为黑色
      //     image.bitmap.data[idx] = 32; // 红色通道
      //     image.bitmap.data[idx + 1] = 38; // 绿色通道
      //     image.bitmap.data[idx + 2] = 48; // 蓝色通道
      //   }
      //   else if (red === 249 && green === 250 && blue === 243) {
      //     image.bitmap.data[idx] = 50; // 红色通道
      //     image.bitmap.data[idx + 1] = 50; // 绿色通道
      //     image.bitmap.data[idx + 2] = 50; // 蓝色通道
      //   }
      // })
      // .resize(192,192)
      // .convolute([
      //   [0, -1, 0],
      //   [-1, 5, -1],
      //   [0, -1, 0],
      // ])
      // .convolute([
      //   [-1, -1, -1],
      //   [-1, 9, -1],
      //   [-1, -1, -1],
      // ])
      .composite(await jimp.read(filePathRawCvg), 0, 0)
      // .color([{apply:"darken",params:[25]}])
      // .contrast(0.5)

      .write(filePathRes);
    await exec(`zimg ${filePathRes} -a lq`);
    // let buf = readFileSync(filePathRes)
    // writeFileSync(filePathRes, {buffer: deflateSync(buf)})
    res.download(filePathRes, fileName + ".png", (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(
          `[${fileName}] 文件发送成功[${((Date.now() - utc) / 1000).toFixed(
            3
          )}s]`
        );
      }
    });
  } else {
    res.download(filePathRes, fileName + ".png", (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(
          `[${fileName}] 文件发送成功(已缓存)[${(
            (Date.now() - utc) /
            1000
          ).toFixed(3)}s]`
        );
      }
    });
  }
});
app.listen(PORT);
console.log(`Server listening (${PORT})...`);
