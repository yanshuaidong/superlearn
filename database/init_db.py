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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            answer TEXT NOT NULL,
            question_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # ==================== 复习记录表 (用于遗忘曲线) ====================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS review_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            review_level INTEGER DEFAULT 1,
            next_review_date TIMESTAMP,
            is_remembered INTEGER DEFAULT 1,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
    ''')
    
    # ==================== 答题报告表（核心：记录答题进步） ====================
    # 这个表记录用户对每道题的答题情况，包括第一次和最近一次的答案对比
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS answer_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL UNIQUE,
            
            -- 第一次答题记录
            first_answer TEXT,
            first_score INTEGER,
            first_feedback TEXT,
            first_improvements TEXT,
            first_answer_at TIMESTAMP,
            
            -- 最近一次答题记录（如果只答过一次，则与第一次相同）
            last_answer TEXT,
            last_score INTEGER,
            last_feedback TEXT,
            last_improvements TEXT,
            last_answer_at TIMESTAMP,
            
            -- 统计信息
            attempt_count INTEGER DEFAULT 0,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
    ''')
    
    # ==================== AI评分历史记录表（可选：保留所有历史评分） ====================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_score_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            user_answer TEXT NOT NULL,
            ai_score INTEGER NOT NULL,
            ai_feedback TEXT,
            ai_improvements TEXT,
            score_type TEXT DEFAULT 'learn',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"数据库初始化成功！位置: {DB_PATH}")

if __name__ == '__main__':
    init_database()
