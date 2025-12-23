<template>
  <div class="learn-view">
    <h1 class="page-title">
      <el-icon><Reading /></el-icon>
      专注学习模块
    </h1>

    <!-- 初始状态：开始学习入口 -->
    <el-card v-if="!currentQuestion && !showQuestionList" class="start-card">
      <div class="start-content">
        <div class="start-icon">
          <el-icon :size="64"><Reading /></el-icon>
        </div>
        <h2>准备好开始学习了吗？</h2>
        <p class="start-desc">一道一道题目学习，做完一道再做下一道</p>
        
        <div class="start-stats" v-if="stats">
          <div class="stat-item">
            <span class="stat-value">{{ stats.total_questions }}</span>
            <span class="stat-label">题目总数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.done_count }}</span>
            <span class="stat-label">已做过</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.undone_count }}</span>
            <span class="stat-label">未做过</span>
          </div>
          <div class="stat-item" v-if="stats.avg_score > 0">
            <span class="stat-value">{{ stats.avg_score }}</span>
            <span class="stat-label">平均分</span>
          </div>
        </div>

        <div class="start-actions">
          <el-button type="primary" size="large" @click="startRandomQuestion">
            <el-icon><Promotion /></el-icon>
            随机开始一道
          </el-button>
          <el-button size="large" @click="showQuestionList = true">
            <el-icon><List /></el-icon>
            选择题目学习
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 题目选择列表 -->
    <el-card v-if="showQuestionList && !currentQuestion" class="select-card">
      <template #header>
        <div class="card-header">
          <el-icon><List /></el-icon>
          <span>选择题目</span>
          <el-button text type="primary" @click="showQuestionList = false">
            <el-icon><Back /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <!-- 筛选器 -->
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="答题状态" clearable @change="loadQuestions">
          <el-option label="全部" value="" />
          <el-option label="未做过" value="undone" />
          <el-option label="已做过" value="done" />
        </el-select>
        <el-select v-model="filterType" placeholder="题目类型" clearable @change="loadQuestions">
          <el-option label="全部类型" value="" />
          <el-option label="基础" value="基础" />
          <el-option label="进阶" value="进阶" />
          <el-option label="高频" value="高频" />
          <el-option label="手写" value="手写" />
          <el-option label="原理" value="原理" />
          <el-option label="面经" value="面经" />
          <el-option label="自检" value="自检" />
        </el-select>
      </div>

      <div v-if="loading" class="loading-wrapper">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="!questions.length" class="empty-wrapper">
        <el-empty description="暂无可学习的题目，请先在「题目AI加工」模块添加题目" />
      </div>

      <div v-else class="question-list">
        <div 
          v-for="question in questions" 
          :key="question.id" 
          class="question-item"
          :class="{ 'done': question.attempt_count > 0 }"
          @click="startLearning(question)"
        >
          <div class="question-header">
            <el-tag :type="getTagType(question.question_type)" size="small">
              {{ question.question_type }}
            </el-tag>
            <el-tag 
              v-if="question.attempt_count > 0" 
              type="success" 
              size="small"
              effect="plain"
            >
              已做{{ question.attempt_count }}次
            </el-tag>
            <el-tag 
              v-if="question.last_score" 
              :type="getScoreTagType(question.last_score)" 
              size="small"
              effect="plain"
            >
              {{ question.last_score }}分
            </el-tag>
          </div>
          <div class="question-title-preview">
            <ContentRenderer :content="question.title" />
          </div>
          <div class="start-hint">
            <el-icon><Right /></el-icon>
            点击开始学习
          </div>
        </div>
      </div>
    </el-card>

    <!-- 学习进行中 -->
    <div v-if="currentQuestion" class="learning-session">
      <!-- 顶部进度条和计时器 -->
      <div class="session-header">
        <div class="progress-section">
          <div class="step-indicators">
            <div 
              v-for="(step, index) in steps" 
              :key="index"
              class="step-indicator"
              :class="{ 
                'active': currentStep === index, 
                'completed': currentStep > index 
              }"
            >
              <div class="step-icon">
                <el-icon v-if="currentStep > index"><Check /></el-icon>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="step-info">
                <span class="step-name">{{ step.name }}</span>
                <span class="step-time">{{ step.duration }}分钟</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="timer-section">
          <div class="timer-display" :class="{ 'warning': remainingTime <= 60 }">
            <el-icon><Clock /></el-icon>
            <span class="time-value">{{ formatTime(remainingTime) }}</span>
          </div>
          <el-progress 
            :percentage="stepProgress" 
            :stroke-width="8"
            :show-text="false"
            :color="currentStep === 0 ? '#67c23a' : (currentStep === 1 ? '#e6a23c' : '#409eff')"
          />
        </div>

        <div class="session-actions">
          <el-button text type="danger" @click="exitSession">
            <el-icon><Close /></el-icon>
            退出学习
          </el-button>
        </div>
      </div>

      <!-- 第一步：快速浏览 (40% = 4分钟) -->
      <div v-if="currentStep === 0" class="step-content step-scan">
        <el-card class="content-card">
          <template #header>
            <div class="content-header">
              <div class="step-badge scan">
                <el-icon><View /></el-icon>
                第一步：快速浏览
              </div>
              <span class="step-tip">认真阅读题目和答案，理解核心要点</span>
            </div>
          </template>
          
          <div class="question-section">
            <h3 class="section-title">
              <el-icon><QuestionFilled /></el-icon>
              题目
            </h3>
            <div class="content-box question-box">
              <ContentRenderer :content="currentQuestion.title" />
            </div>
          </div>

          <div class="answer-section">
            <h3 class="section-title">
              <el-icon><Ticket /></el-icon>
              标准答案
            </h3>
            <div class="content-box answer-box">
              <ContentRenderer :content="currentQuestion.answer" />
            </div>
          </div>
        </el-card>

        <div class="step-actions">
          <el-button type="success" size="large" @click="nextStep">
            <el-icon><Right /></el-icon>
            我已理解，进入下一步
          </el-button>
        </div>
      </div>

      <!-- 第二步：自己讲和写要点 (40% = 4分钟) -->
      <div v-if="currentStep === 1" class="step-content step-write">
        <el-card class="content-card">
          <template #header>
            <div class="content-header">
              <div class="step-badge write">
                <el-icon><EditPen /></el-icon>
                第二步：自己讲&写要点
              </div>
              <span class="step-tip">先用自己的话讲出来，再写下关键要点</span>
            </div>
          </template>
          
          <div class="question-section">
            <h3 class="section-title">
              <el-icon><QuestionFilled /></el-icon>
              题目
            </h3>
            <div class="content-box question-box">
              <ContentRenderer :content="currentQuestion.title" />
            </div>
          </div>

          <div class="my-answer-section">
            <h3 class="section-title">
              <el-icon><Edit /></el-icon>
              我的理解 <span class="core-tip">（核心：用自己的话讲清楚！）</span>
            </h3>
            <el-input
              v-model="myAnswer"
              type="textarea"
              :rows="10"
              placeholder="请用自己的语言描述这道题的答案...

