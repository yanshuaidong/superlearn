/**
 * Background Service Worker - WebSocket 版本
 * 
 * 职责：
 * 1. 与后端保持 WebSocket 持久连接
 * 2. 接收任务推送并转发给 content script 执行
 * 3. 将执行结果通过 WebSocket 返回给后端
 * 
 * 优势：
 * - 持久连接，不会因为心跳超时而断开
 * - 实时推送，任务响应更快
 * - 自动重连机制
 */

const BACKEND_URL = 'http://127.0.0.1:1125';
const WS_URL = 'ws://127.0.0.1:1125/socket.io/?EIO=4&transport=websocket';

let socket = null;
let isRunning = false;
let currentTask = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 100;  // 最大重连次数
const RECONNECT_INTERVAL = 3000;     // 重连间隔（毫秒）

// 初始化 - 从 storage 恢复状态
chrome.storage.local.get(['isRunning'], (result) => {
  if (result.isRunning) {
    isRunning = true;
    connectWebSocket();
  }
});

/**
 * 监听来自 popup 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startService':
      startService();
      sendResponse({ success: true });
      break;
    case 'stopService':
      stopService();
      sendResponse({ success: true });
      break;
    case 'getStatus':
      sendResponse({
        success: true,
        isRunning: isRunning,
        connected: socket && socket.readyState === WebSocket.OPEN,
        hasTask: currentTask !== null
      });
      break;
    default:
      sendResponse({ success: false, message: '未知操作' });
  }
  return true;
});

/**
 * 启动服务
 */
function startService() {
  if (isRunning) return;
  
  isRunning = true;
  chrome.storage.local.set({ isRunning: true });
  connectWebSocket();
  console.log('[ChatGPT Helper] 服务已启动');
}

/**
 * 停止服务
 */
function stopService() {
  if (!isRunning) return;
  
  isRunning = false;
  chrome.storage.local.set({ isRunning: false });
  disconnectWebSocket();
  currentTask = null;
  console.log('[ChatGPT Helper] 服务已停止');
}

/**
 * 连接 WebSocket
 */
function connectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('[WebSocket] 已经连接');
    return;
  }
  
  // 清理旧连接
  if (socket) {
    socket.close();
    socket = null;
  }
  
  console.log('[WebSocket] 正在连接...');
  
  try {
    socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {
      console.log('[WebSocket] 连接成功！');
      reconnectAttempts = 0;
      
      // 发送握手消息（Socket.IO 协议）
      // EIO=4 是 Engine.IO 版本 4 的握手
      // 40 是 Socket.IO 的 CONNECT 消息
      socket.send('40');
      
      notifyPopup({ backendOnline: true, connected: true });
    };
    
    socket.onmessage = (event) => {
      handleSocketMessage(event.data);
    };
    
    socket.onclose = (event) => {
      console.log('[WebSocket] 连接关闭:', event.code, event.reason);
      socket = null;
      notifyPopup({ backendOnline: false, connected: false });
      
      // 自动重连
      if (isRunning) {
        scheduleReconnect();
      }
    };
    
    socket.onerror = (error) => {
      console.error('[WebSocket] 连接错误:', error);
      notifyPopup({ backendOnline: false, connected: false });
    };
    
  } catch (error) {
    console.error('[WebSocket] 创建连接失败:', error);
    scheduleReconnect();
  }
}

/**
 * 断开 WebSocket
 */
function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (socket) {
    socket.close();
    socket = null;
  }
  
  reconnectAttempts = 0;
}

/**
 * 安排重连
 */
