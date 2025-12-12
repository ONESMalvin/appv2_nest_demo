<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# AppV2 NestJS 项目

## 开发环境设置

### 快速启动
```bash
# 一键启动开发环境（推荐）
./dev.sh

# 或者手动启动
npm run dev
```

### 分别启动
```bash
# 启动后端开发服务器（端口 8083）
npm run dev:backend

# 启动前端开发服务器（端口 8080）
npm run dev:web
```

## 开发环境特性

### 🔥 热重载
- **后端**: NestJS 自动监听文件变化并重启
- **前端**: Webpack 热模块替换 (HMR)

### 🌐 代理配置
前端开发服务器已配置代理，自动转发 API 请求到后端：
- 前端访问: `http://localhost:8080`
- 后端 API: `http://localhost:8083`
- 静态文件: `http://localhost:8083/static`

### 📁 项目结构
```
appv2-nest/
├── src/                 # NestJS 后端源码
├── web/                 # React 前端源码
├── dist/                # 后端构建输出
├── web/dist/           # 前端构建输出
└── package.json        # 根目录配置
```

## 构建命令

```bash
# 构建后端
npm run build

# 构建前端
npm run build:web

# 构建所有
npm run build:all
```

## 端口说明

- **8080**: 前端开发服务器
- **8083**: 后端 API 服务器
- **8083/static**: 静态文件服务

## 开发流程

1. 运行 `./dev.sh` 启动开发环境
2. 修改前端代码 → 自动热重载
3. 修改后端代码 → 自动重启服务
4. 访问 `http://localhost:8080` 进行开发调试