💡 学习技巧：
1. 先大声说出来（就像面试一样）
2. 再写下关键要点
3. 注意逻辑清晰，条理分明"
              class="answer-input"
            />
          </div>

          <div class="answer-hidden-hint">
            <el-icon><Hide /></el-icon>
            标准答案已隐藏，请独立思考
          </div>
        </el-card>

        <div class="step-actions">
          <el-button type="warning" size="large" @click="nextStep" :disabled="!myAnswer.trim()">
            <el-icon><Right /></el-icon>
            提交我的答案，查看结果
          </el-button>
        </div>
      </div>

      <!-- 第三步：复习和AI评分 (20% = 2分钟) -->
      <div v-if="currentStep === 2" class="step-content step-review">
        <el-card class="content-card">
          <template #header>
            <div class="content-header">
              <div class="step-badge review">
                <el-icon><Medal /></el-icon>
                第三步：复习与评估
              </div>
              <span class="step-tip">对比标准答案，看看差距在哪里</span>
            </div>
          </template>

          <div class="comparison-container">
            <!-- 左侧：我的答案 -->
            <div class="comparison-column my-column">
              <h3 class="column-title">
                <el-icon><User /></el-icon>
                我的答案
              </h3>
              <div class="content-box my-answer-box">
                {{ myAnswer }}
              </div>
            </div>

            <!-- 右侧：标准答案 -->
            <div class="comparison-column standard-column">
              <h3 class="column-title">
                <el-icon><CircleCheck /></el-icon>
                标准答案
              </h3>
              <div class="content-box standard-answer-box">
                <ContentRenderer :content="currentQuestion.answer" />
              </div>
            </div>
          </div>

          <!-- AI评分区域 -->
          <div class="ai-evaluation">
            <div class="evaluation-header">
              <el-icon><MagicStick /></el-icon>
              <span>AI 智能评估</span>
              <el-button 
                v-if="!aiEvaluation && !evaluating" 
                type="primary" 
                size="small"
                @click="requestAiEvaluation"
              >
                获取AI评分
              </el-button>
            </div>

            <div v-if="evaluating" class="evaluating-status">
              <el-icon class="is-loading"><Loading /></el-icon>
              AI正在分析你的答案...
            </div>

            <div v-else-if="aiEvaluation" class="evaluation-result">
              <div class="score-display">
                <div class="score-circle" :class="getScoreClass(aiEvaluation.score)">
                  <span class="score-value">{{ aiEvaluation.score }}</span>
                  <span class="score-label">分</span>
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

            <div v-else class="evaluation-placeholder">
              <el-icon><InfoFilled /></el-icon>
              点击上方按钮获取AI评分
            </div>
          </div>
        </el-card>

        <!-- 完成学习后的操作 -->
        <div class="step-actions finish-actions">
          <el-button type="success" size="large" @click="goNextQuestion">
            <el-icon><Right /></el-icon>
            做下一题
          </el-button>
          <el-button type="primary" size="large" @click="finishLearning">
            <el-icon><Check /></el-icon>
            结束学习
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLearningQuestions, getRandomQuestion, getNextQuestion, evaluateAnswer, saveAnswerReport, getAnswerStats } from '../api'
import ContentRenderer from '../components/ContentRenderer.vue'

