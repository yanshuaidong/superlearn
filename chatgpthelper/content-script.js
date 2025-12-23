/**
 * Content Script
 * 职责：在 ChatGPT 页面执行自动化操作
 * 
 * 工作流程：
 * 1. 接收来自 background 的任务
 * 2. 点击新对话按钮
 * 3. 输入问题
 * 4. 点击发送
 * 5. 等待 AI 回答完成
 * 6. 返回回答内容
 */

(function() {
  'use strict';

  console.log('[ChatGPT Helper] Content Script 已加载');

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
    console.log('[ChatGPT Helper] 开始执行任务:', taskId);
    console.log('[ChatGPT Helper] 问题:', question);

    try {
      // 步骤1: 点击新对话按钮（创建新对话）
      console.log('[ChatGPT Helper] 步骤1: 尝试创建新对话');
      await clickNewChatButton();
      await sleep(2000);

      // 步骤2: 找到输入框并输入问题
      console.log('[ChatGPT Helper] 步骤2: 输入问题');
      const inputSuccess = await inputQuestion(question);
      if (!inputSuccess) {
        return { success: false, message: '无法输入问题，未找到输入框' };
      }
      await sleep(500);

      // 步骤3: 点击发送按钮
      console.log('[ChatGPT Helper] 步骤3: 点击发送按钮');
      const sendSuccess = await clickSendButton();
      if (!sendSuccess) {
        return { success: false, message: '无法发送问题，发送按钮不可用' };
      }

      // 步骤4: 等待 AI 回答完成
      console.log('[ChatGPT Helper] 步骤4: 等待 AI 回答');
      const waitSuccess = await waitForAnswerComplete(600000); // 最长等待10分钟
      if (!waitSuccess) {
        return { success: false, message: 'AI 回答超时' };
      }

      // 步骤5: 等待额外时间确保内容完全渲染
      console.log('[ChatGPT Helper] 步骤5: 等待内容渲染');
      await sleep(3000);

      // 步骤6: 获取 AI 回答
      console.log('[ChatGPT Helper] 步骤6: 获取回答内容');
      const answer = getAIAnswer();
      if (!answer) {
        return { success: false, message: '无法获取 AI 回答' };
      }

      console.log('[ChatGPT Helper] 任务完成，回答长度:', answer.length);
      return { 
        success: true, 
        answer: answer,
        taskId: taskId
      };

    } catch (error) {
      console.error('[ChatGPT Helper] 任务执行出错:', error);
      return { success: false, message: '执行出错: ' + error.message };
    }
  }

  /**
   * 点击新对话按钮
   */
  async function clickNewChatButton() {
    // ChatGPT 的新对话按钮选择器
    const selectors = [
      'a[data-testid="create-new-chat-button"]',  // 主要选择器
      'a[href="/"]',  // 备用选择器
      'button[data-testid="new-chat-button"]'
    ];

    for (const selector of selectors) {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.click();
        console.log('[ChatGPT Helper] 已点击新对话按钮:', selector);
        return true;
      }
    }

    // 如果没找到按钮，可能已经在对话页面
    console.log('[ChatGPT Helper] 未找到新对话按钮，继续执行');
    return false;
  }

  /**
   * 输入问题
   */
  async function inputQuestion(question) {
    // 等待输入框出现 - ChatGPT 使用 contenteditable 的 div
    let inputEditor = await waitForElement('#prompt-textarea[contenteditable="true"]', 5000);
    
    if (inputEditor) {
      inputEditor.innerHTML = '';
      const pTag = document.createElement('p');
      pTag.textContent = question;
      inputEditor.appendChild(pTag);
      inputEditor.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[ChatGPT Helper] 问题已输入（contenteditable）');
      return true;
    }
    
    // 备用方案：传统 textarea
    const textarea = await waitForElement('textarea#prompt-textarea, textarea[name="prompt-textarea"]', 3000);
    if (textarea) {
      textarea.value = question;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[ChatGPT Helper] 问题已输入（textarea）');
      return true;
    }

    console.error('[ChatGPT Helper] 未找到输入框');
    return false;
  }

  /**
   * 点击发送按钮
   */
  async function clickSendButton() {
    // 等待发送按钮可用
    const sendBtn = await waitForSendButton(5000);
    
    if (!sendBtn) {
      console.error('[ChatGPT Helper] 未找到可用的发送按钮');
      return false;
    }

    sendBtn.click();
    console.log('[ChatGPT Helper] 已点击发送按钮');
    return true;
  }

  /**
   * 等待发送按钮可用
   */
  async function waitForSendButton(timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // ChatGPT 发送按钮选择器
      const selectors = [
        'button[data-testid="send-button"]',
        'button#composer-submit-button'
      ];
      
      for (const selector of selectors) {
        const btn = document.querySelector(selector);
        if (btn && !btn.disabled) {
          return btn;
        }
      }
      
      // 备用：查找带发送相关 aria-label 的按钮
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        const ariaLabel = btn.getAttribute('aria-label') || '';
        if ((ariaLabel.includes('发送') || ariaLabel.includes('Send')) && !btn.disabled) {
          return btn;
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
    const initialCopyButtonCount = getVisibleCopyButtonCount();
    
    console.log(`[ChatGPT Helper] 初始复制按钮数量: ${initialCopyButtonCount}`);
    console.log(`[ChatGPT Helper] 当前是否在流式传输中: ${isStreamingInProgress()}`);

    // 等待流式传输开始（停止按钮出现）
    let streamingStarted = false;
    while (Date.now() - startTime < timeout) {
      if (isStreamingInProgress()) {
        console.log('[ChatGPT Helper] 检测到流式传输开始（停止按钮出现）');
        streamingStarted = true;
        break;
      }
      await sleep(500);
    }

    if (!streamingStarted) {
      console.log('[ChatGPT Helper] 等待流式传输开始超时，继续检查复制按钮...');
    }

    // 等待流式传输结束（停止按钮消失）+ 复制按钮数量增加
    while (Date.now() - startTime < timeout) {
      const isStreaming = isStreamingInProgress();
      const currentCopyButtonCount = getVisibleCopyButtonCount();

      // 流式传输结束（停止按钮消失）且复制按钮数量增加
      if (!isStreaming && currentCopyButtonCount > initialCopyButtonCount) {
        console.log(`[ChatGPT Helper] 流式传输完成，复制按钮数量: ${initialCopyButtonCount} → ${currentCopyButtonCount}`);
        return true;
      }

      // 每10秒打印一次等待状态
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (elapsed % 10 === 0 && elapsed > 0) {
        console.log(`[ChatGPT Helper] 等待中... | 已等待: ${elapsed}秒 | 流式传输中: ${isStreaming} | 复制按钮: ${currentCopyButtonCount}`);
      }

      await sleep(1000);
    }

    console.log('[ChatGPT Helper] 等待超时');
    return false;
  }

  /**
   * 检查是否存在停止按钮（流式传输中）
   */
  function isStreamingInProgress() {
    const stopButton = document.querySelector('button[data-testid="stop-button"]');
    return stopButton !== null;
  }

  /**
   * 获取可见的复制按钮数量
   */
  function getVisibleCopyButtonCount() {
    const copyButtons = document.querySelectorAll('button[data-testid="copy-turn-action-button"]');
    let visibleCount = 0;

    copyButtons.forEach((btn) => {
      if (isElementVisible(btn)) {
        visibleCount++;
      }
    });

    return visibleCount;
  }

  /**
   * 检查元素是否可见
   */
  function isElementVisible(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;

    // 检查父元素链的 opacity
    let current = element.parentElement;
    let depth = 0;
    while (current && current !== document.body && depth < 10) {
      const parentStyle = window.getComputedStyle(current);
      if (parentStyle.opacity === '0') return false;
      if (parentStyle.display === 'none') return false;
      if (parentStyle.visibility === 'hidden') return false;
      current = current.parentElement;
      depth++;
    }

    if (element.offsetParent === null && style.position !== 'fixed') {
      return false;
    }

    return true;
  }

  /**
   * 获取 AI 回答内容（返回纯文本）
   */
  function getAIAnswer() {
    // 找到所有助手消息
    const allMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const validMessages = Array.from(allMessages).filter(msg => {
      const messageId = msg.getAttribute('data-message-id') || '';
      return !messageId.includes('placeholder');
    });

    console.log(`[ChatGPT Helper] 消息统计 | 全部助手消息: ${allMessages.length} | 有效消息: ${validMessages.length}`);

    if (validMessages.length === 0) {
      return null;
    }

    // 获取最后一条消息
    const lastMessage = validMessages[validMessages.length - 1];
    const contentElement = lastMessage.querySelector('[class*="markdown"]');
    
    // 提取文本内容
    const content = contentElement ? extractTextContent(contentElement) : extractTextContent(lastMessage);
    
    console.log(`[ChatGPT Helper] 提取内容长度: ${content ? content.length : 0}`);
    
    return content && content.length > 0 ? content : null;
  }

  /**
   * 提取元素的文本内容
   */
  function extractTextContent(element) {
    let text = '';
    
    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (['BR', 'P', 'DIV', 'LI'].includes(node.tagName)) {
          if (text && !text.endsWith('\n')) {
            text += '\n';
          }
        }
        
        for (const child of node.childNodes) {
          traverse(child);
        }
        
        if (['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName)) {
          if (text && !text.endsWith('\n')) {
            text += '\n';
          }
        }
      }
    }
    
    traverse(element);
    return text.replace(/\n{3,}/g, '\n\n').trim();
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

})();
