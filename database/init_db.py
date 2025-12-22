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
    
    # 题目表
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
    
    # 复习记录表 (用于遗忘曲线)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS review_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            review_level INTEGER DEFAULT 1,
            next_review_date TIMESTAMP,
            is_remembered INTEGER DEFAULT 1,
            FOREIGN KEY (question_id) REFERENCES questions(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"数据库初始化成功！位置: {DB_PATH}")

if __name__ == '__main__':
    init_database()

