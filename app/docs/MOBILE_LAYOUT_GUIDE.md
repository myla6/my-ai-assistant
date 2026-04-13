# 移动端 CSS 布局完全指南

> 本文档整理了移动端 CSS 布局的完整知识体系，从基础到进阶，从理论到实战。

## 目录

1. [现代 CSS 布局方案](#1-现代-css-布局方案)
2. [移动端布局方案演进](#2-移动端布局方案演进)
3. [rpx 详解](#3-rpx-详解)
4. [H5 与移动端现状](#4-h5-与移动端现状)
5. [跨端框架布局方案](#5-跨端框架布局方案)
6. [H5 接入 App 完整流程](#6-h5-接入-app-完整流程)
7. [移动端布局进阶技巧](#7-移动端布局进阶技巧)
8. [CSS 硬件加速详解](#8-css-硬件加速详解)
9. [实战案例与最佳实践](#9-实战案例与最佳实践)

---

## 1. 现代 CSS 布局方案

### 1.1 Flexbox（弹性盒布局）

最常用的一维布局方案，适合处理行或列的布局。

```css
.container {
  display: flex;
  justify-content: space-between; /* 主轴对齐 */
  align-items: center; /* 交叉轴对齐 */
  gap: 1rem; /* 子元素间距 */
}

.item {
  flex: 1; /* 等分空间 */
  /* 或者 flex: 0 0 200px; 固定宽度 */
}
```

**典型场景：**
- 导航栏
- 卡片内部布局
- 垂直居中
- 等高列

### 1.2 Grid（网格布局）

二维布局的最佳选择，可以同时控制行和列。

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 响应式网格 */
  gap: 2rem;
}

/* 或者显式定义 */
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
}

.header { grid-area: header; }
```

**典型场景：**
- 页面整体布局
- 卡片网格
- 复杂的表单布局
- 图片画廊

### 1.3 Container Queries（容器查询）

根据父容器尺寸而非视口尺寸来应用样式，真正的组件级响应式。

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 150px 1fr;
  }
}
```

### 1.4 现代组合方案

实际项目中通常组合使用：

```css
/* 页面整体：Grid */
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* 导航栏：Flexbox */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 内容区：Grid + Container Queries */
.content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  container-type: inline-size;
}
```

### 1.5 实用技巧

```css
/* 居中万能方案 */
.center {
  display: grid;
  place-items: center;
}

/* 自适应列数 */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
}

/* Flexbox 换行布局 */
.flex-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-wrap > * {
  flex: 1 1 300px; /* 最小 300px，可增长 */
}
```

### 1.6 选择建议

- 一维布局（单行/单列）→ Flexbox
- 二维布局（行+列）→ Grid
- 组件内部响应式 → Container Queries
- 需要对齐父网格 → Subgrid
- 简单居中 → Grid place-items

---

## 2. 移动端布局方案演进

### 2.1 固定 px 时代（2010-2012）

最早期的做法，直接用设计稿的 px 值。

```css
.container {
  width: 320px; /* iPhone 3/4 的宽度 */
  font-size: 14px;
}
```

**问题：**
- 不同屏幕尺寸显示效果差异大
- 高分辨率屏幕（Retina）显示模糊
- 完全不具备响应式能力

### 2.2 媒体查询断点时代（2012-2015）

通过 `@media` 针对不同屏幕尺寸写不同样式。

```css
/* 移动端 */
.container {
  width: 100%;
  padding: 10px;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    width: 750px;
    padding: 20px;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    width: 1000px;
    padding: 30px;
  }
}
```

**问题：**
- 断点之间的尺寸适配不够平滑
- 代码冗余，维护成本高
- 需要为每个断点写一套样式

### 2.3 rem 方案（2015-2018）

根据屏幕宽度动态设置根元素字体大小，所有尺寸用 rem 单位。

```javascript
// 设置根字号（通常在 HTML head 中）
(function() {
  const baseSize = 16; // 基准字号
  const baseWidth = 375; // 设计稿宽度
  const scale = document.documentElement.clientWidth / baseWidth;
  document.documentElement.style.fontSize = baseSize * scale + 'px';
})();
```

```css
/* 设计稿 750px，元素宽度 100px */
.box {
  width: 1rem; /* 100 / 100 = 1rem */
  font-size: 0.28rem; /* 28 / 100 = 0.28rem */
}
```

**优点：**
- 真正的等比缩放
- 一套代码适配所有屏幕

**问题：**
- 需要 JS 计算
- 大屏幕上元素可能过大
- 字体缩放可能不符合阅读习惯

### 2.4 vw 方案（2018-2020）

直接用视口单位，不需要 JS。

```css
/* 设计稿 375px，元素 100px */
.box {
  width: 26.67vw; /* 100 / 375 * 100 = 26.67vw */
  font-size: 4.27vw; /* 16 / 375 * 100 */
}

/* 通常配合 PostCSS 插件自动转换 */
```

**优点：**
- 纯 CSS 方案，无需 JS
- 性能更好
- 真正的流式布局

**问题：**
- 大屏幕上元素依然会无限放大
- 字体在大屏上可能过大

### 2.5 vw + clamp() 现代方案（2020-至今）

结合 `clamp()` 函数限制最小最大值，实现流式布局的同时控制边界。

```css
/* clamp(最小值, 理想值, 最大值) */

.container {
  /* 宽度在 320px 到 1200px 之间流式变化 */
  width: clamp(320px, 90vw, 1200px);
  padding: clamp(1rem, 5vw, 3rem);
}

.title {
  /* 字体在 18px 到 48px 之间流式变化 */
  font-size: clamp(1.125rem, 2.5vw + 1rem, 3rem);
}

.card {
  /* 结合 calc 实现更精确的控制 */
  font-size: clamp(14px, calc(12px + 0.5vw), 18px);
}
```

### 2.6 工程化解决方案

结合多种技术的混合方案：

```css
:root {
  /* 使用 CSS 变量 + clamp 定义设计系统 */
  --space-xs: clamp(0.5rem, 1vw, 0.75rem);
  --space-sm: clamp(0.75rem, 2vw, 1rem);
  --space-md: clamp(1rem, 3vw, 1.5rem);
  --space-lg: clamp(1.5rem, 4vw, 2rem);
  --space-xl: clamp(2rem, 5vw, 3rem);
  
  --font-xs: clamp(0.75rem, 1.5vw, 0.875rem);
  --font-sm: clamp(0.875rem, 2vw, 1rem);
  --font-base: clamp(1rem, 2.5vw, 1.125rem);
  --font-lg: clamp(1.125rem, 3vw, 1.5rem);
  --font-xl: clamp(1.5rem, 4vw, 2.5rem);
}

.container {
  padding: var(--space-md);
  font-size: var(--font-base);
}

/* 配合 Container Queries 实现组件级响应式 */
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    padding: var(--space-lg);
    font-size: var(--font-lg);
  }
}
```

### 2.7 实战配置示例

```css
/* 在 globals.css 或 Tailwind 配置中 */
@layer base {
  html {
    /* 基础字号使用 clamp */
    font-size: clamp(14px, 2vw, 16px);
  }
  
  body {
    /* 容器最大宽度 */
    max-width: 1440px;
    margin: 0 auto;
    padding: clamp(1rem, 5vw, 2rem);
  }
}

/* 实用类 */
.fluid-text-sm { font-size: clamp(0.875rem, 1.5vw, 1rem); }
.fluid-text-base { font-size: clamp(1rem, 2vw, 1.125rem); }
.fluid-text-lg { font-size: clamp(1.125rem, 2.5vw, 1.5rem); }
.fluid-text-xl { font-size: clamp(1.5rem, 3vw, 2.5rem); }

.fluid-space-sm { padding: clamp(0.5rem, 2vw, 1rem); }
.fluid-space-md { padding: clamp(1rem, 3vw, 2rem); }
.fluid-space-lg { padding: clamp(2rem, 5vw, 4rem); }
```

---

## 3. rpx 详解

### 3.1 rpx 是什么

rpx（responsive pixel）= 响应式像素，是微信小程序发明的单位，后来被 Taro、uni-app 等跨端框架采用。

**核心规则：**
```
规定：屏幕宽度 = 750rpx（固定值）

换算公式：
1rpx = 屏幕宽度 / 750

实际像素 = rpx值 × (屏幕宽度 / 750)
```

### 3.2 不同设备上的换算

#### iPhone 6/7/8（375px 宽度）
```
屏幕宽度：375px
1rpx = 375 / 750 = 0.5px

示例：
100rpx = 100 × 0.5 = 50px
750rpx = 750 × 0.5 = 375px（全屏宽）
```

#### iPhone 6 Plus（414px 宽度）
```
屏幕宽度：414px
1rpx = 414 / 750 = 0.552px

示例：
100rpx = 100 × 0.552 = 55.2px
750rpx = 750 × 0.552 = 414px（全屏宽）
```

#### iPhone 12/13（390px 宽度）
```
屏幕宽度：390px
1rpx = 390 / 750 = 0.52px

示例：
100rpx = 100 × 0.52 = 52px
750rpx = 750 × 0.52 = 390px（全屏宽）
```

#### Android 设备（360px 宽度，常见）
```
屏幕宽度：360px
1rpx = 360 / 750 = 0.48px

示例：
100rpx = 100 × 0.48 = 48px
750rpx = 750 × 0.48 = 360px（全屏宽）
```

### 3.3 为什么是 750rpx？

因为 iPhone 6/7/8 的设计稿通常是 **750px 宽**（物理分辨率）。

```
iPhone 6 的屏幕：
- 逻辑分辨率：375 × 667 px
- 物理分辨率：750 × 1334 px
- DPR（设备像素比）：2

设计师给的设计稿：750px 宽
开发时直接用设计稿的 px 值作为 rpx 值
```

### 3.4 rpx 的使用场景

```css
/* ✅ 用 rpx 的场景 */
.container {
  width: 700rpx;          /* 容器宽度 */
  height: 400rpx;
  padding: 30rpx;         /* 内边距 */
  margin: 0 25rpx;        /* 外边距 */
}

.image {
  width: 200rpx;          /* 图片尺寸 */
  height: 200rpx;
}

/* ✅ 用 px 的场景 */
.text {
  font-size: 14px;        /* 字体大小 */
  line-height: 1.5;       /* 行高用倍数 */
}

.divider {
  border-bottom: 1px solid #eee;  /* 细线 */
}

/* ✅ 用 % 的场景 */
.half-width {
  width: 50%;             /* 父元素的一半 */
}
```

### 3.5 rpx 的实际开发流程

#### 1. 设计师给设计稿（750px 宽）

```
设计稿标注：
- 容器宽度：700px
- 左右边距：25px
- 标题字号：36px
- 内容字号：28px
```

#### 2. 开发直接用 rpx

```css
.container {
  width: 700rpx;          /* 直接用设计稿的值 */
  margin: 0 25rpx;
}

.title {
  font-size: 36rpx;       /* 或者用 18px（36/2） */
}

.content {
  font-size: 28rpx;       /* 或者用 14px（28/2） */
}
```

#### 3. 在不同设备上自动适配

```
iPhone 6（375px）：
- 700rpx = 350px
- 25rpx = 12.5px

iPhone 12（390px）：
- 700rpx = 364px
- 25rpx = 13px

Android（360px）：
- 700rpx = 336px
- 25rpx = 12px
```

### 3.6 rpx 的注意事项

#### 1. 小数像素问题

```css
/* rpx 可能计算出小数像素 */
.box {
  width: 100rpx;  /* 在 iPhone 6 上 = 50px */
                  /* 在 Android 上 = 48px */
                  /* 在某些设备上可能是 49.5px */
}

/* 小数像素会被浏览器四舍五入，可能导致：*/
/* - 边缘模糊 */
/* - 布局错位（多个元素累计误差） */
```

**解决方案：**
```css
/* 关键尺寸用能被整除的值 */
.box {
  width: 750rpx;   /* ✅ 总是整数 */
  width: 375rpx;   /* ✅ 在 iPhone 6 上是整数 */
  width: 100rpx;   /* ⚠️ 可能有小数 */
}
```

#### 2. 字体大小的争议

```css
/* 方案 A：用 rpx（会随屏幕缩放） */
.text {
  font-size: 28rpx;  /* 小屏 13px，大屏 15px */
}

/* 方案 B：用 px（固定大小） */
.text {
  font-size: 14px;   /* 所有屏幕都是 14px */
}

/* 推荐：正文用 px，标题用 rpx */
.title {
  font-size: 36rpx;  /* 标题可以缩放 */
}

.content {
  font-size: 14px;   /* 正文固定，保证可读性 */
}
```

#### 3. 边框不要用 rpx

```css
/* ❌ 错误 */
.box {
  border: 1rpx solid #ccc;  /* 大屏上会很粗 */
}

/* ✅ 正确 */
.box {
  border: 1px solid #ccc;   /* 固定 1px */
}

/* 如果需要更细的线（0.5px） */
.hairline {
  border: 0.5px solid #ccc;  /* 部分设备支持 */
}

/* 或者用伪元素 + transform */
.hairline::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: #ccc;
  transform: scaleY(0.5);  /* 缩小到 0.5px */
}
```

#### 4. rpx 在 H5 中的转换

```css
/* 小程序中 */
.box {
  width: 375rpx;  /* 屏幕宽度的一半 */
}

/* Taro 编译到 H5 后 */
.box {
  width: 50vw;    /* 或者转换为 rem */
}
```

### 3.7 rpx vs 其他单位对比

| 单位 | 是否响应式 | 基准 | 适用场景 | 小程序支持 |
|------|-----------|------|----------|-----------|
| **rpx** | ✅ | 屏幕宽度 = 750rpx | 布局、间距 | ✅ |
| **px** | ❌ | 固定像素 | 边框、字体 | ✅ |
| **rem** | ✅ | 根元素字号 | H5 响应式 | ❌ |
| **vw** | ✅ | 视口宽度 | H5 流式布局 | ❌ |
| **%** | ✅ | 父元素尺寸 | 相对布局 | ✅ |

---

## 4. H5 与移动端现状

### 4.1 H5 还活跃的场景

#### 营销活动页（最大的使用场景）
- 电商大促活动页（双11、618）
- 品牌营销 H5（互动游戏、抽奖）
- 裂变分享页（拼团、砍价）
- 问卷调查、投票页面

**为什么用 H5：**
- 快速上线，不需要发版
- 跨平台分享（微信、QQ、浏览器都能打开）
- 开发成本低，一套代码到处跑

#### 内嵌在 App 里的 WebView
- App 内的活动页
- 帮助中心、用户协议
- 商品详情页（部分电商）
- 资讯内容页

#### 微信生态（依然很大）
- 微信公众号文章内的交互页面
- 微信内的 H5 游戏/活动
- 企业微信的应用页面

#### 独立的移动网站
- 官网的移动版
- 工具类网站（计算器、查询工具）
- 内容类网站（新闻、博客）
- PWA 应用

### 4.2 现在的移动端开发格局

**实际占比（根据行业观察）：**

```
小程序：40%
├─ 微信小程序（最大头）
├─ 支付宝小程序
├─ 抖音小程序
└─ 其他平台小程序

原生 App：30%
├─ iOS（Swift/SwiftUI）
├─ Android（Kotlin）
└─ 跨平台（Flutter/React Native）

H5/Web：25%
├─ 内嵌 WebView（最多）
├─ 营销活动页
├─ 移动网站
└─ PWA

其他：5%
└─ 快应用、鸿蒙应用等
```

### 4.3 H5 vs 小程序 vs 原生 - 选择逻辑

#### 什么时候用 H5

```
✅ 适合 H5 的场景：
- 临时活动页（上线快，结束就下）
- 需要跨平台分享的页面
- 内容展示为主的页面
- 预算有限的项目
- 需要 SEO 的页面

❌ 不适合 H5：
- 需要复杂交互的应用
- 需要调用大量原生能力
- 对性能要求极高
- 需要离线使用
```

#### 什么时候用小程序

```
✅ 适合小程序：
- 微信生态内的业务
- 中等复杂度的应用
- 需要微信支付、分享等能力
- 电商、本地生活类应用
- 不想开发 App 但需要类原生体验

❌ 不适合小程序：
- 跨平台分享（小程序只能在对应平台打开）
- 包体积超过限制（主包 2M）
- 需要使用小程序不支持的 API
```

#### 什么时候用原生 App

```
✅ 适合原生：
- 复杂的业务逻辑
- 需要极致性能
- 需要完整的原生能力
- 大型应用（社交、视频、游戏）
- 需要后台运行

❌ 不适合原生：
- 预算有限
- 开发周期紧
- 团队没有原生开发能力
```

### 4.4 实际项目中的混合方案（最常见）

#### 方案 1：App + 内嵌 H5
```
原生 App 做核心功能
├─ 首页、个人中心（原生）
├─ 核心业务流程（原生）
└─ 活动页、帮助页（H5）

优点：兼顾性能和灵活性
```

#### 方案 2：小程序 + H5
```
小程序做主体
├─ 核心功能（小程序）
└─ 营销活动（H5，通过 web-view 打开）

优点：开发成本低，覆盖微信生态
```

#### 方案 3：全端覆盖
```
一套代码，多端部署
├─ H5（浏览器、WebView）
├─ 小程序（微信、支付宝）
├─ App（React Native/Flutter）
└─ 桌面端（Electron）

工具：Taro、uni-app、React Native
```

---

