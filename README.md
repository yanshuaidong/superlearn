# superlearn
超级学习（整个系统仅仅是我自己用）


数据库位置
learn.db(总的数据库，表待定)

backlearn: 后端 使用（端口在1123）
Flask==2.3.3
Flask-CORS==4.0.0
数据库使用import sqlite3。
SQLite数据库



frontlearn：前端（端口在1124）
vue3，vue-router，"element-plus": "^2.10.4", "axios": "^1.10.0",

页面能力：类似后台管理系统的左侧是侧边栏。右侧是内容。

左侧模块1：点击后，右侧统计信息，会有很多统计信息展示。

左侧模块2：学习主模块。（这里是学习的主要阵地）
能力1：我会从别的网站找来面试题。将题目粘贴。我会下拉选择题目的类型，基础/进阶/高频/手写/原理/面经/自检等。这里类型仅仅前端写死，固定传递给后端就好。
然后我自己会写上答案。第二个框子。然后保存。就进入数据库了。
包含，我自己写的题干，自己写的答案。自己下拉选择的题目的类型。

左侧模块3：
就是复习模块。你知道遗忘曲线吧。
我进入这个模块后，需要按照遗忘曲线。让我定期回顾之前学习的题目。



## 项目结构

```
superlearn/
├── database/
│   └── init_db.py          # 数据库初始化脚本
├── backlearn/
│   ├── requirements.txt    # Python依赖
│   └── app.py              # Flask后端API (端口1123)
└── frontlearn/
    ├── package.json        # 前端依赖
    ├── vite.config.js      # Vite配置
    ├── index.html
    ├── public/
    │   └── vite.svg        # 网站图标
    └── src/
        ├── main.js
        ├── App.vue
        ├── router/index.js
        ├── api/index.js
        ├── styles/main.css
        └── views/
            ├── StatsView.vue   # 统计信息模块
            ├── LearnView.vue   # 学习主模块
            └── ReviewView.vue  # 复习模块
```

## 功能特性

### 1️⃣ 统计信息模块
- 总题目数、今日待复习、今日已复习、累计复习次数
- 题目类型分布图表
- 掌握程度分布 (Lv.1-8)
- 近7天学习/复习趋势

### 2️⃣ 学习主模块
- 添加/编辑/删除面试题
- 题目类型选择：基础/进阶/高频/手写/原理/面经/自检
- 按类型筛选题目
- 展开查看答案

### 3️⃣ 复习模块 (艾宾浩斯遗忘曲线)
- 复习间隔：1→2→4→7→15→30→60→120天
- 卡片式复习界面
- 键盘快捷键支持 (空格显示答案，←没记住，→记住了)
- 实时进度追踪

## 启动方式

**1. 启动后端:**
```bash
cd backlearn
pip install -r requirements.txt
python app.py
```

**2. 启动前端:**
```bash
cd frontlearn
npm install
npm run dev
```

后端运行在 `http://localhost:1123`，前端运行在 `http://localhost:1124`

界面使用暗色主题，绿色为主题色，设计现代美观！🧠





