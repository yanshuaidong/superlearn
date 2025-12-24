/**
 * Popup Script - WebSocket 版本
 * 职责：控制服务启停，显示状态
 * 
 * 功能：
 * 1. 启动/停止 WebSocket 服务
 * 2. 显示各项状态（包括 WebSocket 连接状态）
 * 3. 显示当前任务
 */

// DOM 元素
const controlBtn = document.getElementById('controlBtn');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const backendDot = document.getElementById('backendDot');
const backendStatus = document.getElementById('backendStatus');
const pluginDot = document.getElementById('pluginDot');
const pluginStatus = document.getElementById('pluginStatus');
const pageDot = document.getElementById('pageDot');
const pageStatus = document.getElementById('pageStatus');
const taskInfo = document.getElementById('taskInfo');
const taskContent = document.getElementById('taskContent');

// 状态
let isRunning = false;
let isConnected = false;

/**
 * 初始化
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 从 storage 获取运行状态
  const result = await chrome.storage.local.get(['isRunning']);
  isRunning = result.isRunning || false;
  
  // 从 background 获取完整状态
  try {
    const bgStatus = await chrome.runtime.sendMessage({ action: 'getStatus' });
    if (bgStatus && bgStatus.success) {
      isRunning = bgStatus.isRunning;
      isConnected = bgStatus.connected;
    }
  } catch (e) {
    // background 可能未准备好，忽略错误
  }
  
  updateUI(isConnected);
  checkStatus();
});

/**
 * 控制按钮点击
 */
controlBtn.addEventListener('click', async () => {
  isRunning = !isRunning;
  
  // 停止服务时重置连接状态
  if (!isRunning) {
    isConnected = false;
  }
  
  // 保存状态到 storage
  await chrome.storage.local.set({ isRunning });
  
  // 通知 background
  chrome.runtime.sendMessage({
    action: isRunning ? 'startService' : 'stopService'
  });
  
  updateUI(isConnected);
});

/**
 * 更新 UI 显示
 */
function updateUI(connected = false) {
  if (isRunning) {
    controlBtn.textContent = '⏹️ 停止服务';
    controlBtn.classList.remove('start');
    controlBtn.classList.add('stop');
    
    if (connected) {
      statusIcon.textContent = '✅';
      statusIcon.classList.remove('stopped', 'working');
      statusIcon.classList.add('running');
      pluginDot.classList.remove('offline');
      pluginDot.classList.add('online');
      pluginStatus.textContent = 'WebSocket 已连接';
      statusText.textContent = '服务运行中，等待任务...';
    } else {
      statusIcon.textContent = '🔄';
      statusIcon.classList.remove('stopped', 'working', 'running');
      pluginDot.classList.remove('online');
      pluginDot.classList.add('offline');
      pluginStatus.textContent = '正在连接...';
      statusText.textContent = '正在连接 WebSocket...';
    }
    statusText.classList.remove('working');
  } else {
    controlBtn.textContent = '▶️ 启动服务';
    controlBtn.classList.remove('stop');
    controlBtn.classList.add('start');
    statusIcon.textContent = '⏹️';
    statusIcon.classList.remove('running', 'working');
    statusIcon.classList.add('stopped');
    pluginDot.classList.remove('online', 'working');
    pluginDot.classList.add('offline');
    pluginStatus.textContent = '已停止';
    statusText.textContent = '服务未运行';
    statusText.classList.remove('working');
    taskInfo.classList.remove('show');
  }
}

/**
 * 检查各项状态
 */
async function checkStatus() {
  // 检查后端服务
  try {
    const response = await fetch('http://127.0.0.1:1125/health');
    const data = await response.json();
    if (data.success) {
      backendDot.classList.remove('offline');
      backendDot.classList.add('online');
      backendStatus.textContent = '已连接';
    }
  } catch (e) {
    backendDot.classList.remove('online');
    backendDot.classList.add('offline');
    backendStatus.textContent = '未连接';
  }
  
  // 检查 ChatGPT 页面
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('chatgpt.com')) {
      pageDot.classList.remove('offline');
      pageDot.classList.add('online');
      pageStatus.textContent = '已打开';
    } else {
      pageDot.classList.remove('online');
      pageDot.classList.add('offline');
      pageStatus.textContent = '未打开';
    }
  } catch (e) {
    pageDot.classList.remove('online');
    pageDot.classList.add('offline');
    pageStatus.textContent = '检测失败';
  }
  
  // 从 background 获取 WebSocket 状态
  if (isRunning) {
    try {
      const bgStatus = await chrome.runtime.sendMessage({ action: 'getStatus' });
      if (bgStatus && bgStatus.success) {
        isConnected = bgStatus.connected;
        updateUI(isConnected);
        
        // 如果有任务，更新任务显示
        if (bgStatus.hasTask) {
          statusIcon.textContent = '⚡';
          statusIcon.classList.remove('stopped', 'running');
          statusIcon.classList.add('working');
          pluginDot.classList.remove('offline', 'online');
          pluginDot.classList.add('working');
          statusText.textContent = '正在处理任务...';
          statusText.classList.add('working');
        }
      }
    } catch (e) {
      // background 可能未准备好
    }
  }
}

/**
 * 监听来自 background 的状态更新
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'statusUpdate') {
    updateStatusFromBackground(message);
  }
  return true;
});

/**
 * 根据 background 的消息更新状态
 */
function updateStatusFromBackground(data) {
  // 更新 WebSocket 连接状态
  if (data.connected !== undefined) {
    isConnected = data.connected;
    updateUI(isConnected);
  }
  
  if (data.hasTask) {
    // 有任务正在处理
    statusIcon.textContent = '⚡';
    statusIcon.classList.remove('stopped', 'running');
    statusIcon.classList.add('working');
    pluginDot.classList.remove('offline', 'online');
    pluginDot.classList.add('working');
    pluginStatus.textContent = '处理中...';
    statusText.textContent = '正在处理任务...';
    statusText.classList.add('working');
    
    // 显示任务信息
    if (data.question) {
      taskInfo.classList.add('show');
      taskContent.textContent = data.question;
    }
  } else if (isRunning && isConnected) {
    // 运行中且已连接但没有任务
    statusIcon.textContent = '✅';
    statusIcon.classList.remove('stopped', 'working');
    statusIcon.classList.add('running');
    pluginDot.classList.remove('offline', 'working');
    pluginDot.classList.add('online');
    pluginStatus.textContent = 'WebSocket 已连接';
    statusText.textContent = '服务运行中，等待任务...';
    statusText.classList.remove('working');
    taskInfo.classList.remove('show');
  }
  
  // 更新后端状态
  if (data.backendOnline !== undefined) {
    if (data.backendOnline) {
      backendDot.classList.remove('offline');
      backendDot.classList.add('online');
      backendStatus.textContent = '已连接';
    } else {
      backendDot.classList.remove('online');
      backendDot.classList.add('offline');
      backendStatus.textContent = '未连接';
    }
  }
}

// 每3秒检查一次状态
setInterval(checkStatus, 3000);

