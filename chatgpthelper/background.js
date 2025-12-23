/**
 * Background Service Worker
 * 职责：
 * 1. 维护与后端的心跳连接（每秒一次）
 * 2. 接收任务并转发给 content script 执行
 * 3. 将执行结果返回给后端
 */

const BACKEND_URL = 'http://127.0.0.1:1126';
let heartbeatInterval = null;
let isRunning = false;
let currentTask = null;

// 初始化 - 从 storage 恢复状态
chrome.storage.local.get(['isRunning'], (result) => {
  if (result.isRunning) {
    isRunning = true;
    startHeartbeat();
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
  startHeartbeat();
  console.log('[ChatGPT Helper] 服务已启动');
}

/**
 * 停止服务
 */
function stopService() {
  if (!isRunning) return;
  
  isRunning = false;
  chrome.storage.local.set({ isRunning: false });
  stopHeartbeat();
  currentTask = null;
  console.log('[ChatGPT Helper] 服务已停止');
}

/**
 * 启动心跳
 */
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // 立即执行一次
  doHeartbeat();
  
  // 每秒执行一次
  heartbeatInterval = setInterval(doHeartbeat, 1000);
}

/**
 * 停止心跳
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * 执行心跳
 */
async function doHeartbeat() {
  if (!isRunning) return;
  
  // 如果正在处理任务，不再获取新任务
  if (currentTask) {
    notifyPopup({ hasTask: true, question: currentTask.question });
    return;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/heartbeat`);
    const data = await response.json();
    
    // 通知 popup 后端在线
    notifyPopup({ backendOnline: true, hasTask: false });
    
    if (data.has_task) {
      console.log('[ChatGPT Helper] 收到新任务:', data.task_id);
      currentTask = {
        id: data.task_id,
        question: data.question
      };
      
      // 通知 popup 有任务
      notifyPopup({ hasTask: true, question: data.question });
      
      // 执行任务
      executeTask(data.task_id, data.question);
    }
  } catch (error) {
    // 后端不在线
    notifyPopup({ backendOnline: false, hasTask: false });
  }
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
      // 没有找到 ChatGPT 页面，报告失败
      await reportTaskResult(taskId, '', false, '未找到 ChatGPT 页面，请先打开 chatgpt.com');
      currentTask = null;
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
    
    // 等待一下让脚本初始化
    await sleep(200);
    
    // 发送任务给 content script
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'executeTask',
      taskId: taskId,
      question: question
    });
    
    if (result && result.success) {
      // 任务成功
      await reportTaskResult(taskId, result.answer, true, '完成');
    } else {
      // 任务失败
      await reportTaskResult(taskId, '', false, result?.message || '执行失败');
    }
    
  } catch (error) {
    console.error('[ChatGPT Helper] 任务执行出错:', error);
    await reportTaskResult(taskId, '', false, '执行出错: ' + error.message);
  }
  
  currentTask = null;
  notifyPopup({ hasTask: false });
}

/**
 * 向后端报告任务结果
 */
async function reportTaskResult(taskId, answer, success, message) {
  try {
    const response = await fetch(`${BACKEND_URL}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task_id: taskId,
        answer: answer,
        success: success,
        message: message
      })
    });
    
    const data = await response.json();
    console.log('[ChatGPT Helper] 结果已报告:', data);
  } catch (error) {
    console.error('[ChatGPT Helper] 报告结果失败:', error);
  }
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

console.log('[ChatGPT Helper] Background service worker 已启动');
