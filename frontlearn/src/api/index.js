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

// 题目管理相关（分页+搜索）
export const getQuestionsPaginated = (params = {}) => api.get('/questions/manage', { params })
export const getQuestionDetail = (id) => api.get(`/questions/${id}`)

// 学习相关 - 一题一做模式
export const getLearningQuestions = (params = {}) => api.get('/learning/questions', { params })
export const getNextQuestion = (params = {}) => api.get('/learning/next', { params })
export const getRandomQuestion = (params = {}) => api.get('/learning/random', { params })

// 答题报告相关
export const getAnswerReport = (questionId) => api.get(`/answer-report/${questionId}`)
export const saveAnswerReport = (data) => api.post('/answer-report/save', data)
export const getAnswerStats = () => api.get('/answer-report/stats')

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

// 获取某道题的AI评分历史记录（用于复习时查看进步）
export const getScoreHistory = (questionId) => api.get(`/ai/score-history/${questionId}`)

// 保存学习记录（兼容旧接口）
export const saveLearningRecord = (data) => api.post('/learning/record', data)

export default api
