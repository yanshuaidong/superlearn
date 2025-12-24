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

  // 防止重复注入：如果已经注入过，直接退出
  if (window.__chatgptHelperInjected) {
    console.log('[ChatGPT] content-script 已存在，跳过重复注入');
    return;
  }
  window.__chatgptHelperInjected = true;
  console.log('[ChatGPT] content-script 首次注入');

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'executeTask') {
      executeTask(message.taskId, message.question)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ 
          success: false, 
          message: error.message 
        }));
      return true;
    }
    return true;
  });

  /**
   * 执行任务：自动化聊天流程
   */
  async function executeTask(taskId, question) {
    console.log('[ChatGPT] 任务开始:', question.substring(0, 50) + '...');

    try {
      // 步骤1：点击新对话按钮
      await clickNewChatButton();
      await sleep(3000);

      // 步骤2：输入问题
      const inputSuccess = await inputQuestion(question);
      if (!inputSuccess) {
        return { success: false, message: '无法输入问题，未找到输入框' };
      }
      // 等待 ChatGPT 前端处理输入事件和预检请求
      await sleep(5000);

      // 步骤3：点击发送按钮
      const sendSuccess = await clickSendButton();
      if (!sendSuccess) {
        return { success: false, message: '无法发送问题，发送按钮不可用' };
      }
      
      // 发送后等待请求初始化
      await sleep(3000);

      // 步骤4：等待AI回答完成（5分钟超时）
      const waitSuccess = await waitForAnswerComplete(300000);
      if (!waitSuccess) {
        return { success: false, message: 'AI 回答超时' };
      }

      // 步骤5：获取答案（waitForAnswerComplete 内部已等待3秒）
      const answer = await getAIAnswerWithRetry(30000);
      if (!answer) {
        return { success: false, message: '无法获取 AI 回答' };
      }

      console.log('[ChatGPT] 任务完成，回答长度:', answer.length);
      return { 
        success: true, 
        answer: answer,
        taskId: taskId
      };

    } catch (error) {
      console.error('[ChatGPT] 出错:', error.message);
      return { success: false, message: '执行出错: ' + error.message };
    }
  }

  /**
   * 点击新对话按钮
   */
  async function clickNewChatButton() {
    // 方法1：使用 data-testid（保留）
    const btn = document.querySelector('a[data-testid="create-new-chat-button"]');
    if (btn) {
      btn.click();
      return true;
    }
    
    return false;
  }

  /**
   * 输入问题 - 使用模拟真实用户输入的方式
   * 针对 ProseMirror 编辑器，需要完整的事件链来触发正确的预检请求
   */
  async function inputQuestion(question) {
    let inputEditor = await waitForElement('#prompt-textarea[contenteditable="true"]', 5000);
    
    if (inputEditor) {
      // 先聚焦输入框
      inputEditor.focus();
      await sleep(100);
      
      // 清空内容
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(inputEditor);
      selection.removeAllRanges();
      selection.addRange(range);
      await sleep(50);
      
      // 触发 beforeinput 事件（删除选中内容）
      inputEditor.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContentBackward'
      }));
      
      document.execCommand('delete', false, null);
      await sleep(100);
      
      // 方法1：模拟粘贴操作（保留）
      try {
        inputEditor.focus();
        
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', question);
        
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer
        });
        
        inputEditor.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertFromPaste',
          data: question,
          dataTransfer: dataTransfer
        }));
        
        inputEditor.dispatchEvent(pasteEvent);
        
        await sleep(100);
        let currentText = inputEditor.textContent || inputEditor.innerText;
        if (!currentText.includes(question.substring(0, Math.min(20, question.length)))) {
          document.execCommand('insertText', false, question);
        }
        
        inputEditor.dispatchEvent(new InputEvent('input', { 
          bubbles: true, 
          cancelable: true,
          inputType: 'insertFromPaste',
          data: question
        }));
        
        await sleep(300);
        
        currentText = inputEditor.textContent || inputEditor.innerText;
        if (currentText.includes(question.substring(0, Math.min(20, question.length)))) {
          await sleep(500);
          return true;
        }
      } catch (e) {
        console.log('[ChatGPT] 方法1粘贴失败:', e.message);
      }
    }
    return false;
  }

  /**
   * HTML 转义函数
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 点击发送按钮
   */
  async function clickSendButton() {
    // 方法1：模拟 Enter 键发送（保留）
    const inputEditor = document.querySelector('#prompt-textarea[contenteditable="true"]');
    if (inputEditor) {
      inputEditor.focus();
      await sleep(100);
      
      const enterKeyEvent = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true
      };
      
      inputEditor.dispatchEvent(new KeyboardEvent('keydown', enterKeyEvent));
      await sleep(50);
      inputEditor.dispatchEvent(new KeyboardEvent('keypress', enterKeyEvent));
      await sleep(50);
      inputEditor.dispatchEvent(new KeyboardEvent('keyup', enterKeyEvent));
      
      await sleep(500);
      if (hasStopButton() || !hasSendButton()) {
        return true;
      }
    }
    return true;
  }

  /**
   * 等待 AI 回答完成
   * 基于复制按钮和 AI 回答内容判断：
   * - 有 AI 消息
   * - 消息内容不为空
   * - 有可见的复制按钮
   * @param {number} timeout - 超时时间，默认 30 秒
   */
  async function waitForAnswerComplete(timeout = 60000) {
    const startTime = Date.now();
    
    console.log('[ChatGPT] 开始等待 AI 回答，超时时间:', timeout / 1000, '秒');

    while (Date.now() - startTime < timeout) {
      const currentMessageCount = getAssistantMessageCount();
      const currentVisibleCopyButtonCount = getVisibleCopyButtonCount();
      const lastMessage = getLastAssistantMessage();
      const lastMessageContent = lastMessage ? lastMessage.textContent.trim() : '';
      
      console.log('[ChatGPT] 检查状态 - 消息数:', currentMessageCount, '可见复制按钮:', currentVisibleCopyButtonCount, '内容长度:', lastMessageContent.length);

      // 判断完成条件：有AI消息 + 内容不为空 + 有可见复制按钮
      if (currentMessageCount > 0 && 
          lastMessageContent.length > 0 && 
          currentVisibleCopyButtonCount > 0) {
        console.log('[ChatGPT] 检测到回答完成！');
        console.log('[ChatGPT] 回答内容长度:', lastMessageContent.length);
        // 额外等待确保内容稳定
        await sleep(3000);
        return true;
      }

      // 每 10 秒检查一次
      await sleep(10000);
    }

    console.error('[ChatGPT] 等待回答超时');
    return false;
  }

  /**
   * 检查元素是否可见
   */
  function isElementVisible(element, enableDebug = false) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    // 检查元素本身
    const hasSize = rect.width > 0 && rect.height > 0;
    const isDisplayed = style.display !== 'none';
    const isVisible = style.visibility !== 'hidden';
    const hasOpacity = parseFloat(style.opacity) > 0;
    
    if (enableDebug) {
      console.log(`[isElementVisible] 元素检查:`, {
        hasSize,
        isDisplayed,
        isVisible,
        hasOpacity,
        rect: { width: rect.width, height: rect.height },
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity
      });
    }
    
    // 检查父元素链的可见性
    let current = element.parentElement;
    let depth = 0;
    while (current && current !== document.body && depth < 10) {
      const parentStyle = window.getComputedStyle(current);
      if (parentStyle.display === 'none' || 
          parentStyle.visibility === 'hidden' || 
          parseFloat(parentStyle.opacity) === 0) {
        if (enableDebug) {
          console.log(`[isElementVisible] 父元素不可见:`, {
            tag: current.tagName,
            display: parentStyle.display,
            visibility: parentStyle.visibility,
            opacity: parentStyle.opacity
          });
        }
        return false;
      }
      current = current.parentElement;
      depth++;
    }
    
    return hasSize && isDisplayed && isVisible && hasOpacity;
  }

  /**
   * 获取可见的复制按钮数量
   */
  function getVisibleCopyButtonCount(enableDebug = false) {
    const copyButtons = document.querySelectorAll('button[data-testid="copy-turn-action-button"]');
    let visibleCount = 0;
    
    if (enableDebug) {
      console.log(`[CopyButton] 找到 ${copyButtons.length} 个复制按钮`);
    }
    
    copyButtons.forEach((btn, index) => {
      const isVisible = isElementVisible(btn, enableDebug);
      if (isVisible) visibleCount++;
      
      if (enableDebug) {
        // 打印父元素链的可见性信息
        let parentInfo = [];
        let current = btn.parentElement;
        let depth = 0;
        while (current && current !== document.body && depth < 5) {
          const pStyle = window.getComputedStyle(current);
          parentInfo.push({
            tag: current.tagName,
            class: current.className?.substring?.(0, 50) || '',
            display: pStyle.display,
            visibility: pStyle.visibility,
            opacity: pStyle.opacity
          });
          current = current.parentElement;
          depth++;
        }
        
        console.log(`[CopyButton] 按钮${index}:`, {
          isVisible,
          buttonHTML: btn.outerHTML.substring(0, 100),
          parentChain: parentInfo
        });
      }
    });
    
    return visibleCount;
  }

  /**
   * 检查复制按钮是否存在且可见
   * 注意：页面上可能有多条消息，每条消息都有复制按钮
   * 我们需要检查最后一条消息的复制按钮
   */
  function isCopyButtonVisible() {
    // 获取所有复制按钮，取最后一个（对应最新的消息）
    const copyButtons = document.querySelectorAll('button[data-testid="copy-turn-action-button"]');
    if (copyButtons.length === 0) {
      return false;
    }
    
    // 取最后一个复制按钮（对应最新消息）
    const copyButton = copyButtons[copyButtons.length - 1];
    
    // 检查按钮是否在 DOM 中且有尺寸
    const rect = copyButton.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }
    
    // 简化检查：只要按钮存在且有尺寸，就认为可见
    // ChatGPT 使用 CSS mask 来控制显示/隐藏，但按钮本身始终在 DOM 中
    // 生成完成后，按钮会出现在最后一条消息下方
    return true;
  }

  /**
   * 检查是否有 stop-button（正在生成中）
   */
  function hasStopButton() {
    return document.querySelector('button[data-testid="stop-button"]') !== null;
  }

  /**
   * 检查是否有 send-button（可以发送）
   */
  function hasSendButton() {
    return document.querySelector('button[data-testid="send-button"]') !== null;
  }

  /**
   * 获取最后一条助手消息元素
   */
  function getLastAssistantMessage() {
    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const validMessages = Array.from(messages).filter(msg => {
      const messageId = msg.getAttribute('data-message-id') || '';
      return !messageId.includes('placeholder');
    });
    return validMessages.length > 0 ? validMessages[validMessages.length - 1] : null;
  }

  /**
   * 获取助手消息数量
   */
  function getAssistantMessageCount() {
    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
    return Array.from(messages).filter(msg => {
      const messageId = msg.getAttribute('data-message-id') || '';
      return !messageId.includes('placeholder');
    }).length;
  }

  /**
   * 带重试机制的获取 AI 回答
   * @param {number} timeout - 超时时间
   */
  async function getAIAnswerWithRetry(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const answer = getAIAnswer();
      if (answer) {
        return answer;
      }
      await sleep(1000);
    }
    
    console.error('[ChatGPT] 获取答案超时');
    return null;
  }

  /**
   * 获取 AI 回答内容（返回 HTML）
   * 直接返回 markdown 元素的 innerHTML
   */
  function getAIAnswer() {
    const allMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const validMessages = Array.from(allMessages).filter(msg => {
      const messageId = msg.getAttribute('data-message-id') || '';
      return !messageId.includes('placeholder');
    });

    if (validMessages.length === 0) {
      return null;
    }

    const lastMessage = validMessages[validMessages.length - 1];
    
    // 查找 markdown 容器，直接返回 HTML
    const markdownElement = lastMessage.querySelector('[class*="markdown"]');
    if (markdownElement) {
      const htmlContent = markdownElement.innerHTML;
      return htmlContent && htmlContent.length > 0 ? htmlContent : null;
    }
    
    return null;
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
