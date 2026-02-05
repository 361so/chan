# 铲一铲 (Scoop a Scoop)

基于 UniApp + Vue 3 + Pinia 开发的宠物粪便上报与积分系统。

## 技术栈

- **框架**: UniApp + Vue 3
- **构建工具**: Vite
- **状态管理**: Pinia
- **样式**: SCSS (uni-ui 可选)

## 功能模块

1.  **上报系统**: GPS定位、拍照上传（3张）、文字描述。
2.  **积分系统**: 上报获积分、排行榜（周/月/总）。
3.  **用户中心**: 登录、个人信息、积分记录。

## 目录结构

```
src/
  ├── pages/          # 页面 (index, rank, user, login)
  ├── static/         # 静态资源 (需自行添加 tabbar 图标)
  ├── store/          # Pinia 状态管理
  ├── utils/          # 工具函数
  ├── App.vue         # 根组件
  ├── main.js         # 入口文件
  ├── pages.json      # 路由配置
  └── uni.scss        # 全局样式变量
```

## 快速开始

1.  安装依赖:
    ```bash
    npm install
    ```

2.  运行到 H5 (浏览器):
    ```bash
    npm run dev:h5
    ```

3.  运行到 微信小程序:
    ```bash
    npm run dev:mp-weixin
    ```

## 注意事项

- 项目中使用了 Mock 数据模拟登录和上传。
- 请在 `src/static/tabbar/` 下放入对应的图标文件 (`report.png`, `rank.png`, `user.png` 等) 以正常显示底部导航栏。
- 需在 `manifest.json` 中配置实际的 AppID。
