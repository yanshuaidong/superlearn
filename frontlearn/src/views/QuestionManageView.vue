<template>
  <div class="question-manage-view">
    <h1 class="page-title">
      <el-icon><Document /></el-icon>
      题目管理
    </h1>

    <!-- 搜索和添加区域 -->
    <el-card class="search-card" shadow="hover">
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索题目标题..."
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button type="success" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          添加题目
        </el-button>
      </div>
    </el-card>

    <!-- 题目列表 -->
    <el-card class="list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><List /></el-icon>
          <span>题目列表</span>
          <el-tag type="info" size="small">共 {{ pagination.total }} 道题目</el-tag>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="questions"
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="序号" width="70" align="center">
          <template #default="{ $index }">
            {{ getRowIndex($index) }}
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.question_type)" size="small">
              {{ row.question_type }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="题目标题" min-width="300">
          <template #default="{ row }">
            <div class="question-title-cell">{{ row.title }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="答题状态" width="200">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag 
                v-if="row.attempt_count > 0" 
                type="success" 
                size="small"
                effect="plain"
              >
                <el-icon><Check /></el-icon>
                已做{{ row.attempt_count }}次
              </el-tag>
              <el-tag 
                v-else 
                type="info" 
                size="small"
                effect="plain"
              >
                未做过
              </el-tag>
              
              <!-- 分数对比 -->
              <div v-if="row.first_score || row.last_score" class="score-info">
                <span v-if="row.first_score" class="score-item first">
                  首次: {{ row.first_score }}分
                </span>
                <span v-if="row.last_score && row.attempt_count > 1" class="score-item last">
                  最近: {{ row.last_score }}分
                </span>
              </div>
              <el-tag 
                v-if="row.attempt_count > 1 && row.last_score > row.first_score" 
                type="success" 
                size="small"
              >
                ↑ 进步{{ row.last_score - row.first_score }}分
              </el-tag>
              <el-tag 
                v-else-if="row.attempt_count > 1 && row.last_score < row.first_score" 
                type="danger" 
                size="small"
              >
                ↓ 退步{{ row.first_score - row.last_score }}分
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button 
              v-if="row.attempt_count > 0"
              type="success" 
              size="small" 
              link
              @click="viewAnswerReport(row)"
            >
              <el-icon><View /></el-icon>
              答题记录
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              link
              @click="openEditDialog(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              link
              @click="handleDelete(row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
        
        <template #empty>
          <el-empty description="暂无题目数据" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '添加题目' : '编辑题目'"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="题目类型" prop="question_type">
          <el-select v-model="formData.question_type" placeholder="选择题目类型" style="width: 200px">
            <el-option label="基础" value="基础" />
            <el-option label="进阶" value="进阶" />
            <el-option label="高频" value="高频" />
            <el-option label="手写" value="手写" />
            <el-option label="原理" value="原理" />
            <el-option label="面经" value="面经" />
            <el-option label="自检" value="自检" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="题目标题" prop="title">
          <el-input
            v-model="formData.title"
            type="textarea"
            :rows="3"
            placeholder="请输入题目标题"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="warning" 
            plain 
            @click="copyPrompt"
            :disabled="!formData.title"
          >
            <el-icon><CopyDocument /></el-icon>
            复制提示词到剪贴板
          </el-button>
        </el-form-item>
        
        <el-form-item label="答案解析" prop="answer">
          <el-input
            v-model="formData.answer"
            type="textarea"
            :rows="12"
            placeholder="请输入答案解析"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ dialogMode === 'add' ? '添加' : '保存' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 答题记录弹窗 -->
    <el-dialog
      v-model="reportDialogVisible"
      title="答题记录"
      width="800px"
      destroy-on-close
    >
      <div v-if="currentReport" class="report-content">
        <!-- 题目信息 -->
        <div class="report-question">
          <h3>
            <el-tag :type="getTypeTagType(currentReport.question_type)" size="small">
              {{ currentReport.question_type }}
            </el-tag>
            {{ currentReport.title }}
          </h3>
        </div>

        <!-- 进步概览 -->
        <div class="progress-overview">
          <div class="stat-card">
            <span class="stat-label">答题次数</span>
            <span class="stat-value">{{ currentReport.attempt_count }}</span>
          </div>
          <div class="stat-card first">
            <span class="stat-label">首次得分</span>
            <span class="stat-value">{{ currentReport.first_score || '-' }}</span>
          </div>
          <div class="stat-card last">
            <span class="stat-label">最近得分</span>
            <span class="stat-value">{{ currentReport.last_score || '-' }}</span>
          </div>
          <div class="stat-card improvement" :class="getImprovementClass(currentReport)">
            <span class="stat-label">进步情况</span>
            <span class="stat-value">
              {{ getImprovementText(currentReport) }}
            </span>
          </div>
        </div>

        <!-- 答案对比 -->
        <div class="answer-comparison">
          <!-- 第一次答题 -->
          <div class="answer-section first-answer">
            <h4>
              <el-icon><Clock /></el-icon>
              第一次答题
              <span class="answer-time">{{ formatDate(currentReport.first_answer_at) }}</span>
            </h4>
            <div class="answer-content">
              <div class="my-answer">
                <span class="label">我的答案：</span>
                <div class="content">{{ currentReport.first_answer || '无记录' }}</div>
              </div>
              <div class="score-badge" :class="getScoreClass(currentReport.first_score)">
                {{ currentReport.first_score || 0 }}分
              </div>
            </div>
            <div v-if="currentReport.first_feedback" class="feedback">
              <span class="label">AI评价：</span>
              <div class="content">{{ currentReport.first_feedback }}</div>
            </div>
            <div v-if="currentReport.first_improvements" class="improvements">
              <span class="label">改进建议：</span>
              <div class="content">{{ currentReport.first_improvements }}</div>
            </div>
          </div>

          <!-- 最近一次答题（如果不是第一次） -->
          <div v-if="currentReport.attempt_count > 1" class="answer-section last-answer">
            <h4>
              <el-icon><Clock /></el-icon>
              最近一次答题
              <span class="answer-time">{{ formatDate(currentReport.last_answer_at) }}</span>
            </h4>
            <div class="answer-content">
              <div class="my-answer">
                <span class="label">我的答案：</span>
                <div class="content">{{ currentReport.last_answer || '无记录' }}</div>
              </div>
              <div class="score-badge" :class="getScoreClass(currentReport.last_score)">
                {{ currentReport.last_score || 0 }}分
              </div>
            </div>
            <div v-if="currentReport.last_feedback" class="feedback">
              <span class="label">AI评价：</span>
              <div class="content">{{ currentReport.last_feedback }}</div>
            </div>
            <div v-if="currentReport.last_improvements" class="improvements">
              <span class="label">改进建议：</span>
              <div class="content">{{ currentReport.last_improvements }}</div>
            </div>
          </div>
        </div>

        <!-- 标准答案 -->
        <div class="standard-answer-section">
          <h4>
            <el-icon><Ticket /></el-icon>
            标准答案
          </h4>
          <div class="standard-content">
            <ContentRenderer :content="currentReport.standard_answer" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="reportDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestionsPaginated, getQuestionDetail, addQuestion, updateQuestion, deleteQuestion, getAnswerReport } from '../api'
import ContentRenderer from '../components/ContentRenderer.vue'
import { StandardizedQuestions } from '../components/prompt/StandardizedQuestions.js'

// 搜索关键词
const searchKeyword = ref('')

// 加载状态
const loading = ref(false)

// 题目列表
const questions = ref([])

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0
})

