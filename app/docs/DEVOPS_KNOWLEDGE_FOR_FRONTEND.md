# 运维配置，前端必须懂

## 核心原则

```
运维负责：配置服务器、CDN、域名、证书
前端负责：理解这些配置如何影响代码
分工：运维配，前端懂，出问题才能快速定位
```

---

## 1. CDN

**运维做什么**：买 CDN 服务、配置域名、配置回源规则

**前端必须懂什么**：

打包文件名要加 hash，否则 CDN 缓存不会更新
```
app.js        ← 改了代码，用户还是用旧缓存
app.abc123.js ← 改了代码，文件名变了，CDN 加载新文件
```

publicPath 要配对，否则资源路径全错
```javascript
// next.config.ts
assetPrefix: 'https://cdn.myapp.com'
// 打包后 <script src="https://cdn.myapp.com/app.abc123.js">
```

CDN 缓存时间影响发布策略：
- HTML 不能缓存太久（用户要拿到最新入口）
- JS/CSS 可以永久缓存（因为有 hash，改了就是新文件名）

---

## 2. HTTPS / HTTP

**运维做什么**：申请 SSL 证书、配置 Nginx

**前端必须懂什么**：

Mixed Content 问题，网站是 HTTPS，代码里不能有 HTTP 资源
```html
<!-- 浏览器直接阻止，图片不显示 -->
<img src="http://cdn.example.com/logo.png">

<!-- 正确写法，跟随当前协议 -->
<img src="//cdn.example.com/logo.png">
```

Service Worker 只在 HTTPS 下工作，要做 PWA 或离线缓存，必须 HTTPS

Cookie 的 Secure 属性，只在 HTTPS 下发送，HTTP 下登录状态会丢失

---

## 3. CORS 跨域

**运维做什么**：在 Nginx 或后端配置响应头

**前端必须懂什么**：

跨域是浏览器的同源策略，不是服务器的问题
```
你的网站：https://myapp.com
你的 API： https://api.myapp.com
← 域名不同，浏览器阻止
```

发送 Cookie 时要加 credentials
```javascript
fetch('https://api.myapp.com/data', {
  credentials: 'include'  // 不加这个，Cookie 不会发送
})
// 同时后端必须配置 Access-Control-Allow-Credentials: true
// 且 Access-Control-Allow-Origin 不能是 *，必须是具体域名
```

预检请求（Preflight），POST/PUT/DELETE 请求会先发一个 OPTIONS 请求，
运维没配好会导致请求失败，要能看懂 Network 面板里的 OPTIONS 请求

---

## 4. Nginx 配置

**运维做什么**：配置 Nginx

**前端必须懂什么**：

SPA 路由需要 Nginx 配合，否则刷新页面 404
```nginx
# 运维需要加这个
location / {
  try_files $uri $uri/ /index.html;
}
# 没有这个，用户访问 /about 刷新页面
# Nginx 找不到 about.html，返回 404
```

Gzip 压缩，运维开启后 JS 文件从 1MB 变成 200KB，加载速度提升 5 倍，
前端要知道这个优化存在，不要重复手动压缩

静态资源缓存时间，运维配置 Cache-Control，
前端要知道这影响用户看到新版本的时间

---

## 5. 域名和 DNS

**运维做什么**：买域名、配置 DNS 解析

**前端必须懂什么**：

子域名和 Cookie 的关系
```
myapp.com 设置的 Cookie，api.myapp.com 默认收不到

需要设置 Cookie 的 domain：
Set-Cookie: token=abc; Domain=.myapp.com
← 加了点，所有子域名都能收到
```

DNS 预解析，前端可以主动优化加载速度
```html
<!-- 告诉浏览器提前解析这个域名，减少延迟 -->
<link rel="dns-prefetch" href="//cdn.myapp.com">
<link rel="preconnect" href="https://api.myapp.com">
```

---

## 6. 负载均衡

**运维做什么**：配置多台服务器、配置负载均衡

**前端必须懂什么**：

