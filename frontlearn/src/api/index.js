import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
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

export default api

