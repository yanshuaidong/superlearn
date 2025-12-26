<template>
  <div class="content-renderer" :class="{ 'text-mode': contentType === 'text', 'html-mode': contentType !== 'text' }">
    <!-- HTML/Markdown 内容渲染 -->
    <div v-if="contentType !== 'text'" class="html-content" v-html="renderedContent"></div>
    <!-- 纯文本渲染 -->
    <div v-else class="text-content">{{ content }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

// 配置 marked
marked.setOptions({
  breaks: true,        // 支持 GitHub 风格的换行
  gfm: true,           // 启用 GitHub 风格 Markdown
  headerIds: false,    // 禁用标题ID（避免ID冲突）
})

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  // 强制指定类型：'auto' | 'text' | 'html' | 'markdown'
  forceType: {
    type: String,
    default: 'auto'
  }
})

// 检测内容是否包含HTML标签
const detectHtml = (str) => {
  if (!str) return false
  // 常见HTML标签检测
  const htmlPatterns = [
    /<(p|div|span|h[1-6]|ul|ol|li|pre|code|table|tr|td|th|blockquote|strong|em|a|br|hr)[^>]*>/i,
    /&(nbsp|lt|gt|amp|quot|#\d+);/i  // HTML实体
  ]
  return htmlPatterns.some(pattern => pattern.test(str))
}

// 检测内容是否为 Markdown 格式
const detectMarkdown = (str) => {
  if (!str) return false
  // Markdown 语法特征检测
  const markdownPatterns = [
    /^#{1,6}\s+/m,                    // 标题 # ## ### 等
    /\*\*[^*]+\*\*/,                  // 粗体 **text**
    /\*[^*]+\*/,                      // 斜体 *text*
    /^\s*[-*+]\s+/m,                  // 无序列表 - * +
    /^\s*\d+\.\s+/m,                  // 有序列表 1. 2. 3.
    /```[\s\S]*?```/,                 // 代码块 ```code```
    /`[^`]+`/,                        // 行内代码 `code`
    /^\s*>/m,                         // 引用 >
    /\[([^\]]+)\]\([^)]+\)/,          // 链接 [text](url)
    /^\s*\|.*\|.*\|/m,                // 表格
    /^---+$/m,                        // 分隔线
  ]
  return markdownPatterns.some(pattern => pattern.test(str))
}

// 判断内容类型：'text' | 'html' | 'markdown'
const contentType = computed(() => {
  if (props.forceType === 'text') return 'text'
  if (props.forceType === 'html') return 'html'
  if (props.forceType === 'markdown') return 'markdown'
  
  // 自动检测
  if (detectHtml(props.content)) return 'html'
  if (detectMarkdown(props.content)) return 'markdown'
  return 'text'
})

// 渲染后的内容
const renderedContent = computed(() => {
  if (!props.content) return ''
  
  if (contentType.value === 'markdown') {
    // 解析 Markdown 为 HTML
    return marked(props.content)
  }
  
  // HTML 内容直接返回
  return props.content
})
</script>

<style scoped>
.content-renderer {
  width: 100%;
}

/* 纯文本模式 */
.text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.8;
}

/* HTML内容模式 */
.html-content {
  line-height: 1.8;
}

/* HTML内容样式 - DeepSeek返回格式适配 */
.html-content :deep(p) {
  margin: 0.8em 0;
}

.html-content :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  font-size: 13px;
}

.html-content :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 13px;
}

.html-content :deep(p code),
.html-content :deep(li code) {
  background: #f0f0f0;
  color: #c7254e;
  padding: 2px 6px;
  border-radius: 4px;
}

.html-content :deep(ul),
.html-content :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.html-content :deep(li) {
  margin: 4px 0;
}

.html-content :deep(h1),
.html-content :deep(h2),
.html-content :deep(h3),
.html-content :deep(h4) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #303133;
}

.html-content :deep(h1) { font-size: 1.5em; }
.html-content :deep(h2) { font-size: 1.3em; }
.html-content :deep(h3) { font-size: 1.1em; }
.html-content :deep(h4) { font-size: 1em; }

.html-content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding: 12px 16px;
  margin: 12px 0;
  color: #606266;
  background: #f5f7fa;
  border-radius: 0 8px 8px 0;
}

.html-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.html-content :deep(th),
.html-content :deep(td) {
  border: 1px solid #e4e7ed;
  padding: 8px 12px;
  text-align: left;
}

.html-content :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.html-content :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.html-content :deep(a:hover) {
  text-decoration: underline;
}

.html-content :deep(strong) {
  font-weight: 600;
  color: #303133;
}

.html-content :deep(em) {
  font-style: italic;
}

.html-content :deep(hr) {
  border: none;
  border-top: 1px solid #e4e7ed;
  margin: 16px 0;
}

.html-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}
</style>

