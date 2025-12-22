<template>
  <div class="learn-view">
    <h1 class="page-title">
      <el-icon><Edit /></el-icon>
      学习主模块
    </h1>

    <!-- 添加新题目 -->
    <el-card class="add-card">
      <template #header>
        <div class="card-header">
          <el-icon><Plus /></el-icon>
          <span>{{ editingId ? '编辑题目' : '添加新题目' }}</span>
        </div>
      </template>
      <el-form :model="form" label-position="top">
        <el-form-item label="题目类型">
          <el-select v-model="form.question_type" placeholder="选择题目类型" style="width: 200px;">
            <el-option 
              v-for="type in questionTypes" 
              :key="type" 
              :label="type" 
              :value="type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题目内容">
          <el-input
            v-model="form.title"
            type="textarea"
            :rows="4"
            placeholder="请输入面试题目..."
          />
        </el-form-item>
        <el-form-item label="我的答案">
          <el-input
            v-model="form.answer"
            type="textarea"
            :rows="8"
            placeholder="请输入你理解的答案..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            <el-icon><Check /></el-icon>
            {{ editingId ? '更新题目' : '保存题目' }}
          </el-button>
          <el-button v-if="editingId" @click="cancelEdit">
            取消编辑
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 题目列表 -->
    <el-card class="list-card">
      <template #header>
        <div class="card-header-with-filter">
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>题目列表 ({{ questions.length }})</span>
          </div>
          <el-select 
            v-model="filterType" 
            placeholder="筛选类型" 
            clearable 
            style="width: 140px;"
            @change="loadQuestions"
          >
            <el-option 
              v-for="type in questionTypes" 
              :key="type" 
              :label="type" 
              :value="type"
            />
          </el-select>
        </div>
      </template>

      <div v-if="loading" class="loading-wrapper">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="!questions.length" class="empty-wrapper">
        <el-empty description="暂无题目，快来添加第一道题目吧！" />
      </div>

      <div v-else class="question-list">
        <div 
          v-for="question in questions" 
          :key="question.id" 
          class="question-item"
        >
          <div class="question-header">
            <el-tag :type="getTagType(question.question_type)" size="small">
              {{ question.question_type }}
            </el-tag>
            <span class="question-date">{{ formatDate(question.created_at) }}</span>
            <div class="question-actions">
              <el-button 
                type="primary" 
                size="small" 
                text 
                @click="handleEdit(question)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                text 
                @click="handleDelete(question.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="question-title">{{ question.title }}</div>
          <el-collapse>
            <el-collapse-item title="查看答案">
              <div class="question-answer">{{ question.answer }}</div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestions, addQuestion, updateQuestion, deleteQuestion } from '../api'

// 题目类型
const questionTypes = ['基础', '进阶', '高频', '手写', '原理', '面经', '自检']

// 表单数据
const form = reactive({
  title: '',
  answer: '',
  question_type: '基础'
})

const editingId = ref(null)
const submitting = ref(false)
const loading = ref(false)
const filterType = ref('')
const questions = ref([])

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

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const loadQuestions = async () => {
  loading.value = true
  try {
    const res = await getQuestions(filterType.value)
    if (res.data.code === 200) {
      questions.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.title.trim() || !form.answer.trim()) {
    ElMessage.warning('请填写题目和答案')
    return
  }

  submitting.value = true
  try {
    if (editingId.value) {
      const res = await updateQuestion(editingId.value, form)
      if (res.data.code === 200) {
        ElMessage.success('更新成功')
        cancelEdit()
        loadQuestions()
      } else {
        ElMessage.error(res.data.message || '更新失败')
      }
    } else {
      const res = await addQuestion(form)
      if (res.data.code === 200) {
        ElMessage.success('添加成功')
        form.title = ''
        form.answer = ''
        form.question_type = '基础'
        loadQuestions()
      } else {
        ElMessage.error(res.data.message || '添加失败')
      }
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleEdit = (question) => {
  editingId.value = question.id
  form.title = question.title
  form.answer = question.answer
  form.question_type = question.question_type
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => {
  editingId.value = null
  form.title = ''
  form.answer = ''
  form.question_type = '基础'
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这道题目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await deleteQuestion(id)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadQuestions()
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.learn-view {
  max-width: 900px;
}

.add-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.card-header-with-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
  gap: 16px;
}

.question-list {
  padding: 0;
}

.question-item {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.question-item:last-child {
  border-bottom: none;
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

.question-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.question-title {
  font-size: 15px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.question-answer {
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
