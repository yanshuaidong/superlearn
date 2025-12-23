<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <el-icon :size="28"><Reading /></el-icon>
        <span>超级学习</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        router
      >
        <el-menu-item index="/stats">
          <el-icon><DataAnalysis /></el-icon>
          <span>统计信息</span>
        </el-menu-item>
        <el-menu-item index="/ai-process">
          <el-icon><MagicStick /></el-icon>
          <span>题目AI加工</span>
        </el-menu-item>
        <el-menu-item index="/question-manage">
          <el-icon><Document /></el-icon>
          <span>题目管理</span>
        </el-menu-item>
        <el-menu-item index="/learn">
          <el-icon><Edit /></el-icon>
          <span>学习主模块</span>
        </el-menu-item>
        <el-menu-item index="/review">
          <el-icon><Timer /></el-icon>
          <span>复习模块</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <span>🧠 坚持学习，超越自我</span>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.sidebar {
  width: 220px;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  color: #409eff;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.sidebar-footer {
  padding: 16px;
  text-align: center;
  color: #909399;
  font-size: 12px;
  border-top: 1px solid #e4e7ed;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
