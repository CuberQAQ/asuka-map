# Asuka Map

## 项目结构
- client_watch: Zepp OS 设备小程序
- CuberMapEngine: 地图库，给小程序使用
- server: 用于测试的简易地图瓦片服务器
- zimg: 基于.net环境，用命令行将png和Zepp OS tga图片互转

## 说明
服务端不是必须的，如果你的Zepp OS设备可以使用transfer-file、download和image_convert api，直接去百度搜高德、腾讯地图之类的公开瓦片服务api的url，就不用自己部署服务器。

## 开发

### 前置条件
1. CuberMapEngine使用TypeScript开发，如果你想编译，请先安装typescript编译器。
```bash
npm install -g typescript
```
之后在 CuberMapEngine 文件夹中执行tsc即可编译成js

注：服务端可能用到`zimg.exe`来转换png和tga，请先加入到环境变量中.
