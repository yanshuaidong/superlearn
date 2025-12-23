<template>
  <div class="ai-process-view">
    <h1 class="page-title">
      <el-icon><MagicStick /></el-icon>
      题目AI加工
    </h1>

    <!-- 说明卡片 -->
    <el-card class="intro-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><InfoFilled /></el-icon>
          <span>模块说明</span>
        </div>
      </template>
      <div class="intro-content">
        <p>🎯 <strong>目的：</strong>将网络搜集的面试题转化为标准化、易吸收的面试题和答案解析</p>
        <p>📋 <strong>流程：</strong>输入原始题目 → AI智能加工 → 生成标准化题目和答案 → 入库学习</p>
        <p>⚠️ <strong>注意：</strong>AI接口为串行处理，一次处理一题，每题最长等待10分钟，请耐心等待</p>
      </div>
    </el-card>

    <!-- 输入区域 -->
    <el-card class="input-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Edit /></el-icon>
          <span>输入原始题目</span>
          <el-tag type="info" size="small" class="tip-tag">每行一题，或使用分隔符分隔</el-tag>
        </div>
      </template>
      <el-input
        v-model="rawInput"
        type="textarea"
        :rows="8"
        placeholder="请输入你从网络搜集的面试题，支持以下格式：
1. 每行一题
2. 使用 --- 分隔多个题目
3. 使用 【问题】 标记题目

示例：
什么是闭包？
---
Vue3和Vue2的区别是什么？
---
解释一下JavaScript的事件循环机制"
        :disabled="isProcessing"
      />
      <div class="input-actions">
        <el-select v-model="questionType" placeholder="选择题目类型" style="width: 150px" :disabled="isProcessing">
          <el-option label="基础" value="基础" />
          <el-option label="进阶" value="进阶" />
          <el-option label="高频" value="高频" />
          <el-option label="手写" value="手写" />
          <el-option label="原理" value="原理" />
          <el-option label="面经" value="面经" />
          <el-option label="自检" value="自检" />
        </el-select>
        <el-button type="primary" @click="parseQuestions" :disabled="!rawInput.trim() || isProcessing">
          <el-icon><Document /></el-icon>
          解析题目
        </el-button>
      </div>
    </el-card>

    <!-- 解析结果预览 -->
    <el-card v-if="parsedQuestions.length > 0" class="preview-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><List /></el-icon>
          <span>解析出 {{ parsedQuestions.length }} 道题目</span>
          <el-button 
            type="success" 
            size="small" 
            @click="startProcessing" 
            :loading="isProcessing"
            :disabled="isProcessing"
          >
            <el-icon><Cpu /></el-icon>
            开始AI加工
          </el-button>
        </div>
      </template>
      <div class="question-list">
        <div 
          v-for="(q, index) in parsedQuestions" 
          :key="index" 
          class="question-item"
          :class="{ 
            'processing': q.status === 'processing',
            'done': q.status === 'done',
            'error': q.status === 'error'
          }"
        >
          <div class="question-header">
            <span class="question-index">#{{ index + 1 }}</span>
            <el-tag :type="getStatusType(q.status)" size="small">{{ getStatusText(q.status) }}</el-tag>
            <el-icon v-if="q.status === 'processing'" class="loading-icon"><Loading /></el-icon>
          </div>
          <div class="question-content">{{ q.raw }}</div>
        </div>
      </div>
    </el-card>

    <!-- 处理进度 -->
    <el-card v-if="isProcessing || processedResults.length > 0" class="progress-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><TrendCharts /></el-icon>
          <span>处理进度</span>
          <span class="progress-text">{{ completedCount }} / {{ parsedQuestions.length }}</span>
        </div>
      </template>
      <el-progress 
        :percentage="progressPercentage" 
        :status="progressStatus"
        :stroke-width="16"
        striped
        striped-flow
      />
      <div v-if="isProcessing && currentProcessingIndex >= 0" class="processing-tip">
        <el-icon class="loading-icon"><Loading /></el-icon>
        正在处理第 {{ currentProcessingIndex + 1 }} 题，请耐心等待（最长10分钟）...
      </div>
    </el-card>

    <!-- AI加工结果 -->
    <el-card v-if="processedResults.length > 0" class="results-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Finished /></el-icon>
          <span>AI加工结果</span>
          <div class="header-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="saveAllToDb" 
              :loading="isSaving"
              :disabled="successResults.length === 0"
            >
              <el-icon><FolderAdd /></el-icon>
              全部入库 ({{ successResults.length }} 题)
            </el-button>
          </div>
        </div>
      </template>
      <div class="results-list">
        <el-collapse v-model="activeResults">
          <el-collapse-item 
            v-for="(result, index) in processedResults" 
            :key="index" 
            :name="index"
            :class="{ 'error-result': result.error }"
          >
            <template #title>
              <div class="result-title">
                <span class="result-index">#{{ index + 1 }}</span>
                <el-tag :type="result.error ? 'danger' : (result.saved ? 'success' : 'primary')" size="small">
                  {{ result.error ? '处理失败' : (result.saved ? '已入库' : '待入库') }}
                </el-tag>
                <span class="result-question">{{ truncate(result.title || result.raw, 50) }}</span>
              </div>
            </template>
            <div class="result-content">
              <div v-if="result.error" class="error-message">
                <el-icon><WarningFilled /></el-icon>
                {{ result.error }}
              </div>
              <template v-else>
                <div class="result-section">
                  <h4><el-icon><QuestionFilled /></el-icon> 标准化题目</h4>
                  <div class="result-text title-text">{{ result.title }}</div>
                </div>
                <div class="result-section">
                  <h4><el-icon><Ticket /></el-icon> 答案解析</h4>
                  <div class="result-text answer-text" v-html="formatAnswer(result.answer)"></div>
                </div>
                <div class="result-actions">
                  <el-button 
                    v-if="!result.saved"
                    type="success" 
                    size="small" 
                    @click="saveSingleToDb(result, index)"
                    :loading="result.saving"
                  >
                    <el-icon><CircleCheck /></el-icon>
                    单独入库
                  </el-button>
                  <el-tag v-else type="success" effect="plain">
                    <el-icon><SuccessFilled /></el-icon>
                    已入库
                  </el-tag>
                </div>
              </template>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { processQuestionWithAi, addQuestion } from '../api'

