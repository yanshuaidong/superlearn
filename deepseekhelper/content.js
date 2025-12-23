/**
 * Content Script
 * 职责：在 DeepSeek 页面执行自动化操作
 * 
 * 工作流程：
 * 1. 接收来自 background 的任务
 * 2. 点击新对话按钮
 * 3. 输入问题
 * 4. 点击发送
 * 5. 等待 AI 回答完成
 * 6. 返回回答内容
 */

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'executeTask') {
    // 异步执行任务
    executeTask(message.taskId, message.question)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        message: error.message 
      }));
    return true; // 保持消息通道开启
  }
  return true;
});

/**
 * 执行任务：自动化聊天流程
 */
async function executeTask(taskId, question) {
  console.log('[DeepSeek Helper] 开始执行任务:', taskId);
  console.log('[DeepSeek Helper] 问题:', question);

  try {
    // 步骤1: 点击新对话按钮（创建新对话）
    console.log('[DeepSeek Helper] 步骤1: 尝试创建新对话');
    await clickNewChatButton();
    await sleep(800);

    // 步骤2: 找到输入框并输入问题
    console.log('[DeepSeek Helper] 步骤2: 输入问题');
    const inputSuccess = await inputQuestion(question);
    if (!inputSuccess) {
      return { success: false, message: '无法输入问题，未找到输入框' };
    }
    await sleep(300);

    // 步骤3: 点击发送按钮
    console.log('[DeepSeek Helper] 步骤3: 点击发送按钮');
    const sendSuccess = await clickSendButton();
    if (!sendSuccess) {
      return { success: false, message: '无法发送问题，发送按钮不可用' };
    }

    // 步骤4: 等待 AI 回答完成
    console.log('[DeepSeek Helper] 步骤4: 等待 AI 回答');
    const waitSuccess = await waitForAnswerComplete(600000); // 最长等待10分钟，确保复杂问题有足够时间
    if (!waitSuccess) {
      return { success: false, message: 'AI 回答超时' };
    }

    // 步骤5: 等待额外时间确保内容完全渲染
    console.log('[DeepSeek Helper] 步骤5: 等待内容渲染');
    await sleep(2000);

    // 步骤6: 获取 AI 回答
    console.log('[DeepSeek Helper] 步骤6: 获取回答内容');
    const answer = getAIAnswer();
    if (!answer) {
      return { success: false, message: '无法获取 AI 回答' };
    }

    console.log('[DeepSeek Helper] 任务完成，回答长度:', answer.length);
    return { 
      success: true, 
      answer: answer,
      taskId: taskId
    };

  } catch (error) {
    console.error('[DeepSeek Helper] 任务执行出错:', error);
    return { success: false, message: '执行出错: ' + error.message };
  }
}

/**
 * 点击新对话按钮
 */
async function clickNewChatButton() {
  // 尝试多种选择器
  const selectors = [
    '._5a8ac7a',           // 侧边栏新对话按钮
    '[class*="new-chat"]',
    'button[class*="new"]'
  ];

  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.click();
      console.log('[DeepSeek Helper] 已点击新对话按钮:', selector);
      return true;
    }
  }

  // 如果没找到按钮，可能已经在对话页面
  console.log('[DeepSeek Helper] 未找到新对话按钮，继续执行');
  return false;
}

/**
 * 输入问题
 */
async function inputQuestion(question) {
  // 等待输入框出现
  const textarea = await waitForElement('.d96f2d2a, textarea[class*="input"], #chat-input', 5000);
  
  if (!textarea) {
    console.error('[DeepSeek Helper] 未找到输入框');
    return false;
  }

  // 聚焦并清空
  textarea.focus();
  textarea.value = '';
  
  // 输入问题
  textarea.value = question;
  
  // 触发各种事件让页面检测到输入
  const events = ['input', 'change', 'keyup', 'keydown'];
  for (const eventType of events) {
    const event = new Event(eventType, { bubbles: true, cancelable: true });
    textarea.dispatchEvent(event);
  }

  // 再次设置值（某些情况下需要）
  await sleep(100);
  if (textarea.value !== question) {
    // 使用 execCommand 作为备选方案
    textarea.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, question);
  }

  console.log('[DeepSeek Helper] 问题已输入');
  return true;
}

/**
 * 点击发送按钮
 */
async function clickSendButton() {
  // 等待发送按钮可用
  const sendBtn = await waitForSendButton(5000);
  
  if (!sendBtn) {
    console.error('[DeepSeek Helper] 未找到可用的发送按钮');
    return false;
  }

  sendBtn.click();
  console.log('[DeepSeek Helper] 已点击发送按钮');
  return true;
}

/**
 * 等待发送按钮可用
 */
