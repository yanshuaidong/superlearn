"""
测试多问题处理流程
内置3个问题，依次发送给 ChatGPT Helper API
用于观察和调试多问题处理时的问题
"""

import requests
import time
import threading
from datetime import datetime

BACKEND_URL = 'http://127.0.0.1:1125'

# 内置的3个测试问题
TEST_QUESTIONS = [
    "请用100字左右介绍一下Python语言的特点和应用场景。",
    "请解释什么是递归，并给出一个计算阶乘的递归函数示例（Python代码）。",
    "请比较冒泡排序和快速排序的时间复杂度，并分析各自的优缺点。",
]

def check_service_status():
    """检查服务状态"""
    try:
        response = requests.get(f'{BACKEND_URL}/status', timeout=5)
        data = response.json()
        online = data.get('plugin_online', False)
        print(f"[状态] 插件在线: {online}")
        return online
    except Exception as e:
        print(f"[错误] 无法连接后端: {e}")
        return False

def ask_question(question, question_num):
    """发送单个问题并等待回答"""
    print(f"\n[问题 {question_num}] {question}")
    start_time = time.time()
    
    try:
        response = requests.post(
            f'{BACKEND_URL}/ask',
            json={'question': question, 'timeout': 120},
            timeout=130
        )
        
        elapsed = time.time() - start_time
        data = response.json()
        
        if data.get('success'):
            answer = data.get('answer', '')
            preview = answer[:100] + '...' if len(answer) > 100 else answer
            print(f"  ✅ 成功 ({elapsed:.1f}s): {preview}")
            return True
        else:
            print(f"  ❌ 失败: {data.get('message', '未知错误')}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"  ❌ 超时")
        return False
    except Exception as e:
        print(f"  ❌ 异常: {e}")
        return False

def test_sequential():
    """顺序测试：依次发送问题，等待每个问题完成后再发送下一个"""
    print("\n📋 顺序测试")
    
    results = []
    for i, question in enumerate(TEST_QUESTIONS, 1):
        success = ask_question(question, i)
        results.append(success)
        
        if i < len(TEST_QUESTIONS):
            time.sleep(3)
    
    success_count = sum(results)
    print(f"\n📊 结果: {success_count}/{len(results)} 成功")

def test_concurrent():
    """并发测试：同时发送多个问题，观察后端如何处理"""
    print("\n📋 并发测试")
    
    threads = []
    results = [None] * len(TEST_QUESTIONS)
    
    def worker(question, question_num, results_list):
        results_list[question_num - 1] = ask_question(question, question_num)
    
    for i, question in enumerate(TEST_QUESTIONS, 1):
        t = threading.Thread(target=worker, args=(question, i, results))
        threads.append(t)
        t.start()
        time.sleep(0.1)
    
    for t in threads:
        t.join()
    
    success_count = sum(1 for r in results if r)
    print(f"\n📊 结果: {success_count}/{len(results)} 成功")

def main():
    print("🔧 ChatGPT Helper 测试")
    
    if not check_service_status():
        print("⚠️  请先启动后端和插件")
        return
    
    print("\n选择: 1.顺序 2.并发 q.退出")
    choice = input("选项: ").strip()
    
    if choice == '1':
        test_sequential()
    elif choice == '2':
        test_concurrent()
    elif choice == 'q':
        print("已退出")
    else:
        test_sequential()

if __name__ == '__main__':
    main()