const rawInput = ref('')
const questionType = ref('基础')
const parsedQuestions = ref([])
const processedResults = ref([])
const isProcessing = ref(false)
const isSaving = ref(false)
const activeResults = ref([])

// 解析输入的题目
const parseQuestions = () => {
  const input = rawInput.value.trim()
  if (!input) return

  let questions = []
  
  // 优先按 --- 分隔
  if (input.includes('---')) {
    questions = input.split('---').map(q => q.trim()).filter(q => q)
  } 
  // 按【问题】标记分隔
  else if (input.includes('【问题】')) {
    questions = input.split('【问题】').map(q => q.trim()).filter(q => q)
  }
  // 按换行分隔
  else {
    questions = input.split('\n').map(q => q.trim()).filter(q => q)
  }

  parsedQuestions.value = questions.map(q => ({
    raw: q,
    status: 'pending' // pending, processing, done, error
  }))

  processedResults.value = []
  activeResults.value = []

  if (questions.length > 0) {
    ElMessage.success(`成功解析 ${questions.length} 道题目`)
  } else {
    ElMessage.warning('未能解析出有效题目')
  }
}

// 当前处理的题目索引
const currentProcessingIndex = ref(-1)

// 开始AI加工处理（串行处理，确保稳定性）
const startProcessing = async () => {
  if (parsedQuestions.value.length === 0) return
  
  isProcessing.value = true
  processedResults.value = []
  currentProcessingIndex.value = -1
  
  // 逐个处理（串行，一个完成后再处理下一个）
  for (let i = 0; i < parsedQuestions.value.length; i++) {
    const question = parsedQuestions.value[i]
    currentProcessingIndex.value = i
    question.status = 'processing'
    
    console.log(`[AI加工] 开始处理第 ${i + 1}/${parsedQuestions.value.length} 题`)
    
    try {
      // 发送请求并等待完成（最长等待10分钟）
      const response = await processQuestionWithAi({
        question: question.raw,
        type: questionType.value
      })
      
      // 处理成功
      if (response.data.code === 200) {
        question.status = 'done'
        processedResults.value.push({
          raw: question.raw,
          title: response.data.data.title,
          answer: response.data.data.answer,
          saved: false,
          saving: false
        })
        activeResults.value.push(i)
        console.log(`[AI加工] 第 ${i + 1} 题处理成功`)
      } else {
        // 服务端返回错误
        question.status = 'error'
        processedResults.value.push({
          raw: question.raw,
          error: response.data.message || '处理失败',
          saved: false
        })
        console.warn(`[AI加工] 第 ${i + 1} 题处理失败:`, response.data.message)
      }
    } catch (error) {
      // 捕获所有错误（包括超时、网络错误等）
      question.status = 'error'
      
      let errorMessage = '处理失败'
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = '处理超时（超过10分钟），请稍后重试'
      } else if (error.response) {
        errorMessage = `服务端错误: ${error.response.status}`
      } else if (error.request) {
        errorMessage = '网络错误，请检查后端服务是否正常'
      } else {
        errorMessage = error.message || '未知错误'
      }
      
      processedResults.value.push({
        raw: question.raw,
        error: errorMessage,
        saved: false
      })
      console.error(`[AI加工] 第 ${i + 1} 题出错:`, errorMessage)
    }
    
    // 无论成功还是失败，都继续处理下一题
    // 短暂延迟，避免请求过快
    if (i < parsedQuestions.value.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // 所有题目处理完成
  isProcessing.value = false
  currentProcessingIndex.value = -1
  
  const successCount = processedResults.value.filter(r => !r.error).length
  const failCount = processedResults.value.length - successCount
  
  ElNotification({
    title: '处理完成',
    message: `成功处理 ${successCount} 道，失败 ${failCount} 道`,
    type: failCount === 0 ? 'success' : (successCount > 0 ? 'warning' : 'error'),
    duration: 5000
  })
  
  console.log(`[AI加工] 全部完成，成功 ${successCount} 道，失败 ${failCount} 道`)
}

// 单个入库
const saveSingleToDb = async (result, index) => {
  if (result.saved || result.saving) return
  
  result.saving = true
  try {
    const response = await addQuestion({
      title: result.title,
      answer: result.answer,
      question_type: questionType.value
    })
    
    if (response.data.code === 200) {
      result.saved = true
      ElMessage.success('入库成功')
    } else {
      ElMessage.error(response.data.message || '入库失败')
    }
  } catch (error) {
    ElMessage.error('入库失败：' + error.message)
  } finally {
    result.saving = false
  }
}

// 全部入库
const saveAllToDb = async () => {
  const toSave = processedResults.value.filter(r => !r.error && !r.saved)
  if (toSave.length === 0) {
    ElMessage.info('没有需要入库的题目')
    return
  }
  
  isSaving.value = true
  let successCount = 0
  
  for (const result of toSave) {
    result.saving = true
    try {
      const response = await addQuestion({
        title: result.title,
        answer: result.answer,
        question_type: questionType.value
      })
      
      if (response.data.code === 200) {
        result.saved = true
        successCount++
      }
    } catch (error) {
      console.error('入库失败:', error)
    } finally {
      result.saving = false
    }
  }
  
  isSaving.value = false
  
  ElNotification({
    title: '批量入库完成',
    message: `成功入库 ${successCount} 道题目`,
    type: successCount === toSave.length ? 'success' : 'warning'
  })
}

// 计算属性
const completedCount = computed(() => {
  return parsedQuestions.value.filter(q => q.status === 'done' || q.status === 'error').length
})

const progressPercentage = computed(() => {
  if (parsedQuestions.value.length === 0) return 0
  return Math.round((completedCount.value / parsedQuestions.value.length) * 100)
})

const progressStatus = computed(() => {
  if (progressPercentage.value === 100) {
    return processedResults.value.some(r => r.error) ? 'warning' : 'success'
  }
  return ''
})

const successResults = computed(() => {
  return processedResults.value.filter(r => !r.error && !r.saved)
})

// 工具函数
const getStatusType = (status) => {
  const types = {
    pending: 'info',
    processing: 'warning',
    done: 'success',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '等待中',
    processing: '处理中',
    done: '已完成',
    error: '失败'
  }
  return texts[status] || '未知'
}

const truncate = (str, len) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

const formatAnswer = (answer) => {
  if (!answer) return ''
  // 现在 AI 回答已经是 HTML 格式，直接返回即可
  return answer
}
</script>

<style scoped>
.ai-process-view {
  max-width: 1000px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  color: #303133;
  margin-bottom: 24px;
}

.page-title .el-icon {
  color: #e6a23c;
}

.intro-card,
.input-card,
.preview-card,
.progress-card,
.results-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.tip-tag {
  margin-left: auto;
}

.intro-content {
  line-height: 2;
  color: #606266;
}

.intro-content p {
  margin: 8px 0;
}

.input-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  align-items: center;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #909399;
  transition: all 0.3s;
}

