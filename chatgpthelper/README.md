# ChatGPT Helper

基于浏览器插件的 ChatGPT AI 自动化问答 API 服务。

## 功能特点

- 通过 API 接口提交问题，自动在 ChatGPT 页面获取回答
- 一次只处理一个问题，确保稳定性
- 支持超时控制，默认 5 分钟
- 插件心跳机制，实时监控连接状态

## 架构

```
外部程序 → Flask API (1126端口) → 浏览器插件 → ChatGPT 页面
                ↑                      ↓
                └──────── 回答 ─────────┘
```

## 文件结构

```
chatgpthelper/
├── main.py              # Flask 后端服务
├── manifest.json        # 插件配置
├── background.js        # 后台服务（心跳、任务分发）
├── content-script.js    # 页面操作脚本
├── popup.html           # 控制面板界面
├── popup.js             # 控制面板逻辑
├── icon.png             # 插件图标
└── requirements.txt     # Python 依赖
```

## 使用步骤

### 1. 安装 Python 依赖

```bash
cd chatgpthelper
pip install -r requirements.txt
```

### 2. 加载浏览器插件

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `chatgpthelper` 文件夹

### 3. 启动服务

```bash
# 启动 Flask 后端
python main.py
```

### 4. 启动插件

1. 打开 https://chatgpt.com 并登录
2. 点击浏览器工具栏的插件图标
3. 点击「启动服务」按钮

## API 接口

### POST /ask - 提交问题

提交问题并等待 AI 回答。

**请求示例：**
```bash
curl -X POST http://127.0.0.1:1126/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "你好，请介绍一下你自己"}'
```

**请求体：**
```json
{
    "question": "你的问题",
    "timeout": 300  // 可选，超时秒数，默认300
}
```

**响应示例：**
```json
{
    "success": true,
    "question": "你好，请介绍一下你自己",
    "answer": "你好！我是 ChatGPT...",
    "message": "完成",
    "task_id": "20241223_123456"
}
```

### GET /status - 获取服务状态

```bash
curl http://127.0.0.1:1126/status
```

**响应：**
```json
{
    "success": true,
    "service": "ChatGPT Helper API",
    "port": 1126,
    "plugin_online": true,
    "has_task": false,
    "task_status": null
}
```

### GET /health - 健康检查

```bash
curl http://127.0.0.1:1126/health
```

**响应：**
```json
{
    "success": true,
    "message": "ChatGPT Helper API 运行中",
    "plugin_online": true
}
```

## 工作流程

1. 外部程序通过 POST `/ask` 提交问题
2. Flask 服务创建任务并等待
3. 插件通过心跳 `/heartbeat` 获取任务
4. 插件在 ChatGPT 页面：
   - 点击新对话按钮
   - 输入问题
   - 点击发送
   - 等待 AI 回答完成
   - 提取回答内容
5. 插件通过 POST `/answer` 返回结果
6. `/ask` 接口返回答案给调用方

## 注意事项

- 确保 ChatGPT 页面保持打开状态
- 确保已登录 ChatGPT 账号
- 一次只能处理一个问题
- 复杂问题可能需要较长时间，可调整 timeout 参数

## 端口说明

- **1126**: ChatGPT Helper API 服务端口
- **1125**: DeepSeek Helper API 服务端口（如果需要同时运行）

