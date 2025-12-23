"""
测试多问题处理流程
内置3个问题，依次发送给 DeepSeek Helper API
用于观察和调试多问题处理时的问题
"""

import requests
import time
import threading
from datetime import datetime

BACKEND_URL = 'http://127.0.0.1:1125'

# 内置的3个测试问题
TEST_QUESTIONS = [
    "1+1等于几？请直接回答数字。",
    "2+2等于几？请直接回答数字。",
    "3+3等于几？请直接回答数字。",
]

def check_service_status():
    """检查服务状态"""
    try:
        response = requests.get(f'{BACKEND_URL}/status', timeout=5)
        data = response.json()
        print(f"[状态] 插件在线: {data.get('plugin_online', False)}")
        print(f"[状态] 当前有任务: {data.get('has_task', False)}")
        return data.get('plugin_online', False)
    except Exception as e:
        print(f"[错误] 无法连接后端服务: {e}")
        return False

def ask_question(question, question_num):
    """发送单个问题并等待回答"""
    print(f"\n{'='*60}")
    print(f"[问题 {question_num}] 发送: {question}")
    print(f"[时间] {datetime.now().strftime('%H:%M:%S')}")
    print('='*60)
    
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
            # 截取前200个字符显示
            preview = answer[:200] + '...' if len(answer) > 200 else answer
            print(f"\n[成功] 问题 {question_num} 已回答")
            print(f"[耗时] {elapsed:.1f} 秒")
            print(f"[回答预览] {preview}")
            return True
        else:
            print(f"\n[失败] 问题 {question_num}")
            print(f"[原因] {data.get('message', '未知错误')}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n[超时] 问题 {question_num} 请求超时")
        return False
    except Exception as e:
        print(f"\n[错误] 问题 {question_num} 发生异常: {e}")
        return False

def test_sequential():
    """顺序测试：依次发送问题，等待每个问题完成后再发送下一个"""
    print("\n" + "="*60)
    print("📋 顺序测试模式：依次处理每个问题")
    print("="*60)
    
    results = []
    for i, question in enumerate(TEST_QUESTIONS, 1):
        success = ask_question(question, i)
        results.append(success)
        
        if i < len(TEST_QUESTIONS):
            print(f"\n⏳ 等待 3 秒后发送下一个问题...")
            time.sleep(3)
    
    print("\n" + "="*60)
    print("📊 测试结果汇总")
    print("="*60)
    for i, (question, success) in enumerate(zip(TEST_QUESTIONS, results), 1):
        status = "✅ 成功" if success else "❌ 失败"
        print(f"  问题 {i}: {status} - {question[:30]}...")
    
    success_count = sum(results)
    print(f"\n总计: {success_count}/{len(results)} 成功")

def test_concurrent():
    """并发测试：同时发送多个问题，观察后端如何处理"""
    print("\n" + "="*60)
    print("📋 并发测试模式：同时发送所有问题")
    print("="*60)
    
    threads = []
    results = [None] * len(TEST_QUESTIONS)
    
    def worker(question, question_num, results_list):
        results_list[question_num - 1] = ask_question(question, question_num)
    
    # 启动所有线程
    for i, question in enumerate(TEST_QUESTIONS, 1):
        t = threading.Thread(target=worker, args=(question, i, results))
        threads.append(t)
        t.start()
        time.sleep(0.1)  # 稍微错开，方便观察日志
    
    # 等待所有线程完成
    for t in threads:
        t.join()
    
    print("\n" + "="*60)
    print("📊 并发测试结果汇总")
    print("="*60)
    for i, (question, success) in enumerate(zip(TEST_QUESTIONS, results), 1):
        status = "✅ 成功" if success else "❌ 失败"
        print(f"  问题 {i}: {status} - {question[:30]}...")
    
    success_count = sum(1 for r in results if r)
    print(f"\n总计: {success_count}/{len(results)} 成功")

def main():
    print("="*60)
    print("🔧 DeepSeek Helper 多问题测试工具")
    print("="*60)
    
    # 检查服务状态
    if not check_service_status():
        print("\n⚠️  请先启动后端服务 (python main.py) 和浏览器插件")
        return
    
    print("\n请选择测试模式:")
    print("  1. 顺序测试（等前一个完成再发下一个）")
    print("  2. 并发测试（同时发送所有问题）")
    print("  q. 退出")
    
    choice = input("\n请输入选项 (1/2/q): ").strip()
    
    if choice == '1':
        test_sequential()
    elif choice == '2':
        test_concurrent()
    elif choice == 'q':
        print("已退出")
    else:
        print("无效选项，执行顺序测试...")
        test_sequential()

if __name__ == '__main__':
    main()