async function waitForSendButton(timeout = 5000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // 查找发送按钮
    const buttons = document.querySelectorAll('._7436101, button[class*="send"]');
    
    for (const btn of buttons) {
      // 检查按钮是否可用
      const isDisabled = btn.classList.contains('ds-icon-button--disabled') ||
                         btn.getAttribute('aria-disabled') === 'true' ||
                         btn.disabled;
      
      if (!isDisabled) {
        // 检查是否包含发送图标
        const svg = btn.querySelector('svg');
        if (svg) {
          return btn;
        }
      }
    }
    
    await sleep(100);
  }
  
  return null;
}

/**
 * 等待 AI 回答完成
 * @param {number} timeout - 超时时间，默认 10 分钟
 */
async function waitForAnswerComplete(timeout = 600000) {
  const startTime = Date.now();
  let isAnswering = false;
  let lastAnswerLength = 0;
  let stableCount = 0;
  let retryCount = 0;
  const maxRetries = 3; // 最多重试3次

  console.log('[DeepSeek Helper] 开始等待 AI 回答...');

  while (Date.now() - startTime < timeout) {
    // 首先检查是否有重试按钮（AI 请求失败）
    const retryButton = checkRetryButton();
    if (retryButton) {
      retryCount++;
      if (retryCount > maxRetries) {
        console.log('[DeepSeek Helper] AI 请求多次失败，已超过最大重试次数');
        return false;
      }
      console.log(`[DeepSeek Helper] 检测到 AI 请求失败，点击重试 (第 ${retryCount} 次)`);
      retryButton.click();
      await sleep(1000);
      isAnswering = false;
      stableCount = 0;
      continue;
    }

    // 检查是否有停止按钮（表示正在回答）
    const hasStopButton = checkStopButton();
    
    if (hasStopButton) {
      isAnswering = true;
      stableCount = 0;
      console.log('[DeepSeek Helper] AI 正在回答中...');
    } else if (isAnswering) {
      // 之前在回答，现在停止按钮消失了
      // 检查回答内容是否稳定
      const currentAnswer = getAIAnswer();
      const currentLength = currentAnswer ? currentAnswer.length : 0;
      
      if (currentLength > 0 && currentLength === lastAnswerLength) {
        stableCount++;
        if (stableCount >= 3) {
          // 内容稳定了3次检查（约1.5秒），认为回答完成
          console.log('[DeepSeek Helper] AI 回答已完成');
          return true;
        }
      } else {
        stableCount = 0;
      }
      
      lastAnswerLength = currentLength;
    }

    await sleep(500);
  }

  console.log('[DeepSeek Helper] 等待超时');
  return false;
}

/**
 * 检查是否有停止按钮（表示 AI 正在回答）
 */
function checkStopButton() {
  const buttons = document.querySelectorAll('._7436101, button[class*="stop"]');
  
  for (const btn of buttons) {
    const svg = btn.querySelector('svg');
    if (!svg) continue;
    
    const pathD = svg.querySelector('path')?.getAttribute('d') || '';
    
    // 方形停止按钮的路径特征
    if (pathD.includes('M2 4.88') || pathD.includes('4.88C2')) {
      return true;
    }
  }
  
  return false;
}

/**
 * 检查是否有重试按钮（AI 请求失败时出现）
 * 重试按钮特征：循环箭头图标，SVG path 以 M1.27206 开头
 */
function checkRetryButton() {
  // 查找所有可能的按钮
  const buttons = document.querySelectorAll('.ds-icon-button, [class*="a3b9bd76"]');
  
  for (const btn of buttons) {
    const svg = btn.querySelector('svg');
    if (!svg) continue;
    
    const pathD = svg.querySelector('path')?.getAttribute('d') || '';
    
    // 重试按钮的 SVG 路径特征（循环箭头图标）
    if (pathD.includes('M1.27206 6.2135') || pathD.includes('1.27206')) {
      // 确保按钮可点击
      const isDisabled = btn.getAttribute('aria-disabled') === 'true' || btn.disabled;
      if (!isDisabled) {
        return btn;
      }
    }
  }
  
  return null;
}

/**
 * 获取 AI 回答内容（返回 HTML 格式，方便前端直接渲染）
 */
function getAIAnswer() {
  // 找到所有 markdown 回答元素
  const markdownElements = document.querySelectorAll('.ds-markdown, [class*="markdown-body"]');
  
  if (markdownElements.length === 0) {
    return null;
  }

  // 获取最后一个（最新的回答）
  const lastAnswer = markdownElements[markdownElements.length - 1];
  
  // 返回 HTML 格式，保留 DeepSeek 渲染后的样式结构
  const htmlContent = lastAnswer.innerHTML;
  
  return htmlContent ? htmlContent.trim() : null;
}

/**
 * 等待元素出现
 */
async function waitForElement(selector, timeout = 5000) {
  const startTime = Date.now();
  const selectors = selector.split(', ');
  
  while (Date.now() - startTime < timeout) {
    for (const sel of selectors) {
      const element = document.querySelector(sel.trim());
      if (element) {
        return element;
      }
    }
    await sleep(100);
  }
  
  return null;
}

/**
 * 延时函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('[DeepSeek Helper] Content script 已加载');
