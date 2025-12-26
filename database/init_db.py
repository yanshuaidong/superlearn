"""
超级学习系统 - 数据库初始化脚本
运行此脚本创建数据库表结构
"""
import sqlite3
import os

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'learn.db')

def init_database():
    """初始化数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # ==================== 题目表（纯净题库，不记录任何答题信息） ====================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 题目唯一ID，自增主键
            title TEXT NOT NULL,                   -- 题目内容/问题描述
            answer TEXT NOT NULL,                  -- 标准答案/参考答案
            question_type TEXT NOT NULL,           -- 题目类型（如：选择题、填空题、简答题等）
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 题目创建时间
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- 题目最后更新时间
        )
    ''')
    
    # ==================== 复习记录表 (用于遗忘曲线) ====================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS review_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,       -- 记录唯一ID，自增主键
            question_id INTEGER NOT NULL,               -- 关联的题目ID
            review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 本次复习的时间
            review_level INTEGER DEFAULT 1,             -- 复习级别（1-5级，级别越高间隔越长）
            next_review_date TIMESTAMP,                 -- 下次应复习的时间（根据遗忘曲线计算）
            is_remembered INTEGER DEFAULT 1,            -- 是否记住了（1=记住，0=忘记）
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE  -- 外键关联题目表，级联删除
        )
    ''')
    
    # ==================== 答题报告表（核心：记录答题进步） ====================
    # 这个表记录用户对每道题的答题情况，包括第一次和最近一次的答案对比
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS answer_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 记录唯一ID，自增主键
            question_id INTEGER NOT NULL UNIQUE,   -- 关联的题目ID（唯一，每道题只有一条报告）
            
            -- 第一次答题记录（用于对比进步）
            first_answer TEXT,           -- 第一次作答的答案内容
            first_score INTEGER,         -- 第一次作答的AI评分（0-100分）
            first_feedback TEXT,         -- 第一次作答的AI反馈/评语
            first_improvements TEXT,     -- 第一次作答后AI给出的改进建议
            first_answer_at TIMESTAMP,   -- 第一次作答的时间
            
            -- 最近一次答题记录（如果只答过一次，则与第一次相同）
            last_answer TEXT,            -- 最近一次作答的答案内容
            last_score INTEGER,          -- 最近一次作答的AI评分（0-100分）
            last_feedback TEXT,          -- 最近一次作答的AI反馈/评语
            last_improvements TEXT,      -- 最近一次作答后AI给出的改进建议
            last_answer_at TIMESTAMP,    -- 最近一次作答的时间
            
            -- 统计信息
            attempt_count INTEGER DEFAULT 0,  -- 总答题次数
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 记录创建时间
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 记录最后更新时间
            
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE  -- 外键关联题目表，级联删除
        )
    ''')
    
    # ==================== AI评分历史记录表（可选：保留所有历史评分） ====================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_score_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 记录唯一ID，自增主键
            question_id INTEGER NOT NULL,          -- 关联的题目ID
            user_answer TEXT NOT NULL,             -- 用户提交的答案内容
            ai_score INTEGER NOT NULL,             -- AI给出的评分（0-100分）
            ai_feedback TEXT,                      -- AI给出的反馈/评语
            ai_improvements TEXT,                  -- AI给出的改进建议
            score_type TEXT DEFAULT 'learn',       -- 评分类型（learn=学习模式, review=复习模式）
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 评分记录创建时间
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE  -- 外键关联题目表，级联删除
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"数据库初始化成功！位置: {DB_PATH}")

if __name__ == '__main__':
    init_database()
