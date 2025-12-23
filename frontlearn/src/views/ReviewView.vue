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

        <!-- 历史评分进步对比 -->
        <div v-if="scoreHistory && scoreHistory.progress" class="progress-comparison">
          <div class="comparison-header">
            <el-icon><TrendCharts /></el-icon>
            <span>你的进步轨迹</span>
          </div>
          <div class="comparison-stats">
            <div class="stat-item">
              <span class="stat-label">首次评分</span>
              <span class="stat-value first">{{ scoreHistory.progress.first_score }}分</span>
            </div>
            <div class="stat-arrow">
              <el-icon v-if="scoreHistory.progress.improvement > 0" color="#67c23a"><Top /></el-icon>
              <el-icon v-else-if="scoreHistory.progress.improvement < 0" color="#f56c6c"><Bottom /></el-icon>
              <el-icon v-else color="#909399"><Minus /></el-icon>
            </div>
            <div class="stat-item">
              <span class="stat-label">最新评分</span>
              <span class="stat-value latest" :class="getScoreClass(scoreHistory.progress.latest_score)">
                {{ scoreHistory.progress.latest_score }}分
              </span>
            </div>
            <div class="stat-item improvement">
              <span class="stat-label">进步</span>
              <span 
                class="stat-value change" 
                :class="{ 'positive': scoreHistory.progress.improvement > 0, 'negative': scoreHistory.progress.improvement < 0 }"
              >
                {{ scoreHistory.progress.improvement > 0 ? '+' : '' }}{{ scoreHistory.progress.improvement }}分
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">练习次数</span>
              <span class="stat-value">{{ scoreHistory.progress.total_attempts }}次</span>
            </div>
          </div>
        </div>

        <div class="review-question">
          <h3>
            <el-icon><QuestionFilled /></el-icon>
            问题
          </h3>
          <div class="question-content">
            <ContentRenderer :content="currentQuestion.title" />
          </div>
        </div>

        <!-- 步骤1: 用户回答区域 -->
        <div v-if="reviewStep === 1" class="my-answer-section">
          <h3>
            <el-icon><Edit /></el-icon>
            我的回答
            <span class="tip">（先不看答案，尝试自己回答）</span>
          </h3>
          <el-input
            v-model="myAnswer"
            type="textarea"
            :rows="6"
            placeholder="请用自己的话回答这道题..."
            class="answer-input"
          />
          <div class="step-actions">
            <el-button type="primary" @click="submitMyAnswer" :disabled="!myAnswer.trim()">
              <el-icon><Check /></el-icon>
              提交并获取AI评分
            </el-button>
            <el-button @click="skipToAnswer">
              <el-icon><Right /></el-icon>
              跳过，直接看答案
            </el-button>
          </div>
        </div>

        <!-- 步骤2: AI评分中 -->
        <div v-else-if="reviewStep === 2 && evaluating" class="evaluating-status">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <span>AI正在评分中...</span>
        </div>

        <!-- 步骤3: 显示结果和标准答案 -->
        <div v-else-if="reviewStep === 3" class="result-section">
          <!-- AI评分结果 -->
          <div v-if="aiEvaluation" class="ai-evaluation">
            <div class="evaluation-header">
              <el-icon><MagicStick /></el-icon>
              <span>AI 评分结果</span>
            </div>
            <div class="evaluation-result">
              <div class="score-display">
                <div class="score-circle" :class="getScoreClass(aiEvaluation.score)">
                  <span class="score-value">{{ aiEvaluation.score }}</span>
                  <span class="score-label">分</span>
                </div>
                <!-- 与上次对比 -->
                <div v-if="lastScore !== null" class="score-compare">
                  <span v-if="aiEvaluation.score > lastScore" class="improve">
                    <el-icon><Top /></el-icon>
                    比上次提升 {{ aiEvaluation.score - lastScore }} 分！
                  </span>
                  <span v-else-if="aiEvaluation.score < lastScore" class="decline">
                    <el-icon><Bottom /></el-icon>
                    比上次下降 {{ lastScore - aiEvaluation.score }} 分
                  </span>
                  <span v-else class="same">
                    与上次持平
                  </span>
                </div>
              </div>
              <div class="evaluation-content">
                <div v-if="aiEvaluation.feedback" class="feedback-section">
                  <h4><el-icon><ChatLineRound /></el-icon> 评价反馈</h4>
                  <ContentRenderer :content="aiEvaluation.feedback" />
                </div>
                <div v-if="aiEvaluation.improvements" class="improvements-section">
                  <h4><el-icon><WarnTriangleFilled /></el-icon> 需要改进</h4>
                  <ContentRenderer :content="aiEvaluation.improvements" />
                </div>
              </div>
            </div>
          </div>

          <!-- 对比区域 -->
          <div class="comparison-container">
            <div class="comparison-column my-column">
              <h3>
                <el-icon><User /></el-icon>
                我的回答
              </h3>
              <div class="content-box my-answer-box">
                {{ myAnswer || '（跳过了回答）' }}
              </div>
            </div>
            <div class="comparison-column standard-column">
              <h3>
                <el-icon><CircleCheck /></el-icon>
                标准答案
              </h3>
              <div class="content-box standard-answer-box">
                <ContentRenderer :content="currentQuestion.answer" />
              </div>
            </div>
          </div>

          <!-- 复习操作 -->
          <div class="review-actions">
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
          </div>
        </div>
      </el-card>

      <!-- 快捷键提示 -->
      <div class="keyboard-hints">
        <el-tag size="small" type="info"><kbd>Enter</kbd> 提交回答</el-tag>
        <el-tag size="small" type="info"><kbd>←</kbd> 没记住</el-tag>
        <el-tag size="small" type="info"><kbd>→</kbd> 记住了</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getTodayReview, completeReview, evaluateAnswer, getScoreHistory } from '../api'