function scheduleReconnect() {
  if (reconnectTimer) return;
  
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('[WebSocket] 达到最大重连次数，停止重连');
    return;
  }
  
  reconnectAttempts++;
  console.log(`[WebSocket] ${RECONNECT_INTERVAL/1000}秒后重连... (尝试 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (isRunning) {
      connectWebSocket();
    }
  }, RECONNECT_INTERVAL);
}

/**
 * 处理 Socket.IO 消息
 * Socket.IO 协议格式：
 * - 0: CONNECT
 * - 2: EVENT
 * - 3: ACK
 * - 40: 命名空间连接
 * - 42: 事件消息
 */
function handleSocketMessage(data) {
  // Engine.IO 心跳
  if (data === '2') {
    // 收到 ping，回复 pong
    socket.send('3');
    return;
  }
  
  if (data === '3') {
    // pong 响应，忽略
    return;
  }
  
  // Socket.IO 连接确认
  if (data.startsWith('40')) {
    console.log('[WebSocket] Socket.IO 连接已确认');
    return;
  }
  
  // Socket.IO 事件消息（格式：42["event_name", data]）
  if (data.startsWith('42')) {
    try {
      const jsonStr = data.substring(2);
      const [eventName, eventData] = JSON.parse(jsonStr);
      
      console.log('[WebSocket] 收到事件:', eventName, eventData);
      
      switch (eventName) {
        case 'connected':
          console.log('[WebSocket] 服务器确认连接:', eventData);
          break;
          
        case 'new_task':
          handleNewTask(eventData);
          break;
          
        case 'result_received':
          console.log('[WebSocket] 服务器确认收到结果:', eventData);
          break;
          
        case 'pong':
          // 心跳响应
          break;
      }
    } catch (e) {
      console.error('[WebSocket] 解析消息失败:', e, data);
    }
  }
}

/**
 * 发送 Socket.IO 事件
 */
function emitEvent(eventName, data) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('[WebSocket] 未连接，无法发送消息');
    return false;
  }
  
  const message = '42' + JSON.stringify([eventName, data]);
  socket.send(message);
  return true;
}

/**
 * 处理新任务
 */
async function handleNewTask(data) {
  const { task_id, question } = data;
  
  console.log('[ChatGPT Helper] 收到新任务:', task_id);
  
  if (currentTask) {
    console.log('[ChatGPT Helper] 当前有任务在处理，拒绝新任务');
    emitEvent('task_result', {
      task_id: task_id,
      success: false,
      message: '当前有任务在处理中',
      answer: ''
    });
    return;
  }
  
  currentTask = { id: task_id, question: question };
  notifyPopup({ hasTask: true, question: question });
  
  // 执行任务
  await executeTask(task_id, question);
}

/**
 * 执行任务
 */
async function executeTask(taskId, question) {
  console.log('[ChatGPT Helper] 开始执行任务:', taskId);
  
  try {
    // 查找 ChatGPT 标签页
    const tabs = await chrome.tabs.query({ url: '*://chatgpt.com/*' });
    
    if (tabs.length === 0) {
      emitEvent('task_result', {
        task_id: taskId,
        success: false,
        message: '未找到 ChatGPT 页面，请先打开 chatgpt.com',
        answer: ''
      });
      currentTask = null;
      notifyPopup({ hasTask: false });
      return;
    }
    
    const tab = tabs[0];
    
    // 确保 content script 已注入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      });
    } catch (e) {
      // 可能已经注入，忽略错误
    }
    
    // 等待脚本初始化
    await sleep(200);
    
    // 发送任务给 content script
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'executeTask',
      taskId: taskId,
      question: question
    });
    
    // 发送结果给后端
    emitEvent('task_result', {
      task_id: taskId,
      success: result?.success || false,
      message: result?.message || '执行完成',
      answer: result?.answer || ''
    });
    
    console.log('[ChatGPT Helper] 任务结果已发送:', result?.success ? '成功' : '失败');
    
  } catch (error) {
    console.error('[ChatGPT Helper] 任务执行出错:', error);
    emitEvent('task_result', {
      task_id: taskId,
      success: false,
      message: '执行出错: ' + error.message,
      answer: ''
    });
  }
  
  currentTask = null;
  notifyPopup({ hasTask: false });
}

/**
 * 通知 popup 状态更新
 */
function notifyPopup(data) {
  chrome.runtime.sendMessage({
    action: 'statusUpdate',
    ...data
  }).catch(() => {
    // popup 可能未打开，忽略错误
  });
}

/**
 * 睡眠函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 保持 Service Worker 活跃
 * Chrome MV3 的 Service Worker 在 30 秒无活动后会休眠
 * 使用 chrome.alarms 来定期唤醒
 */
chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });  // 每 24 秒

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // 检查连接状态
    if (isRunning && (!socket || socket.readyState !== WebSocket.OPEN)) {
      console.log('[KeepAlive] 检测到断线，尝试重连...');
      connectWebSocket();
    }
  }
});

console.log('[ChatGPT Helper] Background service worker 已启动 (WebSocket 版本)');
