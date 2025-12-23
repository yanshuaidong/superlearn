import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000 // 默认 30 秒超时
})

// 题目相关
export const getQuestions = (type = '') => api.get('/questions', { params: { type } })
export const addQuestion = (data) => api.post('/questions', data)
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data)
export const deleteQuestion = (id) => api.delete(`/questions/${id}`)

// 复习相关
export const getTodayReview = () => api.get('/review/today')
export const completeReview = (data) => api.post('/review/complete', data)

// 统计相关
export const getOverviewStats = () => api.get('/stats/overview')
export const getMasteryStats = () => api.get('/stats/mastery')

// AI加工相关 - 每个题目最大等待 10 分钟
export const processQuestionWithAi = (data) => api.post('/ai/process', data, { timeout: 600000 }) // 10分钟超时，AI处理可能较慢

// AI评分相关 - 用于学习模块第三步
export const evaluateAnswer = (data) => api.post('/ai/evaluate', data, { timeout: 300000 }) // 5分钟超时

// 获取待学习题目（已通过AI加工的题目）
export const getLearningQuestions = (params = {}) => api.get('/questions/learning', { params })

// 保存学习记录
export const saveLearningRecord = (data) => api.post('/learning/record', data)

export default api

