<template>
  <div class="review-view">
    <h1 class="page-title">
      <el-icon><Timer /></el-icon>
      复习模块
    </h1>

    <!-- 遗忘曲线说明 -->
    <el-card class="info-card">
      <div class="curve-info">
        <div class="curve-title">
          <el-icon><InfoFilled /></el-icon>
          艾宾浩斯遗忘曲线复习计划
        </div>
        <div class="curve-desc">
          复习间隔：1天 → 2天 → 4天 → 7天 → 15天 → 30天 → 60天 → 120天
        </div>
        <div class="curve-levels">
          <el-tag 
            v-for="(day, index) in [1, 2, 4, 7, 15, 30, 60, 120]" 
            :key="index"
            type="info"
            size="small"
          >
            Lv.{{ index + 1 }}: {{ day }}天
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 今日复习进度 -->
    <el-card class="progress-card">
      <div class="progress-content">
        <div class="progress-stats">
          <div class="progress-item">
            <span class="progress-value pending">{{ reviewQuestions.length }}</span>
            <span class="progress-label">待复习</span>
          </div>
          <el-divider direction="vertical" />
          <div class="progress-item">
            <span class="progress-value completed">{{ completedCount }}</span>
            <span class="progress-label">已完成</span>
          </div>
        </div>
        <el-progress 
          :percentage="progressPercent" 
          :stroke-width="12"
          class="progress-bar"
        />
        <div class="progress-text">今日复习进度: {{ progressPercent }}%</div>
      </div>
    </el-card>

    <!-- 复习区域 -->
    <div v-if="loading" class="loading-wrapper">
      <el-icon class="is-loading" :size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="!reviewQuestions.length && !currentQuestion" class="empty-wrapper">
      <el-result icon="success" title="太棒了！" sub-title="今日复习任务已完成，继续保持！">
        <template #extra>
          <el-button type="primary" @click="loadReviewQuestions">
            刷新检查
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 当前复习卡片 -->
    <div v-else-if="currentQuestion" class="review-card-wrapper">
      <el-card class="review-card">
        <div class="review-meta">
          <el-tag :type="getTagType(currentQuestion.question_type)">
            {{ currentQuestion.question_type }}
          </el-tag>
          <span class="review-level">
            <el-icon><Medal /></el-icon>
            复习等级: Lv.{{ currentQuestion.review_level }}
          </span>
          <span class="review-queue">
            剩余 {{ reviewQuestions.length }} 题
          </span>
        </div>

        <div class="review-question">
          <h3>问题</h3>
          <div class="question-content">{{ currentQuestion.title }}</div>
        </div>

        <div v-if="showAnswer" class="review-answer">
          <h3>答案</h3>
          <div class="answer-content">{{ currentQuestion.answer }}</div>
        </div>

        <div class="review-actions">
          <el-button 
            v-if="!showAnswer" 
            type="primary" 
            size="large" 
            @click="showAnswer = true"
          >
            <el-icon><View /></el-icon>
            显示答案
          </el-button>

          <template v-else>
            <el-button 
              type="danger" 
              size="large" 
              @click="handleReview(false)"
              :loading="reviewing"
            >
              <el-icon><CircleClose /></el-icon>
              没记住
            </el-button>
            <el-button 
              type="success" 
              size="large" 
              @click="handleReview(true)"
              :loading="reviewing"
            >
              <el-icon><CircleCheck /></el-icon>
              记住了
            </el-button>
          </template>
        </div>
      </el-card>

      <!-- 快捷键提示 -->
      <div class="keyboard-hints">
        <el-tag size="small" type="info"><kbd>Space</kbd> 显示答案</el-tag>
        <el-tag size="small" type="info"><kbd>←</kbd> 没记住</el-tag>
        <el-tag size="small" type="info"><kbd>→</kbd> 记住了</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getTodayReview, completeReview } from '../api'

const loading = ref(false)
const reviewing = ref(false)
const showAnswer = ref(false)
const reviewQuestions = ref([])
const currentQuestion = ref(null)
const completedCount = ref(0)
const totalToday = ref(0)

