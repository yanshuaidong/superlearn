"""
超级学习系统 - Flask后端
端口: 1123
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import requests
import json
import re
import threading
import time
from datetime import datetime, timedelta

app = Flask(__name__)

# AI接口调用锁，确保同一时间只有一个请求发送到AI接口
ai_api_lock = threading.Lock()

# AI接口配置
AI_API_URL = "http://127.0.0.1:1125/ask"
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


@app.route('/api/questions/manage', methods=['GET'])
def get_questions_paginated():
    """分页获取题目列表（支持搜索）"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取分页参数
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    keyword = request.args.get('keyword', '').strip()
    
    # 计算偏移量
    offset = (page - 1) * page_size
    
    # 构建查询条件
    if keyword:
        # 按标题搜索
        count_sql = 'SELECT COUNT(*) as total FROM questions WHERE title LIKE ?'
        list_sql = '''
            SELECT id, title, question_type, created_at, updated_at 
            FROM questions 
            WHERE title LIKE ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        '''
        search_param = f'%{keyword}%'
        cursor.execute(count_sql, (search_param,))
        total = cursor.fetchone()['total']
        cursor.execute(list_sql, (search_param, page_size, offset))
    else:
        count_sql = 'SELECT COUNT(*) as total FROM questions'
        list_sql = '''
            SELECT id, title, question_type, created_at, updated_at 
            FROM questions 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        '''
        cursor.execute(count_sql)
        total = cursor.fetchone()['total']
        cursor.execute(list_sql, (page_size, offset))
    
    questions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    # 计算总页数
    total_pages = (total + page_size - 1) // page_size
    
    return jsonify({
        'code': 200,
        'data': {
            'list': questions,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total': total,
                'total_pages': total_pages
            }
        }
    })


@app.route('/api/questions/<int:question_id>', methods=['GET'])
def get_question_detail(question_id):
    """获取单个题目详情"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM questions WHERE id = ?', (question_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return jsonify({'code': 200, 'data': dict(row)})
    else:
        return jsonify({'code': 404, 'message': '题目不存在'})

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


# ==================== AI加工相关API ====================

def call_ai_api(prompt, max_retries=3, retry_delay=5):
    """
    调用AI接口（带锁和重试机制）
    
    Args:
        prompt: 问题内容
        max_retries: 最大重试次数
        retry_delay: 重试间隔（秒）
    """
    # 使用锁确保同一时间只有一个请求发送到AI接口
    with ai_api_lock:
        for attempt in range(max_retries):
            try:
                print(f"[AI调用] 第{attempt + 1}次尝试...")
                response = requests.post(
                    AI_API_URL,
                    json={'question': prompt},
                    timeout=600  # 10分钟超时，确保单个题目有足够处理时间
                )
                if response.status_code == 200:
                    result = response.json()
                    # 根据AI接口返回的结构提取答案
                    if 'answer' in result:
                        return result['answer']
                    elif 'response' in result:
                        return result['response']
                    elif 'content' in result:
                        return result['content']
                    else:
                        return str(result)
                elif response.status_code == 503:
                    # AI服务繁忙，等待后重试
                    print(f"[AI调用] AI服务繁忙(503)，{retry_delay}秒后重试...")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        retry_delay *= 2  # 指数退避
                        continue
                    else:
                        print("[AI调用] 达到最大重试次数，AI服务持续繁忙")
                        return None
                else:
                    print(f"[AI调用] 请求失败，状态码: {response.status_code}")
                    return None
            except Exception as e:
                print(f"[AI调用] 接口调用失败: {e}")
                if attempt < max_retries - 1:
                    print(f"[AI调用] {retry_delay}秒后重试...")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                return None
        return None


def parse_ai_response(response_text):
    """解析AI返回的标准化题目和答案"""
    title = ""
    answer = ""
    
    # 尝试按标记解析
    # 匹配 【标准化题目】或 **标准化题目** 等格式
    title_patterns = [
        r'【标准化题目】[：:]*\s*(.*?)(?=【|$)',
        r'\*\*标准化题目\*\*[：:]*\s*(.*?)(?=\*\*|【|$)',
        r'标准化题目[：:]\s*(.*?)(?=答案|【|\n\n|$)',
        r'问题[：:]\s*(.*?)(?=答案|【|\n\n|$)',
    ]
    
    answer_patterns = [
        r'【答案解析】[：:]*\s*(.*)',
        r'\*\*答案解析\*\*[：:]*\s*(.*)',
        r'答案解析[：:]\s*(.*)',
        r'答案[：:]\s*(.*)',
    ]
    
    for pattern in title_patterns:
        match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
        if match:
            title = match.group(1).strip()
            break
    
    for pattern in answer_patterns:
        match = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
        if match:
            answer = match.group(1).strip()
            break
    
    # 如果没有匹配到，使用简单分割
    if not title or not answer:
        lines = response_text.strip().split('\n')
        if len(lines) >= 2:
            # 第一行作为题目
            title = lines[0].strip()
            # 剩余作为答案
            answer = '\n'.join(lines[1:]).strip()
        else:
            title = response_text[:100] if len(response_text) > 100 else response_text
            answer = response_text
    
    return title, answer


@app.route('/api/ai/process', methods=['POST'])
def process_question_with_ai():
    """使用AI加工题目"""
    data = request.get_json()
    raw_question = data.get('question', '').strip()
    question_type = data.get('type', '基础')
    
    if not raw_question:
        return jsonify({'code': 400, 'message': '题目不能为空'})
    
    # 构造prompt，让AI生成标准化的题目和答案
    prompt = f"""你是资深前端技术面试教练。你的任务是把题目改写成面试标准题，并生成"候选人可直接复述、拿高分"的答案。

