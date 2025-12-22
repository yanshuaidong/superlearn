import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/stats'
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/StatsView.vue')
  },
  {
    path: '/learn',
    name: 'Learn',
    component: () => import('../views/LearnView.vue')
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('../views/ReviewView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