const progressPercent = computed(() => {
  if (totalToday.value === 0) return 0
  return Math.round((completedCount.value / totalToday.value) * 100)
})

const getTagType = (type) => {
  const types = {
    '基础': '',
    '进阶': 'success',
    '高频': 'warning',
    '手写': 'danger',
    '原理': 'info',
    '面经': 'success',
    '自检': 'warning'
  }
  return types[type] || ''
}

const loadReviewQuestions = async () => {
  loading.value = true
  try {
    const res = await getTodayReview()
    if (res.data.code === 200) {
      reviewQuestions.value = res.data.data
      totalToday.value = res.data.data.length + completedCount.value
      nextQuestion()
    }
  } catch (error) {
    ElMessage.error('加载复习题目失败')
  } finally {
    loading.value = false
  }
}

const nextQuestion = () => {
  if (reviewQuestions.value.length > 0) {
    currentQuestion.value = reviewQuestions.value[0]
    showAnswer.value = false
  } else {
    currentQuestion.value = null
  }
}

const handleReview = async (isRemembered) => {
  if (!currentQuestion.value) return
  
  reviewing.value = true
  try {
    const res = await completeReview({
      question_id: currentQuestion.value.id,
      is_remembered: isRemembered
    })
    
    if (res.data.code === 200) {
      const result = res.data.data
      if (isRemembered) {
        ElMessage.success(`记住了！下次复习: ${result.next_review_date}`)
      } else {
        ElMessage.info('没关系，从头开始，下次一定记住！')
      }
      
      // 从队列中移除
      reviewQuestions.value.shift()
      completedCount.value++
      nextQuestion()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    reviewing.value = false
  }
}

// 键盘快捷键
const handleKeydown = (e) => {
  if (!currentQuestion.value) return
  
  if (e.code === 'Space' && !showAnswer.value) {
    e.preventDefault()
    showAnswer.value = true
  } else if (e.code === 'ArrowLeft' && showAnswer.value) {
    handleReview(false)
  } else if (e.code === 'ArrowRight' && showAnswer.value) {
    handleReview(true)
  }
}

onMounted(() => {
  loadReviewQuestions()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.review-view {
  max-width: 800px;
  margin: 0 auto;
}

.info-card {
  margin-bottom: 20px;
}

.curve-info {
  padding: 8px 0;
}

.curve-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 12px;
}

.curve-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 16px;
}

.curve-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.progress-card {
  margin-bottom: 20px;
}

.progress-content {
  text-align: center;
}

.progress-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 20px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-value {
  font-size: 32px;
  font-weight: 700;
}

.progress-value.pending {
  color: #e6a23c;
}

.progress-value.completed {
  color: #67c23a;
}

.progress-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.progress-bar {
  margin: 0 auto 12px;
  max-width: 400px;
}

.progress-text {
  color: #909399;
  font-size: 13px;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #909399;
  gap: 16px;
}

.review-card-wrapper {
  margin-bottom: 20px;
}

.review-card {
  padding: 8px;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.review-level {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
  font-size: 14px;
}

.review-queue {
  margin-left: auto;
  color: #909399;
  font-size: 13px;
}

.review-question h3,
.review-answer h3 {
  color: #409eff;
  font-size: 14px;
  margin-bottom: 12px;
  font-weight: 500;
}

.question-content {
  font-size: 16px;
  color: #303133;
  line-height: 1.8;
  white-space: pre-wrap;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.review-answer {
  margin-bottom: 20px;
}

.answer-content {
  font-size: 15px;
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
  padding: 16px;
  background: #f0f9eb;
  border-radius: 8px;
  border-left: 4px solid #67c23a;
}

.review-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 16px;
}

.review-actions .el-button {
  min-width: 120px;
}

.keyboard-hints {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.keyboard-hints kbd {
  font-family: monospace;
  margin-right: 4px;
}
</style>
