"""
超级学习系统 - Flask后端
端口: 1123
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'learn.db')

def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """初始化数据库表"""
    conn = get_db()
    cursor = conn.cursor()
    
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

# 遗忘曲线间隔天数 (艾宾浩斯遗忘曲线)
REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120]

def calculate_next_review_date(review_level):
    """根据复习级别计算下次复习日期"""
    if review_level > len(REVIEW_INTERVALS):
        days = REVIEW_INTERVALS[-1]
    else:
        days = REVIEW_INTERVALS[review_level - 1]
    return datetime.now() + timedelta(days=days)


# ==================== 题目相关API ====================

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """获取所有题目"""
    conn = get_db()
    cursor = conn.cursor()
    
    question_type = request.args.get('type', '')
    
    if question_type:
        cursor.execute('SELECT * FROM questions WHERE question_type = ? ORDER BY created_at DESC', (question_type,))
    else:
        cursor.execute('SELECT * FROM questions ORDER BY created_at DESC')
    
    questions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'code': 200, 'data': questions})

@app.route('/api/questions', methods=['POST'])
def add_question():
    """添加新题目"""
    data = request.get_json()
    title = data.get('title', '').strip()
    answer = data.get('answer', '').strip()
    question_type = data.get('question_type', '基础')
    
    if not title or not answer:
        return jsonify({'code': 400, 'message': '题目和答案不能为空'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO questions (title, answer, question_type) 
        VALUES (?, ?, ?)
    ''', (title, answer, question_type))
    
    question_id = cursor.lastrowid
    
    # 同时创建首次复习记录
    next_review = calculate_next_review_date(1)
    cursor.execute('''
        INSERT INTO review_records (question_id, review_level, next_review_date)
        VALUES (?, 1, ?)
    ''', (question_id, next_review.strftime('%Y-%m-%d %H:%M:%S')))
    
    conn.commit()
    conn.close()
    
    return jsonify({'code': 200, 'message': '添加成功', 'data': {'id': question_id}})

@app.route('/api/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id):
    """更新题目"""
    data = request.get_json()
    title = data.get('title', '').strip()
    answer = data.get('answer', '').strip()
    question_type = data.get('question_type', '基础')
    
    if not title or not answer:
        return jsonify({'code': 400, 'message': '题目和答案不能为空'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE questions 
        SET title = ?, answer = ?, question_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (title, answer, question_type, question_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'code': 200, 'message': '更新成功'})

@app.route('/api/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id):
    """删除题目"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 先删除相关的复习记录
    cursor.execute('DELETE FROM review_records WHERE question_id = ?', (question_id,))
    # 再删除题目
    cursor.execute('DELETE FROM questions WHERE id = ?', (question_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'code': 200, 'message': '删除成功'})


# ==================== 复习相关API ====================

@app.route('/api/review/today', methods=['GET'])
def get_today_review():
    """获取今日需要复习的题目"""
    conn = get_db()
    cursor = conn.cursor()
    
    today = datetime.now().strftime('%Y-%m-%d')
    
    cursor.execute('''
        SELECT q.*, r.review_level, r.next_review_date, r.id as record_id
        FROM questions q
        INNER JOIN review_records r ON q.id = r.question_id
        WHERE DATE(r.next_review_date) <= DATE(?)
        AND r.id IN (
            SELECT MAX(id) FROM review_records GROUP BY question_id
        )
        ORDER BY r.next_review_date ASC
    ''', (today,))
    
    questions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'code': 200, 'data': questions})

@app.route('/api/review/complete', methods=['POST'])
def complete_review():
    """完成复习"""
    data = request.get_json()
    question_id = data.get('question_id')
    is_remembered = data.get('is_remembered', True)
    
    if not question_id:
        return jsonify({'code': 400, 'message': '题目ID不能为空'})
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取当前复习级别
    cursor.execute('''
        SELECT review_level FROM review_records 
        WHERE question_id = ? 
        ORDER BY id DESC LIMIT 1
    ''', (question_id,))
    
    row = cursor.fetchone()
    current_level = row['review_level'] if row else 1
    
    # 如果记住了，级别+1；如果没记住，重置为1
    if is_remembered:
        new_level = min(current_level + 1, len(REVIEW_INTERVALS))
    else:
        new_level = 1
    
    next_review = calculate_next_review_date(new_level)
    
    # 插入新的复习记录
    cursor.execute('''
        INSERT INTO review_records (question_id, review_level, next_review_date, is_remembered)
        VALUES (?, ?, ?, ?)
    ''', (question_id, new_level, next_review.strftime('%Y-%m-%d %H:%M:%S'), 1 if is_remembered else 0))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'code': 200, 
        'message': '复习完成',
        'data': {
            'new_level': new_level,
            'next_review_date': next_review.strftime('%Y-%m-%d')
        }
    })


# ==================== 统计相关API ====================

@app.route('/api/stats/overview', methods=['GET'])
def get_overview_stats():
    """获取总览统计"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 总题目数
    cursor.execute('SELECT COUNT(*) as total FROM questions')
    total = cursor.fetchone()['total']
    
    # 各类型题目数
    cursor.execute('''
        SELECT question_type, COUNT(*) as count 
        FROM questions 
        GROUP BY question_type
    ''')
    type_stats = [dict(row) for row in cursor.fetchall()]
    
    # 今日需复习数
    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute('''
        SELECT COUNT(DISTINCT q.id) as count
        FROM questions q
        INNER JOIN review_records r ON q.id = r.question_id
        WHERE DATE(r.next_review_date) <= DATE(?)
        AND r.id IN (
            SELECT MAX(id) FROM review_records GROUP BY question_id
        )
    ''', (today,))
    today_review = cursor.fetchone()['count']
    
    # 今日已复习数
    cursor.execute('''
        SELECT COUNT(*) as count 
        FROM review_records 
        WHERE DATE(review_date) = DATE(?)
    ''', (today,))
    today_completed = cursor.fetchone()['count']
    
    # 总复习次数
    cursor.execute('SELECT COUNT(*) as total FROM review_records')
    total_reviews = cursor.fetchone()['total']
    
    # 最近7天新增题目数
    cursor.execute('''
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM questions 
        WHERE created_at >= DATE('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date
    ''')
    weekly_new = [dict(row) for row in cursor.fetchall()]
    
    # 最近7天复习次数
    cursor.execute('''
        SELECT DATE(review_date) as date, COUNT(*) as count 
        FROM review_records 
        WHERE review_date >= DATE('now', '-7 days')
        GROUP BY DATE(review_date)
        ORDER BY date
    ''')
    weekly_review = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'code': 200,
        'data': {
            'total_questions': total,
            'type_stats': type_stats,
            'today_review_count': today_review,
            'today_completed': today_completed,
            'total_reviews': total_reviews,
            'weekly_new': weekly_new,
            'weekly_review': weekly_review
        }
    })


@app.route('/api/stats/mastery', methods=['GET'])
def get_mastery_stats():
    """获取掌握程度统计"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 按复习级别统计
    cursor.execute('''
        SELECT r.review_level, COUNT(DISTINCT r.question_id) as count
        FROM review_records r
        WHERE r.id IN (
            SELECT MAX(id) FROM review_records GROUP BY question_id
        )
        GROUP BY r.review_level
        ORDER BY r.review_level
    ''')
    
    level_stats = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'code': 200, 'data': level_stats})


if __name__ == '__main__':
    # 启动时初始化数据库
    init_db()
    print("超级学习后端启动中...")
    print("访问地址: http://localhost:1123")
    app.run(host='0.0.0.0', port=1123, debug=True)