.question-item.processing {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.question-item.done {
  border-left-color: #67c23a;
  background: #f0f9eb;
}

.question-item.error {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.question-index {
  font-weight: 600;
  color: #409eff;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: #e6a23c;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.question-content {
  color: #606266;
  line-height: 1.6;
  word-break: break-all;
}

.progress-card .card-header {
  display: flex;
  align-items: center;
}

.progress-text {
  margin-left: auto;
  font-size: 14px;
  color: #909399;
}

.processing-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  background: #fdf6ec;
  border-radius: 6px;
  color: #e6a23c;
  font-size: 14px;
}

.results-card .header-actions {
  margin-left: auto;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.result-index {
  font-weight: 600;
  color: #409eff;
}

.result-question {
  flex: 1;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-content {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  padding: 12px;
  background: #fef0f0;
  border-radius: 6px;
}

.result-section {
  margin-bottom: 20px;
}

.result-section h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 15px;
}

.result-text {
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  line-height: 1.8;
  color: #606266;
}

.title-text {
  font-weight: 500;
  color: #303133;
}

.answer-text {
  max-height: 400px;
  overflow-y: auto;
}

/* DeepSeek HTML 内容样式 */
.answer-text :deep(p) {
  margin: 0.8em 0;
}

.answer-text :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.answer-text :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.answer-text :deep(p code) {
  background: #f0f0f0;
  color: #c7254e;
  padding: 2px 6px;
  border-radius: 4px;
}

.answer-text :deep(ul),
.answer-text :deep(ol) {
  padding-left: 24px;
  margin: 8px 0;
}

.answer-text :deep(li) {
  margin: 4px 0;
}

.answer-text :deep(h1),
.answer-text :deep(h2),
.answer-text :deep(h3),
.answer-text :deep(h4) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #303133;
}

.answer-text :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 12px 0;
  color: #606266;
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
}

.answer-text :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.answer-text :deep(th),
.answer-text :deep(td) {
  border: 1px solid #e4e7ed;
  padding: 8px 12px;
  text-align: left;
}

.answer-text :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.answer-text :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.answer-text :deep(a:hover) {
  text-decoration: underline;
}

.answer-text :deep(strong) {
  font-weight: 600;
  color: #303133;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;
}

.error-result :deep(.el-collapse-item__header) {
  color: #f56c6c;
}
</style>

