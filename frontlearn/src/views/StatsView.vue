<template>
  <div class="stats-view">
    <h1 class="page-title">
      <el-icon><DataAnalysis /></el-icon>
      统计信息
    </h1>

    <!-- 核心统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="32" color="#409eff"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_questions }}</div>
              <div class="stat-label">总题目数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="32" color="#e6a23c"><AlarmClock /></el-icon>
            <div class="stat-info">
              <div class="stat-value warning">{{ stats.today_review_count }}</div>
              <div class="stat-label">今日待复习</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="32" color="#67c23a"><CircleCheck /></el-icon>
            <div class="stat-info">
              <div class="stat-value success">{{ stats.today_completed }}</div>
              <div class="stat-label">今日已复习</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="32" color="#909399"><TrendCharts /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_reviews }}</div>
              <div class="stat-label">累计复习次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 题目类型分布 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <el-icon><PieChart /></el-icon>
          <span>题目类型分布</span>
        </div>
      </template>
      <div class="type-distribution">
        <div 
          v-for="item in stats.type_stats" 
          :key="item.question_type" 
          class="type-item"
        >
          <div class="type-info">
            <el-tag :type="getTagType(item.question_type)" size="small">
              {{ item.question_type }}
            </el-tag>
            <span class="type-count">{{ item.count }} 题</span>
          </div>
          <el-progress 
            :percentage="getPercentage(item.count)" 
            :show-text="false"
            :stroke-width="8"
          />
        </div>
        <el-empty v-if="!stats.type_stats?.length" description="暂无数据，快去添加题目吧！" />
      </div>
    </el-card>

    <!-- 掌握程度分布 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <el-icon><Medal /></el-icon>
          <span>掌握程度分布</span>
        </div>
      </template>
      <el-row :gutter="12" class="mastery-grid">
        <el-col :xs="6" :sm="3" v-for="level in masteryLevels" :key="level.level">
          <el-card shadow="never" class="mastery-item">
            <div class="mastery-level">Lv.{{ level.level }}</div>
            <div class="mastery-count">{{ level.count }}</div>
            <div class="mastery-desc">{{ getLevelDesc(level.level) }}</div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 学习趋势 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><Plus /></el-icon>
              <span>近7天新增题目</span>
            </div>
          </template>
          <div class="trend-chart">
            <div 
              v-for="day in weeklyNewData" 
              :key="day.date" 
              class="trend-bar-wrapper"
            >
              <div 
                class="trend-bar new" 
                :style="{ height: getTrendHeight(day.count, 'new') + '%' }"
              >
                <span class="trend-value">{{ day.count }}</span>
              </div>
              <div class="trend-date">{{ formatDate(day.date) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><Refresh /></el-icon>
              <span>近7天复习次数</span>
            </div>
          </template>
          <div class="trend-chart">
            <div 
              v-for="day in weeklyReviewData" 
              :key="day.date" 
              class="trend-bar-wrapper"
            >
              <div 
                class="trend-bar review" 
                :style="{ height: getTrendHeight(day.count, 'review') + '%' }"
              >
                <span class="trend-value">{{ day.count }}</span>
              </div>
              <div class="trend-date">{{ formatDate(day.date) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getOverviewStats, getMasteryStats } from '../api'

const stats = ref({
  total_questions: 0,
  type_stats: [],
  today_review_count: 0,
  today_completed: 0,
  total_reviews: 0,
  weekly_new: [],
  weekly_review: []
})

const masteryStats = ref([])

const masteryLevels = computed(() => {
  const levels = []
  for (let i = 1; i <= 8; i++) {
    const found = masteryStats.value.find(m => m.review_level === i)
    levels.push({
      level: i,
      count: found ? found.count : 0
    })
  }
  return levels
})

const weeklyNewData = computed(() => {
  const data = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const found = stats.value.weekly_new?.find(d => d.date === dateStr)
    data.push({
      date: dateStr,
      count: found ? found.count : 0
    })
  }
  return data
})

const weeklyReviewData = computed(() => {
  const data = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const found = stats.value.weekly_review?.find(d => d.date === dateStr)
    data.push({
      date: dateStr,
      count: found ? found.count : 0
    })
  }
  return data
})

const getPercentage = (count) => {
  const max = Math.max(...(stats.value.type_stats?.map(t => t.count) || [1]))
  return (count / max) * 100
}

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

const getLevelDesc = (level) => {
  const descs = ['新学习', '初记忆', '短期记忆', '中期记忆', '长期记忆', '深度记忆', '永久记忆', '完全掌握']
  return descs[level - 1] || ''
}

const getTrendHeight = (count, type) => {
  const data = type === 'new' ? weeklyNewData.value : weeklyReviewData.value
  const max = Math.max(...data.map(d => d.count), 1)
  return Math.max((count / max) * 100, 10)
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const loadStats = async () => {
  try {
    const [overviewRes, masteryRes] = await Promise.all([
      getOverviewStats(),
      getMasteryStats()
    ])
    if (overviewRes.data.code === 200) {
      stats.value = overviewRes.data.data
    }
    if (masteryRes.data.code === 200) {
      masteryStats.value = masteryRes.data.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-view {
  max-width: 1200px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.success {
  color: #67c23a;
}

.stat-label {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.type-distribution {
  padding: 8px 0;
}

.type-item {
  margin-bottom: 16px;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.type-count {
  color: #909399;
  font-size: 13px;
}

.mastery-grid {
  padding: 8px 0;
}

.mastery-item {
  text-align: center;
  padding: 12px 8px;
  margin-bottom: 12px;
}

.mastery-level {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
  margin-bottom: 8px;
}

.mastery-count {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.mastery-desc {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 160px;
  padding: 16px 0;
}

.trend-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.trend-bar {
  width: 28px;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 6px;
  min-height: 20px;
  transition: height 0.3s ease;
}

.trend-bar.new {
  background: linear-gradient(180deg, #67c23a, #85ce61);
}

.trend-bar.review {
  background: linear-gradient(180deg, #409eff, #66b1ff);
}

.trend-value {
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}

.trend-date {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