// 学习步骤配置
const steps = [
  { name: '快速浏览', duration: 4, percentage: 40 },
  { name: '自己讲写', duration: 4, percentage: 40 },
  { name: '复习评估', duration: 2, percentage: 20 }
]

// 状态
const loading = ref(false)
const questions = ref([])
const currentQuestion = ref(null)
const currentStep = ref(0)
const myAnswer = ref('')
const aiEvaluation = ref(null)
const evaluating = ref(false)
const showQuestionList = ref(false)
const stats = ref(null)

// 筛选条件
const filterStatus = ref('')
const filterType = ref('')

// 计时器
const timer = ref(null)
const remainingTime = ref(0) // 秒
const stepStartTime = ref(0)

// 当前步骤总时间（秒）
const currentStepDuration = computed(() => {
  return steps[currentStep.value].duration * 60
})

// 步骤进度百分比
const stepProgress = computed(() => {
  if (currentStepDuration.value === 0) return 0
  const elapsed = currentStepDuration.value - remainingTime.value
  return Math.min(100, Math.round((elapsed / currentStepDuration.value) * 100))
})

// 格式化时间 MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取标签类型
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

// 获取分数标签类型
const getScoreTagType = (score) => {
  if (score >= 90) return 'success'
  if (score >= 75) return ''
  if (score >= 60) return 'warning'
  return 'danger'
}