// 弹窗状态
const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add' | 'edit'
const submitting = ref(false)
const formRef = ref(null)

// 答题记录弹窗
const reportDialogVisible = ref(false)
const currentReport = ref(null)

// 当前编辑的题目ID
const editingId = ref(null)

// 表单数据
const formData = reactive({
  title: '',
  answer: '',
  question_type: '基础'
})

// 表单校验规则
const formRules = {
  title: [
    { required: true, message: '请输入题目标题', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请输入答案解析', trigger: 'blur' }
  ],
  question_type: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ]
}

// 获取题目列表
const fetchQuestions = async () => {
  loading.value = true
  try {
    const response = await getQuestionsPaginated({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: searchKeyword.value
    })
    
    if (response.data.code === 200) {
      questions.value = response.data.data.list
      pagination.total = response.data.data.pagination.total
      pagination.totalPages = response.data.data.pagination.total_pages
    } else {
      ElMessage.error(response.data.message || '获取题目列表失败')
    }
  } catch (error) {
    ElMessage.error('获取题目列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchQuestions()
}

// 分页大小改变
const handleSizeChange = () => {
  pagination.page = 1
  fetchQuestions()
}

// 页码改变
const handlePageChange = () => {
  fetchQuestions()
}

// 打开添加弹窗
const openAddDialog = () => {
  dialogMode.value = 'add'
  editingId.value = null
  formData.title = ''
  formData.answer = ''
  formData.question_type = '基础'
  dialogVisible.value = true
}

// 打开编辑弹窗
const openEditDialog = async (question) => {
  dialogMode.value = 'edit'
  editingId.value = question.id
  
  // 获取题目详情
  try {
    const response = await getQuestionDetail(question.id)
    if (response.data.code === 200) {
      const data = response.data.data
      formData.title = data.title
      formData.answer = data.answer
      formData.question_type = data.question_type
      dialogVisible.value = true
    } else {
      ElMessage.error(response.data.message || '获取题目详情失败')
    }
  } catch (error) {
    ElMessage.error('获取题目详情失败：' + error.message)
  }
}

// 查看答题记录
const viewAnswerReport = async (question) => {
  try {
    const response = await getAnswerReport(question.id)
    if (response.data.code === 200) {
      currentReport.value = response.data.data
      reportDialogVisible.value = true
    } else {
      ElMessage.warning(response.data.message || '暂无答题记录')
    }
  } catch (error) {
    ElMessage.error('获取答题记录失败：' + error.message)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const data = {
        title: formData.title,
        answer: formData.answer,
        question_type: formData.question_type
      }
      
      let response
      if (dialogMode.value === 'add') {
        response = await addQuestion(data)
      } else {
        response = await updateQuestion(editingId.value, data)
      }
      
      if (response.data.code === 200) {
        ElMessage.success(dialogMode.value === 'add' ? '添加成功' : '修改成功')
        dialogVisible.value = false
        fetchQuestions()
      } else {
        ElMessage.error(response.data.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('操作失败：' + error.message)
    } finally {
      submitting.value = false
    }
  })
}

// 删除题目
const handleDelete = async (question) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除题目「${truncate(question.title, 30)}」吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await deleteQuestion(question.id)
    if (response.data.code === 200) {
      ElMessage.success('删除成功')
      // 如果当前页只有一条数据且不是第一页，则跳到上一页
      if (questions.value.length === 1 && pagination.page > 1) {
        pagination.page--
      }
      fetchQuestions()
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + error.message)
    }
  }
}