import ContentRenderer from '../components/ContentRenderer.vue'

const loading = ref(false)
const reviewing = ref(false)
const evaluating = ref(false)
const reviewQuestions = ref([])
const currentQuestion = ref(null)
const completedCount = ref(0)
const totalToday = ref(0)

// 新增状态
const reviewStep = ref(1) // 1=填写答案, 2=评分中, 3=显示结果
const myAnswer = ref('')
const aiEvaluation = ref(null)
const scoreHistory = ref(null)
const lastScore = ref(null)

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

const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
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

// 加载某道题的历史评分
const loadScoreHistory = async (questionId) => {
  try {
    const res = await getScoreHistory(questionId)
    if (res.data.code === 200) {
      scoreHistory.value = res.data.data
      // 获取上次评分
      if (res.data.data.records && res.data.data.records.length > 0) {
        lastScore.value = res.data.data.records[0].ai_score
      } else {
        lastScore.value = null
      }
    }
  } catch (error) {
    console.warn('加载评分历史失败:', error)
    scoreHistory.value = null
    lastScore.value = null
  }
}

const nextQuestion = () => {
  if (reviewQuestions.value.length > 0) {
    currentQuestion.value = reviewQuestions.value[0]
    // 重置状态
    reviewStep.value = 1
    myAnswer.value = ''
    aiEvaluation.value = null
    scoreHistory.value = null
    lastScore.value = null
    // 加载该题的历史评分
    loadScoreHistory(currentQuestion.value.id)
  } else {
    currentQuestion.value = null
  }
}

// 提交答案并获取AI评分
const submitMyAnswer = async () => {
  if (!myAnswer.value.trim()) {
    ElMessage.warning('请先填写你的答案')
    return
  }

  reviewStep.value = 2
  evaluating.value = true

  try {
    const res = await evaluateAnswer({
      question_id: currentQuestion.value.id,
      question: currentQuestion.value.title,
      standard_answer: currentQuestion.value.answer,
      user_answer: myAnswer.value,
      score_type: 'review' // 标记为复习时的评分
    })

    if (res.data.code === 200) {
      aiEvaluation.value = res.data.data
      ElMessage.success('AI评分完成')
    } else {
      ElMessage.error(res.data.message || 'AI评分失败')
      aiEvaluation.value = null
    }
  } catch (error) {
    ElMessage.error('AI评分服务暂时不可用')
    aiEvaluation.value = null
  } finally {
    evaluating.value = false
    reviewStep.value = 3
  }
}