// 获取分数等级样式
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await getAnswerStats()
    if (res.data.code === 200) {
      stats.value = res.data.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载题目列表
const loadQuestions = async () => {
  loading.value = true
  try {
    const res = await getLearningQuestions({
      type: filterType.value,
      status: filterStatus.value
    })
    if (res.data.code === 200) {
      questions.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

// 随机开始一道题
const startRandomQuestion = async () => {
  loading.value = true
  try {
    const res = await getRandomQuestion({ prefer_undone: 'true' })
    if (res.data.code === 200) {
      startLearning(res.data.data)
    } else {
      ElMessage.warning(res.data.message || '暂无可学习的题目')
    }
  } catch (error) {
    ElMessage.error('获取题目失败')
  } finally {
    loading.value = false
  }
}

// 开始学习
const startLearning = (question) => {
  currentQuestion.value = question
  currentStep.value = 0
  myAnswer.value = ''
  aiEvaluation.value = null
  showQuestionList.value = false
  startStepTimer()
}

// 启动当前步骤计时器
const startStepTimer = () => {
  stopTimer()
  remainingTime.value = currentStepDuration.value
  stepStartTime.value = Date.now()
  
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      // 时间到，自动进入下一步
      if (currentStep.value < 2) {
        ElMessage.warning('时间到！自动进入下一步')
        nextStep()
      } else {
        stopTimer()
        ElMessage.info('复习时间结束')
      }
    }
  }, 1000)
}

// 停止计时器
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

// 下一步
const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
    startStepTimer()
  }
}

// 退出学习
const exitSession = async () => {
  try {
    await ElMessageBox.confirm('确定要退出本次学习吗？学习进度将不会保存。', '提示', {
      confirmButtonText: '确定退出',
      cancelButtonText: '继续学习',
      type: 'warning'
    })
    stopTimer()
    currentQuestion.value = null
    currentStep.value = 0
    myAnswer.value = ''
    aiEvaluation.value = null
    loadStats() // 刷新统计
  } catch {
    // 用户取消
  }
}

// 请求AI评分
const requestAiEvaluation = async () => {
  if (!myAnswer.value.trim()) {
    ElMessage.warning('请先填写你的答案')
    return
  }

  evaluating.value = true
  try {
    const res = await evaluateAnswer({
      question_id: currentQuestion.value.id,
      question: currentQuestion.value.title,
      standard_answer: currentQuestion.value.answer,
      user_answer: myAnswer.value,
      score_type: 'learn' // 标记为学习时的评分
    })
    
    if (res.data.code === 200) {
      aiEvaluation.value = res.data.data
      ElMessage.success('AI评分完成')
      
      // 保存答题报告
      await saveAnswerReport({
        question_id: currentQuestion.value.id,
        user_answer: myAnswer.value,
        ai_score: res.data.data.score,
        ai_feedback: res.data.data.feedback,
        ai_improvements: res.data.data.improvements
      })
    } else {
      ElMessage.error(res.data.message || 'AI评分失败')
    }
  } catch (error) {
    ElMessage.error('AI评分服务暂时不可用，请稍后重试')
  } finally {
    evaluating.value = false
  }
}

// 做下一题
const goNextQuestion = async () => {
  stopTimer()
  
  try {
    const res = await getNextQuestion({
      current_id: currentQuestion.value.id,
      type: filterType.value
    })
    
    if (res.data.code === 200) {
      startLearning(res.data.data)
      ElMessage.success('开始下一题！')
    } else {
      ElMessage.info('恭喜！已经没有更多题目了')
      finishLearning()
    }
  } catch (error) {
    ElMessage.error('获取下一题失败')
  }
}

// 完成学习
const finishLearning = async () => {
  stopTimer()
  
  ElMessage.success('学习完成！继续加油！')
  currentQuestion.value = null
  currentStep.value = 0
  myAnswer.value = ''
  aiEvaluation.value = null
  
  // 刷新统计
  await loadStats()
}

