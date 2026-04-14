# Flexbox 和 Grid 布局完全指南

> 深入理解 Flexbox 和 Grid 的底层原理、使用方法和最佳实践

## 目录

1. [核心原理对比](#1-核心原理对比)
2. [Flexbox 深度解析](#2-flexbox-深度解析)
3. [Grid 深度解析](#3-grid-深度解析)
4. [响应式布局](#4-响应式布局)
5. [断点系统详解](#5-断点系统详解)
6. [实战案例](#6-实战案例)
7. [常见问题解答](#7-常见问题解答)

---

## 1. 核心原理对比

### 1.1 设计思路的本质区别

#### Flexbox：空间分配算法（内容驱动）

**核心问题：**
```
"我有一些元素，容器大小可能变化，如何让它们自动适应？"
```

**解决方案：**
```
1. 确定一个方向（主轴）
2. 沿着这个方向排列元素
3. 自动计算每个元素应该占多少空间
4. 空间多了就分配（flex-grow）
5. 空间少了就收缩（flex-shrink）
```

**图示：**
```
容器 600px，3 个元素（每个 100px）

初始状态：
┌────────────────────────────────────────┐
│[100px][100px][100px]  剩余 300px      │
└────────────────────────────────────────┘

flex-grow: 1（自动分配剩余空间）：
┌────────────────────────────────────────┐
│[200px]  [200px]  [200px]               │
└────────────────────────────────────────┘
每个分到 100px，最终 200px

容器变小到 200px（空间不足）：
┌────────────────────┐
│[67px][67px][66px]  │
└────────────────────┘
flex-shrink 自动收缩
```

#### Grid：坐标系统（布局驱动）

**核心问题：**
```
"我要一个 3×3 的格子，每个格子放什么？"
```

**解决方案：**
```
1. 画网格线（定义坐标系）
2. 计算每个轨道的尺寸
3. 元素按坐标放置
4. 不需要关心元素内容，格子就在那里
```

**图示：**
```
grid-template-columns: 1fr 2fr 1fr

步骤 1：画网格线
     1      2          3      4
  ┌──────┬──────────┬──────┐
1 │      │          │      │
  ├──────┼──────────┼──────┤
2 │      │          │      │
  └──────┴──────────┴──────┘
3

步骤 2：计算轨道尺寸（容器 600px）
1fr + 2fr + 1fr = 4fr
1fr = 600 / 4 = 150px

轨道 1: 150px
轨道 2: 300px
轨道 3: 150px

步骤 3：放置元素
元素 A: grid-column: 1 / 3
       → 从线 1 到线 3
       → 占据轨道 1 和轨道 2
       → 宽度 = 150 + 300 = 450px

格子已经画好了，元素只是填进去而已
```

### 1.2 核心区别总结

| 特性 | Flexbox | Grid |
|------|---------|------|
| **维度** | 一维（行或列） | 二维（行和列） |
| **设计思路** | 内容驱动 | 布局驱动 |
| **核心算法** | 空间分配 | 坐标定位 |
| **适用场景** | 组件内部布局 | 页面整体布局 |
| **灵活性** | 高（内容决定布局） | 低（布局决定内容位置） |
| **精确性** | 低（自动计算） | 高（精确控制） |

**类比理解：**
```
Flexbox = 排队
- 大家站成一排
- 空间多了就散开点
- 空间少了就挤一挤
- 灵活，但只能一个方向

Grid = Excel 表格
- 先画好格子
- 内容往格子里填
- 格子是固定的
- 精确，可以控制行和列
```

### 1.3 选择建议

```
用 Flexbox：
✅ 一维布局（一行或一列）
✅ 内容数量不确定
✅ 需要自动适应
✅ 组件内部布局
✅ 导航栏、按钮组、标签云

用 Grid：
✅ 二维布局（行+列）
✅ 结构固定
✅ 需要精确控制
✅ 页面整体布局
✅ 卡片网格、图片画廊、仪表盘

混合使用：
✅ Grid 做整体布局
✅ Flexbox 做局部布局
```

---

## 2. Flexbox 深度解析

### 2.1 Flexbox 的底层计算原理

#### 浏览器的计算流程

```javascript
// 伪代码：浏览器内部的 Flexbox 布局算法

function calculateFlexLayout(container, items) {
  // 步骤 1：确定主轴方向
  const mainAxis = container.flexDirection; // row 或 column

  // 步骤 2：计算每个子元素的基础尺寸（flex-basis）
  let totalBasis = 0;
  items.forEach(item => {
    item.basis = item.flexBasis || item.width || item.contentWidth;
    totalBasis += item.basis;
  });

  // 步骤 3：计算剩余空间或超出空间
  let freeSpace = container.width - totalBasis;

  // 步骤 4：分配或收缩
  if (freeSpace > 0) {
    // 有剩余空间，使用 flex-grow 分配
    let totalGrow = items.reduce((sum, item) => sum + item.flexGrow, 0);
    if (totalGrow > 0) {
      items.forEach(item => {
        let growAmount = (freeSpace * item.flexGrow) / totalGrow;
        item.finalWidth = item.basis + growAmount;
      });
    }
  } else if (freeSpace < 0) {
    // 空间不足，使用 flex-shrink 收缩
    let totalShrink = items.reduce((sum, item) => {
      return sum + (item.flexShrink * item.basis);
    }, 0);
    if (totalShrink > 0) {
      items.forEach(item => {
        let shrinkAmount = (Math.abs(freeSpace) * item.flexShrink * item.basis) / totalShrink;
        item.finalWidth = item.basis - shrinkAmount;
      });
    }
  }

  // 步骤 5：应用对齐属性
  applyAlignment(items, container.justifyContent, container.alignItems);

  return items;
}
```

**Flexbox 的本质就是这个公式：**
```
最终尺寸 = 基础尺寸 + 分配的空间（或 - 收缩的空间）
```

### 2.2 详细计算示例

#### 场景 1：有剩余空间（flex-grow 生效）

```css
.container {
  width: 600px;
  display: flex;
}
.item-a { width: 100px; flex-grow: 1; }
.item-b { width: 100px; flex-grow: 2; }
.item-c { width: 100px; flex-grow: 0; }
```

**计算过程：**
```
1. 基础尺寸总和：100 + 100 + 100 = 300px
2. 剩余空间：600 - 300 = 300px
3. 权重总和：1 + 2 + 0 = 3
4. 单位权重空间：300 / 3 = 100px

5. 分配：
   A: 100 + (100 × 1) = 200px
   B: 100 + (100 × 2) = 300px
   C: 100 + (100 × 0) = 100px

6. 验证：200 + 300 + 100 = 600px ✓
```

**图示：**
```
初始状态：
┌────────────────────────────────────────────────────────┐
│ [A:100px] [B:100px] [C:100px]  剩余:300px              │
└────────────────────────────────────────────────────────┘

分配后：
┌────────────────────────────────────────────────────────┐
│ [A:200px]    [B:300px]        [C:100px]                │
└────────────────────────────────────────────────────────┘
```

#### 场景 2：空间不足（flex-shrink 生效）

```css
.container {
  width: 600px;
  display: flex;
}
.item-a { width: 300px; flex-shrink: 1; }
.item-b { width: 300px; flex-shrink: 2; }
.item-c { width: 300px; flex-shrink: 0; }
```

**计算过程：**
```
1. 基础尺寸总和：300 + 300 + 300 = 900px
2. 超出空间：900 - 600 = 300px
3. 权重总和：1 + 2 + 0 = 3
4. 单位权重收缩：300 / 3 = 100px

5. 收缩：
   A: 300 - (100 × 1) = 200px
   B: 300 - (100 × 2) = 100px
   C: 300 - (100 × 0) = 300px（flex-shrink:0 不收缩）

6. 验证：200 + 100 + 300 = 600px ✓
```

**图示：**
```
初始状态（超出容器）：
┌────────────────────────────────────────────────────────┐
│ [A:300px]      [B:300px]      [C:300px]      │超出300px
└────────────────────────────────────────────────────────┘

收缩后：
┌────────────────────────────────────────────────────────┐
│ [A:200px]  [B:100px]      [C:300px]                    │
└────────────────────────────────────────────────────────┘
```

### 2.3 flex-grow 和 flex-shrink 的关系

**它们不是互斥的，而是互补的：**

```
有剩余空间 → flex-grow 生效，flex-shrink 不生效
空间不足   → flex-shrink 生效，flex-grow 不生效
空间刚好   → 两个都不生效
```

```css
/* 同一个元素可以同时设置两个 */
.item {
  flex-grow: 1;    /* 有剩余空间时增长 */
  flex-shrink: 1;  /* 空间不足时收缩 */
  flex-basis: 200px;
}

/* 简写：flex: grow shrink basis */
.item {
  flex: 1 1 200px;
}

/* 常用简写 */
.item { flex: 1; }     /* flex: 1 1 0% */
.item { flex: auto; }  /* flex: 1 1 auto */
.item { flex: none; }  /* flex: 0 0 auto（不伸缩） */
```

### 2.4 主轴和交叉轴

```
flex-direction: row（默认）
┌─────────────────────────────────┐
│  →  →  →  →  →  →  →  →  →   │ 主轴（水平）
│  [A]  [B]  [C]                  │
│                                 │ ↕ 交叉轴（垂直）
└─────────────────────────────────┘

flex-direction: column
┌─────────────────────────────────┐
│  [A]                            │ ↕ 主轴（垂直）
│  [B]                            │
│  [C]                            │
│  →  →  →  →  →  →  →  →  →   │ 交叉轴（水平）
└─────────────────────────────────┘
```

**对齐属性：**
```css
.container {
  display: flex;

  /* 主轴对齐 */
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;

  /* 交叉轴对齐 */
  align-items: flex-start | flex-end | center | stretch | baseline;

  /* 多行时交叉轴对齐 */
  align-content: flex-start | flex-end | center | space-between | space-around;
}

/* 单个子元素覆盖交叉轴对齐 */
.item {
  align-self: flex-start | flex-end | center | stretch;
}
```

### 2.5 常用 Flexbox 布局模式

#### 水平垂直居中

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 更简洁的写法（Grid） */
.center {
  display: grid;
  place-items: center;
}
```

#### 导航栏（两端对齐）

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}
```

#### 卡片底部固定

```css
.card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-body {
  flex: 1; /* 占满剩余空间 */
}

.card-footer {
  /* 自动被推到底部 */
}
```

#### 等宽列

```css
.columns {
  display: flex;
  gap: 1rem;
}

.column {
  flex: 1; /* 等分空间 */
}
```

### 2.6 圣杯布局（Flexbox 实现）

```
┌─────────────────────────────────┐
│          Header                 │
├──────┬──────────────┬───────────┤
│ Nav  │    Main      │    Ads    │
│      │   Content    │           │
├──────┴──────────────┴───────────┤
│          Footer                 │
└─────────────────────────────────┘
```

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header, .footer {
  flex-shrink: 0; /* 不收缩 */
}

.body {
  display: flex;
  flex: 1; /* 占满剩余高度 */
}

.nav, .ads {
  width: 200px;
  flex-shrink: 0;
}

.main {
  flex: 1; /* 占满剩余宽度 */
}
```

### 2.7 gap 和 order

```css
/* gap：子元素之间的间距 */
.container {
  display: flex; /* 必须是 flex 或 grid 容器 */
  gap: 1rem;           /* 行列都是 1rem */
  gap: 1rem 2rem;      /* 行间距 1rem，列间距 2rem */
  row-gap: 1rem;       /* 只设置行间距 */
  column-gap: 2rem;    /* 只设置列间距 */
}

/* order：改变视觉顺序（不改变 DOM 顺序） */
.item-a { order: 2; }  /* 默认 order: 0 */
.item-b { order: 1; }
.item-c { order: 3; }
/* 视觉顺序：B → A → C */
/* DOM 顺序不变：A → B → C */
```

**注意：order 只改变视觉顺序，屏幕阅读器仍按 DOM 顺序读取。**

---

## 3. Grid 深度解析

### 3.1 Grid 的底层原理

Grid 的本质是**坐标系统**，先画网格线，再放置元素。

#### 网格线的概念

```
n 列 = n+1 条垂直线
n 行 = n+1 条水平线

3 列 2 行的网格：
     1      2      3      4   ← 垂直线编号
  ┌──────┬──────┬──────┐
1 │  A   │  B   │  C   │
  ├──────┼──────┼──────┤
2 │  D   │  E   │  F   │
  └──────┴──────┴──────┘
3   ↑ 水平线编号

元素 A 占据：
- 列：线 1 到线 2（第 1 列轨道）
- 行：线 1 到线 2（第 1 行轨道）
```

#### Grid 的计算流程

```javascript
// 伪代码：Grid 布局算法

function calculateGridLayout(container, items) {
  // 步骤 1：解析 grid-template-columns
  // 例如：1fr 2fr 1fr → [1, 2, 1]
  const columns = parseTemplate(container.gridTemplateColumns);

  // 步骤 2：计算轨道尺寸
  const totalFr = columns.reduce((sum, col) => sum + col, 0); // 4
  const frUnit = container.width / totalFr; // 每个 fr 的实际像素
  const trackSizes = columns.map(col => col * frUnit);
  // 容器 600px → [150px, 300px, 150px]

  // 步骤 3：绘制网格线
  // 垂直线位置：[0, 150, 450, 600]

  // 步骤 4：放置元素
  items.forEach(item => {
    // grid-column: 1 / 3 → 从线1到线3
    item.left = gridLines[item.columnStart - 1];
    item.width = gridLines[item.columnEnd - 1] - item.left;
    // 宽度 = 450 - 0 = 450px（跨两列）
  });
}
```

### 3.2 核心属性详解

#### grid-template-columns / grid-template-rows

定义轨道（列/行）的尺寸，这是 Grid 的核心。

```css
/* 固定尺寸 */
.grid {
  grid-template-columns: 200px 300px 200px;
}

/* fr 单位（fraction = 分数，按比例分配剩余空间） */
.grid {
  grid-template-columns: 1fr 2fr 1fr;
  /* 容器 600px：150px 300px 150px */
}

/* 混合使用 */
.grid {
  grid-template-columns: 200px 1fr 2fr;
  /* 固定 200px，剩余 400px 按 1:2 分配 → 133px 267px */
}

/* repeat() 函数 */
.grid {
  grid-template-columns: repeat(3, 1fr);
  /* 等同于：1fr 1fr 1fr */

  grid-template-columns: repeat(3, 200px 1fr);
  /* 等同于：200px 1fr 200px 1fr 200px 1fr */
}

/* minmax()：设置轨道的最小和最大尺寸 */
.grid {
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  /* 每列最小 100px，最大平分剩余空间 */
}
```

**auto-fit vs auto-fill：**

```css
/* auto-fill：保留空轨道（列数固定） */
.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
/* 容器 1000px，3 个元素 */
/* 结果：5 列（200px×5），后 2 列为空轨道 */

/* auto-fit：折叠空轨道（元素撑满） */
.grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
/* 容器 1000px，3 个元素 */
/* 结果：3 列，每列 333px（空轨道被折叠，1fr 平分） */
```

#### grid-template-areas

用命名区域定义布局，最直观的方式。

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* 区域名称随便取，对应 grid-area 属性 */
.header  { grid-area: header; }
.nav     { grid-area: nav; }
.main    { grid-area: main; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }
```

**图示：**
```
┌─────────────────────────────────┐
│          header                 │ auto
├──────┬──────────────┬───────────┤
│ nav  │    main      │   aside   │ 1fr
├──────┴──────────────┴───────────┤
│          footer                 │ auto
└─────────────────────────────────┘
 200px      1fr          200px
```

**注意事项：**
```
✅ 区域名称可以随便取
✅ 用 . 表示空单元格
✅ 区域必须是矩形（不能是 L 形）
✅ 每行的列数必须相同
```

#### grid-auto-rows / grid-auto-columns

定义隐式轨道（超出 template 定义的行/列）的尺寸。

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* 只定义了列，没定义行 */
  grid-auto-rows: 200px; /* 自动生成的每行高度 200px */
}

/* 瀑布流布局 */
.masonry {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 10px; /* 小单位行高，方便精确跨行 */
  gap: 1rem;
}
```

### 3.3 元素定位

```css
/* 用线编号定位 */
.item {
  grid-column: 1 / 3;   /* 从线1到线3，跨2列 */
  grid-row: 1 / 2;      /* 从线1到线2，占1行 */
}

/* 用 span 指定跨越数量 */
.item {
  grid-column: 1 / span 2;  /* 从线1开始，跨2列 */
  grid-row: span 3;          /* 跨3行 */
}

/* -1 表示最后一条线 */
.item {
  grid-column: 1 / -1;  /* 从第一列到最后一列（全宽） */
}
```

**span 的计算（瀑布流）：**
```javascript
// span 不是自动计算的，需要 JS 手动计算
const items = document.querySelectorAll('.masonry-item');

items.forEach(item => {
  const img = item.querySelector('img');
  img.onload = () => {
    const rowHeight = 10;  // grid-auto-rows 的值
    const rowGap = 16;     // gap 的值
    const height = img.height;
    const rowSpan = Math.ceil((height + rowGap) / (rowHeight + rowGap));
    item.style.gridRowEnd = `span ${rowSpan}`;
  };
});
```

### 3.4 对齐属性

Grid 有 6 个对齐属性：

```css
/* 容器级别 */
.grid {
  /* 整体网格在容器中的水平对齐 */
  justify-content: start | end | center | space-between | space-around | space-evenly;

  /* 整体网格在容器中的垂直对齐 */
  align-content: start | end | center | space-between | space-around | space-evenly;

  /* 元素在单元格内的水平对齐 */
  justify-items: start | end | center | stretch;

  /* 元素在单元格内的垂直对齐 */
  align-items: start | end | center | stretch;
}

/* 单个元素覆盖 */
.item {
  justify-self: center;
  align-self: center;
  place-self: center center; /* 简写 */
}

/* 记忆技巧 */
/* justify- → 水平（横向） */
/* align-   → 垂直（纵向） */
/* -content → 整体对齐 */
/* -items   → 单元格内对齐 */
/* -self    → 单个元素覆盖 */
```

### 3.5 圣杯布局（Grid 实现）

```css
.holy-grail {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   ads"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  gap: 1rem;
}

.header  { grid-area: header; }
.nav     { grid-area: nav; }
.main    { grid-area: main; }
.ads     { grid-area: ads; }
.footer  { grid-area: footer; }
```

**响应式圣杯布局：**

```css
/* 移动端：单列堆叠 */
.holy-grail {
  display: grid;
  grid-template-areas:
    "header"
    "nav"
    "main"
    "ads"
    "footer";
  grid-template-columns: 1fr;
}

/* 桌面端：三列布局 */
@media (min-width: 768px) {
  .holy-grail {
    grid-template-areas:
      "header header header"
      "nav    main   ads"
      "footer footer footer";
    grid-template-columns: 200px 1fr 200px;
    grid-template-rows: auto 1fr auto;
  }
}
```

### 3.6 template 这个词是什么意思？

**template = 模板，定义布局的"蓝图"。**

```
grid-template-columns  → 列的模板（有几列，每列多宽）
grid-template-rows     → 行的模板（有几行，每行多高）
grid-template-areas    → 区域的模板（用名字描述布局）

grid-auto-rows         → 自动生成行的尺寸（没有 template，所以叫 auto）
grid-auto-columns      → 自动生成列的尺寸

CSS 命名规律：
grid-template-xxx → 你手动定义的
grid-auto-xxx     → 浏览器自动生成的
```

---

## 4. 响应式布局

### 4.1 Grid 的自动响应式（无需媒体查询）

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}
```

**工作原理：**
```
容器 1200px：
- 1200 / 250 = 4.8 → 可以放 4 列
- 每列宽度：1200 / 4 = 300px

容器 800px：
- 800 / 250 = 3.2 → 可以放 3 列
- 每列宽度：800 / 3 ≈ 267px

容器 400px：
- 400 / 250 = 1.6 → 只能放 1 列
- 每列宽度：400px（全宽）

完全自动，不需要写任何媒体查询！
```

**防止小屏溢出的写法：**
```css
.grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  /* min(100%, 250px)：容器小于 250px 时用 100%，防止溢出 */
}
```

### 4.2 Grid 自动响应式的局限性

Grid 的 auto-fit 只能调整列数，以下场景还是需要媒体查询：

```css
/* 1. 改变布局结构（移动端单列 → 桌面端多列） */
@media (min-width: 768px) {
  .layout {
    grid-template-areas:
      "header header"
      "nav    main"
      "footer footer";
  }
}

/* 2. 调整间距 */
.grid { gap: 1rem; }
@media (min-width: 768px) {
  .grid { gap: 2rem; }
}

/* 3. 显示/隐藏元素 */
.sidebar { display: none; }
@media (min-width: 1024px) {
  .sidebar { display: block; }
}

/* 4. 改变字体大小 */
.title { font-size: 1.5rem; }
@media (min-width: 768px) {
  .title { font-size: 2.5rem; }
}
```

### 4.3 完整响应式布局示例

```css
.layout {
  display: grid;
  gap: 1rem;

  /* 移动端：单列 */
  grid-template-areas:
    "header"
    "main"
    "sidebar"
    "footer";
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .layout {
    gap: 2rem;
    /* 平板：两列 */
    grid-template-areas:
      "header  header"
      "main    sidebar"
      "footer  footer";
    grid-template-columns: 2fr 1fr;
  }
}

@media (min-width: 1024px) {
  .layout {
    gap: 3rem;
    /* 桌面：三列 */
    grid-template-areas:
      "header  header  header"
      "nav     main    sidebar"
      "footer  footer  footer";
    grid-template-columns: 200px 1fr 300px;
  }
}
```

### 4.4 Container Queries（容器查询）

比媒体查询更先进，根据父容器尺寸响应，而不是视口尺寸。

```css
/* 声明容器 */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 根据容器宽度响应 */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 150px 1fr;
  }
}

/* 优势：同一个组件在不同位置有不同表现 */
/* 侧边栏里的卡片（容器窄）→ 竖向布局 */
/* 主内容区的卡片（容器宽）→ 横向布局 */
```

---

## 5. 断点系统详解

### 5.1 主流框架断点对比

| 断点 | Bootstrap 5 | Tailwind CSS | 含义 |
|------|-------------|--------------|------|
| 默认 | < 576px | < 640px | 手机竖屏 |
| sm | ≥ 576px | ≥ 640px | 手机横屏 |
| md | ≥ 768px | ≥ 768px | 平板竖屏 |
| lg | ≥ 992px | ≥ 1024px | 平板横屏/小笔记本 |
| xl | ≥ 1200px | ≥ 1280px | 桌面 |
| xxl/2xl | ≥ 1400px | ≥ 1536px | 大屏桌面 |

**唯一共识：768px（iPad 竖屏宽度）**

### 5.2 为什么各家断点值不一样？

```
1. 没有官方标准
   W3C 只提供了媒体查询工具，没有规定具体值

2. 设备尺寸在不断变化
   2010年：iPhone 4 = 320px，iPad = 768px
   2024年：iPhone 15 = 393px，iPad Pro = 1024px

3. 框架设计哲学不同
   Bootstrap：基于经典设备尺寸（576/768/992/1200）
   Tailwind：基于现代设备尺寸（640/768/1024/1280）
```

### 5.3 断点缩写记忆技巧

**把断点想象成衣服尺码：**

```
XS  → Extra Small  → 超小  → 手机竖屏（< 576px）
S   → Small        → 小    → 手机横屏（≥ 576px）
M   → Medium       → 中    → 平板竖屏（≥ 768px）
L   → Large        → 大    → 平板横屏（≥ 992px）
XL  → Extra Large  → 超大  → 桌面（≥ 1200px）
XXL → 2X Large     → 超超大 → 大屏（≥ 1400px）

就像买衣服：XS → S → M → L → XL → XXL
屏幕越大，断点越大
```

### 5.4 Tailwind 断点的使用方式

```html
<!-- 移动端优先：默认样式是最小屏幕，然后逐步增大 -->
<div class="
  grid grid-cols-1
  sm:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
  xl:grid-cols-5
">
```

```css
/* 等同于 */
.grid { grid-template-columns: repeat(1, 1fr); }

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 1280px) {
  .grid { grid-template-columns: repeat(5, 1fr); }
}
```

### 5.5 自定义断点系统

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

```css
/* 纯 CSS 自定义 */
:root {
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
}

@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
```

---

## 6. 实战案例

### 6.1 响应式卡片网格

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
  padding: clamp(1rem, 5vw, 3rem);
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.card-footer {
  margin-top: auto; /* 推到底部 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 6.2 响应式导航栏

```css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  gap: 1rem;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: none; /* 移动端隐藏 */
  gap: 2rem;
}

.nav-menu-btn {
  display: block; /* 移动端显示汉堡菜单 */
}

@media (min-width: 768px) {
  .nav-links {
    display: flex; /* 桌面端显示 */
  }
  .nav-menu-btn {
    display: none; /* 桌面端隐藏 */
  }
}
```

### 6.3 完整页面布局（Grid + Flexbox 混合）

```css
/* 页面整体：Grid 控制大结构 */
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* 导航栏：Flexbox 控制内部排列 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
}

/* 主内容区：Grid 控制内容网格 */
.main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
  align-content: start;
}

/* 卡片内部：Flexbox 控制内容排列 */
.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}

/* 底部：Flexbox */
.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid #eee;
}
```

### 6.4 响应式表单

```css
.form {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr; /* 移动端单列 */
}

@media (min-width: 768px) {
  .form {
    grid-template-columns: repeat(2, 1fr); /* 桌面双列 */
  }

  /* 某些字段占满整行 */
  .form-field--full {
    grid-column: 1 / -1;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
}

.form-field input,
.form-field textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

### 6.5 图片画廊（瀑布流）

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 10px; /* 小单位行高 */
  gap: 1rem;
}

.gallery-item {
  /* span 由 JS 动态计算 */
}

.gallery-item img {
  width: 100%;
  display: block;
}
```

```javascript
// 动态计算 span
function resizeGalleryItem(item) {
  const grid = document.querySelector('.gallery');
  const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
  const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('gap'));
  const itemHeight = item.querySelector('img').getBoundingClientRect().height;
  const rowSpan = Math.ceil((itemHeight + rowGap) / (rowHeight + rowGap));
  item.style.gridRowEnd = `span ${rowSpan}`;
}

document.querySelectorAll('.gallery-item img').forEach(img => {
  img.addEventListener('load', () => resizeGalleryItem(img.parentElement));
});
```

---

## 7. 常见问题解答

### 7.1 flex-grow 和 flex-shrink 会同时生效吗？

**会，但不会同时触发。它们是互补的，不是互斥的。**

```
有剩余空间 → flex-grow 生效，flex-shrink 不触发
空间不足   → flex-shrink 生效，flex-grow 不触发
空间刚好   → 两个都不触发

同一个元素完全可以同时设置两个属性：
.item {
  flex-grow: 1;    /* 有空间时增长 */
  flex-shrink: 1;  /* 没空间时收缩 */
}
这是完全正常的写法，flex: 1 就等于 flex: 1 1 0%
```

### 7.2 gap 和 order 必须在 flex/grid 容器中才生效吗？

**是的，两个属性都只在 flex/grid 上下文中生效。**

```css
/* ✅ 正确 */
.container {
  display: flex; /* 或 grid */
  gap: 1rem;     /* 生效 */
}
.item { order: 2; } /* 生效 */

/* ❌ 无效 */
.container {
  /* 普通块级元素 */
  gap: 1rem;     /* 不生效 */
}
.item { order: 2; } /* 不生效 */
```

### 7.3 Grid 的 span 是自动计算的吗？

**不是，span 是手动指定的。** 如果需要根据内容动态计算，必须用 JavaScript。

```css
/* 手动指定 */
.item { grid-row-end: span 3; }

/* 动态计算需要 JS（瀑布流场景） */
```

### 7.4 为什么 Grid 比 Flexbox 好理解？

```
Grid 是"画格子"思维：
1. 先画好格子（网格线）
2. 元素往格子里填
3. 格子是固定的，一目了然
类比：Excel 表格

Flexbox 是"算空间"思维：
1. 元素排成一排
2. 计算剩余/超出空间
3. 按权重分配/收缩
4. 涉及计算公式
类比：排队站位
```

### 7.5 什么时候用 Flexbox，什么时候用 Grid？

```
Flexbox 适合：
- 一维布局（只有行，或只有列）
- 内容数量不确定
- 组件内部布局（导航栏、按钮组、卡片内部）
- 需要自动适应内容大小

Grid 适合：
- 二维布局（同时控制行和列）
- 结构固定的页面布局
- 卡片网格、图片画廊
- 需要精确对齐的复杂布局

混合使用（最常见）：
- Grid 做页面整体结构
- Flexbox 做组件内部布局
```

### 7.6 CSS 硬件加速是什么？

**硬件加速 = 把渲染任务交给 GPU，而不是 CPU。**

```
CPU 渲染（慢）：
- 单线程，逐像素计算
- 改变 width/height/margin 会触发重排（reflow）
- 重排 → 重绘 → 合成，代价很高

GPU 渲染（快）：
- 并行计算，专门处理图形
- transform/opacity 只触发合成（composite）
- 不需要重排重绘，直接在 GPU 层操作
```

**触发硬件加速：**
```css
/* ✅ 触发 GPU 渲染（只触发合成） */
.fast {
  transform: translateX(100px);  /* 位移 */
  transform: scale(1.2);         /* 缩放 */
  transform: rotate(45deg);      /* 旋转 */
  opacity: 0.5;                  /* 透明度 */
}

/* ❌ 触发 CPU 重排（性能差） */
.slow {
  left: 100px;      /* 触发重排 */
  width: 200px;     /* 触发重排 */
  margin-top: 20px; /* 触发重排 */
}
```

**动画性能优化：**
```css
/* ✅ 正确：用 transform 做位移动画 */
.box {
  transition: transform 0.3s ease;
  will-change: transform; /* 提示浏览器提前创建 GPU 层 */
}
.box:hover {
  transform: translateX(20px);
}

/* ❌ 错误：用 left 做位移动画 */
.box {
  position: relative;
  transition: left 0.3s ease;
}
.box:hover {
  left: 20px; /* 每帧都触发重排，性能差 */
}
```

**will-change 注意事项：**
```css
/* ✅ 只在需要动画的元素上用 */
.animated {
  will-change: transform;
}

/* ❌ 不要滥用，会占用大量 GPU 内存 */
* {
  will-change: transform; /* 千万别这样写 */
}
```

### 7.7 为什么响应式布局多用 Grid？

```
Grid 的 auto-fit + minmax 可以一行代码实现响应式：
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

等效于手写多个媒体查询：
@media (min-width: 250px)  { grid-template-columns: 1fr; }
@media (min-width: 500px)  { grid-template-columns: 1fr 1fr; }
@media (min-width: 750px)  { grid-template-columns: 1fr 1fr 1fr; }
@media (min-width: 1000px) { grid-template-columns: 1fr 1fr 1fr 1fr; }

Grid 帮你省掉了这些媒体查询！
```

---

## 总结速查

### Flexbox 核心公式

```
最终尺寸 = 基础尺寸(flex-basis)
         + 分配空间(flex-grow × 单位权重)
         - 收缩空间(flex-shrink × 单位权重)

有剩余空间 → flex-grow 生效
空间不足   → flex-shrink 生效
```

### Grid 核心原理

```
n 列 = n+1 条垂直线
n 行 = n+1 条水平线

先画网格线 → 再计算轨道尺寸 → 最后放置元素
```

### 选择决策树

```
需要布局？
├─ 一维（只有行或列）→ Flexbox
│   ├─ 导航栏、按钮组 → justify-content 对齐
│   ├─ 垂直居中 → align-items: center
│   └─ 等宽列 → flex: 1
│
└─ 二维（行+列）→ Grid
    ├─ 卡片网格 → repeat(auto-fit, minmax(...))
    ├─ 页面布局 → grid-template-areas
    └─ 精确定位 → grid-column / grid-row
```

### 断点记忆

```
XS < SM < MD < LG < XL < XXL
手机  手机  平板  笔记本  桌面  大屏
竖屏  横屏  竖屏  横屏
      576   768   992   1200  1400  (Bootstrap)
      640   768  1024   1280  1536  (Tailwind)

唯一共识：768px（iPad 竖屏）
```
