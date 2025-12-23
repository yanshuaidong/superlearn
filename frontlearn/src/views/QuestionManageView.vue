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

      <div v-loading="loading" class="question-list">
        <div v-if="questions.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无题目数据" />
        </div>
        
        <div 
          v-for="question in questions" 
          :key="question.id" 
          class="question-item"
        >
          <div class="question-info">
            <span class="question-id">#{{ question.id }}</span>
            <el-tag :type="getTypeTagType(question.question_type)" size="small">
              {{ question.question_type }}
            </el-tag>
            <span class="question-title">{{ question.title }}</span>
          </div>
          <div class="question-actions">
            <el-button 
              type="primary" 
              size="small" 
              text
              @click="openEditDialog(question)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              text
              @click="handleDelete(question)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>
      </div>

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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestionsPaginated, getQuestionDetail, addQuestion, updateQuestion, deleteQuestion } from '../api'

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

// 截断文本
const truncate = (str, len) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
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

.question-list {
  min-height: 200px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.question-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.question-item:hover {
  background: #f0f9ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.question-item:last-child {
  margin-bottom: 0;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.question-id {
  font-weight: 600;
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
}

.question-title {
  flex: 1;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.question-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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

:deep(.el-dialog__body) {
  padding-top: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>