// 生命周期
onMounted(() => {
  loadStats()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.learn-view {
  max-width: 1100px;
}

/* 开始卡片 */
.start-card {
  margin-bottom: 20px;
}

.start-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.start-icon {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #409eff, #79bbff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #fff;
}

.start-content h2 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 8px 0;
}

.start-desc {
  color: #909399;
  font-size: 14px;
  margin: 0 0 32px 0;
}

.start-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
  padding: 20px 40px;
  background: #f5f7fa;
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.start-actions {
  display: flex;
  gap: 16px;
}

.start-actions .el-button {
  min-width: 160px;
  height: 48px;
  font-size: 16px;
}

/* 选择题目卡片 */
.select-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-header .el-button {
  margin-left: auto;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filter-bar .el-select {
  width: 150px;
}

.loading-wrapper,
.empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
  gap: 16px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  padding: 16px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.question-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.question-item.done {
  background: #f0f9eb;
  border-color: #c2e7b0;
}

.question-item.done:hover {
  border-color: #67c23a;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.question-date {
  color: #909399;
  font-size: 12px;
}

.question-title-preview {
  font-size: 15px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 12px;
  max-height: 80px;
  overflow: hidden;
}

.start-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.3s;
}

.question-item:hover .start-hint {
  opacity: 1;
}

/* 学习会话 */
.learning-session {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.session-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.progress-section {
  flex: 1;
}

.step-indicators {
  display: flex;
  gap: 32px;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.5;
  transition: all 0.3s;
}

.step-indicator.active {
  opacity: 1;
}

.step-indicator.completed {
  opacity: 0.8;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: #909399;
  transition: all 0.3s;
}

.step-indicator.active .step-icon {
  background: #409eff;
  color: #fff;
}

.step-indicator.completed .step-icon {
  background: #67c23a;
  color: #fff;
}

.step-info {
  display: flex;
  flex-direction: column;
}

.step-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.step-time {
  font-size: 12px;
  color: #909399;
}

.timer-section {
  min-width: 160px;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  justify-content: center;
}

.timer-display .el-icon {
  color: #409eff;
}

.timer-display.warning .el-icon,
.timer-display.warning .time-value {
  color: #f56c6c;
}

.time-value {
  font-size: 24px;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #303133;
}

.session-actions {
  margin-left: auto;
}

/* 步骤内容 */
.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-card {
  border-radius: 12px;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.step-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.step-badge.scan {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: #fff;
}

.step-badge.write {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
  color: #fff;
}

.step-badge.review {
  background: linear-gradient(135deg, #409eff, #79bbff);
  color: #fff;
}

.step-tip {
  color: #909399;
  font-size: 13px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 20px 0 12px;
  font-size: 15px;
  color: #409eff;
  font-weight: 500;
}

.content-box {
  padding: 16px 20px;
  border-radius: 10px;
  line-height: 1.8;
}

.question-box {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  font-size: 16px;
  color: #303133;
}

.answer-box {
  background: linear-gradient(135deg, #f0f9eb 0%, #e8f5e1 100%);
  border: 1px solid #c2e7b0;
  color: #606266;
}

/* 第二步特有 */
.my-answer-section {
  margin-top: 20px;
}

.core-tip {
  color: #e6a23c;
  font-size: 13px;
  font-weight: normal;
}

.answer-input :deep(.el-textarea__inner) {
  font-size: 15px;
  line-height: 1.8;
  padding: 16px;
  border-radius: 10px;
}

.answer-hidden-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-top: 16px;
  background: #fef0f0;
  border-radius: 8px;
  color: #f56c6c;
  font-size: 14px;
}

/* 第三步特有 */
.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.comparison-column {
  display: flex;
  flex-direction: column;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
}

.my-column .column-title {
  color: #e6a23c;
}

.standard-column .column-title {
  color: #67c23a;
}

.my-answer-box {
  flex: 1;
  background: #fffbf0;
  border: 1px solid #faecd8;
  white-space: pre-wrap;
}

.standard-answer-box {
  flex: 1;
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
}

/* AI评估 */
.ai-evaluation {
  margin-top: 24px;
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

.evaluation-header .el-button {
  margin-left: auto;
}

.evaluating-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #e6a23c;
}

.evaluation-result {
  display: flex;
  gap: 24px;
}

.score-display {
  flex-shrink: 0;
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

.evaluation-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}

/* 步骤操作 */
.step-actions {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.step-actions .el-button {
  min-width: 200px;
  height: 48px;
  font-size: 16px;
}

.finish-actions {
  gap: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    gap: 16px;
  }

  .step-indicators {
    flex-wrap: wrap;
    gap: 16px;
  }

  .comparison-container {
    grid-template-columns: 1fr;
  }

  .evaluation-result {
    flex-direction: column;
  }

  .score-display {
    display: flex;
    justify-content: center;
  }

  .start-stats {
    flex-wrap: wrap;
    justify-content: center;
  }

  .start-actions {
    flex-direction: column;
    width: 100%;
  }

  .start-actions .el-button {
    width: 100%;
  }
}
</style>
