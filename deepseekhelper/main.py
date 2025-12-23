"""
DeepSeek Helper Flask 后端服务
端口：1125

架构：
- 对外提供 /ask 接口，供其他程序提交问题
- 与浏览器插件保持心跳通讯，分发任务
- 一次只能处理一个问题，确保稳定性

工作流程：
1. 外部程序 POST /ask 提交问题
2. 插件通过心跳 /heartbeat 获取任务
3. 插件操作浏览器获取答案
4. 插件 POST /answer 返回答案
5. /ask 接口返回答案给调用方
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 过滤掉 heartbeat 请求日志，避免刷屏
class HeartbeatFilter(logging.Filter):
    def filter(self, record):
        # 过滤掉包含 heartbeat 的日志
        return 'heartbeat' not in record.getMessage().lower()

# 应用过滤器到 werkzeug 日志
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.addFilter(HeartbeatFilter())

# 注意：不再保存本地 JSON 文件，数据直接以 HTML 格式返回给调用方

# ============ 任务管理 ============

class TaskManager:
    """任务管理器 - 确保一次只处理一个问题"""
    
    def __init__(self):
        self.lock = threading.Lock()
        self.current_task = None  # 当前任务
        self.task_result = None   # 任务结果
        self.task_event = threading.Event()  # 用于等待任务完成
        self.plugin_connected = False  # 插件是否连接
        self.last_heartbeat = 0  # 最后心跳时间
        
    def is_plugin_online(self):
        """检查插件是否在线（3秒内有心跳）"""
        return time.time() - self.last_heartbeat < 3
    
    def submit_task(self, question, timeout=180):
        """
        提交任务并等待结果
        
        Args:
            question: 问题内容
            timeout: 超时时间（秒），默认3分钟
            
        Returns:
            dict: 任务结果
        """
        with self.lock:
            if self.current_task is not None:
                return {
                    'success': False,
                    'message': '当前有任务正在处理中，请稍后重试'
                }
            
            if not self.is_plugin_online():
                return {
                    'success': False,
                    'message': '插件未连接或已离线，请确保插件已启动'
                }
            
            # 创建新任务
            self.current_task = {
                'id': datetime.now().strftime('%Y%m%d_%H%M%S'),
                'question': question,
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            }
            self.task_result = None
            self.task_event.clear()
        
        print(f'[TaskManager] 新任务已创建: {self.current_task["id"]}')
        print(f'  - 问题: {question[:50]}...' if len(question) > 50 else f'  - 问题: {question}')
        
        # 等待任务完成
        completed = self.task_event.wait(timeout=timeout)
        
        with self.lock:
            if not completed:
                # 超时
                self.current_task = None
                return {
                    'success': False,
                    'message': f'任务超时（{timeout}秒），AI回答可能需要更长时间'
                }
            
            result = self.task_result
            self.current_task = None
            self.task_result = None
            
            return result
    
    def get_pending_task(self):
        """获取待处理的任务（供插件调用）"""
        with self.lock:
            self.last_heartbeat = time.time()
            self.plugin_connected = True
            
            if self.current_task and self.current_task['status'] == 'pending':
                # 标记为处理中
                self.current_task['status'] = 'processing'
                return {
                    'has_task': True,
                    'task_id': self.current_task['id'],
                    'question': self.current_task['question']
                }
            
            return {'has_task': False}
    
    def complete_task(self, task_id, answer, success=True, message=''):
        """完成任务（供插件调用）"""
        with self.lock:
            if not self.current_task or self.current_task['id'] != task_id:
                return {
                    'success': False,
                    'message': '任务ID不匹配或任务已过期'
                }
            
            # 设置结果（不再保存本地 JSON 文件，直接返回 HTML 格式给调用方）
            self.task_result = {
                'success': success,
                'message': message if message else ('完成' if success else '失败'),
                'question': self.current_task['question'],
                'answer': answer,  # 现在是 HTML 格式，前端可以直接渲染
                'task_id': task_id
            }
            
            # 通知等待的线程
            self.task_event.set()
            
            print(f'[TaskManager] 任务完成: {task_id}')
            
            return {'success': True, 'message': '任务结果已接收'}
    
    def get_status(self):
        """获取当前状态"""
        with self.lock:
            return {
                'plugin_online': self.is_plugin_online(),
                'has_task': self.current_task is not None,
                'task_status': self.current_task['status'] if self.current_task else None,
                'last_heartbeat': self.last_heartbeat
            }


# 全局任务管理器
task_manager = TaskManager()


# ============ API 接口 ============

@app.route('/ask', methods=['POST'])
def ask():
    """
    对外接口：提交问题并等待AI回答
    
    请求体：
    {
        "question": "你的问题",
        "timeout": 180  // 可选，超时秒数，默认180
    }
    
    响应：
    {
        "success": true/false,
        "question": "问题",
        "answer": "AI回答",
        "message": "状态信息"
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('question'):
            return jsonify({
                'success': False,
                'message': '请提供问题内容'
            }), 400
        
        question = data['question'].strip()
        timeout = data.get('timeout', 180)
        
        print(f'\n[API] 收到问题请求: {question[:50]}...' if len(question) > 50 else f'\n[API] 收到问题请求: {question}')
        
        # 提交任务并等待结果
        result = task_manager.submit_task(question, timeout)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 503
            
    except Exception as e:
        print(f'[API] 处理请求出错: {e}')
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500


@app.route('/heartbeat', methods=['GET'])
def heartbeat():
    """
    插件心跳接口
    
    插件每秒调用一次，用于：
    1. 保持连接状态
    2. 获取待处理的任务
    
    响应：
    {
        "success": true,
        "has_task": true/false,
        "task_id": "任务ID",
        "question": "问题内容"
    }
    """
    task_info = task_manager.get_pending_task()
    return jsonify({
        'success': True,
        **task_info
    })


@app.route('/answer', methods=['POST'])
def answer():
    """
    插件回答接口：提交AI回答
    
    请求体：
    {
        "task_id": "任务ID",
        "answer": "AI回答内容",
        "success": true/false,
        "message": "状态信息"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': '请求体为空'
            }), 400
        
        task_id = data.get('task_id')
        answer_content = data.get('answer', '')
        success = data.get('success', True)
        message = data.get('message', '')
        
        if not task_id:
            return jsonify({
                'success': False,
                'message': '缺少 task_id'
            }), 400
        
        result = task_manager.complete_task(task_id, answer_content, success, message)
        
        return jsonify(result)
        
    except Exception as e:
        print(f'[API] 处理回答出错: {e}')
        return jsonify({
            'success': False,
            'message': f'服务器错误: {str(e)}'
        }), 500


@app.route('/status', methods=['GET'])
def status():
    """
    获取服务状态
    """
    status_info = task_manager.get_status()
    return jsonify({
        'success': True,
        'service': 'DeepSeek Helper API',
        'port': 1125,
        **status_info
    })


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'success': True,
        'message': 'DeepSeek Helper API 运行中',
        'plugin_online': task_manager.is_plugin_online()
    })


# ============ 主程序 ============

if __name__ == '__main__':
    print('=' * 60)
    print('🚀 DeepSeek Helper API 服务启动')
    print('=' * 60)
    print(f'🌐 服务地址: http://127.0.0.1:1125')
    print(f'📝 回答格式: HTML (直接可渲染)')
    print()
    print('对外接口（供其他程序调用）:')
    print('  POST /ask      - 提交问题，等待AI回答')
    print('  GET  /status   - 获取服务状态')
    print('  GET  /health   - 健康检查')
    print()
    print('内部接口（供插件调用）:')
    print('  GET  /heartbeat - 插件心跳，获取任务')
    print('  POST /answer    - 提交AI回答')
    print()
    print('使用示例:')
    print('  curl -X POST http://127.0.0.1:1125/ask \\')
    print('       -H "Content-Type: application/json" \\')
    print('       -d \'{"question": "你好"}\'')
    print()
    print('⚠️  请确保浏览器插件已启动并连接')
    print('=' * 60)
    print('\n按 Ctrl+C 停止服务\n')
    
    # 使用 threaded=True 支持并发请求
    app.run(host='127.0.0.1', port=1125, debug=False, threaded=True)
