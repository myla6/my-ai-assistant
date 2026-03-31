# 联网搜索功能配置指南

## 功能说明

你的 AI 助手现在支持联网搜索功能！可以实时获取最新信息、新闻、数据等。

## 如何获取 Tavily API Key

1. 访问 [Tavily 官网](https://tavily.com)
2. 点击右上角 "Sign Up" 注册账号
3. 登录后进入 Dashboard
4. 复制你的 API Key

## 配置步骤

1. 打开项目根目录的 `.env.local` 文件
2. 找到 `TAVILY_API_KEY=your_tavily_api_key_here` 这一行
3. 将 `your_tavily_api_key_here` 替换为你的实际 API Key
4. 保存文件并重启开发服务器

```bash
npm run dev
```

## 使用示例

现在你可以问助手这些问题：

- "今天有什么重要新闻？"
- "帮我搜索一下最新的 AI 技术进展"
- "2024年世界杯冠军是谁？"
- "比特币现在的价格是多少？"
- "最新的 iPhone 有什么特性？"

助手会自动判断何时需要联网搜索，并返回最新的信息。

## 免费额度

Tavily 提供免费套餐：
- 每月 1000 次搜索请求
- 对于个人项目和测试完全够用

## 技术细节

- 搜索工具：`TavilySearchResults`
- 每次搜索返回最多 5 个结果
- 包含答案摘要和相关链接
- 自动与天气查询等其他工具协同工作
