# 铲泡屎 (Scoop a Scoop)

基于 UniApp + Vue 3 + Pinia 开发的宠物粪便上报与积分系统。旨在通过用户上报环境卫生、交通秩序、公共设施等问题，共同维护社区环境。

## 技术栈

- **核心框架**: [UniApp](https://uniapp.dcloud.io/) + [Vue 3](https://v3.vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **UI 组件库**: [uni-ui](https://uniapp.dcloud.io/component/uniui/uni-ui.html)
- **地图服务**: 腾讯地图 SDK (qqmap-wx-jssdk)
- **CSS 预处理**: SCSS

## 功能模块

### 1. 上报系统
- **多类型上报**: 支持环境卫生（10分）、交通秩序（15分）、公共设施（20分）等类型。
- **多媒体上传**: 支持图片和视频上传。
- **位置记录**: 自动获取并记录 GPS 定位信息。
- **状态追踪**: 待审核、已通过、已驳回状态实时更新。

### 2. 积分系统
- **积分获取**: 上报审核通过后自动获得对应积分。
- **积分榜**: 展示用户积分排名（周/月/总）。
- **积分记录**: 详细的积分获取明细，支持查看审核状态。

### 3. 用户中心
- **用户管理**: 微信一键登录/注册。
- **个人记录**: 查看填报历史，支持查看驳回原因。
- **基础服务**: 关于我们、隐私政策、个人信息管理。

### 4. 管理员审核
- **审核列表**: 查看所有待审核的上报记录。
- **审核操作**: 支持通过（发放积分）或驳回（填写驳回原因）。
- **详情查看**: 查看上报的图片、视频、位置及描述。

## 目录结构

```
src/
  ├── api/            # API 接口封装 (rank, report, system)
  ├── pages/          # 页面文件
  │   ├── index/      # 首页 (发现)
  │   ├── report/     # 上报页
  │   ├── rank/       # 排行榜
  │   ├── user/       # 用户中心 (个人信息, 记录, 历史, 隐私等)
  │   ├── login/      # 登录页
  │   └── admin/      # 管理员页面 (审核)
  ├── static/         # 静态资源 (图片, 图标)
  ├── store/          # Pinia 状态管理 (user, location)
  ├── uni_modules/    # UniApp 插件 (uni-ui, uni-config-center 等)
  ├── utils/          # 工具函数 (request, share, watermark)
  ├── App.vue         # 根组件
  ├── main.js         # 入口文件
  ├── manifest.json   # 应用配置
  ├── pages.json      # 路由及页面配置
  └── uni.scss        # 全局样式变量
cloudfunctions/       # 云函数目录
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发环境运行

**H5 (浏览器预览):**
```bash
npm run dev:h5
```

**微信小程序:**
```bash
npm run dev:mp-weixin
```

### 3. 生产环境构建

**H5:**
```bash
npm run build:h5
```

**微信小程序:**
```bash
npm run build:mp-weixin
```

## 配置说明

1.  **Manifest 配置**:
    - 请在 `src/manifest.json` 中配置实际的 AppID (`appid` 和 `mp-weixin.appid`)。
    - 当前配置的微信小程序 AppID 为 `wxddf493599e25cf44`。
    - H5 端使用了腾讯地图 Key: `LWHBZ-LKJ34-HABUE-X55XF-BZNPK-2AB7I`。

2.  **图标配置**:
    - 底部导航栏图标位于 `src/static/tabbar/`。
    - 默认包含 `report.png`, `rank.png`, `user.png` 及其选中态图标。

3.  **Mock 数据**:
    - 项目部分接口可能使用了 Mock 数据，实际部署时请确保后端服务（或云函数）正常运行。