【原始题目】
{raw_question}

【题目类型】
{question_type}

【核心原则】
- 禁止教材式解释！要像候选人在面试中回答问题一样
- 语言口语化、可复述，避免学术定义堆砌
- 结论先行，先说面试官最想听的答案，再展开
- 用编号/要点组织，关键信息用短句

【输出格式（严格遵守）】

【标准化题目】
（改写后的标准面试题，一句话）

【答案解析】

## 一、结论先行（30秒版）
面试官最想听到的核心结论，1-3句话直接给出答案。
示例格式："XXX的本质是...，它解决的核心问题是...，最关键的点是..."

## 二、答题框架（可直接复述）
用编号列出完整答题结构，每个点一句话说清楚：
1. 是什么：一句话定义
2. 为什么：解决什么问题
3. 怎么用：核心用法/步骤
4. 注意点：关键细节

## 三、最小示例
用最容易理解的方式说明，可以是：
- 真实场景类比（如：负载均衡就像银行多窗口分流排队）
- 最简代码（不超过10行）
- 对比案例（有它 vs 没它的区别）
选择最能帮助记忆和理解的形式。

## 四、面试官评分点
- 高分点：面试官希望听到什么
- 扣分点：常见错误回答

## 五、追问与应对
列出2-3个常见追问，每个追问给出简洁的标准回答：
Q1: 追问问题
A1: 标准回答

Q2: 追问问题
A2: 标准回答
"""
    
    # 调用AI接口
    ai_response = call_ai_api(prompt)
    
    if not ai_response:
        return jsonify({'code': 500, 'message': 'AI接口调用失败，请检查AI服务是否启动'})
    
    # 解析AI返回的内容
    title, answer = parse_ai_response(ai_response)
    
    if not title or not answer:
        return jsonify({'code': 500, 'message': 'AI返回内容解析失败', 'raw_response': ai_response})
    
    return jsonify({
        'code': 200,
        'message': '处理成功',
        'data': {
            'title': title,
            'answer': answer,
            'raw_response': ai_response  # 保留原始响应，便于调试
        }
    })


if __name__ == '__main__':
    # 启动时初始化数据库
    init_db()
    print("超级学习后端启动中...")
    print("访问地址: http://localhost:1123")
    app.run(host='0.0.0.0', port=1123, debug=True)