// 跳过回答，直接看答案
const skipToAnswer = () => {
  myAnswer.value = ''
  aiEvaluation.value = null
  reviewStep.value = 3
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
  
  if (e.code === 'Enter' && !e.shiftKey && reviewStep.value === 1 && myAnswer.value.trim()) {
    e.preventDefault()
    submitMyAnswer()
  } else if (e.code === 'ArrowLeft' && reviewStep.value === 3) {
    handleReview(false)
  } else if (e.code === 'ArrowRight' && reviewStep.value === 3) {
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
  max-width: 900px;
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

/* 进步对比区域 */
.progress-comparison {
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e1 100%);
  border: 1px solid #c2e7b0;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

.comparison-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #67c23a;
  margin-bottom: 12px;
}

.comparison-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-value.first {
  color: #909399;
}

.stat-value.latest.excellent {
  color: #67c23a;
}

.stat-value.latest.good {
  color: #409eff;
}

.stat-value.latest.pass {
  color: #e6a23c;
}

.stat-value.latest.fail {
  color: #f56c6c;
}

.stat-value.change.positive {
  color: #67c23a;
}

.stat-value.change.negative {
  color: #f56c6c;
}

.stat-arrow {
  font-size: 24px;
}

.stat-item.improvement {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.review-question h3,
.my-answer-section h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #409eff;
  font-size: 14px;
  margin-bottom: 12px;
  font-weight: 500;
}

.my-answer-section h3 .tip {
  color: #909399;
  font-weight: normal;
  font-size: 13px;
}

.question-content {
  font-size: 16px;
  color: #303133;
  line-height: 1.8;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.my-answer-section {
  margin-bottom: 20px;
}

.answer-input :deep(.el-textarea__inner) {
  font-size: 15px;
  line-height: 1.8;
  padding: 16px;
  border-radius: 10px;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.evaluating-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: #e6a23c;
  font-size: 16px;
}

/* AI评估区域 */
.ai-evaluation {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 12px;
}

.evaluation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.evaluation-header .el-icon {
  color: #e6a23c;
}

.evaluation-result {
  display: flex;
  gap: 24px;
}

.score-display {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e4e7ed, #c0c4cc);
  color: #606266;
}

.score-circle.excellent {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: #fff;
}

.score-circle.good {
  background: linear-gradient(135deg, #409eff, #79bbff);
  color: #fff;
}

.score-circle.pass {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
  color: #fff;
}

.score-circle.fail {
  background: linear-gradient(135deg, #f56c6c, #f89898);
  color: #fff;
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  margin-top: 4px;
}

.score-compare {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 12px;
}

.score-compare .improve {
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-compare .decline {
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-compare .same {
  color: #909399;
}

.evaluation-content {
  flex: 1;
}

.feedback-section,
.improvements-section {
  margin-bottom: 16px;
}

.feedback-section h4,
.improvements-section h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
}

.improvements-section h4 {
  color: #e6a23c;
}

/* 对比区域 */
.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.comparison-column h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
}

.my-column h3 {
  color: #e6a23c;
}

.standard-column h3 {
  color: #67c23a;
}

.content-box {
  padding: 16px;
  border-radius: 10px;
  line-height: 1.8;
  min-height: 150px;
}

.my-answer-box {
  background: #fffbf0;
  border: 1px solid #faecd8;
  white-space: pre-wrap;
  color: #606266;
}

.standard-answer-box {
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
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

/* 响应式 */
@media (max-width: 768px) {
  .comparison-container {
    grid-template-columns: 1fr;
  }

  .evaluation-result {
    flex-direction: column;
  }

  .score-display {
    align-items: center;
  }

  .comparison-stats {
    gap: 12px;
  }

  .stat-item {
    min-width: 60px;
  }
}
</style>