// 获取类型标签颜色
const getTypeTagType = (type) => {
  const types = {
    '基础': '',
    '进阶': 'success',
    '高频': 'warning',
    '手写': 'danger',
    '原理': 'info',
    '面经': 'primary',
    '自检': 'info'
  }
  return types[type] || ''
}

// 计算正确的前端序号
const getRowIndex = (index) => {
  return (pagination.page - 1) * pagination.pageSize + index + 1
}

// 表格行样式
const tableRowClassName = ({ row }) => {
  return row.attempt_count > 0 ? 'done-row' : ''
}

// 获取分数样式类
const getScoreClass = (score) => {
  if (!score) return 'none'
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}

// 获取进步情况样式类
const getImprovementClass = (report) => {
  if (!report || report.attempt_count < 2) return ''
  if (report.last_score > report.first_score) return 'positive'
  if (report.last_score < report.first_score) return 'negative'
  return ''
}

// 获取进步情况文字
const getImprovementText = (report) => {
  if (!report || report.attempt_count < 2) return '-'
  const diff = (report.last_score || 0) - (report.first_score || 0)
  if (diff > 0) return `+${diff}分`
  if (diff < 0) return `${diff}分`
  return '持平'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 截断文本
const truncate = (str, len) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

// 复制提示词到剪贴板
const copyPrompt = async () => {
  if (!formData.title) {
    ElMessage.warning('请先输入题目标题')
    return
  }
  
  // 将提示词模板中的占位符替换为实际值
  const prompt = StandardizedQuestions.prompt
    .replace('{raw_question}', formData.title)
    .replace('{question_type}', formData.question_type)
  
  try {
    await navigator.clipboard.writeText(prompt)
    ElMessage.success('提示词已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败：' + error.message)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchQuestions()
})
</script>

<style scoped>
.question-manage-view {
  max-width: 1200px;
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
  color: #409eff;
}

.search-card {
  margin-bottom: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 400px;
}

.list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-header .el-tag {
  margin-left: auto;
}

/* 题目标题单元格 */
.question-title-cell {
  line-height: 1.6;
  word-break: break-word;
  white-space: normal;
}

/* 状态单元格 */
.status-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.score-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.score-item {
  padding: 2px 6px;
  border-radius: 4px;
  background: #f5f7fa;
}

.score-item.first {
  color: #909399;
}

.score-item.last {
  color: #409eff;
}

/* 已做过的行样式 */
:deep(.el-table .done-row) {
  background-color: #f0f9eb;
}

:deep(.el-table .done-row:hover > td) {
  background-color: #e8f5e1 !important;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 答题记录弹窗样式 */
.report-content {
  max-height: 70vh;
  overflow-y: auto;
}

.report-question h3 {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #303133;
  line-height: 1.6;
}

.progress-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-card .stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.stat-card.first .stat-value {
  color: #909399;
}

.stat-card.last .stat-value {
  color: #409eff;
}

.stat-card.improvement.positive .stat-value {
  color: #67c23a;
}

.stat-card.improvement.negative .stat-value {
  color: #f56c6c;
}

.answer-comparison {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.answer-section {
  padding: 16px;
  border-radius: 8px;
}

.answer-section.first-answer {
  background: #f5f7fa;
  border-left: 3px solid #909399;
}

.answer-section.last-answer {
  background: #f0f9ff;
  border-left: 3px solid #409eff;
}

.answer-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.answer-time {
  font-weight: normal;
  font-size: 12px;
  color: #909399;
}

.answer-content {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.my-answer {
  flex: 1;
}

.my-answer .label,
.feedback .label,
.improvements .label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.my-answer .content {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.score-badge {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
}

.score-badge.excellent {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.score-badge.good {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.score-badge.pass {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
}

.score-badge.fail {
  background: linear-gradient(135deg, #f56c6c, #f89898);
}

.score-badge.none {
  background: #e4e7ed;
  color: #909399;
}

.feedback,
.improvements {
  margin-top: 12px;
}

.feedback .content,
.improvements .content {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
}

.improvements .content {
  background: #fef0f0;
  color: #f56c6c;
}

.standard-answer-section {
  padding: 16px;
  background: #f0f9eb;
  border-radius: 8px;
  border-left: 3px solid #67c23a;
}

.standard-answer-section h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #67c23a;
}

.standard-content {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  line-height: 1.8;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

@media (max-width: 768px) {
  .progress-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .answer-content {
    flex-direction: column;
  }

  .score-badge {
    width: 50px;
    height: 50px;
    font-size: 14px;
  }
}
</style>
