# DeepSeek Helper

基于浏览器插件的 DeepSeek AI 自动化问答 API 服务。

## 架构设计

```
┌─────────────────┐     POST /ask      ┌─────────────────┐
│   外部程序       │  ───────────────►  │   Python API    │
│ (其他 Python)   │  ◄───────────────  │   (端口 1125)   │
└─────────────────┘     返回答案        └────────┬────────┘
                                                │
                                         心跳 1秒/次
                                         (获取任务)
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   浏览器插件     │
                                       │ (Chrome 扩展)   │
                                       └────────┬────────┘
                                                │
                                         操作浏览器
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   DeepSeek      │
                                       │ chat.deepseek.com│
                                       └─────────────────┘
```

## 工作流程

1. **外部程序**调用 `POST /ask` 提交问题
2. **Python 后端**将问题放入任务队列，等待处理
3. **浏览器插件**每秒心跳一次，检查是否有待处理任务
4. **插件**获取到任务后，操作浏览器：
   - 点击新对话按钮
   - 输入问题
   - 点击发送
   - 等待 AI 回答完成
5. **插件**将 AI 回答发送回 Python 后端
6. **Python 后端**将答案返回给等待的外部程序

## 特性

- ✅ **API 化调用**：其他程序可通过 HTTP 接口调用
- ✅ **稳定可靠**：一次只处理一个问题，避免冲突
- ✅ **心跳保活**：插件与后端保持 1 秒一次的心跳
- ✅ **状态可视**：插件界面显示运行状态和当前任务
- ✅ **自动保存**：问答数据自动保存为 JSON 文件

## 安装

### 1. 安装 Python 依赖

```bash
cd deepseekhelper
pip install -r requirements.txt
```

### 2. 安装浏览器插件

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `deepseekhelper` 目录

### 3. 启动后端服务

```bash
python main.py
```

### 4. 启动插件服务

1. 打开浏览器并访问 `https://chat.deepseek.com`
2. 点击浏览器工具栏的插件图标
3. 点击「启动服务」按钮

## API 文档

### 对外接口（供其他程序调用）

#### POST /ask - 提交问题

提交问题并等待 AI 回答（同步阻塞）。

**请求体：**
```json
{
  "question": "你的问题内容",
  "timeout": 180
}
```

**响应：**
```json
{
  "success": true,
  "question": "你的问题",
  "answer": "AI 的回答内容",
  "message": "完成",
  "task_id": "20231223_123456"
}
```

**示例：**
```bash
curl -X POST http://127.0.0.1:1125/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "什么是机器学习？"}'
```

**Python 调用示例：**
```python
import requests

response = requests.post(
    'http://127.0.0.1:1125/ask',
    json={'question': '什么是机器学习？', 'timeout': 180}
)
result = response.json()

if result['success']:
    print(f"问题: {result['question']}")
    print(f"回答: {result['answer']}")
else:
    print(f"失败: {result['message']}")
```

#### GET /status - 获取服务状态

**响应：**
```json
{
  "success": true,
  "service": "DeepSeek Helper API",
  "port": 1125,
  "plugin_online": true,
  "has_task": false,
  "task_status": null
}
```

#### GET /health - 健康检查

**响应：**
```json
{
  "success": true,
  "message": "DeepSeek Helper API 运行中",
  "plugin_online": true
}
```

### 内部接口（供插件调用）

#### GET /heartbeat - 插件心跳

插件每秒调用一次，用于保持连接和获取待处理任务。

#### POST /answer - 提交回答

插件完成任务后提交 AI 回答。

## 文件结构

```
deepseekhelper/
├── main.py           # Python 后端服务
├── manifest.json     # 插件配置
├── background.js     # 后台服务（心跳、任务调度）
├── content.js        # 内容脚本（页面操作）
├── popup.html        # 插件弹窗界面
├── popup.js          # 弹窗逻辑
├── icon.png          # 插件图标
├── requirements.txt  # Python 依赖
├── data/             # 问答数据存储
└── README.md         # 说明文档
```

## 注意事项

1. **一次一问**：系统一次只能处理一个问题，确保稳定性
2. **超时设置**：默认超时 180 秒，可根据需要调整
3. **页面要求**：需要保持 DeepSeek 页面打开
4. **插件状态**：请确保插件已启动（显示"运行中"）

## 故障排除

### 插件显示"后端未连接"
- 确保 Python 后端已启动 (`python main.py`)
- 检查端口 1125 是否被占用

### 任务超时
- 检查 DeepSeek 页面是否正常
- AI 回答可能需要较长时间，可增加 timeout 参数

### 无法发送问题
- 刷新 DeepSeek 页面
- 重新启动插件服务