Session 一致性问题：
```
用户第一次请求 → 服务器 A（Session 存在 A）
用户第二次请求 → 服务器 B（Session 不在 B）
→ 用户被登出
```

解决方案是用 JWT Token 而不是 Session，或者用 Redis 共享 Session，
这直接影响你的登录逻辑怎么写，要和后端提前对齐

---

## 7. 环境变量

**运维做什么**：在服务器上配置环境变量

**前端必须懂什么**：

前端的环境变量在打包时就固定了，不是运行时读取的
```javascript
// .env.local
NEXT_PUBLIC_API_URL=https://api.myapp.com

// 代码里
fetch(process.env.NEXT_PUBLIC_API_URL + '/data')

// 打包后变成（已经写死）
fetch('https://api.myapp.com/data')
```

所以前端有几套环境就要打几次包，不像后端改个环境变量重启就行

NEXT_PUBLIC_ 前缀的变量会暴露给浏览器，
敏感信息（密钥、数据库密码）绝对不能加这个前缀

---

## 8. 日志和监控

**运维做什么**：配置日志收集、配置监控告警

**前端必须懂什么**：

运维的监控看不到前端的 JS 报错，前端错误要主动上报
```javascript
window.addEventListener('error', (e) => {
  reportError({
    message: e.message,
    stack: e.error?.stack,
    url: location.href
  })
})

// Promise 未捕获的错误
window.addEventListener('unhandledrejection', (e) => {
  reportError({ message: e.reason })
})
```

Source Map 要配合监控使用：
- 打包后的代码报错是压缩过的，看不懂
- 需要上传 Source Map 到监控系统才能还原
- Source Map 不要部署到生产服务器（会暴露源码）

---

## 9. 反向代理

**运维做什么**：配置 Nginx 反向代理

**前端必须懂什么**：

本地开发时的代理配置，就是模拟反向代理
```javascript
// next.config.ts
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://api.myapp.com/:path*',
    }
  ]
}
// 前端请求 /api/user → 实际请求 https://api.myapp.com/user
// 解决本地开发的跨域问题
```

生产环境运维用 Nginx 做同样的事，所以本地和生产行为一致，
如果本地没问题但生产有问题，大概率是 Nginx 配置和本地代理配置不一致

---

## 10. 部署流程

**运维做什么**：配置 CI/CD、配置服务器

**前端必须懂什么**：

打包产物是什么，运维需要什么
```
Next.js 打包后：
├─ .next/       ← 服务端代码，运维部署到 Node.js 服务器
├─ public/      ← 静态资源，可以放 CDN
└─ package.json ← 运维需要 npm start 启动

Vite/CRA 打包后：
└─ dist/        ← 全是静态文件，Nginx 直接托管就行
```

静态部署 vs 服务端部署的区别
```
纯静态（Vite）：
打包后全是 HTML/CSS/JS
运维只需要 Nginx，成本低

服务端渲染（Next.js）：
需要 Node.js 服务器持续运行
运维需要配置 PM2 或 Docker
成本更高，但首屏更快、SEO 更好
```

---

## 总结：规律

```
运维配置          →  影响前端代码的行为

CDN 配置          →  打包策略（hash、publicPath）
HTTPS 配置        →  资源引用（不能有 HTTP）
CORS 配置         →  请求写法（credentials、预检请求）
Nginx 路由配置    →  SPA 需要 try_files，否则刷新 404
域名/DNS 配置     →  Cookie 的 domain 设置
负载均衡配置      →  登录方案（JWT vs Session）
环境变量配置      →  打包策略（几套环境几次打包）
监控配置          →  前端要主动上报错误 + Source Map
反向代理配置      →  本地代理要和生产 Nginx 保持一致
部署方式          →  静态 vs 服务端，影响运维成本和架构
```

前端不需要会配这些，但遇到问题时要能说清楚：
1. 这个问题是前端代码的问题还是运维配置的问题
2. 需要运维改什么配置
3. 前端代码需要配合做什么调整
