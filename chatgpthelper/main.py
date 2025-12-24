"""
ChatGPT Helper Flask + WebSocket 后端服务
端口：1125

架构（WebSocket 版本）：
- 对外提供 /ask 接口，供其他程序提交问题
- 与浏览器插件保持 WebSocket 持久连接
- 一次只能处理一个问题，确保稳定性

工作流程：
1. 插件启动时建立 WebSocket 连接
2. 外部程序 POST /ask 提交问题
3. 后端通过 WebSocket 推送任务给插件
4. 插件操作浏览器获取答案
5. 插件通过 WebSocket 发送答案
6. /ask 接口返回答案给调用方
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import threading
import time
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 配置 SocketIO，允许跨域
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 过滤掉 health 请求日志
class QuietRequestFilter(logging.Filter):
    def filter(self, record):
        msg = record.getMessage().lower()
        return '/health' not in msg and 'socket.io' not in msg

werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.addFilter(QuietRequestFilter())


# ============ 任务管理 ============

class TaskManager:
    """任务管理器 - WebSocket 版本"""
    
    def __init__(self):
        self.lock = threading.Lock()
        self.current_task = None
        self.task_result = None
        self.task_event = threading.Event()
        self.connected_clients = set()  # 已连接的客户端 sid
        
    def is_plugin_online(self):
        """检查是否有插件在线"""
        return len(self.connected_clients) > 0
    
    def add_client(self, sid):
        """添加客户端"""
        with self.lock:
            self.connected_clients.add(sid)
            print(f'[WebSocket] 插件已连接: {sid}')
            print(f'[WebSocket] 当前连接数: {len(self.connected_clients)}')
    
    def remove_client(self, sid):
        """移除客户端"""
        with self.lock:
            self.connected_clients.discard(sid)
            print(f'[WebSocket] 插件已断开: {sid}')
            print(f'[WebSocket] 当前连接数: {len(self.connected_clients)}')
    
    def submit_task(self, question, timeout=300):
        """提交任务并等待结果"""
        with self.lock:
            if self.current_task is not None:
                return {
                    'success': False,
                    'message': '当前有任务正在处理中，请稍后重试'
                }
            
            if not self.is_plugin_online():
                return {
                    'success': False,
                    'message': '插件未连接，请确保插件已启动并连接'
                }
            
            # 创建新任务
            task_id = datetime.now().strftime('%Y%m%d_%H%M%S')
            self.current_task = {
                'id': task_id,
                'question': question,
                'status': 'pending',
                'created_at': datetime.now().isoformat()
            }
            self.task_result = None
            self.task_event.clear()
        
        print(f'[TaskManager] 新任务已创建: {task_id}')
        print(f'  - 问题: {question[:50]}...' if len(question) > 50 else f'  - 问题: {question}')
        
        # 通过 WebSocket 推送任务给插件
        socketio.emit('new_task', {
            'task_id': task_id,
            'question': question
        })
        print(f'[WebSocket] 任务已推送给插件')
        
        # 等待任务完成
        completed = self.task_event.wait(timeout=timeout)
        
        with self.lock:
            if not completed:
                self.current_task = None
                return {
                    'success': False,
                    'message': f'任务超时（{timeout}秒），AI回答可能需要更长时间'
                }
            
            result = self.task_result
            self.current_task = None
            self.task_result = None
            
            return result
    
    def complete_task(self, task_id, answer, success=True, message=''):
        """完成任务"""
        with self.lock:
            if not self.current_task or self.current_task['id'] != task_id:
                return {
                    'success': False,
                    'message': '任务ID不匹配或任务已过期'
                }
            
            self.task_result = {
                'success': success,
                'message': message if message else ('完成' if success else '失败'),
                'question': self.current_task['question'],
                'answer': answer,
                'task_id': task_id
            }
            
            self.task_event.set()
            print(f'[TaskManager] 任务完成: {task_id}')
            
            return {'success': True, 'message': '任务结果已接收'}
    
    def get_status(self):
        """获取当前状态"""
        with self.lock:
            return {
                'plugin_online': self.is_plugin_online(),
                'connected_clients': len(self.connected_clients),
                'has_task': self.current_task is not None,
                'task_status': self.current_task['status'] if self.current_task else None
            }


# 全局任务管理器
task_manager = TaskManager()


# ============ WebSocket 事件 ============

@socketio.on('connect')
def handle_connect():
    """处理插件连接"""
    from flask import request
    sid = request.sid
    task_manager.add_client(sid)
    emit('connected', {'message': '连接成功', 'sid': sid})

@socketio.on('disconnect')
def handle_disconnect():
    """处理插件断开"""
    from flask import request
    sid = request.sid
    task_manager.remove_client(sid)

@socketio.on('task_result')
def handle_task_result(data):
    """处理插件返回的任务结果"""
    task_id = data.get('task_id')
    answer = data.get('answer', '')
    success = data.get('success', True)
    message = data.get('message', '')
    
    print(f'[WebSocket] 收到任务结果: {task_id}')
    
    result = task_manager.complete_task(task_id, answer, success, message)
    emit('result_received', result)

@socketio.on('ping')
def handle_ping():
    """处理心跳（可选，WebSocket 本身有心跳机制）"""
    emit('pong', {'time': datetime.now().isoformat()})


# ============ HTTP API 接口 ============

@app.route('/ask', methods=['POST'])
def ask():
    """
    对外接口：提交问题并等待AI回答
    
    请求体：
    {
        "question": "你的问题",
        "timeout": 300  // 可选，超时秒数，默认300
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
        timeout = data.get('timeout', 300)
        
        print(f'\n[API] 收到问题请求: {question[:50]}...' if len(question) > 50 else f'\n[API] 收到问题请求: {question}')
        
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


@app.route('/status', methods=['GET'])
def status():
    """获取服务状态"""
    status_info = task_manager.get_status()
    return jsonify({
        'success': True,
        'service': 'ChatGPT Helper API (WebSocket)',
        'port': 1125,
        **status_info
    })


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'success': True,
        'message': 'ChatGPT Helper API 运行中',
        'plugin_online': task_manager.is_plugin_online()
    })


# ============ 主程序 ============

if __name__ == '__main__':
    print('=' * 60)
    print('🚀 ChatGPT Helper API 服务启动 (WebSocket 版本)')
    print('=' * 60)
    print(f'🌐 HTTP 地址: http://127.0.0.1:1125')
    print(f'🔌 WebSocket: ws://127.0.0.1:1125/socket.io/')
    print()
    print('对外接口（供其他程序调用）:')
    print('  POST /ask      - 提交问题，等待AI回答')
    print('  GET  /status   - 获取服务状态')
    print('  GET  /health   - 健康检查')
    print()
    print('WebSocket 事件:')
    print('  connect        - 插件连接')
    print('  disconnect     - 插件断开')
    print('  new_task       - 推送新任务给插件')
    print('  task_result    - 插件返回任务结果')
    print()
    print('使用示例:')
    print('  curl -X POST http://127.0.0.1:1125/ask \\')
    print('       -H "Content-Type: application/json" \\')
    print('       -d \'{"question": "你好"}\'')
    print()
    print('⚠️  请确保浏览器插件已启动并连接')
    print('=' * 60)
    print('\n按 Ctrl+C 停止服务\n')
    
    # 使用 SocketIO 运行
    socketio.run(app, host='127.0.0.1', port=1125, debug=False, allow_unsafe_werkzeug=True)
